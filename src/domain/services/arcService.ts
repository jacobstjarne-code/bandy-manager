import type { SaveGame } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
import type { ActiveArc, ArcType, StorylineEntry } from '../entities/Narrative'
import type { GameEvent } from '../entities/GameEvent'
import { InboxItemType, MatchEventType } from '../enums'
import { getRivalry } from '../data/rivalries'
import { mulberry32 } from '../utils/random'
import { getCurrentLeagueRound } from '../data/seasonPhases'
import {
  countPriorStorylineResolutions,
  getStorylineResolutionEntries,
  getStorylineTypeFromLedger,
} from './storylineLedgerService'

// 4.6 (SLUTTEST_KO.md, 2026-08-17): alla newStorylines.push(...)-anrop nedan
// sätter matchday: getCurrentLeagueRound(game), INTE den lokala
// currentMatchday-variabeln (som är GLOBAL — justCompletedFixture?.matchday,
// kan bli 27+ under slutspel). SeasonSummaryScreen.tsx renderar
// storyline.matchday som "O{round}" och antar en ligaomgång (1-22); en
// arc-storyline som avgjordes under slutspelet visade "O33" innan denna fix.
// Samma logik som eventResolver.ts:s captainSpeech-storyline redan
// implementerade inline (nu delad via getCurrentLeagueRound istället).
// currentMatchday (global) används fortfarande korrekt för inbox/event-
// tidsstämplar i denna fil — bara storyline.matchday är omfattat.

// ── Helpers ──────────────────────────────────────────────────────────────────

function playerName(p: { firstName: string; lastName: string }): string {
  return `${p.firstName} ${p.lastName}`
}

function genId(prefix: string, matchday: number, suffix: string): string {
  return `${prefix}_${suffix}_md${matchday}`
}

function priorPlayerResolutions(
  game: SaveGame,
  type: StorylineEntry['type'],
  playerId: string,
  beforeMatchday: number,
  resolutionIdSuffix?: string,
): number {
  return countPriorStorylineResolutions(game, type, {
    before: { season: game.currentSeason, matchday: beforeMatchday },
    clubId: game.managedClubId,
    subject: { kind: 'player', id: playerId },
    resolutionIdSuffix,
  })
}

function recurrenceData(data: Record<string, unknown>, priorCount: number): Record<string, unknown> {
  return priorCount === 1 ? { ...data, recurrence: 'variant' } : data
}

function previousDerbyResult(
  game: SaveGame,
  opponentClubId: string | undefined,
  beforeMatchday: number,
): 'win' | 'loss' | null {
  if (!opponentClubId) return null
  const prior = getStorylineResolutionEntries(game, game.currentSeason)
    .filter(entry =>
      getStorylineTypeFromLedger(entry) === 'derby_echo_resolved'
      && entry.matchday < beforeMatchday
      && entry.subject2?.kind === 'club'
      && entry.subject2.id === opponentClubId
    )
    .sort((a, b) => b.matchday - a.matchday)[0]
  return prior?.outcome === 'won' ? 'win' : prior?.outcome === 'lost' ? 'loss' : null
}

function derbyRecurrenceCopy(
  previous: 'win' | 'loss' | null,
  current: 'win' | 'loss' | 'draw',
  managedClubName: string,
  opponentName: string,
): { headline: string; resultText: string } | null {
  if (previous === 'loss' && current === 'win') {
    return { headline: `Revanschen tog ${managedClubName}`, resultText: `🏆 Revansch mot ${opponentName}` }
  }
  if (previous === 'win' && current === 'win') {
    return { headline: 'Två derbyn, två segrar', resultText: `🏆 Dubbelt mot ${opponentName}` }
  }
  if (previous === 'loss' && current === 'loss') {
    return { headline: 'Derbyt förlorat igen', resultText: `💔 Dubbel derbyförlust mot ${opponentName}` }
  }
  if (previous === 'win' && current === 'loss') {
    return { headline: `${opponentName} tog tillbaka det`, resultText: `💔 Derbyförlust mot ${opponentName} — de kvitterade` }
  }
  return null
}

// ── detectArcTriggers ─────────────────────────────────────────────────────────

/**
 * Detects new arc triggers based on game state and the just-completed fixture.
 * Max 2 active non-derby arcs. Max 1 arc per player.
 */
