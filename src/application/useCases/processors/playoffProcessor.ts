import type { Fixture } from '../../../domain/entities/Fixture'
import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { PlayoffBracket, PlayoffEliminationInfo } from '../../../domain/entities/Playoff'
import type { GameEvent } from '../../../domain/entities/GameEvent'
import { FixtureStatus, InboxItemType, PendingScreen, PlayoffStatus } from '../../../domain/enums'
import { updateSeriesAfterMatch, advancePlayoffRound } from '../../../domain/services/playoffService'
import { generateSemiFinalEvent, generateFinalEvent } from '../../../domain/services/playoffNarrativeService'
import { seasonChampionYear } from '../../../domain/utils/seasonYear'

function isSeriesDecided(series: { winnerId: string | null }): boolean {
  return series.winnerId !== null
}

export interface PlayoffProcessorResult {
  updatedBracket: PlayoffBracket | null
  bracketNewFixtures: Fixture[]
  playoffCsBoost: number
  inboxItems: InboxItem[]
  gameEvents: GameEvent[]
  cancelledFixtureIds: string[]
  triggerQFSummary: boolean
  staleEventIds: string[]
  // A2 (2026-08-17): set only in the round the managed club is eliminated —
  // see comment at the PlayoffEliminationInfo definition (Playoff.ts) for why.
  lastPlayoffElimination: PlayoffEliminationInfo | null
}

/**
 * Processes playoff bracket updates, phase advancement, and elimination/promotion notifications.
 *
 * @param simulatedFixtures - All fixtures processed this round (newly simulated + live-played completed)
 * @param allFixtures - Full fixture list (used to cancel decided-series game 3 fixtures)
 * @param fixturesCompletedBeforeRound - IDs of fixtures already completed before this advance() call;
 *   used to deduplicate series updates for live-played managed fixtures (their series was already
 *   updated by matchActions → updateSeriesAfterMatch).
 * @param completedThisRound - All fixtures completed THIS round (incl. live-played); used for
 *   advancement/elimination message triggering.
 */
