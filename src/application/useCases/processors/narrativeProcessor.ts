import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { VictoryEcho } from '../../../domain/services/postVictoryNarrativeService'
import type { SupporterGroup } from '../../../domain/entities/SaveGame'
import { InboxItemType, MatchEventType, FixtureStatus } from '../../../domain/enums'
import { getEventPriority } from '../../../domain/entities/GameEvent'
import { getRivalry } from '../../../domain/data/rivalries'
import { updateSupporterMembers, reevaluateFavoritePlayer } from '../../../domain/services/supporterService'
import { classifyVictory, generateVictoryEcho, shouldSurfaceVictoryEcho } from '../../../domain/services/postVictoryNarrativeService'
import { generatePreMatchOpponentQuote } from '../../../domain/services/opponentManagerService'
import { swedishGenitive } from '../../../domain/data/matchCommentary'
import { deriveUtfall } from '../../../domain/services/matchTypeAxes'
import { getAwayTripNarrative } from '../../../domain/services/supporterRituals'
import { detectArcTriggers, progressArcs } from '../../../domain/services/arcService'
import { logNarrativeBeat } from '../../../domain/services/narrativeLogService'

export interface NarrativeResult {
  fanMood: number
  supporterGroup: SupporterGroup | undefined
  pendingVictoryEcho: VictoryEcho | undefined
  victoryEchoExpires: number | undefined
  rivalryHistory: SaveGame['rivalryHistory']
  nemesisTracker: SaveGame['nemesisTracker']
  inboxItems: InboxItem[]
}

/**
 * KÖRORDER 2026-09-18 §5.1 — Nemesis talar vid tre fasta trösklar, inte vid
 * varje mål. Texterna är Fables (docs/TEXTLEVERANS_SPAKBALANS_2026-09-18.md
 * A1), kopierade ordagrant. Siffrorna skrivs ut i bokstäver just för att
 * trösklarna är fasta — det är samma tal varje gång.
 */
export const NEMESIS_THRESHOLDS = [3, 6, 10] as const

function nemesisBody(threshold: number, name: string, club: string): string {
  if (threshold === 3) return `${name} (${club}) har gjort tre mål mot oss nu. Backarna vet vem han är.`
  if (threshold === 6) return `Sex mål mot oss av ${name} (${club}). Han hittar samma yta varje gång. Scouten har hans nummer.`
  return `${name} (${club}) är uppe i tio mål mot oss. Det pratas om det på Konsum. Han lär inte flytta hit.`
}

/**
 * §5.1 — Rivalmötet talar bara när dominansen ETABLERAS eller BRYTS.
 * Tidigare gick raden även på "två raka" i endera riktningen, vilket gjorde
 * den till en notis varannan match mot samma klubb — 107 gånger i en karriär.
 */
const RIVALRY_DOMINANCE_STREAK = 4