export function detectArcTriggers(game: SaveGame, justCompletedFixture?: Fixture): ActiveArc[] {
  const existing = game.activeArcs ?? []
  const newArcs: ActiveArc[] = []

  const currentMatchday = justCompletedFixture?.matchday ?? game.currentMatchday

  const nonDerbyActive = existing.filter(a => a.type !== 'derby_echo' && a.phase !== 'resolving')
  const activePlayerIds = new Set(existing.map(a => a.playerId).filter(Boolean) as string[])

  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const managedFixtures = game.fixtures.filter(
    f => f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId
  )
  const completedManagedFixtures = managedFixtures.filter(f => f.status === 'completed')

  const hasArcType = (type: ArcType) =>
    existing.some(a => a.type === type && a.phase !== 'resolving') ||
    newArcs.some(a => a.type === type)

  const canAddArc = () =>
    nonDerbyActive.length + newArcs.filter(a => a.type !== 'derby_echo').length < 2

  // ── hungrig_breakthrough ──
  // H1-uppföljning (människoupplevelse-audit 7024f8a, 2026-08-24, Jacobs
  // dom): åldersgränsen höjd 21 → 24. characterPlayerService.ts:s
  // initCharacterPlayers() kan tilldela 'hungrig' till en spelare upp till
  // 24 år (samma fil, kandidatfiltret `p.age <= 24`) — en spelare som fick
  // traiten vid 22-24 kunde ALDRIG utlösa arcen, för alltid (åldern bara
  // ökar). Två tal om samma sak i två filer, nu samma tal. Bekräftat i
  // simulering (scripts/h1-arc-eligibility-sim.ts, 20 karriärer): traiten
  // är den smalare grinden och ska förbli det.
  if (justCompletedFixture
    && justCompletedFixture.status === 'completed'
    && (justCompletedFixture.homeClubId === game.managedClubId
      || justCompletedFixture.awayClubId === game.managedClubId)
    && !hasArcType('hungrig_breakthrough')
    && canAddArc()) {
    const hungrigPlayers = managedPlayers.filter(
      p => p.trait === 'hungrig' && p.age <= 24 && !activePlayerIds.has(p.id)
    )
    for (const p of hungrigPlayers) {
      const priorCount = priorPlayerResolutions(game, 'hungrig_breakthrough', p.id, currentMatchday)
      if (priorCount >= 2) continue
      // Count consecutive games without a goal where player was in the lineup
      const recentFixtures = completedManagedFixtures
        .slice()
        .sort((a, b) => (b.matchday ?? 0) - (a.matchday ?? 0))
      let gamesWithoutGoal = 0
      for (const f of recentFixtures) {
        const isHome = f.homeClubId === game.managedClubId
        const lineup = isHome ? f.homeLineup : f.awayLineup
        const wasInLineup = lineup?.startingPlayerIds?.includes(p.id) || lineup?.benchPlayerIds?.includes(p.id)
        if (!wasInLineup) continue
        const scored = (f.events ?? []).some(e =>
          e.type === MatchEventType.Goal
          && e.playerId === p.id
          && e.clubId === game.managedClubId,
        )
        if (scored) break
        gamesWithoutGoal++
      }
      if (gamesWithoutGoal >= 3) {
        newArcs.push({
          id: genId('arc', currentMatchday, `hungrig_${p.id}`),
          type: 'hungrig_breakthrough',
          playerId: p.id,
          subject: `${p.firstName[0]}. ${p.lastName}`,
          startedMatchday: currentMatchday,
          phase: 'building',
          eventsFired: [],
          decisionsMade: [],
          expiresMatchday: currentMatchday + 6,
          data: recurrenceData({ gamesWithoutGoal }, priorCount),
        })
        break
      }
    }
  }

  // ── joker_redemption ── (triggers from just-completed fixture)
  if (justCompletedFixture
    && justCompletedFixture.status === 'completed'
    && (justCompletedFixture.homeClubId === game.managedClubId
      || justCompletedFixture.awayClubId === game.managedClubId)
    && !hasArcType('joker_redemption')
    && canAddArc()) {
    const jokerPlayers = managedPlayers.filter(
      p => p.trait === 'joker' && !activePlayerIds.has(p.id)
    )
    for (const p of jokerPlayers) {
      const priorCount = priorPlayerResolutions(game, 'joker_vindicated', p.id, currentMatchday)
      if (priorCount >= 2) continue
      const events = justCompletedFixture.events ?? []
      const hadSuspension = events.some(e =>
        e.type === MatchEventType.Suspension
        && e.playerId === p.id
        && e.clubId === game.managedClubId,
      )
      if (hadSuspension) {
        newArcs.push({
          id: genId('arc', currentMatchday, `joker_${p.id}`),
          type: 'joker_redemption',
          playerId: p.id,
          subject: `${p.firstName[0]}. ${p.lastName}`,
          startedMatchday: currentMatchday,
          phase: 'building',
          eventsFired: [],
          decisionsMade: [],
          expiresMatchday: currentMatchday + 4,
          data: recurrenceData({ sourceFixtureId: justCompletedFixture.id }, priorCount),
        })
        break
      }
    }
  }

  // ── veteran_farewell ──
  if (!hasArcType('veteran_farewell') && canAddArc() && currentMatchday >= 15) {
    const veterans = managedPlayers.filter(
      p => p.trait === 'veteran' && p.age >= 30 &&
           p.contractUntilSeason === game.currentSeason &&
           !activePlayerIds.has(p.id)
    )
    const candidate = veterans.find(p =>
      priorPlayerResolutions(game, 'veteran_stayed', p.id, currentMatchday) < 2
    )
    if (candidate) {
      const p = candidate
      const priorCount = priorPlayerResolutions(game, 'veteran_stayed', p.id, currentMatchday)
      newArcs.push({
        id: genId('arc', currentMatchday, `veteran_${p.id}`),
        type: 'veteran_farewell',
        playerId: p.id,
        subject: `${p.firstName[0]}. ${p.lastName}`,
        startedMatchday: currentMatchday,
        phase: 'building',
        eventsFired: [],
        decisionsMade: [],
        expiresMatchday: currentMatchday + 8,
        data: recurrenceData({}, priorCount),
      })
    }
  }

  // ledare_crisis BORTTAGEN (H1-uppföljning, människoupplevelse-audit
  // 7024f8a, 2026-08-24, Jacobs dom). Triggade på exakt samma villkor som
  // postAdvanceEvents.ts:s captainSpeech ("3 förluster i rad") men kunde
  // peka ut en ANNAN spelare än den faktiska kaptenen (trait 'ledare'/
  // 'veteran', inte captainPlayerId) och räknade in cupmatcher i strecket.
  // captainSpeech är kanon — give_words boardPatience-kostnad och
  // take_charges moralkostnad flyttades in i generateCaptainSpeechEvent()
  // (eventFactories.ts) i samma commit. Se BACKLOG.md "Två läsare, en
  // sanning" och SLUTTEST_KO.md post 53 för full historik. Migration för
  // saves med en ledare_crisis-arc mid-flight: saveGameMigration.ts.

  // ── lokal_hero ── (mål i just spelat derby)
  if (justCompletedFixture && !hasArcType('lokal_hero') && canAddArc()) {
    const managedPlayed = justCompletedFixture.homeClubId === game.managedClubId
      || justCompletedFixture.awayClubId === game.managedClubId
    const rivalry = getRivalry(justCompletedFixture.homeClubId, justCompletedFixture.awayClubId)
    if (managedPlayed && rivalry) {
      const lokalPlayers = managedPlayers.filter(
        p => p.trait === 'lokal' && !activePlayerIds.has(p.id)
      )
      for (const p of lokalPlayers) {
        const priorCount = priorPlayerResolutions(game, 'lokal_hero_moment', p.id, currentMatchday)
        if (priorCount >= 2) continue
        const events = justCompletedFixture.events ?? []
        const scoredInDerby = events.some(e =>
          e.type === MatchEventType.Goal
          && e.playerId === p.id
          && e.clubId === game.managedClubId,
        )
        if (scoredInDerby) {
          newArcs.push({
            id: genId('arc', currentMatchday, `lokal_${p.id}`),
            type: 'lokal_hero',
            playerId: p.id,
            subject: `${p.firstName[0]}. ${p.lastName}`,
            startedMatchday: currentMatchday,
            phase: 'building',
            eventsFired: [],
            decisionsMade: [],
            expiresMatchday: currentMatchday + 4,
            data: recurrenceData({ sourceFixtureId: justCompletedFixture.id }, priorCount),
          })
          break
        }
      }
    }
  }

  // ── contract_drama ── (utgående kontrakt + ett faktiskt bud, inte textmatchning)
  // H1-uppföljning (människoupplevelse-audit 7024f8a, 2026-08-24, Jacobs dom):
  // villkoret letade tidigare efter InboxItemType.Media-poster vars body
  // innehöll substrängen "spekulationer" — ingen generator i kodbasen
  // (mediaService/journalistService/rumorService/midSeasonEventService)
  // skrev NÅGONSIN den strängen. `grep -rln spekulationer src/domain` gav
  // ETT träffställe: denna kontrollen. Bekräftat i simulering (scripts/
  // h1-arc-eligibility-sim.ts, 20 karriärer × 4 säsonger): 0/20, strukturellt
  // onåbart, inte bara smalt. "Ett kontraktsdrama som inte kan inträffa är
  // sämre än inget" — omskrivet mot faktisk state: `game.transferBids`
  // (transferService.ts, `direction:'incoming'` = ett bud på VÅR spelare,
  // satt av sellingClubId===managedClubId, se createOutgoingBid-motparten)
  // och `Player.contractUntilSeason` (samma fält veteran_farewell redan
  // använder för "utgående kontrakt").
  if (!hasArcType('contract_drama') && canAddArc()) {
    const biddedPlayerIds = new Set(
      game.transferBids
        .filter(b => b.direction === 'incoming' && b.status === 'pending' && b.sellingClubId === game.managedClubId)
        .map(b => b.playerId)
    )
    for (const p of managedPlayers) {
      if (!biddedPlayerIds.has(p.id)) continue
      if (activePlayerIds.has(p.id)) continue
      if (p.contractUntilSeason !== game.currentSeason) continue
      if (p.form <= 65) continue
      const priorCount = priorPlayerResolutions(
        game,
        'contract_drama_resolved',
        p.id,
        currentMatchday,
        '_extended',
      )
      if (priorCount >= 2) continue
      newArcs.push({
        id: genId('arc', currentMatchday, `contract_${p.id}`),
        type: 'contract_drama',
        playerId: p.id,
        subject: `${p.firstName[0]}. ${p.lastName}`,
        startedMatchday: currentMatchday,
        phase: 'building',
        eventsFired: [],
        decisionsMade: [],
        expiresMatchday: currentMatchday + 6,
        data: recurrenceData({}, priorCount),
      })
      break
    }
  }

  // ── derby_echo ── (just completed derby)
  if (justCompletedFixture
    && (justCompletedFixture.homeClubId === game.managedClubId
      || justCompletedFixture.awayClubId === game.managedClubId)) {
    const rivalry = getRivalry(justCompletedFixture.homeClubId, justCompletedFixture.awayClubId)
    if (rivalry && !existing.some(a => a.type === 'derby_echo' && a.phase !== 'resolving')) {
      const opponentId = justCompletedFixture.homeClubId === game.managedClubId
        ? justCompletedFixture.awayClubId
        : justCompletedFixture.homeClubId
      const isHome = justCompletedFixture.homeClubId === game.managedClubId
      const our = isHome ? (justCompletedFixture.homeScore ?? 0) : (justCompletedFixture.awayScore ?? 0)
      const their = isHome ? (justCompletedFixture.awayScore ?? 0) : (justCompletedFixture.homeScore ?? 0)
      const derbyResult = our > their ? 'win' : our < their ? 'loss' : 'draw'
      newArcs.push({
        id: genId('arc', currentMatchday, `derby_echo_${opponentId}`),
        type: 'derby_echo',
        opponentClubId: opponentId,
        startedMatchday: currentMatchday,
        phase: 'building',
        eventsFired: [],
        decisionsMade: [],
        expiresMatchday: currentMatchday + 2,
        data: { derbyResult, sourceFixtureId: justCompletedFixture.id },
      })
    }
  }

  return newArcs
}