export function processPlayoffRound(
  game: SaveGame,
  simulatedFixtures: Fixture[],
  allFixtures: Fixture[],
  fixturesCompletedBeforeRound: Set<string>,
  completedThisRound: Fixture[],
): PlayoffProcessorResult {
  const result: PlayoffProcessorResult = {
    updatedBracket: game.playoffBracket,
    bracketNewFixtures: [],
    playoffCsBoost: 0,
    inboxItems: [],
    gameEvents: [],
    cancelledFixtureIds: [],
    triggerQFSummary: false,
    staleEventIds: [],
    lastPlayoffElimination: null,
  }

  if (result.updatedBracket === null) return result

  // Update series with NEWLY completed fixtures only (dedup live-played managed fixtures
  // whose series was already updated by matchActions → updateSeriesAfterMatch)
  const newlyCompletedThisRound = simulatedFixtures.filter(
    f => f.status === FixtureStatus.Completed && !fixturesCompletedBeforeRound.has(f.id),
  )

  type AnyPlayoffSeries = (typeof result.updatedBracket.quarterFinals)[0]

  const updateSeries = (series: AnyPlayoffSeries): AnyPlayoffSeries => {
    let s = { ...series }
    for (const f of newlyCompletedThisRound) {
      if (s.fixtures.includes(f.id)) {
        s = updateSeriesAfterMatch(s, f)
      }
    }
    return s
  }

  result.updatedBracket = {
    ...result.updatedBracket,
    quarterFinals: result.updatedBracket.quarterFinals.map(updateSeries),
    semiFinals: result.updatedBracket.semiFinals.map(updateSeries),
    final: result.updatedBracket.final ? updateSeries(result.updatedBracket.final) : null,
  }

  // Cancel game 3 fixtures for decided series
  const allSeriesNow = [
    ...result.updatedBracket.quarterFinals,
    ...result.updatedBracket.semiFinals,
    ...(result.updatedBracket.final ? [result.updatedBracket.final] : []),
  ]
  for (const series of allSeriesNow) {
    if (series.winnerId !== null) {
      for (const fId of series.fixtures) {
        const f = allFixtures.find(fix => fix.id === fId)
        if (f && f.status === FixtureStatus.Scheduled) {
          result.cancelledFixtureIds.push(fId)
        }
      }
    }
  }

  // Check if current phase is complete and advance bracket
  const currentPhaseComplete = (() => {
    if (result.updatedBracket!.status === PlayoffStatus.QuarterFinals)
      return result.updatedBracket!.quarterFinals.every(s => s.winnerId !== null)
    if (result.updatedBracket!.status === PlayoffStatus.SemiFinals)
      return result.updatedBracket!.semiFinals.every(s => s.winnerId !== null)
    if (result.updatedBracket!.status === PlayoffStatus.Final)
      return result.updatedBracket!.final?.winnerId !== null
    return false
  })()

  if (currentPhaseComplete) {
    const wasQFPhase = result.updatedBracket!.status === PlayoffStatus.QuarterFinals
    const wasSFPhase = result.updatedBracket!.status === PlayoffStatus.SemiFinals
    const wasFinalPhase = result.updatedBracket!.status === PlayoffStatus.Final
    const nextRoundStart =
      wasQFPhase ? 28
      : wasSFPhase ? 33
      : 36
    const currentMaxMatchday = Math.max(0, ...allFixtures.map(f => f.matchday ?? 0))
    const nextMatchdayStart = currentMaxMatchday + 1
    const { bracket: newBracket, newFixtures } = advancePlayoffRound(
      result.updatedBracket!,
      game.currentSeason,
      nextRoundStart,
      nextMatchdayStart,
    )
    result.updatedBracket = newBracket
    result.bracketNewFixtures = newFixtures
    if (wasQFPhase && game.pendingScreen !== PendingScreen.QFSummary) {
      result.triggerQFSummary = true
    }

    // Clear stale playoff event for the phase that just completed — prevents
    // old "Fokusera"-kort from persisting into the next phase's portal.
    // wasFinalPhase clear added 2026-08-17: the Final's own "SM-finalen"-kort
    // was never added to staleEventIds, so it could survive (via pendingEvents
    // or the deferredDecisions budget-queue, see roundProcessor.ts) past the
    // champion being crowned. staleEventIds is consumed both against
    // pendingEvents AND deferredDecisions (roundProcessor.ts) — see also the
    // season-rollover wholesale-clear in seasonEndProcessor.ts.
    if (wasQFPhase) result.staleEventIds.push(`playoff_qf_${game.currentSeason}`)
    else if (wasSFPhase) result.staleEventIds.push(`playoff_sf_${game.currentSeason}`)
    else if (wasFinalPhase) result.staleEventIds.push(`playoff_final_${game.currentSeason}`)

    // Narrative event for managed club advancing to next round
    const managedInNewBracket = [
      ...newBracket.semiFinals,
      ...(newBracket.final ? [newBracket.final] : []),
    ].some(s => s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId)
    if (managedInNewBracket) {
      if (wasQFPhase) {
        const sfId = `playoff_sf_${game.currentSeason}`
        const alreadyFired = (game.pendingEvents ?? []).some(e => e.id === sfId) ||
          (game.deferredDecisions ?? []).some(e => e.id === sfId) ||
          (game.resolvedEventIds ?? []).includes(sfId)
        if (!alreadyFired) result.gameEvents.push(generateSemiFinalEvent(game))
      } else if (result.updatedBracket!.status === PlayoffStatus.Final) {
        const finalId = `playoff_final_${game.currentSeason}`
        const alreadyFired = (game.pendingEvents ?? []).some(e => e.id === finalId) ||
          (game.deferredDecisions ?? []).some(e => e.id === finalId) ||
          (game.resolvedEventIds ?? []).includes(finalId)
        if (!alreadyFired) result.gameEvents.push(generateFinalEvent(game))
      }
    }
  }

  // Check managed club advancement or elimination — use completedThisRound (includes live-played)
  const allSeriesAfter = [
    ...result.updatedBracket!.quarterFinals,
    ...result.updatedBracket!.semiFinals,
    ...(result.updatedBracket!.final ? [result.updatedBracket!.final] : []),
  ]
  for (const series of allSeriesAfter) {
    const decidedThisRound =
      completedThisRound.some(f => series.fixtures.includes(f.id)) && isSeriesDecided(series)
    if (!decidedThisRound) continue

    const managedLost = series.loserId === game.managedClubId
    const managedWon = series.winnerId === game.managedClubId

    if (managedLost) {
      const winner = game.clubs.find(c => c.id === series.winnerId)
      const roundName =
        series.round === 'quarterFinal' ? 'kvartsfinalen'
        : series.round === 'semiFinal' ? 'semifinalen'
        : 'SM-finalen'
      const isHome = series.homeClubId === game.managedClubId
      const myWins = isHome ? series.homeWins : series.awayWins
      const theirWins = isHome ? series.awayWins : series.homeWins
      result.inboxItems.push({
        id: `inbox_elim_${game.currentSeason}_${series.id}`,
        date: game.currentDate,
        type: InboxItemType.Playoff,
        title: `Utslagen ur ${roundName}`,
        body: `${winner?.name ?? 'Motståndaren'} gick vidare med ${theirWins}-${myWins} i matcher. En stark insats, men slutspelet är nu över för er del.`,
        isRead: false,
      } as InboxItem)

      // A2 (2026-08-17): resolve motståndare/resultat HÄR, en gång, med game.clubs
      // och allFixtures båda garanterat färska — inte vid ett framtida render-
      // tillfälle där bracket kan ha hunnit nollställas (seasonEndProcessor.ts)
      // eller där renderns egen kopia av samma uträkning kastades bort (se
      // PlayoffEliminationInfo-kommentaren i Playoff.ts).
      const seriesFixturesCompleted = series.fixtures
        .map(fid => allFixtures.find(f => f.id === fid))
        .filter((f): f is Fixture => !!f && f.status === FixtureStatus.Completed)
      const decidingFixture = seriesFixturesCompleted.sort((a, b) => b.matchday - a.matchday)[0]
      result.lastPlayoffElimination = {
        season: game.currentSeason,
        round: series.round,
        opponentName: winner?.shortName ?? winner?.name ?? 'motståndaren',
        resultat: decidingFixture ? `${decidingFixture.homeScore}–${decidingFixture.awayScore}` : '',
      }
      break
    }

    if (managedWon && series.round !== 'final') {
      const opponent = game.clubs.find(c => c.id === series.loserId)
      const isHome = series.homeClubId === game.managedClubId
      const myWins = isHome ? series.homeWins : series.awayWins
      const theirWins = isHome ? series.awayWins : series.homeWins
      const nextRoundName = series.round === 'quarterFinal' ? 'semifinalen' : 'SM-finalen'
      const managedClub = game.clubs.find(c => c.id === game.managedClubId)
      result.playoffCsBoost += series.round === 'quarterFinal' ? 5 : 10
      result.inboxItems.push({
        id: `inbox_advance_${game.currentSeason}_${series.id}`,
        date: game.currentDate,
        type: InboxItemType.Playoff,
        title: `Vidare till ${nextRoundName}!`,
        body: `${managedClub?.name ?? 'Ni'} besegrade ${opponent?.name ?? 'motståndaren'} med ${myWins}-${theirWins} och går vidare till ${nextRoundName}!`,
        isRead: false,
      } as InboxItem)
      break
    }
  }

  // Check if final complete — announce champion
  if (result.updatedBracket!.status === PlayoffStatus.Completed && result.updatedBracket!.champion) {
    const champion = game.clubs.find(c => c.id === result.updatedBracket!.champion)
    const managedClubWon = result.updatedBracket!.champion === game.managedClubId
    if (managedClubWon) {
      result.playoffCsBoost += 20
      result.inboxItems.push({
        id: `inbox_champion_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.Playoff,
        title: 'SVENSKA MÄSTARE!',
        body: `GRATTIS! ${champion?.name} är svenska mästare ${seasonChampionYear(game.currentSeason)}! En historisk säsong som aldrig glöms!`,
        isRead: false,
      } as InboxItem)
    } else {
      result.inboxItems.push({
        id: `inbox_champion_other_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.Playoff,
        title: `${champion?.name} är svenska mästare!`,
        body: `${champion?.name} tar SM-guldet ${seasonChampionYear(game.currentSeason)}!`,
        isRead: false,
      } as InboxItem)
    }
  }

  return result
}