export function processNarrative(
  game: SaveGame,
  justCompletedManagedFixture: Fixture | null,
  nextMatchday: number,
  _newDate: string,
  localRand: () => number,
): NarrativeResult {
  const inboxItems: InboxItem[] = []

  // ── Fan mood + supporter group ──────────────────────────────────────────
  const currentFanMood = game.fanMood ?? 50
  // 8b §B: drift mot 50 varje omgång (3 %) — reversion mot grundstämning, oavsett match.
  // Tillämpas FÖRE match-/transfer-deltan så resultat aktivt motverkar driften (speglar
  // communityProcessor-pulsen). Driften ligger här, inte i roundProcessor, eftersom fanMood
  // beräknas här (ny absolut nivå) — inte som en delta-ackumulator som communityStanding.
  const FANMOOD_DRIFT_TARGET = 50
  const FANMOOD_DRIFT_STRENGTH = 0.03
  let fanMood = Math.max(0, Math.min(100, currentFanMood + (FANMOOD_DRIFT_TARGET - currentFanMood) * FANMOOD_DRIFT_STRENGTH))
  let supporterGroup = game.supporterGroup
  if (justCompletedManagedFixture) {
    const isHome = justCompletedManagedFixture.homeClubId === game.managedClubId
    const myScore = isHome ? justCompletedManagedFixture.homeScore : justCompletedManagedFixture.awayScore
    const theirScore = isHome ? justCompletedManagedFixture.awayScore : justCompletedManagedFixture.homeScore
    const utfall = deriveUtfall(justCompletedManagedFixture, game.managedClubId)
    const won = utfall === 'vunnet'
    const lost = utfall === 'forlorat'
    const bigWin = won && (myScore ?? 0) >= (theirScore ?? 0) + 3
    const bigLoss = lost && (theirScore ?? 0) >= (myScore ?? 0) + 3
    // Oavgjort ger 0 (var +1) — en oavgjord match ska inte långsamt lyfta fanMood.
    let fanDelta = bigWin ? 8 : won ? 4 : bigLoss ? -8 : lost ? -4 : 0
    // Diminishing returns på POSITIVT delta (speglar communityProcessor): högre nivå → mindre lyft.
    // Negativa delta opåverkade — besvikelse biter alltid fullt.
    if (fanDelta > 0) {
      const dim = fanMood > 85 ? 0.25 : fanMood > 70 ? 0.5 : fanMood > 55 ? 0.75 : 1.0
      fanDelta *= dim
    }
    fanMood = Math.max(0, Math.min(100, fanMood + fanDelta))
    if (isHome && supporterGroup) {
      supporterGroup = updateSupporterMembers(supporterGroup, won, localRand)
    }
  }

  // ── Bortaresans efterklang (DOM_DÖDA_TEXTPOOLER_2026-09-18, pool 2) ──────
  // Bortaresekortet fanns, men inget hände efteråt: spelaren sa ja till att
  // subventionera bussen och fick aldrig veta hur resan gick. Klass F,
  // händelse utan efterdyning — och för ett kort spelaren aktivt valt.
  // `getAwayTripNarrative` bar redan vinst-/förlustvarianterna med klackledare,
  // veteran, ungdom och familj som namngivna röster; den anropades bara aldrig.
  if (justCompletedManagedFixture && supporterGroup) {
    const wasAway = justCompletedManagedFixture.awayClubId === game.managedClubId
    // `awayTripMatchday` är omgången kortet BESVARADES, inte bortamatchens
    // omgång (eventResolver sätter resolvedMatchday). Efterklangen hör därför
    // till den FÖRSTA bortamatchen från och med beslutet — inte till en
    // likhetsjämförelse, som aldrig slog till. Id:t nycklas på resan så den
    // går exakt en gång per besvarad bortaresa.
    const trip = supporterGroup.awayTripSeason === game.currentSeason
      ? supporterGroup.awayTripMatchday
      : undefined
    const echoId = `inbox_awaytrip_after_${game.currentSeason}_${trip}`
    const alreadySent = game.inbox.some(i => i.id === echoId) || inboxItems.some(i => i.id === echoId)
    if (wasAway && trip !== undefined && justCompletedManagedFixture.matchday >= trip && !alreadySent) {
      const opponentClub = game.clubs.find(c => c.id === justCompletedManagedFixture.homeClubId)
      const opponentName = opponentClub?.shortName ?? opponentClub?.name ?? 'motståndaren'
      const tripWon = deriveUtfall(justCompletedManagedFixture, game.managedClubId) === 'vunnet'
      const narrative = getAwayTripNarrative(game, 'after', tripWon, opponentName)
      if (narrative) {
        inboxItems.push({
          id: echoId,
          date: game.currentDate,
          type: InboxItemType.Community,
          title: `Bussen hem från ${opponentName}`,
          body: narrative,
          isRead: false,
        } as InboxItem)
      }
    }
  }

  // ── Victory echo ─────────────────────────────────────────────────────────
  let pendingVictoryEcho = game.pendingVictoryEcho
  let victoryEchoExpires = game.victoryEchoExpires
  if (justCompletedManagedFixture) {
    const victoryType = classifyVictory(justCompletedManagedFixture, game.managedClubId)
    if (victoryType) {
      const opponentId = justCompletedManagedFixture.homeClubId === game.managedClubId
        ? justCompletedManagedFixture.awayClubId
        : justCompletedManagedFixture.homeClubId
      const opponentClub = game.clubs.find(c => c.id === opponentId)
      const opponentName = opponentClub?.shortName ?? opponentClub?.name ?? 'motståndaren'
      const echo = generateVictoryEcho(victoryType, justCompletedManagedFixture, opponentName, game.managedClubId, game)
      if (shouldSurfaceVictoryEcho(game, echo)) {
        pendingVictoryEcho = echo
        victoryEchoExpires = nextMatchday + 1
      }
      if (echo.boardMessage) {
        inboxItems.push({
          id: `victory_board_${justCompletedManagedFixture.id}`,
          type: InboxItemType.MediaEvent,
          title: 'Efter vinsten',
          body: echo.boardMessage,
          date: game.currentDate,
          isRead: false,
        })
      }
    } else {
      if (nextMatchday > (victoryEchoExpires ?? 0)) {
        pendingVictoryEcho = undefined
        victoryEchoExpires = undefined
      }
    }
  }

  // ── Supporter favourite reevaluation (every 5 rounds) ────────────────────
  if (nextMatchday % 5 === 0 && supporterGroup) {
    const favResult = reevaluateFavoritePlayer(
      supporterGroup,
      game.players.filter(p => p.clubId === game.managedClubId),
      nextMatchday,
      game.currentSeason,
    )
    if (favResult.changed) {
      inboxItems.push({
        id: `fav_shift_${nextMatchday}_${game.currentSeason}`,
        type: InboxItemType.MediaEvent,
        title: 'Klacken har en ny favorit',
        body: favResult.oldFavoriteName
          ? `Klacken sjunger inte längre ${swedishGenitive(favResult.oldFavoriteName)} namn. ${favResult.newFavoriteName} har tagit över kören.`
          : `${favResult.newFavoriteName} har tagit över kören.`,
        date: game.currentDate,
        isRead: false,
      } as InboxItem)
      supporterGroup = { ...supporterGroup, favoritePlayerId: favResult.favoritePlayerId }
    }
  }

  // ── Rivalry history ──────────────────────────────────────────────────────
  let rivalryHistory = { ...(game.rivalryHistory ?? {}) }
  if (justCompletedManagedFixture) {
    const isHome = justCompletedManagedFixture.homeClubId === game.managedClubId
    const opponentId = isHome ? justCompletedManagedFixture.awayClubId : justCompletedManagedFixture.homeClubId

    const utfall = deriveUtfall(justCompletedManagedFixture, game.managedClubId)
    const won = utfall === 'vunnet'
    const lost = utfall === 'forlorat'
    const resultLabel: 'win' | 'loss' | 'draw' = won ? 'win' : lost ? 'loss' : 'draw'

    const prev = rivalryHistory[opponentId] ?? { wins: 0, losses: 0, draws: 0, currentStreak: 0 }
    const newWins = prev.wins + (won ? 1 : 0)
    const newLosses = prev.losses + (lost ? 1 : 0)
    const newDraws = prev.draws + (!won && !lost ? 1 : 0)
    let newStreak: number
    if (won) {
      newStreak = prev.currentStreak > 0 ? prev.currentStreak + 1 : 1
    } else if (lost) {
      newStreak = prev.currentStreak < 0 ? prev.currentStreak - 1 : -1
    } else {
      newStreak = 0
    }

    rivalryHistory = {
      ...rivalryHistory,
      [opponentId]: {
        wins: newWins,
        losses: newLosses,
        draws: newDraws,
        lastResult: resultLabel,
        currentStreak: newStreak,
      },
    }

    // KÖRORDER 2026-09-18 §5.1 — bara två ögonblick i hela relationen till en
    // klubb, inte en notis varannan match. Dominansen ETABLERAS när
    // vinstsviten når RIVALRY_DOMINANCE_STREAK, och BRYTS vid första förlusten
    // därefter. `dominanceEstablished` i rivalryHistory bär minnet, så ingen
    // av raderna kan gå två gånger på samma sida av gränsen.
    const rival = game.clubs.find(c => c.id === opponentId)
    const rivalName = rival?.name ?? 'motståndaren'
    const wasDominant = rivalryHistory[opponentId]?.dominanceEstablished === true
    const establishes = !wasDominant && newStreak >= RIVALRY_DOMINANCE_STREAK
    const breaks = wasDominant && newStreak <= 0

    if (establishes || breaks) {
      const alreadySentId = `inbox_rivalry_${establishes ? 'established' : 'broken'}_${opponentId}_r${nextMatchday}_${game.currentSeason}`
      if (!game.inbox.some(i => i.id === alreadySentId)) {
        inboxItems.push({
          id: alreadySentId,
          date: game.currentDate,
          type: InboxItemType.RivalryMilestone,
          title: `Rivalmöte: ${rival?.name ?? 'Motståndaren'}`,
          // Fables texter (TEXTLEVERANS A2), kopierade ordagrant.
          body: establishes
            ? `Fyra raka mot ${rivalName}. De har börjat byta lag på straffar när vi kommer.`
            : `${rivalName} tog den till slut. ${newWins}–${newLosses} i matcher fortfarande, men det där kommer de leva på ett tag.`,
          relatedClubId: opponentId,
          isRead: false,
        } as InboxItem)
      }
    }

    rivalryHistory = {
      ...rivalryHistory,
      [opponentId]: {
        ...rivalryHistory[opponentId],
        dominanceEstablished: establishes ? true : breaks ? false : wasDominant,
      },
    }
  }

  // ── Nemesis tracker ──────────────────────────────────────────────────────
  let nemesisTracker = { ...(game.nemesisTracker ?? {}) }
  if (justCompletedManagedFixture) {
    const isHome = justCompletedManagedFixture.homeClubId === game.managedClubId
    const opponentClubId = isHome ? justCompletedManagedFixture.awayClubId : justCompletedManagedFixture.homeClubId
    const opponentGoalEvents = justCompletedManagedFixture.events.filter(
      e => e.type === MatchEventType.Goal && e.clubId === opponentClubId && e.playerId,
    )
    const goalsByOpponent: Record<string, number> = {}
    for (const evt of opponentGoalEvents) {
      if (evt.playerId) goalsByOpponent[evt.playerId] = (goalsByOpponent[evt.playerId] ?? 0) + 1
    }
    for (const [playerId, matchGoals] of Object.entries(goalsByOpponent)) {
      const opponentPlayer = game.players.find(p => p.id === playerId)
      if (!opponentPlayer) continue
      const prev = nemesisTracker[playerId] ?? {
        playerId,
        name: `${opponentPlayer.firstName} ${opponentPlayer.lastName}`,
        clubId: opponentClubId,
        goalsAgainstUs: 0,
        matchesScoredIn: 0,
      }
      const newTotal = prev.goalsAgainstUs + matchGoals
      const newMatches = (prev.matchesScoredIn ?? 0) + 1
      // KÖRORDER 2026-09-18 §5.1 — trösklar, inte varje mål. Villkoret var
      // `inboxSentAt < newTotal`, vilket gav en post för VARJE nytt mål efter
      // det tredje: en spelare som gjorde nio mål mot oss kostade sju poster.
      // Nu talar systemet tre gånger under hela relationen, vid 3, 6 och 10.
      // Match-spärren (mål i ≥2 separata matcher) står kvar — en spelare som
      // gör hattrick i en enda match är inte en nemesis.
      const crossed = NEMESIS_THRESHOLDS.find(
        t => newTotal >= t && prev.goalsAgainstUs < t,
      )
      const shouldSendInbox = newMatches >= 2 && crossed !== undefined
      nemesisTracker[playerId] = { ...prev, goalsAgainstUs: newTotal, matchesScoredIn: newMatches, clubId: opponentClubId }
      if (shouldSendInbox && crossed !== undefined) {
        nemesisTracker[playerId].inboxSentAt = newTotal
        const nemesisClub = game.clubs.find(c => c.id === opponentClubId)
        const nemesisName = `${opponentPlayer.firstName} ${opponentPlayer.lastName}`
        const nemesisClubName = nemesisClub?.name ?? 'motst.'
        inboxItems.push({
          // Id:t bär tröskeln — annars skulle andra och tredje posten krocka
          // med den första inom samma säsong.
          id: `inbox_nemesis_${playerId}_t${crossed}_${game.currentSeason}`,
          date: game.currentDate,
          type: InboxItemType.RivalryMilestone,
          title: `Nemesis: ${nemesisName}`,
          body: nemesisBody(crossed, nemesisName, nemesisClubName),
          relatedPlayerId: playerId,
          isRead: false,
          kind: 'nemesis',
        } as InboxItem)
      }
    }
  }

  return {
    fanMood,
    supporterGroup,
    pendingVictoryEcho,
    victoryEchoExpires,
    rivalryHistory,
    nemesisTracker,
    inboxItems,
  }
}