// ── progressArcs ──────────────────────────────────────────────────────────────

export interface ArcProgressResult {
  updatedArcs: ActiveArc[]
  newEvents: GameEvent[]
  newInboxItems: Array<{
    id: string
    type: InboxItemType
    title: string
    body: string
    relatedPlayerId?: string
    isRead: boolean
    date: string
  }>
  newStorylines: StorylineEntry[]
}

/**
 * PÅSTÅENDEKARTAN batch-03 (2026-08-24), uppdaterad 2026-08-25: denna
 * funktion grenar per arc-typ, och grenarna har olika sanningshalt.
 * hungrig_breakthroughs och contract_dramas peak-event REVERIFIERAR nu sitt
 * triggervillkor innan eventet skapas (mutationVerificationGate-utökning,
 * Jacobs order) — inte längre utelämnade. derby_echo fick låst text av
 * Jacob 2026-08-25 (SANNINGEN-SAKNAS-fix): den släppte kausalpåståendet
 * ("satte tonen") och citerar nu bara det utfall som faktiskt lagras.
 *
 * @cites arc.data.derbyResult, completedSinceStart, arc.decisionsMade, p.age, p.careerStats.seasonsPlayed, p.salary, updatedArc.phase, game.transferBids
 */
export function progressArcs(
  game: SaveGame,
  currentMatchday: number,
): ArcProgressResult {
  const arcs = game.activeArcs ?? []
  const updatedArcs: ActiveArc[] = []
  const newEvents: GameEvent[] = []
  const newInboxItems: ArcProgressResult['newInboxItems'] = []
  const newStorylines: StorylineEntry[] = []

  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const localPaper = game.localPaperName ?? 'Lokaltidningen'
  const currentDate = game.currentDate

  // Suppress unused warning — rng reserved for future stochastic arc content
  void mulberry32(currentMatchday * 7919 + game.currentSeason * 31)

  for (const arc of arcs) {
    if (currentMatchday > arc.expiresMatchday) {
      continue // expired
    }

    const p = arc.playerId ? managedPlayers.find(pp => pp.id === arc.playerId) : undefined
    const name = p ? playerName(p) : 'Spelaren'
    const matchdaysSinceStart = currentMatchday - arc.startedMatchday
    const isRecurrenceVariant = arc.data?.recurrence === 'variant'

    let updatedArc = { ...arc }

    // ── Phase transitions ──
    if (arc.phase === 'building' && matchdaysSinceStart >= 2) {
      updatedArc = { ...updatedArc, phase: 'peak' }
    } else if (arc.phase === 'peak' && matchdaysSinceStart >= 4) {
      updatedArc = { ...updatedArc, phase: 'resolving' }
    }

    // ────────────────────────────────────────────────────────────────────────
    if (arc.type === 'derby_echo') {
      if (matchdaysSinceStart >= 2) {
        updatedArc = { ...updatedArc, phase: 'resolving' }
      }
      const sourceFixtureId = arc.data?.sourceFixtureId as string | undefined
      const sourceFixture = game.fixtures.find(fixture =>
        fixture.status === 'completed'
        && (sourceFixtureId ? fixture.id === sourceFixtureId : fixture.matchday === arc.startedMatchday)
        && (fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId)
        && getRivalry(fixture.homeClubId, fixture.awayClubId) !== null
        && (!arc.opponentClubId
          || fixture.homeClubId === arc.opponentClubId
          || fixture.awayClubId === arc.opponentClubId),
      )
      const isHome = sourceFixture?.homeClubId === game.managedClubId
      const ourScore = sourceFixture
        ? (isHome ? sourceFixture.homeScore : sourceFixture.awayScore)
        : undefined
      const theirScore = sourceFixture
        ? (isHome ? sourceFixture.awayScore : sourceFixture.homeScore)
        : undefined
      const derbyResult = ourScore === undefined || ourScore === null || theirScore === undefined || theirScore === null
        ? null
        : ourScore > theirScore ? 'win' : ourScore < theirScore ? 'loss' : 'draw'
      const sourceOpponentId = sourceFixture
        ? (isHome ? sourceFixture.awayClubId : sourceFixture.homeClubId)
        : arc.opponentClubId
      const opponentClub = game.clubs.find(c => c.id === sourceOpponentId)
      const opponentName = opponentClub?.name ?? 'rivalen'
      const managedClubName = game.clubs.find(c => c.id === game.managedClubId)?.name ?? 'klubben'
      const priorDerbyResult = previousDerbyResult(game, sourceOpponentId, arc.startedMatchday)
      const recurrenceCopy = derbyResult
        ? derbyRecurrenceCopy(priorDerbyResult, derbyResult, managedClubName, opponentName)
        : null

      if (arc.phase === 'building' && derbyResult) {
        const echoId = `derby_echo_inbox_${arc.id}`
        if (!arc.eventsFired.includes(echoId)) {
          const headline = recurrenceCopy?.headline ?? (derbyResult === 'win'
            ? 'Derbyseger ger hela orten energi'
            : derbyResult === 'loss'
              ? `Tung förlust mot ${opponentName} — men nästa gång...`
              : 'Derbyt slutade oavgjort — orten delad')
          const resultText = recurrenceCopy?.resultText ?? (derbyResult === 'win'
            ? `🏆 Derby-triumf mot ${opponentName}`
            : derbyResult === 'loss'
              ? `💔 Derby-förlust mot ${opponentName}`
              : `Oavgjort mot ${opponentName}.`)
          newInboxItems.push({
            id: `inbox_${echoId}`,
            type: InboxItemType.Derby,
            title: `📰 ${localPaper}: "${headline}"`,
            body: resultText,
            isRead: false,
            date: currentDate,
          })
          updatedArc = { ...updatedArc, eventsFired: [...updatedArc.eventsFired, echoId] }
        }
      }

      if (updatedArc.phase === 'resolving') {
        const storylineId = `storyline_${arc.id}_resolved`
        if (!arc.eventsFired.includes(storylineId) && derbyResult) {
          const resultText = recurrenceCopy?.resultText ?? (derbyResult === 'win'
            ? `🏆 Derby-triumf mot ${opponentName}`
            : derbyResult === 'loss'
              ? `💔 Derby-förlust mot ${opponentName}`
              : `Oavgjort mot ${opponentName}.`)
          newStorylines.push({
            id: storylineId,
            type: 'derby_echo_resolved',
            season: game.currentSeason,
            matchday: getCurrentLeagueRound(game),
            clubId: game.managedClubId,
            relatedClubId: sourceOpponentId,
            outcome: derbyResult === 'win' ? 'won' : derbyResult === 'loss' ? 'lost' : 'neutral',
            description: resultText,
            displayText: resultText,
            resolved: true,
          })
        }
        continue // auto-resolve
      }

      updatedArcs.push(updatedArc)
      continue
    }

    // ────────────────────────────────────────────────────────────────────────
    if (arc.type === 'lokal_hero') {
      const sourceFixtureId = arc.data?.sourceFixtureId as string | undefined
      const sourceFixture = game.fixtures.find(fixture =>
        fixture.status === 'completed'
        && (sourceFixtureId ? fixture.id === sourceFixtureId : fixture.matchday === arc.startedMatchday)
        && (fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId)
        && getRivalry(fixture.homeClubId, fixture.awayClubId) !== null
        && (fixture.events ?? []).some(event =>
          event.type === MatchEventType.Goal
          && event.playerId === arc.playerId
          && event.clubId === game.managedClubId,
        ),
      )
      const groundedLocalHero = Boolean(p && sourceFixture)

      if (updatedArc.phase === 'peak' && p && groundedLocalHero) {
        const inboxId = `lokal_hero_inbox_${arc.id}`
        if (!arc.eventsFired.includes(inboxId)) {
          newInboxItems.push({
            id: `inbox_${inboxId}`,
            type: InboxItemType.Media,
            title: isRecurrenceVariant
              ? `📰 ${localPaper}: "${name} gjorde det igen"`
              : `📰 ${localPaper}: "${name} — ortens hjälte"`,
            body: isRecurrenceVariant
              ? 'Två derbyn, två mål. Orten har slutat bli förvånad.'
              : `${name} spelade sin roll. Orten minns.`,
            relatedPlayerId: p.id,
            isRead: false,
            date: currentDate,
          })
          updatedArc = { ...updatedArc, eventsFired: [...updatedArc.eventsFired, inboxId] }
        }
      }
      if (updatedArc.phase === 'resolving') {
        const storylineId = `storyline_${arc.id}_resolved`
        if (!arc.eventsFired.includes(storylineId) && p && groundedLocalHero) {
          newStorylines.push({
            id: storylineId,
            type: 'lokal_hero_moment',
            season: game.currentSeason,
            matchday: getCurrentLeagueRound(game),
            playerId: p.id,
            clubId: game.managedClubId,
            description: isRecurrenceVariant
              ? `🏠 ${name} — ortens hjälte, andra gången`
              : `🏠 ${name} — ortens hjälte`,
            displayText: isRecurrenceVariant
              ? `🏠 ${name} — ortens hjälte, andra gången`
              : `🏠 ${name} — ortens hjälte`,
            resolved: true,
          })
        } else if (isRecurrenceVariant && p && !groundedLocalHero) {
          newInboxItems.push({
            id: `inbox_arc_resolved_generic_${arc.id}`,
            type: InboxItemType.MediaEvent,
            title: `Berättelsen om ${name}`,
            body: `${name} gjorde det igen. Orten räknar med det nu — det är en annan sorts press.`,
            relatedPlayerId: p.id,
            isRead: false,
            date: currentDate,
          })
        }
        continue
      }
      updatedArcs.push(updatedArc)
      continue
    }

    // ────────────────────────────────────────────────────────────────────────
    if (arc.type === 'hungrig_breakthrough') {
      if (updatedArc.phase === 'peak' && p) {
        // mutationVerificationGate-utökning (2026-08-25, Jacobs order: "30–60
        // min, gör den"): villkoret (gamesWithoutGoal >= 3) verifierades bara
        // vid TRIGGER (building-fasen). Utan denna reverifiering kunde
        // journalisten fråga "han har inte gjort mål på länge" trots att
        // spelaren gjort mål i en match MELLAN building och peak (2-4
        // omgångar senare) — exakt samma stale-claim-mönster som redan
        // reverifieras nedan i resolving-grenen, flyttat hit och körd innan
        // peak-eventet skapas.
        const completedSinceStart = game.fixtures.filter(
          f => (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
               f.status === 'completed' &&
               (f.matchday ?? 0) > arc.startedMatchday
        )
        const alreadyScored = completedSinceStart.some(f =>
          (f.events ?? []).some(e =>
            e.type === MatchEventType.Goal
            && e.playerId === arc.playerId
            && e.clubId === game.managedClubId,
          )
        )
        const eventId = `hungrig_peak_event_${arc.id}`
        if (!alreadyScored && !arc.eventsFired.includes(eventId)) {
          newEvents.push({
            id: eventId,
            type: 'playerArc',
            title: isRecurrenceVariant
              ? `Journalisten frågar om ${name} — igen`
              : `Journalisten frågar om ${name}`,
            body: isRecurrenceVariant
              ? `${name} har det tungt igen. Förra gången höll du honom om ryggen, och han bröt isen. Nu står frågan där en gång till: tror du fortfarande?`
              : `${name} har det tungt. Tror du fortfarande på honom?`,
            choices: [
              {
                id: 'back_him',
                label: 'Han får tiden han behöver',
                // O2 lager 3 (Jacobs dom 2026-08-24): var ren boostMorale,
                // zero cost — dominerade pressure/alternatives fullständigt
                // (O2_PAIRWISE_DOMINANCE_AUDIT_2026-08-23.md). Behåller
                // samma +5 moral, kostar nu utvecklingstakt (developmentRate,
                // INTE potentialAbility — ett tak krymper inte för att
                // ingen tryckte på). Text låst av Jacob, ordagrant.
                subtitle: '💛 Moral +5 · utvecklingstakt −4',
                effect: {
                  type: 'multiEffect',
                  subEffects: JSON.stringify([
                    { type: 'boostMorale', amount: 5, targetPlayerId: p.id },
                    { type: 'developmentRateDelta', amount: -4, targetPlayerId: p.id },
                  ]),
                },
              },
              {
                id: 'pressure',
                label: 'Han måste leverera nu',
                subtitle: '💛 Moral −5',
                effect: { type: 'boostMorale', value: -5, targetPlayerId: p.id },
              },
              {
                id: 'alternatives',
                label: 'Vi har andra alternativ',
                subtitle: '💛 Moral −15',
                effect: { type: 'boostMorale', value: -15, targetPlayerId: p.id },
              },
            ],
            sender: { name: 'Journalist', role: 'Media' },
            relatedPlayerId: p.id,
            resolved: false,
          })
          updatedArc = { ...updatedArc, eventsFired: [...updatedArc.eventsFired, eventId] }
        }
      }

      if (updatedArc.phase === 'resolving') {
        const completedSinceStart = game.fixtures.filter(
          f => (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
               f.status === 'completed' &&
               (f.matchday ?? 0) > arc.startedMatchday
        )
        const playerScored = completedSinceStart.some(f =>
          (f.events ?? []).some(e =>
            e.type === MatchEventType.Goal
            && e.playerId === arc.playerId
            && e.clubId === game.managedClubId,
          )
        )
        if (playerScored && p) {
          const storylineId = `storyline_${arc.id}_resolved`
          if (!arc.eventsFired.includes(storylineId)) {
            newStorylines.push({
              id: storylineId,
              type: 'hungrig_breakthrough',
              season: game.currentSeason,
              matchday: getCurrentLeagueRound(game),
              playerId: p.id,
              clubId: game.managedClubId,
              // The goal event proves that the drought ended, but not that
              // this was the match's or season's decisive moment. Reuse the
              // existing approved display line for the narrower true claim.
              description: isRecurrenceVariant ? `${name} bröt isen. Igen.` : `${name} bröt isen`,
              displayText: isRecurrenceVariant ? `${name} bröt isen. Igen.` : `${name} bröt isen`,
              resolved: true,
            })
          }
        } else if (isRecurrenceVariant && p) {
          newInboxItems.push({
            id: `inbox_arc_resolved_generic_${arc.id}`,
            type: InboxItemType.MediaEvent,
            title: `Berättelsen om ${name}`,
            body: `${name}s andra torka. Hungern är kvar. Tålamodet är en annan sak.`,
            relatedPlayerId: p.id,
            isRead: false,
            date: currentDate,
          })
        }
        continue
      }
      updatedArcs.push(updatedArc)
      continue
    }

    // ────────────────────────────────────────────────────────────────────────
    if (arc.type === 'joker_redemption') {
      const sourceFixtureId = arc.data?.sourceFixtureId as string | undefined
      const suspensionFixture = game.fixtures.find(fixture =>
        fixture.status === 'completed'
        && (sourceFixtureId ? fixture.id === sourceFixtureId : fixture.matchday === arc.startedMatchday)
        && (fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId)
        && (fixture.events ?? []).some(event =>
          event.type === MatchEventType.Suspension
          && event.playerId === arc.playerId
          && event.clubId === game.managedClubId,
        ),
      )
      const groundedSuspension = Boolean(p && suspensionFixture)

      if (arc.phase === 'building' && p && groundedSuspension) {
        const inboxId = `joker_building_inbox_${arc.id}`
        if (!arc.eventsFired.includes(inboxId)) {
          newInboxItems.push({
            id: `inbox_${inboxId}`,
            type: InboxItemType.Media,
            title: isRecurrenceVariant
              ? `📰 ${localPaper}: "${name} — igen"`
              : `📰 ${localPaper}: "${name} — geni eller risk?"`,
            body: isRecurrenceVariant ? `${name} — igen.` : `${name} — geni eller risk?`,
            relatedPlayerId: p.id,
            isRead: false,
            date: currentDate,
          })
          updatedArc = { ...updatedArc, eventsFired: [...updatedArc.eventsFired, inboxId] }
        }
      }

      if (updatedArc.phase === 'peak' && p && groundedSuspension) {
        const eventId = `joker_peak_event_${arc.id}`
        if (!arc.eventsFired.includes(eventId)) {
          newEvents.push({
            id: eventId,
            type: 'playerArc',
            title: isRecurrenceVariant
              ? `Styrelsen frågar om ${name} igen`
              : `Styrelsen frågar om ${name}`,
            body: isRecurrenceVariant
              ? `Du trodde på ${name} förra gången, och han gav er rätt. Nu sitter han utvisad igen. Styrelsen vill veta om det är samma svar.`
              : `Styrelsen undrar om ${name}s osäkerhet är värt risken. De vill ha ett klart besked om hans roll i laget.`,
            choices: [
              {
                id: 'back_joker',
                label: 'Jag tror på honom',
                // O2 lager 3 (Jacobs dom 2026-08-24): var ren boostMorale,
                // zero cost — dominerade bench_joker fullständigt. Behåller
                // samma +8 moral, kostar nu discipline (fältet
                // disciplineRisk redan läser i matchmotorn, matchCore.ts).
                // Text låst av Jacob, ordagrant.
                subtitle: '💛 Moral +8 · disciplin −4',
                effect: {
                  type: 'multiEffect',
                  subEffects: JSON.stringify([
                    { type: 'boostMorale', amount: 8, targetPlayerId: p.id },
                    { type: 'disciplineDelta', amount: -4, targetPlayerId: p.id },
                  ]),
                },
              },
              {
                id: 'bench_joker',
                label: 'Bänka nästa match',
                subtitle: 'Vilar nästa match · moral −10',
                effect: {
                  type: 'multiEffect',
                  subEffects: JSON.stringify([
                    { type: 'boostMorale', amount: -10, targetPlayerId: p.id },
                    { type: 'restPlayer', amount: 1, targetPlayerId: p.id },
                  ]),
                },
              },
            ],
            sender: { name: 'Styrelseordföranden', role: 'Styrelse' },
            relatedPlayerId: p.id,
            resolved: false,
          })
          updatedArc = { ...updatedArc, eventsFired: [...updatedArc.eventsFired, eventId] }
        }
      }

      if (updatedArc.phase === 'resolving' && p) {
        const wasBacked = arc.decisionsMade.includes('back_joker')
        const decisionMatchday = typeof arc.data?.decisionMatchday === 'number'
          ? arc.data.decisionMatchday
          : undefined
        if (wasBacked && decisionMatchday !== undefined) {
          const contributed = game.fixtures.some(fixture =>
            fixture.status === 'completed'
            && (fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId)
            && (fixture.matchday ?? 0) > decisionMatchday
            && (fixture.matchday ?? 0) <= currentMatchday
            && (fixture.events ?? []).some(event =>
              (event.type === 'goal' || event.type === 'assist')
                && event.playerId === p.id
                && event.clubId === game.managedClubId,
            ),
          )
          if (contributed) {
            const storylineId = `storyline_${arc.id}_resolved`
            if (!arc.eventsFired.includes(storylineId)) {
              newStorylines.push({
                id: storylineId,
                type: 'joker_vindicated',
                season: game.currentSeason,
                matchday: getCurrentLeagueRound(game),
                playerId: p.id,
                clubId: game.managedClubId,
                // The event proves a contribution after the manager backed
                // the player, not a match-winning action or universal acclaim.
                description: isRecurrenceVariant
                  ? `${name} — joker i hjärtat. Andra gången.`
                  : `${name} — joker i hjärtat`,
                displayText: isRecurrenceVariant
                  ? `${name} — joker i hjärtat. Andra gången.`
                  : `${name} — joker i hjärtat`,
                resolved: true,
              })
            }
          }
        }
        continue
      }
      updatedArcs.push(updatedArc)
      continue
    }

    // ────────────────────────────────────────────────────────────────────────
    if (arc.type === 'veteran_farewell') {
      if (updatedArc.phase === 'peak' && p) {
        const eventId = `veteran_peak_event_${arc.id}`
        if (!arc.eventsFired.includes(eventId)) {
          // O1 kandidat 2, text låst av Jacob 2026-08-24. Två brödtextvarianter
          // — homegrown skriver ut {år} (careerStats.seasonsPlayed är sant
          // för en spelare som aldrig värvats), värvad gör det inte (ingen
          // pålitlig klubb-tenure-data finns för värvade spelare, se
          // BACKLOG.md "Datafält som saknas — år i klubben"). Ingen
          // {ersättare} — "den som väntar" räcker, mallen kräver den inte.
          const annualSalaryTkr = Math.round((p.salary * 12) / 1000)
          const seasonsInClub = p.careerStats?.seasonsPlayed ?? 0
          const body = isRecurrenceVariant
            ? `Två år sedan du förlängde. ${name} fyller ${p.age} och vill ha ett år till. Ett, säger han, inte två. Han är inte bättre än den som väntar — det var han inte då heller. ${annualSalaryTkr} tkr i året, samma som förut.`
            : p.isHomegrown
              ? `${name} fyller ${p.age} i vinter. Han har varit här i ${seasonsInClub} år och han vill ha två till. Han är inte bättre än den som väntar, men han är den de sjunger om. ${annualSalaryTkr} tkr i året, samma som förut.`
              : `${name} fyller ${p.age} i vinter och vill ha två år till. Han har varit här länge nog att folk vet var han bor. Han är inte bättre än den som väntar, men han är den de sjunger om. ${annualSalaryTkr} tkr i året, samma som förut.`
          newEvents.push({
            id: eventId,
            type: 'playerArc',
            title: isRecurrenceVariant ? `${name} vill stanna — igen` : `${name} vill stanna`,
            body,
            choices: [
              {
                id: 'extend_veteran',
                label: isRecurrenceVariant ? 'Förläng ett år' : 'Förläng två år',
                // O1 kandidat 2 (Jacobs dom 2026-08-24): klackens mood är
                // KONSEKVENSEN av valet, inte ett villkor — favoritePlayerId
                // mäter en annan fråga (vem som är bäst just nu) och skulle
                // strukturellt nästan aldrig träffa en åldrande veteran.
                // +6 klackens stämning, godkänd magnitud — mindre än avskedets
                // −14: att behålla någon är förväntat, att släppa någon är
                // en händelse.
                subtitle: isRecurrenceVariant
                  ? 'Kontrakt +1 år · klackens stämning +6'
                  : 'Kontrakt +2 år · klackens stämning +6',
                effect: {
                  type: 'multiEffect',
                  subEffects: JSON.stringify([
                    { type: 'extendContract', targetPlayerId: p.id, contractYears: isRecurrenceVariant ? 1 : 2 },
                    { type: 'supporterMood', amount: 6 },
                  ]),
                },
              },
              {
                id: 'farewell_veteran',
                label: 'Tacka för sig',
                // Var tidigare bara boostMorale — "ett slut" gjorde honom
                // aldrig faktiskt free agent (samma klass av fel som let_go
                // hade, se veteranArcExtendAndLetGo.test.ts). releasePlayer
                // lagd till: konsekvensen är omedelbar, inte väntande på
                // säsongsslutets kontraktsutgång. −14 klackens stämning,
                // godkänd magnitud.
                subtitle: 'Spelaren lämnar · moral −20 · klackens stämning −14',
                effect: {
                  type: 'multiEffect',
                  subEffects: JSON.stringify([
                    { type: 'boostMorale', amount: -20, targetPlayerId: p.id },
                    { type: 'releasePlayer', targetPlayerId: p.id },
                    { type: 'supporterMood', amount: -14 },
                  ]),
                },
              },
            ],
            sender: { name: 'Journalist', role: 'Media' },
            relatedPlayerId: p.id,
            resolved: false,
            // O1 kandidat 2 (DOM_VARSLET_SOM_SYSTEMMALL_2026-08-17.md,
            // Jacobs dom 2026-08-24): mallens fem punkter — klacken (namngiven
            // institution, agerar via mood-konsekvensen), veteranen (redan
            // mött, satt i elvan), lönen/kontraktsåren (ett tal mot en känd
            // resurs), trupp+ekonomi+klack (tre system), keep vs release
            // (systemen pekar isär). systemhandelse:true, inte bara playerArc.
            systemhandelse: true,
          })
          updatedArc = { ...updatedArc, eventsFired: [...updatedArc.eventsFired, eventId] }
        }
      }

      if (updatedArc.phase === 'resolving') {
        const storylineId = `storyline_${arc.id}_resolved`
        if (!arc.eventsFired.includes(storylineId)) {
          const extended = arc.decisionsMade.includes('extend_veteran')
          const farewelled = arc.decisionsMade.includes('farewell_veteran')
          const veteran = arc.playerId ? game.players.find(player => player.id === arc.playerId) : undefined
          const managedSquad = game.clubs.find(club => club.id === game.managedClubId)?.squadPlayerIds ?? []
          const outcomeIsApplied = veteran && (
            (extended
              && veteran.clubId === game.managedClubId
              && veteran.contractUntilSeason >= game.currentSeason + (isRecurrenceVariant ? 1 : 2))
            || (farewelled
              && veteran.clubId === 'free_agent'
              && !managedSquad.includes(veteran.id))
          )
          if (veteran && outcomeIsApplied) {
            const veteranName = playerName(veteran)
            newStorylines.push({
              id: storylineId,
              type: extended ? 'veteran_stayed' : 'veteran_farewell',
              season: game.currentSeason,
              matchday: getCurrentLeagueRound(game),
              playerId: veteran.id,
              clubId: game.managedClubId,
              // O1 kandidat 2, utfallsraderna låsta av Jacob 2026-08-24 — den
              // sista meningen i avskedet ("Han sa att han förstod") är avsiktligt
              // det som gör beslutet dyrt.
              description: extended
                ? isRecurrenceVariant
                  ? `${veteranName} skriver på igen. Ett år. Ingen tårta den här gången — men han log.`
                  : `${veteranName} skriver på i omklädningsrummet. Någon hade tagit med tårta.`
                : isRecurrenceVariant
                  ? `${veteranName} tömde skåpet själv. Han hade väntat på det i två år.`
                  : `${veteranName} tömde skåpet själv. Han sa att han förstod.`,
              displayText: extended
                ? isRecurrenceVariant
                  ? `🏅 ${veteranName} stannar ett år till`
                  : `🏅 ${veteranName} stannar — legenden lever`
                : isRecurrenceVariant
                  ? `${veteranName} tömde skåpet själv. Han hade väntat på det i två år.`
                  : `${veteranName} tömde skåpet själv. Han sa att han förstod.`,
              resolved: true,
            })
          }
        }
        continue
      }
      updatedArcs.push(updatedArc)
      continue
    }

    // ledare_crisis-progressionen BORTTAGEN i samma pass som triggern
    // (se kommentaren vid detectArcTriggers()) — captainSpeech (kanon)
    // hanterar hela kedjan själv, en enda GameEvent i postAdvanceEvents.ts,
    // ingen egen building/peak/resolving-fas behövs för den.

    // ────────────────────────────────────────────────────────────────────────
    if (arc.type === 'contract_drama') {
      if (updatedArc.phase === 'peak' && p) {
        // mutationVerificationGate-utökning (2026-08-25, Jacobs order, samma
        // pass som hungrig_breakthrough ovan): triggerns villkor (ett
        // pending, incoming bud från en annan klubb på spelaren) verifierades
        // bara vid TRIGGER. Utan reverifiering kunde peak-eventet påstå
        // "Rykten om intresse utifrån cirkulerar" trots att budet dragits
        // tillbaka/gått ut/besvarats 2-4 omgångar tidigare — samma
        // trigger-vs-verifiering-mönster som hungrig_breakthrough. Återanvänder
        // exakt samma filter som skapade arcen (raden ovan i denna fil).
        const stillHasPendingBid = game.transferBids.some(
          b => b.direction === 'incoming' && b.status === 'pending' &&
               b.sellingClubId === game.managedClubId && b.playerId === arc.playerId
        )
        const eventId = `contract_peak_event_${arc.id}`
        if (stillHasPendingBid && !arc.eventsFired.includes(eventId)) {
          newEvents.push({
            id: eventId,
            type: 'playerArc',
            title: isRecurrenceVariant ? `${name} ber om ett möte igen` : `${name} ber om ett möte`,
            body: isRecurrenceVariant
              ? `Förra året förlängde ni ett år. Nu är budet tillbaka och kontraktet går ut igen. Han vill inte ha samma samtal två gånger.`
              : `${name} vill reda ut sin framtid. Rykten om intresse utifrån cirkulerar och han vill ha ett klart besked.`,
            choices: [
              {
                id: 'extend_now',
                label: 'Erbjud förlängning nu',
                subtitle: 'Kontrakt +1 år · moral +10',
                effect: { type: 'extendContract', targetPlayerId: p.id, contractYears: 1 },
              },
              {
                id: 'wait_drama',
                label: 'Vänta till säsongsslut',
                subtitle: 'Kontraktet oförändrat · moral −5',
                effect: { type: 'boostMorale', value: -5, targetPlayerId: p.id },
              },
              {
                id: 'let_go',
                label: 'Du får gå',
                subtitle: 'Spelaren lämnar · moral −25',
                // O2 lager 1 (Jacobs dom 2026-08-24): var enbart boostMorale
                // på spelaren som lämnar — "Du får gå" gjorde honom aldrig
                // faktiskt free agent, storylinetexten nedan (`${name} lämnade
                // klubben`) påstod något koden inte utförde. multiEffect
                // behåller den befintliga "💛 Moral −25"-texten oförändrad och
                // lägger till den faktiska borttagningen ur truppen.
                effect: {
                  type: 'multiEffect',
                  subEffects: JSON.stringify([
                    { type: 'boostMorale', amount: -25, targetPlayerId: p.id },
                    { type: 'releasePlayer', targetPlayerId: p.id },
                  ]),
                },
              },
            ],
            sender: { name: name, role: 'Spelare' },
            relatedPlayerId: p.id,
            resolved: false,
          })
          updatedArc = { ...updatedArc, eventsFired: [...updatedArc.eventsFired, eventId] }
        }
      }

      if (updatedArc.phase === 'resolving') {
        const letGo = arc.decisionsMade.includes('let_go')
        const player = arc.playerId ? game.players.find(candidate => candidate.id === arc.playerId) : undefined
        const managedSquad = game.clubs.find(club => club.id === game.managedClubId)?.squadPlayerIds ?? []
        const releaseIsApplied = player
          && player.clubId === 'free_agent'
          && !managedSquad.includes(player.id)
        if (letGo && player && releaseIsApplied) {
          const storylineId = `storyline_${arc.id}_resolved`
          if (!arc.eventsFired.includes(storylineId)) {
            const playerDisplayName = playerName(player)
            newStorylines.push({
              id: storylineId,
              type: 'contract_drama_resolved',
              season: game.currentSeason,
              matchday: getCurrentLeagueRound(game),
              playerId: player.id,
              clubId: game.managedClubId,
              description: isRecurrenceVariant
                ? `${playerDisplayName} lämnade klubben. Andra gången frågan ställdes fick han sitt svar.`
                : `${playerDisplayName} lämnade klubben efter kontraktsstriden. En bitter upplösning.`,
              displayText: `📋 ${playerDisplayName} lämnade`,
              resolved: true,
            })
          }
        }
        continue
      }
      updatedArcs.push(updatedArc)
      continue
    }

    // Fallback: keep arc unless resolving
    if (updatedArc.phase === 'resolving') {
      // DEV-003: generic arc-resolution inbox event for arcs without specific resolving logic
      if (updatedArc.playerId && arc.phase !== 'resolving') {
        const player = managedPlayers.find(pp => pp.id === updatedArc.playerId)
        if (player) {
          const resolvedId = `arc_resolved_generic_${updatedArc.id}`
          if (!arc.eventsFired.includes(resolvedId)) {
            const arcExitTexts: Partial<Record<string, string>> = {
              hungrig_breakthrough: `${player.firstName} ${player.lastName}s genombrott uteblev denna säsong. Men hungern finns kvar.`,
              veteran_farewell: `${player.firstName} ${player.lastName}s era tog slut. Tysta steg ut ur omklädningsrummet.`,
              lokal_hero: `${player.firstName} ${player.lastName} spelade sin roll. Orten minns.`,
              contract_drama: `Kontraktshistorien kring ${player.firstName} ${player.lastName} avslutades utan drama.`,
              derby_echo: `Derbykänslan har lagt sig. Nästa gång räknas igen.`,
            }
            const exitBody = arcExitTexts[updatedArc.type] ?? 'En berättelse i laget avslutades.'
            newInboxItems.push({
              id: `inbox_${resolvedId}`,
              type: InboxItemType.MediaEvent,
              title: `Berättelsen om ${player.firstName} ${player.lastName}`,
              body: exitBody,
              relatedPlayerId: player.id,
              isRead: false,
              date: currentDate,
            })
          }
        }
      }
      // Don't keep resolving arcs — they're done
    } else {
      updatedArcs.push(updatedArc)
    }
  }

  return { updatedArcs, newEvents, newInboxItems, newStorylines }
}
