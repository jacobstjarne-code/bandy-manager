import type { Fixture } from '../../../domain/entities/Fixture'
import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { PlayoffBracket } from '../../../domain/entities/Playoff'
import { FixtureStatus, InboxItemType, PlayoffStatus } from '../../../domain/enums'
import { updateSeriesAfterMatch, advancePlayoffRound } from '../../../domain/services/playoffService'

function isSeriesDecided(series: { winnerId: string | null }): boolean {
  return series.winnerId !== null
}

export interface PlayoffProcessorResult {
  updatedBracket: PlayoffBracket | null
  bracketNewFixtures: Fixture[]
  playoffCsBoost: number
  inboxItems: InboxItem[]
  cancelledFixtureIds: string[]  // fixture IDs to mark as Postponed
}

export function processPlayoffRound(
  game: SaveGame,
  simulatedFixtures: Fixture[],
  allFixtures: Fixture[],
): PlayoffProcessorResult {
  const result: PlayoffProcessorResult = {
    updatedBracket: game.playoffBracket,
    bracketNewFixtures: [],
    playoffCsBoost: 0,
    inboxItems: [],
    cancelledFixtureIds: [],
  }

  if (result.updatedBracket === null) return result

  const completedThisRound = simulatedFixtures.filter(f => f.status === FixtureStatus.Completed)

  type AnyPlayoffSeries = (typeof result.updatedBracket.quarterFinals)[0]

  const updateSeries = (series: AnyPlayoffSeries): AnyPlayoffSeries => {
    let s = { ...series }
    for (const f of completedThisRound) {
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

  // Cancel fixtures for decided series
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

  // Check if current phase is complete and advance
  const currentPhaseComplete = (() => {
    if (result.updatedBracket!.status === PlayoffStatus.QuarterFinals) return result.updatedBracket!.quarterFinals.every(s => s.winnerId !== null)
    if (result.updatedBracket!.status === PlayoffStatus.SemiFinals) return result.updatedBracket!.semiFinals.every(s => s.winnerId !== null)
    if (result.updatedBracket!.status === PlayoffStatus.Final) return result.updatedBracket!.final?.winnerId !== null
    return false
  })()

  if (currentPhaseComplete) {
    const nextRoundStart = result.updatedBracket!.status === PlayoffStatus.QuarterFinals ? 28
      : result.updatedBracket!.status === PlayoffStatus.SemiFinals ? 33
      : 36
    const currentMaxMatchday = Math.max(0, ...allFixtures.map(f => f.matchday ?? 0))
    const nextMatchdayStart = currentMaxMatchday + 1
    const { bracket: newBracket, newFixtures } = advancePlayoffRound(result.updatedBracket!, game.currentSeason, nextRoundStart, nextMatchdayStart)
    result.updatedBracket = newBracket
    result.bracketNewFixtures = newFixtures
  }

  // Check managed club advancement or elimination
  const allSeriesAfter = [
    ...result.updatedBracket!.quarterFinals,
    ...result.updatedBracket!.semiFinals,
    ...(result.updatedBracket!.final ? [result.updatedBracket!.final] : []),
  ]
  for (const series of allSeriesAfter) {
    const decidedThisRound = completedThisRound.some(f => series.fixtures.includes(f.id)) && isSeriesDecided(series)
    if (!decidedThisRound) continue

    const managedLost = series.loserId === game.managedClubId
    const managedWon = series.winnerId === game.managedClubId

    if (managedLost) {
      const winner = game.clubs.find(c => c.id === series.winnerId)
      const roundName = series.round === 'quarterFinal' ? 'kvartsfinalen'
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
        body: `${winner?.name ?? 'Motståndaren'} gick vidare med ${theirWins}-${myWins} i matcher.`,
        isRead: false,
      } as InboxItem)
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
        body: `GRATTIS! ${champion?.name} är svenska mästare ${game.currentSeason + 1}!`,
        isRead: false,
      } as InboxItem)
    } else {
      result.inboxItems.push({
        id: `inbox_champion_other_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.Playoff,
        title: `${champion?.name} är svenska mästare!`,
        body: `${champion?.name} tar SM-guldet ${game.currentSeason + 1}!`,
        isRead: false,
      } as InboxItem)
    }
  }

  return result
}