/**
 * Progresses the player-arc state machine and applies its presentation output.
 * Kept as one processor boundary so trigger, progression, queue capping,
 * storyline persistence and narrative cooldown cannot drift apart.
 */
export function processPlayerArcs(
  game: SaveGame,
  justCompletedManagedFixture: Fixture | undefined,
  nextMatchday: number,
): SaveGame {
  const existingArcs = game.activeArcs ?? []
  const newTriggers = detectArcTriggers(game, justCompletedManagedFixture)
  const allArcs = [...existingArcs, ...newTriggers]
  const arcResult = progressArcs(
    { ...game, activeArcs: allArcs },
    nextMatchday,
  )
  const arcInbox: InboxItem[] = arcResult.newInboxItems.map(item => ({
    ...item,
    date: game.currentDate,
    isRead: false,
  }))

  // BUG-009: prune stale resolving arcs (keep 2 matchdays for DEV-003 notification window).
  const cleanedArcs = arcResult.updatedArcs.filter(arc => {
    if (arc.phase !== 'resolving') return true
    return nextMatchday <= arc.expiresMatchday + 2
  })

  // B4 (arc): low-priority arc events pass through the same queue cap.
  const MAX_LOW_IN_QUEUE = 5
  const existingLowCount = (game.pendingEvents ?? []).filter(
    event => !event.resolved && (event.priority ?? getEventPriority(event.type)) === 'low',
  ).length
  const arcLowEvents = arcResult.newEvents.filter(
    event => (event.priority ?? getEventPriority(event.type)) === 'low',
  )
  const arcOtherEvents = arcResult.newEvents.filter(
    event => (event.priority ?? getEventPriority(event.type)) !== 'low',
  )
  const availableLowSlots = Math.max(0, MAX_LOW_IN_QUEUE - existingLowCount)
  const arcLowAllowed = arcLowEvents.slice(0, availableLowSlots)
  const arcLowDropped = arcLowEvents.slice(availableLowSlots)
  const arcDroppedInbox: InboxItem[] = arcLowDropped.map(event => ({
    id: `inbox_arc_drop_${event.id}`,
    date: game.currentDate,
    type: InboxItemType.BoardFeedback,
    title: event.title,
    body: event.body,
    isRead: false,
  }))

  // U5: one cooldown entry per new storyline when its narrative beat is created.
  let narrativeBeatLogWithArcs = game.narrativeBeatLog
  for (const storyline of arcResult.newStorylines) {
    narrativeBeatLogWithArcs = logNarrativeBeat(
      { ...game, narrativeBeatLog: narrativeBeatLogWithArcs },
      storyline.type,
      storyline.season,
      storyline.matchday,
    )
  }

  return {
    ...game,
    activeArcs: cleanedArcs,
    pendingEvents: [...(game.pendingEvents ?? []), ...arcOtherEvents, ...arcLowAllowed],
    storylines: [...(game.storylines ?? []), ...arcResult.newStorylines],
    inbox: [...game.inbox, ...arcInbox, ...arcDroppedInbox],
    narrativeBeatLog: narrativeBeatLogWithArcs,
  }
}

// ── Derby notification ───────────────────────────────────────────────────────

export function processUpcomingDerbyNotification(
  finalAllFixtures: Fixture[],
  game: SaveGame,
): InboxItem[] {
  const inboxItems: InboxItem[] = []
  const remainingScheduled = finalAllFixtures.filter(f => f.status === FixtureStatus.Scheduled)
  if (remainingScheduled.length === 0) return inboxItems

  const upcomingMatchday = Math.min(...remainingScheduled.map(f => f.matchday))
  const upcomingManagedFixture = remainingScheduled.find(
    f => f.matchday === upcomingMatchday &&
    (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )
  if (!upcomingManagedFixture) return inboxItems

  const derbyRivalry = getRivalry(upcomingManagedFixture.homeClubId, upcomingManagedFixture.awayClubId)
  if (!derbyRivalry) return inboxItems

  const opponentClubId = upcomingManagedFixture.homeClubId === game.managedClubId
    ? upcomingManagedFixture.awayClubId
    : upcomingManagedFixture.homeClubId
  const opponentClub = game.clubs.find(c => c.id === opponentClubId)
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const alreadySent = game.inbox.some(item => item.id === `inbox_derby_${upcomingManagedFixture.id}`)
  if (alreadySent) return inboxItems

  inboxItems.push({
    id: `inbox_derby_${upcomingManagedFixture.id}`,
    date: game.currentDate,
    type: InboxItemType.Derby,
    title: `Derby nästa omgång — ${derbyRivalry.name}`,
    body: `${managedClub?.name ?? 'Ni'} möter ${opponentClub?.name ?? 'motståndaren'} i ${derbyRivalry.name}. Intensiteten kommer vara hög.`,
    isRead: false,
  })

  if (opponentClub) {
    const opponentQuote = generatePreMatchOpponentQuote(opponentClub, true, upcomingManagedFixture.id)
    if (opponentQuote) {
      inboxItems.push({
        id: `inbox_prematch_quote_${upcomingManagedFixture.id}`,
        date: game.currentDate,
        type: InboxItemType.MediaEvent,
        title: `Inför derbyt: ${opponentClub.shortName ?? opponentClub.name}`,
        body: opponentQuote,
        isRead: false,
      })
    }
  }
  return inboxItems
}
