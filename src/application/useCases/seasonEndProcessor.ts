import type { SaveGame, InboxItem, AllTimeRecords, SeasonTransitionEvent, BoardAssessment, StorylineEntry } from '../../domain/entities/SaveGame'
import { resolveContractExtension, getManagerDisplayName } from '../../domain/services/managerProfileService'

import { selectMatchOfTheSeason } from '../../domain/services/matchHighlightService'
import type { Player } from '../../domain/entities/Player'
import type { Moment } from '../../domain/entities/Moment'
import { appendMomentsAndEntriesToLedger } from '../../domain/services/momentLedgerService'
import type { EventLedgerEntry } from '../../domain/entities/Narrative'
import { buildRetirementLedgerEntry } from '../../domain/services/clubHistoryLedgerService'
import type { FollowUp, GameEvent } from '../../domain/entities/GameEvent'
import { FixtureStatus, InboxItemType, PendingScreen, PlayerPosition, PlayerArchetype, ClubExpectation } from '../../domain/enums'
import { PLAYER_FIRST_NAMES, PLAYER_LAST_NAMES } from '../../domain/data/playerNames'
import { calculateStandings } from '../../domain/services/standingsService'
import { generateYouthIntake } from '../../domain/services/youthIntakeService'
import { generateSchedule, buildSeasonCalendar, stampFixturesFromCalendar } from '../../domain/services/scheduleGenerator'
import {
  generateCupFixtures,
} from '../../domain/services/cupService'
import {
  createYouthIntakeItem,
} from '../../domain/services/inboxService'
import { mulberry32 } from '../../domain/utils/random'
import { shouldRetire, updateActiveLegendFlags } from '../../domain/services/playerDevelopmentService'
import { generateRetirementData, generateFarewellQuote, isRetiringClubLegendEligible, recordCompletedCaptainSeason } from '../../domain/services/retirementService'
import { generateYouthTeam, carryOverYouthTeam } from '../../domain/services/academyService'
import { calculateKommunBidrag, generateNewPolitician } from '../../domain/services/politicianService'
import { generateSeasonVerdict, generatePreSeasonMessage, seasonReputationDelta, computeBoardPatienceUpdate, computeSeasonVerdictRating, deriveBoardAssessment, BOARD_SEASON_ACKNOWLEDGMENT_PLACEHOLDER, seasonVerdictZoneLine, buildSeasonBoardTruth, isUnderdogSeason, seasonVerdictText, RELEGATION_ZONE_SIZE, selectBoardReasonLine } from '../../domain/services/boardService'
import { deriveBoardLeagueContext, generateSeasonSummary } from '../../domain/services/seasonSummaryService'
import { pickMostImportantDecisionText } from '../../domain/services/seasonDecisionCaptureService'
import { deriveUtfall } from '../../domain/services/matchTypeAxes'
import { evaluateSeasonGoal, deriveSeasonPersonChange, deriveRivalryStanding } from '../../domain/services/seasonGoalService'
import { calculateClubEra } from '../../domain/services/clubEraService'
import { applyBurnoutRecoveryAtTransition } from '../../domain/services/seasonTransitionService'
import { summerFitnessTarget, summerSeasonForm } from '../../domain/services/fitnessRecoveryService'
import { updateLoyaltyScores } from '../../domain/services/characterPlayerService'
import { processAITransfers } from '../../domain/services/aiTransferService'
import { generateNominations, generateGalaEvent, generateGalaInbox } from '../../domain/services/bandyGalaService'
import { checkSeasonEndArc } from '../../domain/services/trainerArcService'
import { createSeasonSignature } from '../../domain/services/seasonSignatureService'
import { evaluateObjective, generateBoardObjectives, isRepeatedObjectiveFailure } from '../../domain/services/boardObjectiveService'
import { updateSilentShout, ageMecenater, checkMecenatRetirement } from '../../domain/services/mecenatService'
import { checkLicenseStatus, buildLicenseInboxItem, isActiveLicenseWarning, LICENSE_ACTION_PLAN_CAPITAL_INCOME } from '../../domain/services/licenseService'
import type { AdvanceResult } from './advanceTypes'
import { getRetirementCandidate, getRetirementQuote } from '../../domain/services/retirementDecisionService'
import { appendFinanceLog, applyFinanceChange, type FinanceEntry } from '../../domain/services/economyService'
import { computeSeasonEndContractDemands } from '../../domain/services/contractDemandService'
import { resolveDeferredAtRollover } from '../../domain/services/deferredRolloverService'
import { FALLBACK_SEASON_DEADLINE_MATCHDAY } from '../../domain/services/decisionTierService'
import { calculateWageBudget } from '../../domain/services/wageBudgetService'
import { buildSeasonStartSquadSnapshot } from '../../domain/services/seasonStartSquadSnapshotService'
import type { FacilityState } from '../../domain/entities/Community'
import type { YouthPlayer } from '../../domain/entities/Academy'
import type { PendingDemand } from '../../domain/entities/Demand'
import { getCoffeeRoomReturnDueMatchday } from '../../domain/services/coffeeRoomService'
import { getCurrentLeagueRound } from '../../domain/data/seasonPhases'
import { appendNewlyResolvedStorylines, getResolvedStorylineProjections } from '../../domain/services/storylineLedgerService'

/** Flytta ett värde på den avslutade säsongens matchday-axel till nästa säsongs nollpunkt. */
export function rebaseMatchdayAnchor(
  absoluteMatchday: number | undefined,
  completedSeasonMatchday: number,
): number | undefined {
  return absoluteMatchday === undefined
    ? undefined
    : absoluteMatchday - completedSeasonMatchday
}

/** Bevara återstående tid när currentMatchday börjar om på 0. */
export function rebaseFutureMatchday(
  absoluteMatchday: number | undefined,
  completedSeasonMatchday: number,
): number | undefined {
  return rebaseMatchdayAnchor(absoluteMatchday, completedSeasonMatchday)
}

/**
 * Cooldowns och historikankare läses mot game.currentMatchday. När axeln
 * börjar om måste deras ålder/återstående tid bevaras. Processor-cursorn
 * beskriver däremot den nya axelns start och nollställs därför till 0.
 */
export function rolloverSeasonMatchdayAnchors(game: SaveGame) {
  const completedSeasonMatchday = game.currentMatchday
  const rebase = (value: number | undefined) => rebaseMatchdayAnchor(value, completedSeasonMatchday)
  const cardStaleTracking = Object.fromEntries(
    Object.entries(game.cardStaleTracking ?? {}).map(([cardId, tracking]) => [
      cardId,
      {
        ...tracking,
        firstShownAt: tracking.firstShownAt - completedSeasonMatchday,
        lastShownAt: tracking.lastShownAt - completedSeasonMatchday,
      },
    ]),
  )

  return {
    lastCoffeeSceneRound: rebase(game.lastCoffeeSceneRound),
    weeklyDecisionLastRound: rebase(game.weeklyDecisionLastRound),
    lastEconomicStressRound: rebase(game.lastEconomicStressRound),
    lastCSPressMatchday: rebase(game.lastCSPressMatchday),
    lastRumorRound: rebase(game.lastRumorRound),
    lastEventQueueRound: rebase(game.lastEventQueueRound),
    lastRivalSaleMatchday: rebase(game.lastRivalSaleMatchday),
    lastIncomingBidMatchday: rebase(game.lastIncomingBidMatchday),
    lastProcessedMatchday: 0,
    cardStaleTracking,
  }
}

/**
 * A last-gasp escape is a table transition, not a proxy for a merely low final
 * position: in the qualification zone before the managed club's final league
 * match, outside it after. Both snapshots use the canonical standings engine.
 */
export function didEscapeRelegationOnFinalMatchday(game: SaveGame): boolean {
  const completedLeagueFixtures = game.fixtures.filter(
    fixture => fixture.status === FixtureStatus.Completed && !fixture.isCup && !fixture.isKnockout,
  )
  const finalStandings = calculateStandings(game.league.teamIds, completedLeagueFixtures, game.pointDeductions)
  const finalPosition = finalStandings.find(row => row.clubId === game.managedClubId)?.position
  const lastManagedFixture = completedLeagueFixtures
    .filter(fixture => fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId)
    .sort((a, b) => (b.matchday ?? 0) - (a.matchday ?? 0))[0]
  if (!lastManagedFixture || finalPosition === undefined) return false

  const priorFixtures = completedLeagueFixtures.filter(
    fixture => (fixture.matchday ?? 0) < (lastManagedFixture.matchday ?? 0),
  )
  const priorPosition = calculateStandings(game.league.teamIds, priorFixtures, game.pointDeductions)
    .find(row => row.clubId === game.managedClubId)?.position
  if (priorPosition === undefined) return false

  const relegationZoneStart = game.league.teamIds.length - RELEGATION_ZONE_SIZE + 1
  return priorPosition >= relegationZoneStart && finalPosition < relegationZoneStart
}

/** Bevara riskavtalets återstående mognadstid på nästa säsongs matchday-axel. */
export function rolloverRiskySponsorContract(
  contract: SaveGame['riskySponsorContract'],
  completedSeasonMatchday: number,
  nextSeason: number,
): SaveGame['riskySponsorContract'] {
  if (!contract) return undefined
  return {
    ...contract,
    riskMaturityRound: rebaseFutureMatchday(
      contract.riskMaturityRound,
      completedSeasonMatchday,
    ) as number,
    season: nextSeason,
  }
}

export function rolloverYouthAvailability(
  players: YouthPlayer[],
  completedSeasonMatchday: number,
): YouthPlayer[] {
  return players.map(player => ({
    ...player,
    availabilityUntilRound: rebaseFutureMatchday(
      player.availabilityUntilRound,
      completedSeasonMatchday,
    ),
  }))
}

/** Bevara återstående "ramp först"-frist över säsongsskiftet (steg C, DOM_BURNOUT_TAK-ordern 2026-09-02). */
export function rolloverPlayerInjuryRamp(
  players: Player[],
  completedSeasonMatchday: number,
): Player[] {
  return players.map(player => ({
    ...player,
    recentlyInjuredUntil: rebaseFutureMatchday(
      player.recentlyInjuredUntil,
      completedSeasonMatchday,
    ),
  }))
}

/**
 * SKALA-BUGGEN steg B-sidofynd (2026-09-02, Jacob) — playerConversations
 * rebasades aldrig vid säsongsskifte (samma steg-C-klass som recentlyInjured-
 * Until/managedClubPeriodisationSince ovan, missad då eftersom fältnamnet
 * inte matchade *UntilRound/*Expires-mönstret). Utan detta blir "N omgångar
 * sedan" negativt i UI:t (PlayerCard.tsx) första omgången varje ny säsong.
 */
export function rolloverPlayerConversations(
  conversations: Record<string, number> | undefined,
  completedSeasonMatchday: number,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(conversations ?? {}).map(([playerId, matchday]) => [
      playerId,
      rebaseFutureMatchday(matchday, completedSeasonMatchday) as number,
    ]),
  )
}

/**
 * SKALA-BUGGEN steg B-sidofynd (2026-09-02, Jacob) — financeLog rebasas
 * aldrig vid säsongsskifte. Till skillnad från journalistminnet (som bär
 * `season` per post och behöver exakt säsong för "X år sedan"-prosa)
 * behöver kassans transaktionshistorik ingen säsongsprecision, bara att
 * .round håller sig kronologiskt begripligt — rebase är därför enklare och
 * räckte, ingen schemautökning av FinanceEntry på ~28 skrivställen.
 */
export function rolloverFinanceLog(
  log: FinanceEntry[] | undefined,
  completedSeasonMatchday: number,
): FinanceEntry[] {
  return (log ?? []).map(entry => ({ ...entry, round: entry.round - completedSeasonMatchday }))
}

export function rolloverPendingDemand(
  demand: PendingDemand | undefined,
  completedSeasonMatchday: number,
): PendingDemand | undefined {
  if (!demand) return undefined
  return {
    ...demand,
    createdRound: demand.createdRound - completedSeasonMatchday,
    deadlineRound: demand.deadlineRound - completedSeasonMatchday,
  }
}

export function rolloverFollowUps(
  followUps: FollowUp[] | undefined,
  completedSeasonMatchday: number,
): FollowUp[] {
  return (followUps ?? []).map(followUp => ({
    ...followUp,
    createdMatchday: followUp.createdMatchday - completedSeasonMatchday,
  }))
}

export function rolloverLeadershipActions(
  actions: NonNullable<SaveGame['leadershipActions']> | undefined,
  completedSeasonMatchday: number,
): NonNullable<SaveGame['leadershipActions']> {
  return (actions ?? []).map(action => ({
    ...action,
    fromRound: action.fromRound - completedSeasonMatchday,
    expiresRound: action.expiresRound - completedSeasonMatchday,
  }))
}

export function rolloverCoffeeRoomReturns(
  pendingReturns: SaveGame['coffeeRoomPendingReturns'],
  completedSeasonMatchday: number,
): NonNullable<SaveGame['coffeeRoomPendingReturns']> {
  return (pendingReturns ?? []).map(pending => {
    const dueMatchday = pending.dueMatchday
      ?? getCoffeeRoomReturnDueMatchday(pending.questionId, pending.answeredMatchday)
    return {
      ...pending,
      answeredMatchday: pending.answeredMatchday - completedSeasonMatchday,
      dueMatchday: dueMatchday - completedSeasonMatchday,
    }
  })
}

export function rolloverEconomicCrisis(
  crisis: SaveGame['economicCrisisState'],
  completedSeasonMatchday: number,
): SaveGame['economicCrisisState'] {
  if (!crisis || crisis.phase === 'resolved') return undefined
  return {
    ...crisis,
    startedMatchday: crisis.startedMatchday - completedSeasonMatchday,
  }
}

export function rolloverActiveArcs(
  arcs: SaveGame['activeArcs'],
  completedSeasonMatchday: number,
): NonNullable<SaveGame['activeArcs']> {
  return (arcs ?? []).map(arc => ({
    ...arc,
    startedMatchday: arc.startedMatchday - completedSeasonMatchday,
    expiresMatchday: arc.expiresMatchday - completedSeasonMatchday,
  }))
}

export function rolloverTransientEchoMatchdays(game: SaveGame) {
  return {
    victoryEchoExpires: rebaseFutureMatchday(game.victoryEchoExpires, game.currentMatchday),
    nationalTeamReturnExpires: rebaseFutureMatchday(game.nationalTeamReturnExpires, game.currentMatchday),
    hallEchoExpires: rebaseFutureMatchday(game.hallEchoExpires, game.currentMatchday),
    klackEcho: game.klackEcho
      ? {
          ...game.klackEcho,
          resultMatchday: game.klackEcho.resultMatchday - game.currentMatchday,
        }
      : undefined,
  }
}

export function rolloverNationalTeamCamp(
  camp: SaveGame['activeNationalTeamCamp'],
  completedSeasonMatchday: number,
): SaveGame['activeNationalTeamCamp'] {
  if (!camp) return undefined
  return {
    ...camp,
    startRound: camp.startRound - completedSeasonMatchday,
    endRound: camp.endRound - completedSeasonMatchday,
  }
}

export function archiveCompletedSeasonInbox(items: InboxItem[]): InboxItem[] {
  return items.map(item => {
    if (item.isRead) return item
    // expiresRound sätts idag enbart på transferbudens inboxposter. Själva
    // transferBids-kön avslutas vid rollover, så deadlinen får inte signalera
    // ett beslut som inte längre existerar.
    if (item.expiresRound !== undefined) {
      return { ...item, isRead: true, expiresRound: undefined }
    }
    return { ...item, isRead: true }
  })
}

/**
 * currentMatchday börjar om på 0 varje säsong, medan activeProject tidigare
 * behöll sin gamla etaMatchday. Då kunde ett sent bygge aldrig nå sitt ETA.
 * Bevara bara den återstående byggtiden på den nya säsongens skala.
 */
export function rolloverFacilityState(game: SaveGame): FacilityState | undefined {
  const state = game.facilityState
  const project = state?.activeProject
  if (!state) return state

  const pausedAt = state.hallTrial?.buildPausedAtMatchday
  const referenceMatchday = pausedAt ?? game.currentMatchday
  const remainingRounds = project
    ? Math.max(0, project.etaMatchday - referenceMatchday)
    : undefined
  return {
    ...state,
    activeProject: project
      ? {
          ...project,
          startedMatchday: 0,
          etaMatchday: remainingRounds!,
        }
      : undefined,
    hallTrial: state.hallTrial
      ? {
          ...state.hallTrial,
          stageStartedRound: state.hallTrial.stageStartedRound - game.currentMatchday,
          buildPausedAtMatchday: undefined,
        }
      : undefined,
  }
}

// ── Position-aware replenishment helpers ──────────────────────────────────────
const POSITION_MINIMUMS: Record<PlayerPosition, number> = {
  [PlayerPosition.Goalkeeper]: 2,
  [PlayerPosition.Defender]:   5,
  [PlayerPosition.Half]:       2,
  [PlayerPosition.Midfielder]: 2,
  [PlayerPosition.Forward]:    4,
}

function pickPositionToFill(players: Player[]): PlayerPosition {
  const counts: Record<PlayerPosition, number> = {
    [PlayerPosition.Goalkeeper]: 0,
    [PlayerPosition.Defender]:   0,
    [PlayerPosition.Half]:       0,
    [PlayerPosition.Midfielder]: 0,
    [PlayerPosition.Forward]:    0,
  }
  for (const p of players) {
    if (counts[p.position] !== undefined) counts[p.position]++
  }
  // First priority: positions below minimum, most underrepresented first
  const belowMin = (Object.keys(POSITION_MINIMUMS) as PlayerPosition[])
    .filter(pos => counts[pos] < POSITION_MINIMUMS[pos])
    .sort((a, b) => (counts[a] - POSITION_MINIMUMS[a]) - (counts[b] - POSITION_MINIMUMS[b]))
  if (belowMin.length > 0) return belowMin[0]
  // Otherwise: fill least-represented position
  return (Object.keys(counts) as PlayerPosition[])
    .sort((a, b) => counts[a] - counts[b])[0]
}

export function handleSeasonEnd(game: SaveGame, seed?: number): AdvanceResult {
  // seasonSummary is generated AFTER all financial updates (prize money, patron, etc.)
  // so the financial change reflects the full season end income.
  // The variable is populated later in this function.
  let seasonSummary: ReturnType<typeof generateSeasonSummary>

  const allFixtures = game.fixtures
  const completedFixtures = allFixtures.filter(f => f.status === FixtureStatus.Completed && !f.isCup && !f.isKnockout)
  // 4.1 (SLUTTEST_KO.md, 2026-08-17): samma saknade pointDeductions-argument
  // som playoffTransition.ts — styrelsens säsongsutlåtande (genereras från
  // managedClubStanding.position nedan) kunde annars beskriva fel placering
  // för en klubb med poängavdrag.
  const standings = calculateStandings(game.league.teamIds, completedFixtures, game.pointDeductions)

  const newInboxItems: InboxItem[] = []

  // Board verdict at season end
  const managedClubStanding = standings.find(s => s.clubId === game.managedClubId)
  // U6 (SLUTTEST_KO.md, 2026-08-17): renommé kunde inte FALLA vid misslyckande
  // — bara skandal/nekad licens sänkte det, se D028 för magnitud/proportions-
  // resonemanget mot skandal (-5/-8). Ratingen härifrån drev tidigare ENDAST
  // den hanterade klubbens renommédelta; sedan H4 Heros-uppföljningen
  // (2026-08-25) räknas rating om oberoende för alla tolv klubbar i loopen
  // nedan (varje klubb mot sin EGEN boardExpectation/placering), så denna
  // ratingen behövs bara för styrelseutlåtandets inboxtext.
  // Påståendesvepet #13 (MASTER.md, 2026-08-24), Jacobs dom 2026-08-26: kortet
  // pushas INTE här längre — bara titel/body beräknas nu (position-baserat,
  // orört). Den faktiska pushen sker efter computeBoardPatienceUpdate nedan,
  // som lägger till lägesraden (seasonVerdictZoneLine) med det SLUTGILTIGA,
  // säsongsslut-uppdaterade boardPatience-värdet — inte det som gällde vid
  // säsongens start, annars skulle kortet visa ett läge som redan hunnit
  // bli inaktuellt samma dag det skrevs.
  let boardVerdictTitle: string | undefined
  let boardVerdictBody: string | undefined
  if (managedClubStanding) {
    const managedClub = game.clubs.find(c => c.id === game.managedClubId)
    if (managedClub) {
      // A-H1: retrospektiv dom över den AVSLUTADE säsongen — läs den frusna
      // säsongsstarts-förväntan, aldrig club.boardExpectation live (den
      // stegas till nästa säsongs krav längre ned i denna funktion, rad ~379).
      const { title, body } = generateSeasonVerdict(
        game.seasonStartBoardExpectation ?? managedClub.boardExpectation,
        managedClubStanding.position,
        game.clubs.length,
      )
      boardVerdictTitle = title
      boardVerdictBody = body
    }
  }

  const baseSeed = seed ?? (game.currentSeason * 12345)

  // ── License check (System B, canonical) ───────────────────────────────────
  const managedClubForLicense = game.clubs.find(c => c.id === game.managedClubId)
  const licenseCheck = checkLicenseStatus(game, baseSeed)
  const newLicenseStatus = licenseCheck.newLicenseStatus
  const newLicenseRiskScore = licenseCheck.newLicenseRiskScore

  // Youth intake for all clubs
  const youthPlayers: Player[] = []
  const youthRecords = [...game.youthIntakeHistory]
  let updatedClubs = game.clubs.map(club => ({ ...club }))

  // U6 (SLUTTEST_KO.md, 2026-08-17) / D028: säsongsvist renommédelta ur
  // placering mot förväntan.
  //
  // H4 Heros-uppföljning (Jacobs dom 2026-08-25): körde tidigare BARA den
  // hanterade klubben — de elva AI-klubbarnas rykte rörde sig aldrig av
  // ligaresultat, bara av det separata (och betydligt mer sällsynta)
  // skandalsystemet. Konsekvens: en tioårig karriär spelades mot en liga
  // vars rykten var frusna vid generering — "Lesjöfors har rustat" gick
  // inte att belägga eftersom ingenting i datan förändrades. Nu körd för
  // ALLA tolv klubbar, var och en mot sin EGEN boardExpectation/placering
  // (inte den hanterade klubbens rating återanvänd för andra klubbar).
  for (let i = 0; i < updatedClubs.length; i++) {
    const clubStanding = standings.find(s => s.clubId === updatedClubs[i].id)
    if (!clubStanding) continue
    const rating = computeSeasonVerdictRating(updatedClubs[i].boardExpectation, clubStanding.position, game.clubs.length)
    const repDelta = seasonReputationDelta(rating)
    const current = updatedClubs[i].reputation ?? 50
    updatedClubs[i] = { ...updatedClubs[i], reputation: Math.max(0, Math.min(100, current + repDelta)) }
  }

  let youthIntakeResultForManagedClub: ReturnType<typeof generateYouthIntake> | null = null

  for (let i = 0; i < updatedClubs.length; i++) {
    const club = updatedClubs[i]
    const existingPlayers = [...game.players, ...youthPlayers].filter(
      p => p.clubId === club.id,
    )
    const intakeResult = generateYouthIntake({
      club,
      existingPlayers,
      season: game.currentSeason,
      date: game.currentDate,
      seed: baseSeed + i,
    })

    youthPlayers.push(...intakeResult.newPlayers)
    updatedClubs[i] = {
      ...club,
      squadPlayerIds: [...club.squadPlayerIds, ...intakeResult.newPlayers.map(p => p.id)],
    }
    youthRecords.push(intakeResult.record)

    if (club.id === game.managedClubId) {
      youthIntakeResultForManagedClub = intakeResult
    }
  }

  // A-M5 (SEXSÄSONGSAUDITEN 2026-08-26): offseasonFinanceLog samlar samma
  // FinanceEntry-form som roundProcessor/transferService redan loggar varje
  // omgång (economyService.ts's FinanceReason) — bara för den hanterade
  // klubben, tre kända rollover-poster (ligaprispengar, mecenatbidrag,
  // kommunbidrag). Rotorsak till M5: dessa tre gick tidigare direkt på
  // `finances` utan en enda appendFinanceLog-rad, så säsongsväxlingens
  // −322→−35 tkr-hopp (Lesjöfors, auditen) inte gick att härleda ur
  // financeLog — det fanns inget att härleda, posterna loggades aldrig.
  // `round: game.currentMatchday` — den avslutade säsongens sista spelade
  // omgång, satt HÄR (innan updatedGame nollställer currentMatchday till 0
  // för nästa säsong nedan).
  const offseasonFinanceLog: FinanceEntry[] = []
  const offseasonRound = game.currentMatchday ?? 0

  // Prize money and transfer budget update for all clubs
  const PRIZE_MONEY = [200000, 150000, 120000, 100000, 80000,
    60000, 50000, 40000, 30000, 25000, 20000, 15000]

  for (let i = 0; i < updatedClubs.length; i++) {
    const clubStanding = standings.find(s => s.clubId === updatedClubs[i].id)
    const position = clubStanding?.position ?? 12
    const prize = PRIZE_MONEY[position - 1] ?? 10000
    if (updatedClubs[i].id === game.managedClubId) {
      offseasonFinanceLog.push({
        round: offseasonRound,
        amount: prize,
        reason: 'league_prize',
        label: `Prispengar (plats ${position})`,
      })
    }
    // §6-arkitekturen (D042-fyndet, Jacobs körorder 2026-09-01): route direkt-
    // skrivningar till finances genom applyFinanceChange, economyService.ts:s
    // ENDA dokumenterade mutationspunkt, istf en egen { ...c, finances: ... }.
    updatedClubs = applyFinanceChange(updatedClubs, updatedClubs[i].id, prize)
    updatedClubs[i] = {
      ...updatedClubs[i],
      transferBudget: Math.max(0, Math.round(updatedClubs[i].finances * 0.15)),
    }
  }

  // Patron contribution at season end
  if (game.patron?.isActive && (game.patron.contribution ?? 0) > 0) {
    const patronIdx = updatedClubs.findIndex(c => c.id === game.managedClubId)
    if (patronIdx !== -1) {
      offseasonFinanceLog.push({
        round: offseasonRound,
        amount: game.patron.contribution,
        reason: 'patron',
        label: `Mecenatbidrag (${game.patron.name})`,
      })
      updatedClubs = applyFinanceChange(updatedClubs, updatedClubs[patronIdx].id, game.patron.contribution)
      newInboxItems.push({
        id: `inbox_patron_contribution_${game.currentSeason + 1}`,
        date: game.currentDate,
        type: InboxItemType.BoardFeedback,
        title: `${game.patron.name} bidrar till klubben`,
        body: `${game.patron.name} skänker ${game.patron.contribution.toLocaleString('sv-SE')} kr till klubben som sitt årliga bidrag. Tack för ditt stöd!`,
        isRead: false,
      } as InboxItem)
    }
  }

  // Synliga mecenater är separata från den dolda patronen. updateSilentShout
  // bokför redan contribution i totalContributed varje säsong; samma belopp
  // måste därför också nå klubbkassan och den kanoniska ekonomiloggen.
  for (const mecenat of game.mecenater ?? []) {
    if (!mecenat.isActive || mecenat.contribution <= 0) continue
    offseasonFinanceLog.push({
      round: offseasonRound,
      amount: mecenat.contribution,
      reason: 'mecenat',
      label: `Mecenatbidrag (${mecenat.name})`,
    })
    updatedClubs = applyFinanceChange(updatedClubs, game.managedClubId, mecenat.contribution)
  }

  // KommunBidrag at season end — dynamic calculation (V0.9)
  if (game.localPolitician) {
    const politIdx = updatedClubs.findIndex(c => c.id === game.managedClubId)
    if (politIdx !== -1) {
      const polClub = updatedClubs[politIdx]
      const commStanding = game.communityStanding ?? 50
      const dynamicBidrag = calculateKommunBidrag(game.localPolitician, polClub, commStanding, game)
      // Update the stored kommunBidrag value for display
      // (we update the politician below in the updatedGame)
      offseasonFinanceLog.push({
        round: offseasonRound,
        amount: dynamicBidrag,
        reason: 'kommunbidrag_politiker',
        label: 'Kommunbidrag (säsongsslut)',
      })
      updatedClubs = applyFinanceChange(updatedClubs, updatedClubs[politIdx].id, dynamicBidrag)
      newInboxItems.push({
        id: `inbox_kommunbidrag_${game.currentSeason + 1}`,
        date: game.currentDate,
        type: InboxItemType.KommunBidrag,
        title: `Kommunbidrag utbetalat`,
        body: `${game.localPolitician.name} meddelar att kommunens bidrag på ${dynamicBidrag.toLocaleString('sv-SE')} kr har betalats ut. Beräknat utifrån ert ungdomsengagemang (${(game.youthTeam?.players.length ?? 0)} ungdomar), kommunens välvilja och er lokala ställning (${commStanding}/100).`,
        isRead: false,
      } as InboxItem)
    }
  }

  // Budget priority effects at season end
  if (game.budgetPriority && game.budgetPriority !== 'balanced') {
    const bpIdx = updatedClubs.findIndex(c => c.id === game.managedClubId)
    if (bpIdx !== -1) {
      const c = updatedClubs[bpIdx]
      if (game.budgetPriority === 'squad') {
        updatedClubs[bpIdx] = {
          ...c,
          transferBudget: Math.round((c.transferBudget ?? 0) * 1.2),
          facilities: Math.max(0, (c.facilities ?? 50) - 1),
        }
      } else if (game.budgetPriority === 'youth') {
        updatedClubs[bpIdx] = {
          ...c,
          transferBudget: Math.round((c.transferBudget ?? 0) * 0.7),
          youthQuality: Math.min(100, (c.youthQuality ?? 50) + 3),
        }
      }
    }
  }

  // Youth intake inbox for managed club
  if (youthIntakeResultForManagedClub !== null) {
    const managedClub = updatedClubs.find(c => c.id === game.managedClubId)!
    newInboxItems.push(
      createYouthIntakeItem(
        youthIntakeResultForManagedClub,
        managedClub,
        game.currentDate,
        youthIntakeResultForManagedClub.scoutTexts,
      ),
    )
  }

  const nextSeason = game.currentSeason + 1

  // H4 Heros-uppföljning (Jacobs dom 2026-08-25): boardExpectation-stegningen
  // körde tidigare BARA den hanterade klubben — precis som renommédeltat
  // ovan, elva klubbars förväntan stod still i evighet. Körd nu för ALLA
  // tolv, var och en mot sin EGEN standing/finansförändring. Bara den
  // hanterade klubben får inboxtext (AI-klubbar har ingen spelare som läser
  // sin egen inbox) — texten diskas för de andra elva, bara newExpectation
  // används.
  // Förutsättningsfasen, steg 1 (Jacobs dom 2026-08-25): samma varv som
  // beräknar boardExpectation-stegningen för hanterad klubb — deriveBoardAssessment
  // läser club.boardExpectation FÖRE denna iterations skrivning (samma
  // pre-mutation-värde generatePreSeasonMessage redan läser), så steg/riktning
  // beräknas en gång, inte två separata gissningar om samma sak.
  let boardAssessment: BoardAssessment | undefined

  for (let i = 0; i < updatedClubs.length; i++) {
    const club = updatedClubs[i]
    const clubStanding = standings.find(s => s.clubId === club.id)
    const lastPos = clubStanding?.position ?? 12
    const finChange = club.id === game.managedClubId
      ? club.finances - (game.seasonStartFinances ?? club.finances)
      : 0
    const { title, body, newExpectation, newConsecutiveExpectationMisses } = generatePreSeasonMessage(club, standings, lastPos, finChange)
    updatedClubs[i] = { ...club, boardExpectation: newExpectation, consecutiveExpectationMisses: newConsecutiveExpectationMisses }

    if (club.id === game.managedClubId) {
      newInboxItems.push({
        id: `inbox_board_preseason_${nextSeason}`,
        date: `${nextSeason}-09-15`,
        type: InboxItemType.BoardFeedback,
        title,
        body,
        isRead: false,
      } as InboxItem)

      boardAssessment = {
        ...deriveBoardAssessment(club, lastPos, nextSeason, updatedClubs.length),
        seasonAcknowledgment: BOARD_SEASON_ACKNOWLEDGMENT_PLACEHOLDER,
      }
    }
  }

  // Generate new schedule for next season
  const newScheduleFixtures = generateSchedule(updatedClubs.map(c => c.id), nextSeason)
  const nextSeasonCalendar = buildSeasonCalendar(nextSeason)
  const leagueFixtures = newScheduleFixtures.map(sf => {
    const slot = nextSeasonCalendar.find(s => s.type === 'league' && s.leagueRound === sf.roundNumber)
    return {
      id: `fixture_${nextSeason}_r${sf.roundNumber}_${sf.homeClubId}_vs_${sf.awayClubId}`,
      leagueId: `league_${nextSeason}`,
      season: nextSeason,
      roundNumber: sf.roundNumber,
      matchday: slot?.matchday ?? sf.roundNumber,
      date: slot?.date,
      tipoffHour: slot?.tipoffHour,
      homeClubId: sf.homeClubId,
      awayClubId: sf.awayClubId,
      status: FixtureStatus.Scheduled,
      homeScore: 0,
      awayScore: 0,
      events: [],
      report: undefined,
      homeLineup: undefined,
      awayLineup: undefined,
      ...(slot?.isAnnandagen ? { isAnnandagen: true } : {}),
      ...(slot?.isNyarsbandy ? { isNyarsbandy: true } : {}),
      ...(slot?.isWindowDeadlineDay ? { isWindowDeadlineDay: true } : {}),
    }
  })

  // Generate cup fixtures for next season
  const cupSeasonSeed = nextSeason * 7919 + 42
  const cupSeasonRand = mulberry32(cupSeasonSeed)
  const clubsSortedByRep = [...updatedClubs].sort((a, b) => (b.reputation ?? 50) - (a.reputation ?? 50))
  const { bracket: newCupBracket, fixtures: rawNewCupFixtures } = generateCupFixtures(
    clubsSortedByRep.map(c => c.id),
    nextSeason,
    cupSeasonRand,
  )
  const newCupFixtures = stampFixturesFromCalendar(rawNewCupFixtures, nextSeasonCalendar)
  const newFixtures = [...leagueFixtures, ...newCupFixtures]


  const newLeague = {
    ...game.league,
    id: `league_${nextSeason}`,
    season: nextSeason,
    fixtureIds: leagueFixtures.map(f => f.id),
  }

  // Reset player season stats, recover fitness, age players
  const allPlayers = [...game.players, ...youthPlayers]
  const playersWithCaptainHistory = allPlayers.map(player =>
    recordCompletedCaptainSeason(player, game.captainPlayerId, game.managedClubId)
  )
  const retirementRand = mulberry32(baseSeed + 99991)
  const retiredPlayerIds = new Set<string>()
  const retirementMessages: InboxItem[] = []
  let nextCaptainPlayerId: string | undefined = game.captainPlayerId

  let resetPlayers = playersWithCaptainHistory.map(player => ({
    ...player,
    age: player.age + 1,
    // A3 (DOM_A3_KONDITIONSSPIRAL_2026-08-29.md), krav 2 — "sommaren måste ge
    // en begriplig återställning till rimlig matchberedskap". `+15` var ett
    // symboliskt påslag: mätningen 2026-08-29 visade en trupp som gick in i
    // säsong 2 på ~40 % trots hela sommaren. Nu ett MÅL (78–92 efter
    // uthållighet), aldrig en sänkning.
    fitness: Math.max(player.fitness, summerFitnessTarget(player.attributes?.stamina)),
    // A3, rotorsak 1: `seasonForm` nollställdes ALDRIG mellan säsonger. Med
    // Vila (−1.0/omgång) landade den på ~20 i säsong 2 och 0 i säsong 4 — och
    // eftersom playerModifier klipper effekten vid seasonForm+3 spelade hela
    // truppen på några få procents effektivitet resten av karriären. Sommaren
    // drar tillbaka mot försäsongsbaslinjen, med en fjärdedel bärighet kvar.
    seasonForm: summerSeasonForm(player.seasonForm),
    startSeasonCA: player.currentAbility,
    // 2026-08-17 (Stickiness-audit, karriärstatistik-dubblering): totalGames/
    // totalGoals/totalAssists ägs av statsProcessor.ts (uppdateras EN gång per
    // spelad match, hela säsongen igenom — se careerStats-blocket där). Att
    // ADDERA seasonStats hit igen vid rollover dubblade varje säsongs siffror
    // (48 matcher blev 96) — och kompounderade vid varje efterföljande rollover,
    // eftersom nästa säsongs per-match-ackumulering utgick från den redan
    // uppblåsta basen. Rollover äger bara seasonsPlayed (inkrementeras här,
    // rörs aldrig av statsProcessor.ts) — totalGames/totalGoals/totalAssists
    // förs vidare oförändrade, redan korrekta från säsongens matcher.
    careerStats: {
      totalGames: player.careerStats?.totalGames ?? 0,
      totalGoals: player.careerStats?.totalGoals ?? 0,
      totalAssists: player.careerStats?.totalAssists ?? 0,
      seasonsPlayed: (player.careerStats?.seasonsPlayed ?? 0) + 1,
    },
    caHistory: [
      ...(player.caHistory ?? []),
      { season: game.currentSeason, ca: player.currentAbility },
    ].slice(-10),
    seasonHistory: [
      ...(player.seasonHistory ?? []),
      {
        season: game.currentSeason,
        goals: player.seasonStats?.goals ?? 0,
        assists: player.seasonStats?.assists ?? 0,
        games: player.seasonStats?.gamesPlayed ?? 0,
        rating: Math.round((player.seasonStats?.averageRating ?? 0) * 10) / 10,
        clubId: player.clubId,
        // E-GRIND0-1 (2026-08-24): läst HÄR, från `player` (funktionens
        // mottagna game-parameter) — INNAN seasonCupStats nollställs nedan,
        // och EFTER att en eventuell tyst extra-runda (roundProcessor.ts:1928)
        // redan applicerat sina increment. Detta ÄR den korrekta, kompletta
        // säsongstotalen — till skillnad från en extern snapshot tagen INNAN
        // anropet till handleSeasonEnd, som kan bli stale av just den
        // rekursionen.
        cupGames: player.seasonCupStats?.gamesPlayed ?? 0,
        cupGoals: player.seasonCupStats?.goals ?? 0,
        cupAssists: player.seasonCupStats?.assists ?? 0,
      },
    ].slice(-10),
    seasonStats: {
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      cornerGoals: 0,
      penaltyGoals: 0,
      yellowCards: 0,
      redCards: 0,
      suspensions: 0,
      averageRating: 0,
      minutesPlayed: 0,
    },
    // Grind 0 (SLUTTEST_KO.md, 2026-08-21) — seasonCupStats saknade denna
    // nollställning. seasonStats (liga) återställdes ovan, men seasonCupStats
    // ärvdes oförändrad via `...player`-spreaden ovan i mappningen och
    // ackumulerade tyst över ALLA säsonger (2 cupmatcher säsong 1 → 5 efter
    // säsong 2, borde varit 2 → cupmatcherna i säsong 2 för sig). saveGameMigration.ts:498
    // dokumenterar redan "seasonCupStats nollställs varje rollover" — koden
    // gjorde det aldrig. careerStats påverkas inte (statsProcessor.ts räknar
    // in cupmatcher i totalGames/totalGoals/totalAssists oavsett bucket).
    seasonCupStats: {
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      cornerGoals: 0,
      penaltyGoals: 0,
      yellowCards: 0,
      redCards: 0,
      suspensions: 0,
      averageRating: 0,
      minutesPlayed: 0,
    },
  }))

  // Retirement check — delegated to shouldRetire() in playerDevelopmentService
  const retiredManagedPlayers: ReturnType<typeof generateRetirementData>[] = []
  // 5.1 Sommaren (SLUTTEST_KO.md, 2026-08-18): "Medan du var borta" — bara
  // retired/contractExpired kan avgöras här (aged/promoted härleds separat
  // nedan resp. skrivs redan av academyActions.ts). Bara managed club.
  const seasonTransitionEvents: SeasonTransitionEvent[] = []
  for (const player of resetPlayers) {
    const retires = shouldRetire(player, retirementRand)
    if (retires) {
      retiredPlayerIds.add(player.id)
      if (player.clubId === game.managedClubId) {
        const retData = generateRetirementData(player, game.managedClubId)
        retiredManagedPlayers.push(retData)
        retirementMessages.push({
          id: `inbox_retirement_${player.id}_${nextSeason}`,
          date: game.currentDate,
          type: InboxItemType.Retirement,
          title: `${player.firstName} ${player.lastName} avslutar karriären`,
          body: `${player.firstName} ${player.lastName} (${player.age} år) lägger skridskorna på hyllan. ${retData.totalGames > 0 ? `${retData.totalGames} matcher, ${retData.totalGoals} mål. ` : ''}${generateFarewellQuote(player)}`,
          isRead: false,
        } as InboxItem)
        seasonTransitionEvents.push({ type: 'retired', playerId: player.id, playerLastName: player.lastName })
      }
    }
  }

  // ── WEAK-007: Nemesis pensioneras — rensa tracker, skicka inbox ───────────
  let updatedNemesisTracker = { ...(game.nemesisTracker ?? {}) }
  for (const pid of retiredPlayerIds) {
    const retiringPlayer = resetPlayers.find(p => p.id === pid)
    if (!retiringPlayer) continue
    for (const [key, nemesis] of Object.entries(updatedNemesisTracker)) {
      if (nemesis.playerId === retiringPlayer.id) {
        retirementMessages.push({
          id: `inbox_nemesis_retired_${retiringPlayer.id}_${nextSeason}`,
          date: game.currentDate,
          type: InboxItemType.BoardFeedback,
          title: 'Nemesis lägger av',
          body: `${retiringPlayer.firstName} ${retiringPlayer.lastName} avslutar karriären. Han gjorde ${nemesis.goalsAgainstUs} mål mot oss. En epok är över.`,
          isRead: false,
          kind: 'nemesis',
        } as InboxItem)
        delete updatedNemesisTracker[key]
      }
    }
  }

  // ── Legacy — retiring managed club players become legends if 3+ seasons ──
  const retirementCeremonyEvents: GameEvent[] = []
  const newLegends = [...(game.clubLegends ?? [])]
  for (const pid of retiredPlayerIds) {
    const player = resetPlayers.find(p => p.id === pid)
    if (!player || player.clubId !== game.managedClubId) continue
    const seasonsInClub = (player.careerStats?.seasonsPlayed ?? 1)
    const isLegendEligible = isRetiringClubLegendEligible(player)
    if (isLegendEligible) {
      const storyline = getResolvedStorylineProjections(game).find(s => s.playerId === pid)
      newLegends.push({
        name: `${player.firstName[0]}. ${player.lastName}`,
        position: player.position,
        seasons: seasonsInClub,
        totalGames: player.careerStats?.totalGames ?? 0,
        totalGoals: player.careerStats?.totalGoals ?? 0,
        totalAssists: player.careerStats?.totalAssists ?? 0,
        titles: [],
        memorableStory: storyline?.displayText,
        retiredSeason: nextSeason,
        playerId: player.id,
      })
      // Special inbox for legend
      retirementMessages.push({
        id: `inbox_legend_${player.id}_${nextSeason}`,
        date: game.currentDate,
        type: InboxItemType.BoardFeedback,
        title: `${player.firstName} ${player.lastName} — en legend tackar för sig`,
        body: `${seasonsInClub} säsonger, ${player.careerStats?.totalGoals ?? 0} mål. ${storyline ? `"${storyline.displayText}"` : 'En spelare som betydde mycket.'} Fansen: "Tack för allt!"`,
        isRead: false,
      } as InboxItem)

      // Retirement ceremony event with choices
      const playerName = `${player.firstName} ${player.lastName}`
      const farewellQuote = generateFarewellQuote(player)
      // Blodslinje: find youth players this legend mentored
      const mentorProtégés = (game.mentorshipHistory ?? []).filter(r => r.seniorPlayerId === player.id)
      const protégéLine = (() => {
        const living = mentorProtégés
          .map(r => resetPlayers.find(p => p.id === r.youthPlayerId))
          .filter((p): p is NonNullable<typeof p> =>
            p !== undefined
            && p.clubId === game.managedClubId
            && !retiredPlayerIds.has(p.id)
          )
        if (living.length === 0) return ''
        const p = living[0]!
        return ` Fostrade ${p.firstName} ${p.lastName}, ${p.age} år.`
      })()
      retirementCeremonyEvents.push({
        id: `retirement_ceremony_${player.id}_${nextSeason}`,
        type: 'retirementCeremony',
        title: `Pensionsceremoni — ${playerName}`,
        body: `${farewellQuote}${protégéLine} Vill du erbjuda en roll i föreningen?`,
        relatedPlayerId: player.id,
        resolved: false,
        sender: { name: playerName, role: 'Avgående spelare' },
        choices: [
          {
            id: 'youth_coach',
            label: 'Erbjud roll som ungdomstränare',
            subtitle: '🌱 +ungdomskvalitet',
            effect: { type: 'setLegendRole', legendRole: 'youth_coach' },
          },
          {
            id: 'scout',
            label: 'Erbjud roll som scout',
            subtitle: '🔍 +scoutresurser',
            effect: { type: 'setLegendRole', legendRole: 'scout' },
          },
          {
            id: 'farewell',
            label: 'Tack och lycka till',
            effect: { type: 'setLegendRole', legendRole: 'farewell' },
          },
        ],
      } as GameEvent)
    }
  }

  const previousLegendIds = new Set((game.clubLegends ?? []).map(legend => legend.playerId).filter(Boolean))
  const retirementLedgerEntries: EventLedgerEntry[] = newLegends.flatMap(legend => {
    if (!legend.playerId || previousLegendIds.has(legend.playerId)) return []
    const entry = buildRetirementLedgerEntry(legend, game.managedClubId)
    return entry ? [entry] : []
  })

  // ── C-B3: Pensionsval — kandidat för nästa säsongs portal-kort ───────────
  const retirementCandidate = getRetirementCandidate(game)
  const pendingRetirementDecision = retirementCandidate
    ? {
        playerId: retirementCandidate.id,
        quote: getRetirementQuote(retirementCandidate),
      }
    : game.pendingRetirementDecision  // keep existing if no new candidate

  const lastRetirementSeason = retirementCandidate
    ? game.currentSeason
    : game.lastRetirementSeason

  // ── 28-A: Pension-impact på morale + kapten-vakuum ───────────────────────
  for (const pid of retiredPlayerIds) {
    const player = resetPlayers.find(p => p.id === pid)
    if (!player || player.clubId !== game.managedClubId) continue
    const seasonsInClub = player.careerStats?.seasonsPlayed ?? 0
    const wasCaptain = player.id === game.captainPlayerId
    const wasLongtime = seasonsInClub >= 3

    if (wasCaptain) nextCaptainPlayerId = undefined

    if (!wasCaptain && !wasLongtime) continue

    const playerSeasonSet = new Set(
      (player.seasonHistory ?? [])
        .filter(h => h.clubId === game.managedClubId)
        .map(h => h.season),
    )

    let affectedCount = 0
    resetPlayers = resetPlayers.map(tm => {
      if (tm.id === pid || retiredPlayerIds.has(tm.id)) return tm
      if (tm.clubId !== game.managedClubId) return tm
      const sharedSeasons = (tm.seasonHistory ?? [])
        .filter(h => h.clubId === game.managedClubId && playerSeasonSet.has(h.season))
        .length
      if (sharedSeasons < 2) return tm
      affectedCount++
      const moraleHit = wasCaptain
        ? Math.min(15, 5 + sharedSeasons * 2)
        : Math.min(10, 3 + sharedSeasons)
      return { ...tm, morale: Math.max(0, tm.morale - moraleHit) }
    })

    const playerName = `${player.firstName} ${player.lastName}`
    let moraleBody: string | null = null
    if (wasCaptain && affectedCount >= 3) {
      moraleBody = `Omklädningsrummet är tystare än vanligt. Halva truppen spelade med ${playerName} i ${seasonsInClub} år. Det märks i morgonens träning.`
    } else if (wasCaptain && affectedCount > 0) {
      moraleBody = `De som var nya när ${playerName} ledde laget pratar inte mycket om det. De som var där länge säger inget alls.`
    } else if (!wasCaptain && affectedCount > 0) {
      moraleBody = `${playerName} var inte kapten. Men han var ${player.lastName}. Det är skillnad. Det märks nu när han inte är där.`
    }
    if (moraleBody) {
      retirementMessages.push({
        id: `inbox_morale_impact_${pid}_${nextSeason}`,
        date: game.currentDate,
        type: InboxItemType.BoardFeedback,
        title: `Truppen saknar ${player.lastName}`,
        body: moraleBody,
        isRead: false,
      } as InboxItem)
    }
  }

  // ── DREAM-011: Club legends auto-renew their contract for 1 year ─────────
  resetPlayers = resetPlayers.map(p => {
    if (p.isClubLegend && p.clubId === game.managedClubId && p.contractUntilSeason <= game.currentSeason) {
      return { ...p, contractUntilSeason: nextSeason }
    }
    return p
  })

  // ── Contract expiry — players whose contracts have run out ───────────────
  const contractExpiredIds = new Set<string>()
  const contractExpiryInbox: InboxItem[] = []

  for (const player of resetPlayers) {
    if (retiredPlayerIds.has(player.id)) continue          // already retiring
    // `handledContractPlayerIds` betyder att årets contractRequest har
    // besvarats, inte att kontraktet nödvändigtvis förlängdes: rejectContract
    // skriver samma id för att inte återgenerera kortet senare under säsongen.
    // Själva contractUntilSeason är därför den enda sanningen för om avtalet
    // faktiskt löper vidare. En förlängning har redan flyttat datumet framåt;
    // ett avslag lämnar datumet orört och ska inte ge ett gratis extraår.
    if (player.contractUntilSeason > game.currentSeason) continue  // still valid

    contractExpiredIds.add(player.id)

    if (player.clubId === game.managedClubId) {
      contractExpiryInbox.push({
        id: `inbox_contract_expired_${player.id}_${nextSeason}`,
        date: game.currentDate,
        type: InboxItemType.ContractExpiring,
        title: `${player.firstName} ${player.lastName} lämnar klubben`,
        body: `${player.firstName} ${player.lastName}s kontrakt har löpt ut. Han lämnar som fri agent.`,
        isRead: false,
      } as InboxItem)
      seasonTransitionEvents.push({ type: 'contractExpired', playerId: player.id, playerLastName: player.lastName })
    }
  }

  // Sprint 28-B: Update isClubLegend flag for active managed-club players.
  // AI-club legends are seeded once in worldGenerator — managed-club legends
  // are computed dynamically each season end (≥5 seasons + ≥100 matches).
  resetPlayers = updateActiveLegendFlags(resetPlayers, game.managedClubId) as typeof resetPlayers

  const activePlayers = resetPlayers
    .filter(p => !retiredPlayerIds.has(p.id))
    .map(p => contractExpiredIds.has(p.id) ? { ...p, clubId: 'free_agent' } : p)

  // ── A-H2b (DOM_AH2B_RETENTION_2026-08-28) — obemötta marknadskrav ────────
  // Beräknas HÄR, mot `game` (PRE-rollover — seasonStats är den avslutade
  // säsongens, inte resetPlayers nollställda värden) och `updatedClubs`
  // (reputation redan uppdaterad ovan, rad ~235 — vad det KOSTAR att hålla
  // truppen NÄSTA säsong). Bara aktiva förstalagsspelare (inte pensionerande/
  // kontraktsutgångna — de lämnar oavsett) och bara EXISTERANDE spelare
  // (game.players, inte youthPlayers — en nyintagen akademist har 0 matcher
  // denna säsong, performanceFactor faller redan tillbaka till 1 för dem,
  // men de ska ändå inte in i "obemött krav"-beslutet vid sin allra första
  // säsongsövergång). Presenteras samlat på PendingScreen.ContractDemands
  // (se pendingContractDemands nedan + gameFlowActions.ts:s clearSeasonSummary).
  const activeManagedPlayerIds = new Set(
    game.players
      .filter(p => p.clubId === game.managedClubId)
      .filter(p => !retiredPlayerIds.has(p.id) && !contractExpiredIds.has(p.id))
      .map(p => p.id),
  )
  // Villkor 2 (SLUTTEST_KO.md A-H2b-fyndet, 2026-08-28): finalPosition måste
  // komma från den färskt beräknade `managedClubStanding` (rad ~90), inte
  // `game.standings` — det fältet är den alfabetiska dummytabellen tills
  // nästa säsongs matcher spelats. `?? 12` matchar samma fallback som
  // seasonStartSnapshot nedan (botten av en 12-lagsserie) för den osannolika
  // raden managedClubStanding saknas helt.
  const managedClubForDemands = updatedClubs.find(c => c.id === game.managedClubId)
  const contractDemands = managedClubForDemands
    ? computeSeasonEndContractDemands(
        game,
        managedClubForDemands,
        activeManagedPlayerIds,
        managedClubStanding?.position ?? 12,
      )
    : []

  // ── Board objectives — evaluate FÖRE patiensuppdateringen ────────────────
  // Femte koefficientrundan (Jacobs dom 2026-08-23, O5_FEMTE_PASSET_
  // AVSKEDSDIAGNOS_2026-08-23.md): meritbufferten utökad till HELA
  // säsongsslutstermen (position + objektivkostnad), inte bara position.
  // Objektiven måste därför utvärderas HÄR, före computeBoardPatienceUpdate
  // — evaluateObjective(obj, game) läser bara den ursprungliga game-parametern
  // (inget mutex/reassignment av `game` sker mellan gamla och nya platsen,
  // verifierat), så flytten ändrar inget om VAD som utvärderas.
  //
  // Jacobs reviderade villkor (styrelseobjektiv-tier-domen, 2026-08-25):
  // bufferten skyddade tidigare INTE upprepat missade mål alls (0% — se
  // isRepeatedObjectiveFailure() i boardObjectiveService.ts för den fulla
  // motiveringen). Jacobs korrigering: "Ett upprepat missat mål ska kosta
  // mer än ett nytt, det var min dom — men att det förbigår krediten helt
  // betyder att bra år aldrig kan hjälpa." Upprepningen ska alltså
  // fortfarande kosta MER än en färsk miss (mindre av kostnaden är
  // buffer-berättigad), men inte förbigå krediten helt. REPEATED_FAILURE_
  // BUFFER_PROTECTION = hur stor andel av kostnaden bufferten FÅR absorbera
  // vid en upprepning — 0.5 vald som mittpunkt (halva skyddet, inte inget)
  // i avsaknad av en egen kalibreringsanledning att avvika.
  const REPEATED_FAILURE_BUFFER_PROTECTION = 0.5
  const objectiveResults: Array<{ season: number; objectiveId: string; result: 'met' | 'failed'; ownerReaction: string; label: string }> = []
  const objectiveStatuses: Array<'met' | 'failed' | 'at_risk' | 'active'> = []
  const OBJECTIVE_PATIENCE_COST: Record<'met' | 'failed' | 'at_risk' | 'active', number> = {
    met: 3, at_risk: -2, active: 0, failed: -5,
  }
  const objectiveHistory = game.boardObjectiveHistory ?? []
  let bufferEligibleObjectiveDelta = 0
  let unprotectedObjectiveDelta = 0
  for (const obj of game.boardObjectives ?? []) {
    const result = evaluateObjective(obj, game)
    objectiveStatuses.push(result.status)
    const finalStatus = result.status === 'met' ? 'met' as const : 'failed' as const
    objectiveResults.push({
      season: game.currentSeason,
      objectiveId: obj.id,
      result: finalStatus,
      ownerReaction: finalStatus === 'met' ? obj.successReward : obj.failureConsequence,
      label: obj.label,
    })
    newInboxItems.push({
      id: `inbox_boardobj_end_${obj.id}_${game.currentSeason}`,
      date: game.currentDate,
      type: InboxItemType.BoardFeedback,
      title: finalStatus === 'met' ? `${obj.label} — uppfyllt` : `${obj.label} — misslyckat`,
      body: finalStatus === 'met' ? obj.successReward : obj.failureConsequence,
      isRead: false,
    } as InboxItem)

    const cost = OBJECTIVE_PATIENCE_COST[result.status]
    if (isRepeatedObjectiveFailure(obj.id, cost, objectiveHistory)) {
      bufferEligibleObjectiveDelta += cost * REPEATED_FAILURE_BUFFER_PROTECTION
      unprotectedObjectiveDelta += cost * (1 - REPEATED_FAILURE_BUFFER_PROTECTION)
    } else {
      bufferEligibleObjectiveDelta += cost
    }
  }
  const objectiveOutcome = {
    met: objectiveStatuses.filter(s => s === 'met').length,
    atRisk: objectiveStatuses.filter(s => s === 'at_risk').length,
    active: objectiveStatuses.filter(s => s === 'active').length,
    failed: objectiveStatuses.filter(s => s === 'failed').length,
  }

  // ── Board patience update ─────────────────────────────────────────────
  const totalTeams = game.clubs.length
  const finalPos = managedClubStanding?.position ?? totalTeams
  // U1 andra halvan (2026-08-22): currentPatience är nu redan uppdaterad
  // löpande under säsongen (roundProcessor.ts:s updateRunningBoardPatience)
  // — detta anrop lägger bara säsongsslutets EGEN term (position relativt
  // förväntan, PLUS nu objektivkostnaden — se ovan) ovanpå, det ersätter
  // inte den löpande delen.
  const currentPatience = game.boardPatience ?? 70
  const currentFailures = game.consecutiveFailures ?? 0
  const currentMeritBuffer = game.meritBuffer ?? 0
  // A-H1: samma frusna säsongsstarts-fält som boardVerdict ovan — patiensen
  // ska mätas mot vad styrelsen KRÄVDE den här säsongen, inte mot vad den
  // redan hunnit kräva för nästa (stegningen sker längre ned, rad ~379).
  const managedClubExpectation = game.seasonStartBoardExpectation
    ?? game.clubs.find(c => c.id === game.managedClubId)?.boardExpectation
    ?? ClubExpectation.MidTable

  // U1 (SLUTTEST_KO.md, 2026-08-17): "nedflyttningsstrid" gav tidigare ingen
  // verklig tålamodsförlust förrän i botten-tre av en totalTeams/3-gissning
  // — kärnan i fyndet var att en klubb kunde tankas en hel säsong och
  // styrelsen blev ändå NÖJDARE. U1 andra halvan (Jacobs dom 2026-08-22,
  // efter Skutskär-auditen): computeBoardPatienceUpdate läser nu en
  // kontinuerlig, boardExpectation-medveten formel (se boardService.ts)
  // istf en klippa vid nedflyttningskanten — position 4-8 av 12 var
  // tidigare en "dödzon" med noll effekt oavsett utfall.
  const patienceUpdate = computeBoardPatienceUpdate(finalPos, totalTeams, currentPatience, currentFailures, managedClubExpectation, currentMeritBuffer, bufferEligibleObjectiveDelta)
  let newBoardPatience = patienceUpdate.newBoardPatience
  let newConsecutiveFailures = patienceUpdate.newConsecutiveFailures
  const newMeritBuffer = patienceUpdate.newMeritBuffer
  // Upprepade objektivmissar — halva kostnaden (REPEATED_FAILURE_BUFFER_
  // PROTECTION ovan) är ALDRIG buffer-skyddad, träffar patiensen direkt.
  // Den andra halvan gick in i bufferEligibleObjectiveDelta ovan och kunde
  // absorberas av computeBoardPatienceUpdate precis som en färsk miss.
  newBoardPatience = Math.max(0, Math.min(100, newBoardPatience + unprotectedObjectiveDelta))

  // Påståendesvepet #13: pushar styrelsebetyg-kortet HÄR, nu att det
  // slutgiltiga newBoardPatience är känt — säsongsdomen (orörd) följt av
  // en egen lägesmening, aldrig ihopvävda till en sats.
  if (boardVerdictTitle !== undefined && boardVerdictBody !== undefined) {
    newInboxItems.push({
      id: `inbox_board_verdict_${game.currentSeason}`,
      date: game.currentDate,
      type: InboxItemType.BoardFeedback,
      title: boardVerdictTitle,
      body: `${boardVerdictBody} ${seasonVerdictZoneLine(newBoardPatience)}`,
      isRead: false,
    } as InboxItem)
  }

  let managerFired = false

  // NOTE: Firing check moved AFTER board objectives evaluation (line ~699)
  // so objective success/failure affects the decision

  // Remove retired and contract-expired players from all club squads
  const clubsWithRetirements = updatedClubs.map(club => ({
    ...club,
    squadPlayerIds: club.squadPlayerIds.filter(
      id => !retiredPlayerIds.has(id) && !contractExpiredIds.has(id)
    ),
  }))

  // ── Tvångsnedflyttning effects (license denied) ───────────────────────────
  let clubsAfterLicense = clubsWithRetirements
  let playersAfterLicense = updateLoyaltyScores(activePlayers)
  // M13: filter out contextual sponsors that have expired
  let sponsorsAfterLicense = (game.sponsors ?? []).filter(
    s => !s.expiresSeason || s.expiresSeason >= nextSeason,
  )

  // 2026-08-26 (Jacobs dom, RAPPORT_ATERKOPPLINGSSLINGAN_HITTAD_2026-08-26.md):
  // "Kaskaden ska bort, inte mjukas. Ett diskret straff med tre samtidiga
  // effekter vid en godtycklig kassagräns kan inte balanseras — bara flyttas."
  // Gamla beteendet (borttaget): 3 SLUMPADE spelare bort utan spelarval, fast
  // -15 rykte, 60% av sponsorerna på en gång — en självförstärkande kaskad
  // (sämre kassa → kaskad → ännu sämre kassa → samma kaskad igen).
  //
  // Nytt: kontinuerliga konsekvenser som skalar med hur djupt under -200 000
  // kassan ligger, ALDRIG en spelarborttagning utan val. Spelaren väljer
  // fortfarande vem som säljs — det gör redan `checkEconomicCrisis`
  // (economicCrisisService.ts, fas 3: sälj/kommunlån/mecenat), en redan
  // byggd, testad, spelarvals-driven mekanism som triggar på SAMMA -200 000-
  // krisväg. Licenskonsekvenserna fyrar nu bara när den kanoniska
  // licenseRiskScore-modellen går IN i license_denied; kassans djup används
  // enbart för att skala ryktesförlusten. Ingen ny händelse behövs för
  // "tvinga fram ett val" — den finns.
  if (licenseCheck.action?.type === 'license_denied' && managedClubForLicense) {
    // Ryktesförlust skalar med underskottets djup istf ett fast tal.
    // Magnitud FÖRESLAGEN, inte dömd: -5 vid tröskeln, +5 extra per
    // ytterligare 50 000 kr under -200 000, tak -30 (samma golv som förut
    // var det enda möjliga utfallet, nu det VÄRSTA möjliga).
    const deficitDepth = Math.max(0, -200_000 - managedClubForLicense.finances)
    const reputationLoss = Math.min(30, 5 + Math.floor(deficitDepth / 50_000) * 5)
    clubsAfterLicense = clubsAfterLicense.map(c =>
      c.id === game.managedClubId
        ? { ...c, reputation: Math.max(0, (c.reputation ?? 50) - reputationLoss) }
        : c
    )

    // En sponsor i taget, inte 60% på en gång — den minst värdefulla lämnar
    // först. Om underskottet fortsätter flera säsonger i rad lämnar en till
    // varje gång, aldrig en engångskaskad.
    if (sponsorsAfterLicense.length > 0) {
      const leavingSponsor = [...sponsorsAfterLicense].sort((a, b) => a.weeklyIncome - b.weeklyIncome)[0]
      sponsorsAfterLicense = sponsorsAfterLicense.filter(s => s.id !== leavingSponsor.id)
      // Orsaken är licensbeskedet, inte orten: en kommersiell partner som
      // drar sig ur för att skydda sig mot associationen — sakligare röst
      // än mecenatens/patronens ort-avhopp. weeklyIncome bär beloppet.
      newInboxItems.push({
        id: `inbox_sponsor_leaves_license_${nextSeason}`,
        date: game.currentDate,
        type: InboxItemType.EconomicCrisis,
        title: `${leavingSponsor.name} bryter avtalet`,
        body: `Licensbeskedet gick inte klubbens väg, och ${leavingSponsor.name} vill inte synas på tröjan medan klubben står under licensnämndens villkor. "Inget ont om laget. Men vi kan inte försvara det mot vår egen styrelse just nu." Samarbetet avslutas i förtid, och klubben tappar ${leavingSponsor.weeklyIncome.toLocaleString('sv-SE')} kr i veckan.`,
        relatedClubId: game.managedClubId,
        isRead: false,
      } as InboxItem)
    }
  }

  // ── Kommunval — every 4th season, 50% chance of new politician ───────────
  let nextPolitician = game.localPolitician
  const kommunvalRand = mulberry32(baseSeed + 444777)
  if (nextSeason % 4 === 0 && kommunvalRand() < 0.5) {
    const newPol = generateNewPolitician(baseSeed + nextSeason * 31, nextSeason)
    nextPolitician = newPol
    newInboxItems.push({
      id: `inbox_kommunval_${nextSeason}`,
      date: game.currentDate,
      type: InboxItemType.KommunBidrag,
      title: `Kommunval: ${newPol.name} ny kommunalråd`,
      body: `${newPol.name} (${newPol.party}) är kommunens nya kommunalråd med agenda "${newPol.agenda}". Kommunbidraget beräknas om baserat på deras prioriteringar. Relation startar på 40/100.`,
      isRead: false,
    } as InboxItem)
  }

  // ── Patron contribution + influence escalation ─────────────────────────────
  let updatedPatron = game.patron
  if (updatedPatron?.isActive) {
    const newInfluence = Math.min(100, (updatedPatron.influence ?? 30) + 5)
    const newTotalContributed = (updatedPatron.totalContributed ?? 0) + updatedPatron.contribution

    if (newInfluence >= 80 && (updatedPatron.influence ?? 30) < 80) {
      newInboxItems.push({
        id: `inbox_patron_demands_${nextSeason}`,
        date: game.currentDate,
        type: InboxItemType.PatronInfluence,
        title: `${updatedPatron.name} kräver inflytande`,
        body: `${updatedPatron.name} har bidragit med totalt ${newTotalContributed.toLocaleString('sv-SE')} kr och känner att han förtjänar mer att säga till om i klubbens beslut.`,
        isRead: false,
      } as InboxItem)
    }

    updatedPatron = {
      ...updatedPatron,
      influence: newInfluence,
      totalContributed: newTotalContributed,
    }
  }

  // ── Media effects (journalist relationship) ────────────────────────────────
  let newJournalistRelationship = game.journalist?.relationship ?? game.journalistRelationship ?? 50
  let newCommunityStanding = game.communityStanding ?? 50

  // Grävande artikel trigger: journalist unhappy + bad finances or license warning
  const managedClubFin = clubsWithRetirements.find(c => c.id === game.managedClubId)?.finances ?? 0
  const gravId = `gravande_artikel_${game.currentSeason}`
  const resolvedSet = new Set(game.resolvedEventIds ?? [])
  if (
    newJournalistRelationship < 30 &&
    (managedClubFin < -50000 || isActiveLicenseWarning(newLicenseStatus)) &&
    !resolvedSet.has(gravId)
  ) {
    newCommunityStanding = Math.max(0, newCommunityStanding - 5)
    newJournalistRelationship = Math.max(0, newJournalistRelationship - 5)
    newInboxItems.push({
      id: `inbox_gravande_${game.currentSeason}`,
      date: game.currentDate,
      type: InboxItemType.MediaEvent,
      title: 'Lokaltidningen granskar ekonomin',
      body: `${game.localPaperName ?? 'Lokaltidningen'} publicerar en kritisk granskning av ${managedClubForLicense?.name ?? 'klubbens'} ekonomi. Kommunen och sponsorer reagerar negativt.`,
      isRead: false,
    } as InboxItem)
    // Reduce sponsor network mood and politician relationship
    if (nextPolitician) {
      nextPolitician = { ...nextPolitician, relationship: Math.max(0, nextPolitician.relationship - 10) }
    }
  }

  // Räddande artikel trigger: journalist happy + youth team good record
  const raddId = `raddande_artikel_${game.currentSeason}`
  const youthWins = game.youthTeam?.seasonRecord?.w ?? 0
  if (
    newJournalistRelationship > 70 &&
    game.youthTeam &&
    youthWins > 5 &&
    !resolvedSet.has(raddId)
  ) {
    newCommunityStanding = Math.min(100, newCommunityStanding + 5)
    newInboxItems.push({
      id: `inbox_raddande_${game.currentSeason}`,
      date: game.currentDate,
      type: InboxItemType.MediaEvent,
      title: 'Lokaltidningen skriver helsida om akademin',
      body: `${game.localPaperName ?? 'Lokaltidningen'} hyllar ${managedClubForLicense?.name ?? 'klubbens'} ungdomsverksamhet med en helsida. Kommunen och sponsorer reagerar positivt.`,
      isRead: false,
    } as InboxItem)
    if (nextPolitician) {
      nextPolitician = { ...nextPolitician, relationship: Math.min(100, nextPolitician.relationship + 5) }
    }
  }

  // ── Build handlingsplan pending event if needed ───────────────────────────
  const seasonEndPendingEvents: GameEvent[] = [...retirementCeremonyEvents]
  if (newLicenseStatus === 'first_warning' || newLicenseStatus === 'point_deduction') {
    const handlingsplanEvent: GameEvent = {
      id: `licenseHandlingsplan_${game.currentSeason}`,
      type: 'licenseHandlingsplan',
      title: 'Licensnämndens krav: Handlingsplan',
      body: `Licensnämnden vill se att ${managedClubForLicense?.name ?? 'klubben'} tar tag i ekonomin. Det finns inte en enda rätt väg — välj var ni lägger kraften.`,
      choices: [
        {
          id: 'sparplan',
          label: 'Skjut till kapital ur egen kassa',
          subtitle: `💰 engångsintäkt ${LICENSE_ACTION_PLAN_CAPITAL_INCOME / 1000} tkr`,
          effect: { type: 'multiEffect', subEffects: JSON.stringify([
            { type: 'income', amount: LICENSE_ACTION_PLAN_CAPITAL_INCOME },
          ]) },
        },
        {
          id: 'membership',
          label: 'Medlemsdrivning — engagera lokala krafter',
          subtitle: '⭐ +8 ortens stöd',
          effect: { type: 'communityStanding', amount: 8 },
        },
        {
          id: 'sponsors',
          label: 'Vänd dig till sponsorerna',
          subtitle: '📰 +3 rykte',
          effect: { type: 'reputation', amount: 3 },
        },
        ...(updatedPatron?.isActive ? [{
          id: 'patron',
          label: `Be ${updatedPatron.name} ställa upp`,
          subtitle: `🤝 +15 ${updatedPatron.name}s välvilja (inga pengar nu)`,
          effect: { type: 'patronHappiness' as const, amount: 15 },
        }] : []),
      ],
      resolved: false,
      // HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md): måste-nivåns
      // frist. Eventet skapas VID rollovern och landar i den KOMMANDE
      // säsongens pendingEvents — handlingsplanen ska vara på plats innan
      // licensnämnden prövar igen, och checkLicenseStatus() körs vid nästa
      // säsongsslut. Fristen är därför den kommande regelsäsongens sista
      // matchdag (nextSeasonCalendar, samma kalender spelet självt får).
      deadlineRound: nextSeasonCalendar[nextSeasonCalendar.length - 1]?.matchday
        ?? FALLBACK_SEASON_DEADLINE_MATCHDAY,
    }
    seasonEndPendingEvents.push(handlingsplanEvent)
  }

  // Firing check — AFTER objectives so success/failure affects the decision
  //
  // Survive-tierns eget avskedskontrakt (Jacobs dom 2026-08-25, efter fjärde
  // H4-mätningen — RAPPORT_SURVIVE_AVSKEDSMEKANIK_AVGRANSNING_2026-08-25.md):
  // "Att förlora är förväntat — det är premissen." boardPatience<=15 OCH
  // consecutiveFailures>=3 är BÅDA sportsligt utfall (det senare byggs av
  // finalPos>=relegationZoneStart — Survive-ankaret ÄR 12=nedflyttningszonen,
  // så en Survive-klubb som presterar exakt som väntat annars ackumulerar
  // consecutiveFailures nästan varje säsong). Stängs av för Survive. Två
  // oberoende finansiella vägar kvarstår ORÖRDA och redan aktiva: licensnekan
  // (rad ~1044 nedan, computeNetResult — ren kassaförändring) och per-omgångs-
  // konkurs (postRoundFlagsProcessor.ts, finances<-2M). En Survive-klubb är
  // alltså inte osparkbar — bara inte sparkbar på ENBART resultat.
  const isSurviveTier = managedClubExpectation === ClubExpectation.Survive
  if (!isSurviveTier && (newBoardPatience <= 15 || newConsecutiveFailures >= 3)) {
    managerFired = true
  }

  // licenseCheck/newLicenseStatus/newLicenseRiskScore flyttade ovan
  // (före handlingsplan-blocket) — se kommentaren där.
  const licensePendingDeductions: Record<string, number> = {}
  if (licenseCheck.action) {
    if (licenseCheck.action.type === 'license_denied') {
      managerFired = true
    }
    if (licenseCheck.action.type === 'point_deduction') {
      licensePendingDeductions[game.managedClubId] = 3
    }
    newInboxItems.push(buildLicenseInboxItem(licenseCheck.action, game.currentDate, game.currentSeason, licenseCheck.newLicenseStatus))
  }

  // A-H4 (TRIAGE_AUDIT_2026-08-29.md, HIGH 4): namngiven avskedsorsak, satt
  // HÄR (samma svep som managerFired ovan) för SeasonSummary.boardTruth —
  // aldrig omderiverad senare av en läsare. Samma prioritetsordning som
  // GameOverScreen.tsx's tidigare (nu ersatta) live-läsning använde: raka
  // förluster/tabellmiss (consecutiveFailures) före utsliten patience, båda
  // avstängda för Survive-tiern (samma isSurviveTier-grind som ovan);
  // licensnekan är den enda vägen kvar när ingen av de två sportsliga skälen
  // stämmer (t.ex. en Survive-klubb, eller en klubb sparkad enbart på
  // licensnämndens beslut).
  let firedReason: 'boardPatience' | 'consecutiveFailures' | 'licenseDenied' | undefined
  if (managerFired) {
    if (!isSurviveTier && newConsecutiveFailures >= 3) firedReason = 'consecutiveFailures'
    else if (!isSurviveTier && newBoardPatience <= 15) firedReason = 'boardPatience'
    else firedReason = 'licenseDenied'
  }

  const objRand = mulberry32((seed ?? 42) + game.currentSeason * 777)
  const managedClubForObj = updatedClubs.find(c => c.id === game.managedClubId)
  // SLUTTEST 2026-08-08 (punkt 4b): currentValue satt till 0 vid generering,
  // uppdaterades bara i checkInObjectives (omg 7/14/22) — hela introt +
  // första tredjedelen av säsongen visade en falsk nolla för nivåmål (t.ex.
  // growFanbase, target 70, spelaren såg "0 / 70" när mätaren stod på 50).
  // Deltamål (growFinances) hade rätt i noll — bara nivåmålen ljög.
  // evaluateObjective körs nu en gång direkt vid generering; checkIn-rytmen
  // (omg 7/14/22) orörd.
  // SLUTTEST RUNDA 3 (punkt 3): startValue = samma initiala evaluateObjective-
  // värde som currentValue skrivs in med — se createNewGame.ts för samma mönster.
  const newSeasonObjectives = managedClubForObj && game.board
    ? generateBoardObjectives(managedClubForObj, game, game.board, objRand)
        .map(obj => {
          const startingValue = evaluateObjective(obj, game).value
          return { ...obj, currentValue: startingValue, startValue: startingValue }
        })
    : []

  // ── Bandygalan ────────────────────────────────────────────────────────────
  const galaNominations = generateNominations(game)
  let galaStorylinesForSeason: StorylineEntry[] = []
  if (galaNominations.length > 0) {
    seasonEndPendingEvents.push(generateGalaEvent(game, galaNominations))
    const { inboxItems: galaInbox, storylines: galaStorylines } = generateGalaInbox(galaNominations, game)
    newInboxItems.push(...galaInbox)
    galaStorylinesForSeason = galaStorylines
  }

  // ── NARR-001: Mecenat retirement check ───────────────────────────────────
  const retirementEvent = checkMecenatRetirement(game)
  if (retirementEvent) {
    seasonEndPendingEvents.push(retirementEvent)
  }

  // ── WEAK-017: Akademi-sammanfattning ─────────────────────────────────────────
  {
    const managedId = game.managedClubId
    const promotions = game.players.filter(p =>
      p.academyClubId === managedId &&
      p.clubId === managedId &&
      (p.careerStats?.totalGames ?? 0) >= 3 &&
      (p.careerStats?.seasonsPlayed ?? 0) <= 1
    ).length
    const sold = game.players.filter(p =>
      p.academyClubId === managedId &&
      p.clubId !== managedId
    ).length
    if (promotions > 0 || sold > 0) {
      newInboxItems.push({
        id: `inbox_academy_summary_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.MediaEvent,
        title: `Akademi-utfall ${game.currentSeason}`,
        body: `${promotions > 0 ? `${promotions} spelare fick A-lagsdebut i år. ` : ''}${sold > 0 ? `${sold} akademifostrad${sold > 1 ? 'e' : ''} spelar nu för annan klubb — och pengarna gick tillbaka till akademin.` : ''} Det är så det ska fungera.`.trim(),
        isRead: false,
      } as InboxItem)
    }
  }

  // ── Funktionärsdöd (2%/säsong vid age >= 65) ──────────────────────────
  // OBS (design, bekräftad av Jacob 2026-06-12): communityStanding +3 vid dödsfall
  // är AVSIKTLIG — "orten samlas i sorgen": begravningen fyller kyrkan, föreningen
  // sluter led. Inte ett teckenfel. Ändra inte utan nytt designbeslut.
  const deathRand = mulberry32((seed ?? 42) + game.currentSeason * 31337)
  let updatedNamedCharacters = (game.namedCharacters ?? []).map(c => ({ ...c }))
  let communityStandingDelta = 0
  for (const char of updatedNamedCharacters) {
    if (char.isAlive === false) continue
    if (!char.id.startsWith('func_')) continue
    const age = char.age ?? 55
    const deathChance = age >= 65 ? 0.02 : 0
    if (deathChance > 0 && deathRand() < deathChance) {
      char.isAlive = false
      char.age = age + 1
      communityStandingDelta += 3
      const mourner = updatedNamedCharacters.find(c => c.isAlive !== false && c.id !== char.id && c.id.startsWith('func_'))
      newInboxItems.push({
        id: `inbox_functionary_death_${char.id}_${game.currentSeason}`,
        date: `${nextSeason}-10-01`,
        type: InboxItemType.Community,
        title: `${char.name} har gått bort`,
        body: `${char.name}, ${char.role?.toLowerCase() ?? 'funktionär'} sedan många år, avled under sommaren. Föreningen sörjer.${mourner ? ` "${mourner.name}: Vi saknar ${char.name}."` : ''}`,
        isRead: false,
      } as InboxItem)
    } else {
      char.age = age + 1
    }
  }

  // ── AI transfers between seasons ─────────────────────────────────────────
  const aiTransferResult = processAITransfers(
    playersAfterLicense,
    clubsAfterLicense,
    nextSeason,
    game.managedClubId,
    baseSeed + 55555,
  )
  playersAfterLicense = aiTransferResult.updatedPlayers
  clubsAfterLicense = aiTransferResult.updatedClubs

  // ── AI squad replenishment: ensure every AI club has ≥ 20, managed club safety-net at 14 ──
  const replenishRand = mulberry32(baseSeed + 77777)
  const emptySeasonStats = { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 }
  const emptyCareerStats = { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 }

  const replenishedPlayers: Player[] = []
  const replenishedClubs = clubsAfterLicense.map(club => {
    const isManaged = club.id === game.managedClubId
    const target = isManaged ? 14 : 20  // Managed: safety-net at 14 (bandy minimum), AI: full squad
    const squadSize = club.squadPlayerIds.length

    const currentPlayers = playersAfterLicense.filter(p => club.squadPlayerIds.includes(p.id))
    const counts: Record<PlayerPosition, number> = {
      [PlayerPosition.Goalkeeper]: 0,
      [PlayerPosition.Defender]:   0,
      [PlayerPosition.Half]:       0,
      [PlayerPosition.Midfielder]: 0,
      [PlayerPosition.Forward]:    0,
    }
    for (const p of currentPlayers) { if (counts[p.position] !== undefined) counts[p.position]++ }

    const needsMore = squadSize < target
    const needsRebalance = (Object.keys(POSITION_MINIMUMS) as PlayerPosition[])
      .some(pos => counts[pos] < POSITION_MINIMUMS[pos])

    if (!needsMore && !needsRebalance) return club

    const shortfall = (Object.keys(POSITION_MINIMUMS) as PlayerPosition[])
      .reduce((sum, pos) => sum + Math.max(0, POSITION_MINIMUMS[pos] - counts[pos]), 0)
    const needed = Math.max(needsMore ? target - squadSize : 0, shortfall)

    const newIds: string[] = []
    const workingRoster = [...currentPlayers]

    for (let i = 0; i < needed; i++) {
      const pos = pickPositionToFill(workingRoster)
      const caBase = Math.round(club.reputation * 0.45 + 15)
      const ca = Math.max(20, Math.min(70, caBase + Math.floor(replenishRand() * 16) - 8))
      const age = 20 + Math.floor(replenishRand() * 12)
      const attrs = { skating: ca - 5, acceleration: ca - 5, stamina: ca - 3, ballControl: ca - 5, passing: ca - 5, shooting: ca - 5, dribbling: ca - 5, vision: ca - 5, decisions: ca - 5, workRate: ca, positioning: ca - 5, defending: ca - 5, cornerSkill: ca - 10, goalkeeping: pos === PlayerPosition.Goalkeeper ? ca : 10, cornerRecovery: ca - 5 }
      const id = `replenish_${club.id}_s${nextSeason}_${squadSize + i}`
      const player: Player = {
        id,
        firstName: PLAYER_FIRST_NAMES[Math.floor(replenishRand() * PLAYER_FIRST_NAMES.length)],
        lastName: PLAYER_LAST_NAMES[Math.floor(replenishRand() * PLAYER_LAST_NAMES.length)],
        age,
        nationality: 'svenska',
        clubId: club.id,
        isHomegrown: age <= 23,
        position: pos,
        archetype: PlayerArchetype.TwoWaySkater,
        salary: Math.round(ca * 120 + 2000),
        contractUntilSeason: nextSeason + 2 + Math.floor(replenishRand() * 2),
        marketValue: ca * 1500,
        morale: 60, form: 55, fitness: 70, sharpness: 50, seasonForm: 60,
        isFullTimePro: ca >= 50,
        currentAbility: ca,
        potentialAbility: Math.min(90, ca + 5 + Math.floor(replenishRand() * 15)),
        developmentRate: age <= 22 ? 60 : 35,
        injuryProneness: 25, discipline: 65,
        attributes: attrs,
        isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
        seasonStats: emptySeasonStats, careerStats: emptyCareerStats,
      }
      replenishedPlayers.push(player)
      workingRoster.push(player)
      newIds.push(id)
    }
    return { ...club, squadPlayerIds: [...club.squadPlayerIds, ...newIds] }
  })

  if (replenishedPlayers.length > 0) {
    playersAfterLicense = [...playersAfterLicense, ...replenishedPlayers]
    clubsAfterLicense = replenishedClubs
  }

  // Budgeten måste följa truppen som faktiskt sparas för nästa säsong. Före
  // denna omräkning behöll klubben start-/klubbytesvärdet även efter pensioner,
  // kontraktsutgångar, AI-övergångar och automatisk truppfyllnad.
  const nextSeasonWageBudget = calculateWageBudget(playersAfterLicense, game.managedClubId)
  clubsAfterLicense = clubsAfterLicense.map(club =>
    club.id === game.managedClubId
      ? { ...club, wageBudget: nextSeasonWageBudget }
      : club
  )

  const notableTransfers = aiTransferResult.transfers.filter(t => t.fee > 50000).slice(0, 3)
  if (notableTransfers.length > 0) {
    const transferText = notableTransfers
      .map(t => `${t.playerName}: ${t.fromClubName} → ${t.toClubName}${t.fee > 0 ? ` (${Math.round(t.fee / 1000)} tkr)` : ' (fri agent)'}`)
      .join('\n')
    newInboxItems.push({
      id: `inbox_ai_transfers_${nextSeason}`,
      date: game.currentDate,
      type: InboxItemType.Transfer,
      title: `Övergångar inför säsong ${nextSeason}`,
      body: `Några anmärkningsvärda övergångar:\n${transferText}`,
      isRead: false,
    } as InboxItem)
  }

  // Generate season summary with the final communityStanding (after all season-end adjustments)
  const matchHighlight = selectMatchOfTheSeason(game)
  // O3/O18 (DOM_EGET_SASONGSMAL/DOM_ARSBOKEN_RYGGRAD, 2026-08-19): samma
  // pre-reset game-vy som generateSeasonSummary självt läser (game.players/
  // game.standings/game.fixtures/game.facilityState speglar fortfarande den
  // AVSLUTADE säsongen här — resetPlayers/updatedClubs för nästa säsong har
  // inte skrivits tillbaka till `game` än). contractExpiredIds/retiredPlayerIds
  // är redan beräknade ovan (kontraktsutgång/pensionering samma rollover).
  //
  // Ordningsbuggen (RAPPORT_ORDNINGSBUGGEN_SEASONENDPROCESSOR_2026-08-25,
  // Jacobs dom "latent räcker inte som skäl att lämna"): clubs: här användes
  // updatedClubs (fryst innan licenseffekter/AI-transfers/truppkomplettering)
  // istf clubsAfterLicense (den array som FAKTISKT sparas för nästa säsong,
  // rad ~1386). Ingen befintlig läsare av seasonEndGameView visade fel
  // (verifierat) — men en framtida läsare av en AI-klubbs finances/
  // squadPlayerIds/reputation härifrån hade fått föråldrad data. clubsAfterLicense
  // är redan fullt beräknad vid denna punkt (sista skrivning rad ~1226, före
  // denna rad) — enrads-bytet lägger ingen ny beräkning, bara rätt källa.
  const seasonEndGameView = { ...game, clubs: clubsAfterLicense }
  const activeGoal = game.activeSeasonGoal?.chosenSeason === game.currentSeason ? game.activeSeasonGoal : undefined
  const personalGoal = activeGoal
    ? evaluateSeasonGoal(seasonEndGameView, activeGoal, { contractExpiredIds, retiredPlayerIds })
    : undefined
  const personChange = deriveSeasonPersonChange(seasonEndGameView, retiredManagedPlayers)
  const rivalryStanding = deriveRivalryStanding(seasonEndGameView)
  const clubEraSnapshot = calculateClubEra(seasonEndGameView)
  seasonSummary = {
    ...generateSeasonSummary(
      seasonEndGameView,
      Math.min(100, newCommunityStanding + communityStandingDelta),
    ),
    retiredPlayers: retiredManagedPlayers.length > 0 ? retiredManagedPlayers : undefined,
    matchOfTheSeason: matchHighlight ?? undefined,
    // A-M5: fryst kopia av offseasonFinanceLog, oberoende av game.financeLog's
    // 50-postars-cap — samma motivering som retiredPlayers/topScorer ovan
    // (frusna namn, ny säsongs data ska aldrig kunna tränga undan historiken
    // innan spelaren hunnit läsa den).
    offseasonFinanceEntries: offseasonFinanceLog.length > 0
      ? offseasonFinanceLog.map(e => ({ label: e.label, amount: e.amount, reason: e.reason }))
      : undefined,
    personalGoal,
    personChange,
    rivalryStanding,
    clubEra: clubEraSnapshot,
    // U1 andra halvan, ändring 6 (Jacobs dom 2026-08-22): datan för
    // årsbokens tvåsanningsmening ("Plats 8 överträffade målet. Två
    // uppdrag missades.") — objectiveStatuses beräknad ovan (samma pass
    // som patience-kostnaden). Bara data, ingen text — Jacob/Opus skriver
    // meningen när fältet finns.
    objectiveOutcome,
    // O18 fält 2, uppdaterad A-H9 (DOM_AH9_ARSBOKENS_BESLUT_2026-08-27.md).
    // MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md Fas 2 — läser
    // game.eventLedger (samtliga tre kandidatkällor dual-writer dit). Samma
    // femstegsvektor, samma fallback-text (Jacobs ord, ordagrant) vid noll
    // kvalificerande — pickMostImportantDecisionText bär SEASON_DECISION_NONE_TEXT
    // internt. Det gamla spridda fältet seasonDecisionCandidates retirerat
    // LIGGARE-PRIO 4 (2026-09-03).
    mostImportantDecision: pickMostImportantDecisionText(game, game.currentSeason),
  }

  // O11: freeze a real underdog season from the same frozen expectation and
  // verdict scale as the yearbook/board assessment. No parallel threshold.
  const underdogStorylineId = `story_underdog_${game.managedClubId}_${game.currentSeason}`
  const shouldWriteUnderdogStoryline = isUnderdogSeason(
    seasonSummary.boardExpectation,
    seasonSummary.finalPosition,
    game.clubs.length,
    seasonSummary.playoffResult === 'champion',
  ) && !(game.storylines ?? []).some(story => story.id === underdogStorylineId)
  // Gala generation must not mutate the incoming save. Keeping the generated
  // entries in this single rollover accumulator also preserves them when an
  // older save has no storylines array yet.
  const seasonEndStorylines = [...(game.storylines ?? []), ...galaStorylinesForSeason]
  if (shouldWriteUnderdogStoryline) {
    const displayText = seasonVerdictText(seasonSummary.boardExpectation, seasonSummary.finalPosition, game.clubs.length)
    seasonEndStorylines.push({
      id: underdogStorylineId,
      type: 'underdog_season',
      season: game.currentSeason,
      matchday: getCurrentLeagueRound(game),
      clubId: game.managedClubId,
      description: displayText,
      displayText,
      resolved: true,
    })
  }

  const relegationEscapeStorylineId = `story_relegation_escape_${game.managedClubId}_${game.currentSeason}`
  if (didEscapeRelegationOnFinalMatchday(game)
    && !seasonEndStorylines.some(story => story.id === relegationEscapeStorylineId)) {
    // Existing approved wording from FORSTARKNINGSSPEC_V3.
    const displayText = 'Räddade sig kvar i sista stund'
    seasonEndStorylines.push({
      id: relegationEscapeStorylineId,
      type: 'relegation_escape',
      season: game.currentSeason,
      matchday: getCurrentLeagueRound(game),
      clubId: game.managedClubId,
      description: displayText,
      displayText,
      resolved: true,
    })
  }

  // A-H4 (TRIAGE_AUDIT_2026-08-29.md, HIGH 4): den gemensamma sanningsmodellen
  // — se entities/SeasonSummary.ts (`boardTruth`) och boardService.ts
  // (`buildSeasonBoardTruth`) för den fulla motiveringen. isChampion läses ur
  // seasonSummary.playoffResult (redan beräknat av generateSeasonSummary ovan
  // ur SAMMA bracket) i stället för att omhärledas här ur game.playoffBracket
  // en andra gång. finalPos/totalTeams/managedClubExpectation och
  // newBoardPatience/newConsecutiveFailures/managerFired/firedReason är redan
  // de exakta värden som skrivs till game.boardPatience/consecutiveFailures/
  // managerFired nedan — ingen ny beräkning, bara en frusen paketering.
  seasonSummary.boardTruth = buildSeasonBoardTruth({
    expectation: managedClubExpectation,
    finalPosition: finalPos,
    totalTeams,
    isChampion: seasonSummary.playoffResult === 'champion',
    boardPatienceAfter: newBoardPatience,
    consecutiveFailuresAfter: newConsecutiveFailures,
    managerFired,
    firedReason,
  })

  const nextAiTransferLog = [
    ...(game.aiTransferLog ?? []),
    ...aiTransferResult.transfers.map(transfer => ({ ...transfer, season: nextSeason })),
  ].slice(-200)

  // Förutsättningsfasen steg 2: frys samma tre ligarörelser som UI:t visar
  // och välj skälsrad ur samma kanoniska underlag. Den nyss färdiga
  // seasonSummary läggs till i läsvyn så getClubPositionTrend jämför den
  // avslutade säsongen med föregående; sommarens AI-affärer bär nextSeason.
  if (boardAssessment) {
    const boardContextGame: SaveGame = {
      ...seasonEndGameView,
      seasonSummaries: [...(game.seasonSummaries ?? []), seasonSummary],
      aiTransferLog: nextAiTransferLog,
    }
    const context = deriveBoardLeagueContext(boardContextGame, nextSeason, boardAssessment.direction)
    boardAssessment = {
      ...boardAssessment,
      leagueMovements: context.movements.length > 0 ? context.movements : undefined,
      reasonSource: boardAssessment.direction === 'unchanged' ? undefined : context.reasonSource,
      reasonLine: selectBoardReasonLine(boardAssessment.direction, context.reasonSource),
    }
  }

  // Manager profile — career record, contract extension, age/seasonsAtClub tick
  let updatedManagerProfile = game.managerProfile
    ? (() => {
        const profile = game.managerProfile!
        // Count this season's results for managed club
        const managedFixtures = game.fixtures.filter(
          f => f.season === game.currentSeason &&
               (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
               f.homeScore !== undefined && f.awayScore !== undefined,
        )
        let sWins = 0, sDraws = 0, sLosses = 0
        for (const f of managedFixtures) {
          const utfall = deriveUtfall(f, game.managedClubId)
          if (utfall === 'vunnet') sWins++
          else if (utfall === 'forlorat') sLosses++
          else sDraws++
        }
        const CAREER_WIN_MILESTONES = [10, 25, 50, 100, 200]
        const SEASONS_MILESTONES = [3, 5, 10]
        const newTotalWins = profile.careerWins + sWins
        const newTotalSeasons = profile.seasonsAtClub + 1
        const crossedWinMilestone = CAREER_WIN_MILESTONES.find(
          m => profile.careerWins < m && newTotalWins >= m)
        const crossedSeasonsMilestone = SEASONS_MILESTONES.find(
          m => profile.seasonsAtClub < m && newTotalSeasons >= m)
        let updatedLog = profile.diary ?? []
        if (crossedWinMilestone) {
          updatedLog = [...updatedLog, {
            season: game.currentSeason, matchday: game.currentMatchday,
            type: 'milestone' as const,
            text: `${crossedWinMilestone} segrar i karriären. Du räknar dem inte, men någon annan gör det.`,
          }]
        } else if (crossedSeasonsMilestone) {
          updatedLog = [...updatedLog, {
            season: game.currentSeason, matchday: game.currentMatchday,
            type: 'milestone' as const,
            text: `${crossedSeasonsMilestone} säsonger i klubben. Du har blivit en del av inventarierna.`,
          }]
        }
        return {
          ...profile,
          age: profile.age + 1,
          seasonsAtClub: newTotalSeasons,
          careerWins: newTotalWins,
          careerDraws: profile.careerDraws + sDraws,
          careerLosses: profile.careerLosses + sLosses,
          diary: updatedLog,
        } as import('../../domain/entities/ManagerProfile').ManagerProfile
      })()
    : undefined

  let contractInboxItem: InboxItem | null = null
  if (updatedManagerProfile) {
    const contractSeed = (game.currentSeason * 7919 + 88003) | 0
    const { profile: contractedProfile, inboxText } = resolveContractExtension(updatedManagerProfile, game.currentSeason, contractSeed, getManagerDisplayName(game))
    updatedManagerProfile = contractedProfile
    if (inboxText) {
      contractInboxItem = {
        id: `contract_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.BoardFeedback,
        title: inboxText,
        body: '',
        isRead: false,
        createdMatchday: game.currentMatchday,
      }
    }
  }

  // 5.1 Sommaren — "aged": den äldsta spelaren kvar i den hanterade truppen
  // efter årets avhopp (retirement/kontraktsutgång redan filtrerade bort ur
  // playersAfterLicense) — INTE varje spelares födelsedag, en enda
  // representant för truppens veterannärvaro. Ingen kandidat om truppen
  // (orimligt) skulle vara tom.
  const agedCandidate = playersAfterLicense
    .filter(p => p.clubId === game.managedClubId)
    .reduce((oldest: typeof playersAfterLicense[number] | null, p) =>
      !oldest || p.age > oldest.age ? p : oldest, null)
  if (agedCandidate) {
    seasonTransitionEvents.push({ type: 'aged', playerId: agedCandidate.id, playerLastName: agedCandidate.lastName, age: agedCandidate.age })
  }

  // 5.1 Sommaren — utbrändhetens återhämtning vid övergången (Jacobs DOM,
  // 2026-08-18): hälften av avståndet ner till 30, aldrig under 30. Sker
  // HÄR, inte vid säsongsslutets vanliga per-omgångsuppdatering (updateManagerBurnout,
  // managerProfileService.ts) — en engångshändelse vid själva övergången.
  if (updatedManagerProfile) {
    updatedManagerProfile = {
      ...updatedManagerProfile,
      burnoutScore: applyBurnoutRecoveryAtTransition(updatedManagerProfile.burnoutScore),
    }
  }

  // MIGRATIONSPLAN_HANDELSELIGGAREN Fas 4 — beräknad EN gång så både
  // recentMoments (dual-write, oförändrad) och eventLedger (ny, durabel)
  // kan mata från samma lista.
  const seasonHighlightMoments: Moment[] = matchHighlight ? [{
    id: `moment_season_highlight_${game.currentSeason}`,
    source: 'season_highlight' as const,
    matchday: matchHighlight.matchday,
    season: game.currentSeason,
    title: `Säsongens match — ${matchHighlight.opponentName}`,
    body: matchHighlight.narrative,
    // Skärpning 4 (Code-fynd, 2026-09-02, flaggat) — matchHighlight.narrative
    // branchar på category (matchHighlightService.ts's buildMatchNarrative,
    // 7-vägs switch), inte fast prosa. Buret strukturerat för en branchad mall.
    matchCategory: matchHighlight.category,
  }] : []

  const updatedGame: SaveGame = {
    ...game,
    captainPlayerId: nextCaptainPlayerId,
    currentSeason: nextSeason,
    currentMatchday: 0,
    ...rolloverSeasonMatchdayAnchors(game),
    ...rolloverTransientEchoMatchdays(game),
    activeNationalTeamCamp: rolloverNationalTeamCamp(game.activeNationalTeamCamp, game.currentMatchday),
    burnoutTrainingSlowdownUntilRound: rebaseFutureMatchday(
      game.burnoutTrainingSlowdownUntilRound,
      game.currentMatchday,
    ),
    burnoutCeilingRecoveryUntilRound: rebaseFutureMatchday(
      game.burnoutCeilingRecoveryUntilRound,
      game.currentMatchday,
    ),
    riskySponsorContract: rolloverRiskySponsorContract(
      game.riskySponsorContract,
      game.currentMatchday,
      nextSeason,
    ),
    managedClubPeriodisationSince: rebaseFutureMatchday(
      game.managedClubPeriodisationSince,
      game.currentMatchday,
    ),
    playerConversations: rolloverPlayerConversations(game.playerConversations, game.currentMatchday),
    pendingFollowUps: rolloverFollowUps(game.pendingFollowUps, game.currentMatchday),
    leadershipActions: rolloverLeadershipActions(game.leadershipActions, game.currentMatchday),
    coffeeRoomPendingReturns: rolloverCoffeeRoomReturns(game.coffeeRoomPendingReturns, game.currentMatchday),
    currentDate: `${nextSeason}-10-01`,
    seasonCalendar: nextSeasonCalendar,
    clubs: clubsAfterLicense,
    players: rolloverPlayerInjuryRamp(playersAfterLicense, game.currentMatchday),
    // 5.1 Sommaren: ackumulerade akademiuppflyttningar under säsongen
    // (academyActions.ts) + retired/contractExpired/aged från denna körning.
    // Sommaren tömmer listan när den visas, inte denna funktion.
    pendingSeasonTransitionEvents: [...(game.pendingSeasonTransitionEvents ?? []), ...seasonTransitionEvents],
    // Förutsättningsfasen, steg 1: senaste säsongens bedömning, ren
    // visningsläsning i SeasonTransitionScene.tsx, ingen egen beräkning där.
    boardAssessment,
    fixtures: newFixtures,
    league: newLeague,
    standings: calculateStandings(updatedClubs.map(c => c.id), []),
    // 2026-07-19: fasmarkörer (PortalPhaseMark) är per säsong, inte per save —
    // nollställs här. Utan detta ser en spelare t.ex. annandagen en gång, aldrig igen.
    phaseMarksSeen: [],
    // A5 — Notisdiet: arkivera olästa från föregående säsong (markera som lästa).
    // Transferbudens deadlines arkiveras också: själva buden nollställs nedan,
    // så en levande expiresRound här hade blivit en föräldralös nästa-säsongspost.
    inbox: [
      ...archiveCompletedSeasonInbox(game.inbox),
      ...newInboxItems,
      ...retirementMessages,
      ...contractExpiryInbox,
      ...(contractInboxItem ? [contractInboxItem] : []),
    ].slice(-75),
    managerProfile: updatedManagerProfile,
    transferState: {
      ...game.transferState,
      freeAgents: [
        ...(game.transferState?.freeAgents ?? []).filter(p =>
          p.age < 37 &&
          game.currentSeason - (p.freeAgentSince ?? game.currentSeason) < 2
        ),
        ...playersAfterLicense
          .filter(p => contractExpiredIds.has(p.id))
          .map(p => ({ ...p, freeAgentSince: game.currentSeason })),
      ],
    },
    youthIntakeHistory: youthRecords,
    // A-M5: skriv rollover-posterna till den löpande financeLog:en (samma
    // appendFinanceLog/cap-vid-50 som roundProcessor.ts:1504-1507 använder
    // varje omgång) — annars härleder EkonomiTab/deriveKassaHistory fel
    // saldo för perioden mellan sista ligaomgången och säsong N+1 omg 1.
    // SKALA-BUGGEN steg B — både det befintliga loggets poster och de nya
    // offseason-posterna ovan (offseasonRound = game.currentMatchday) är
    // uttryckta på den GAMLA säsongens skala. Rebasa hela resultatet i ett
    // svep i stället för att göra det två gånger på olika ställen.
    financeLog: rolloverFinanceLog(
      offseasonFinanceLog.reduce(
        (log, entry) => appendFinanceLog(log, entry),
        game.financeLog ?? []
      ),
      game.currentMatchday,
    ),
    managedClubPendingLineup: undefined,
    matchWeathers: [],
    trainingHistory: [],
    playoffBracket: null,
    // A2 (2026-08-17): nollställs tillsammans med playoffBracket — nästa säsongs
    // elimineringsanslag (om det inträffar) sätter ett nytt värde i playoffProcessor.ts.
    lastPlayoffElimination: null,
    cupBracket: newCupBracket,
    // A1 (långspelsaudit, 10 säsonger, 2026-08-17): .slice(-5) kapade
    // karriärminnet — år 1-5 av 10 var borta, fem SM-guld stod kvar som
    // räknare men åren de vanns fanns inte. Bandy Manager är ett spel om
    // att minnas (Krönikan, årsdagarna, builtSeason) — en produkt som
    // raderar spelarens första fem år motsäger sin egen premiss.
    // Ingen kompaktering byggd: OrtenTab.tsx:573 länkar redan till
    // /game/season-summary/:season för VILKEN säsong som helst i historiken
    // (inte bara de senaste) och SeasonSummaryScreen läser hela SeasonSummary-
    // objektet (roundPoints, storyTriggers, topScorer, m.m.) — en separat
    // kompakt/detaljerad-uppdelning hade tystat den funktionen för äldre
    // säsonger utan att någon bett om det. Obegränsad array matchar både
    // ordern ("säsongsidentitet ska aldrig kastas, detaljdata är en
    // renderingsfråga") och den redan byggda funktionen exakt.
    seasonSummaries: [...(game.seasonSummaries ?? []), seasonSummary],
    // O3 — konsumerat ovan (personalGoal), nollställt här. Nästa Sommaren
    // (SeasonTransitionScene) skriver ett nytt activeSeasonGoal när spelaren väljer.
    activeSeasonGoal: undefined,
    pendingScreen: PendingScreen.SeasonSummary,
    // A-H2b: tom/undefined om inga krav kvalificerar — clearSeasonSummary
    // (gameFlowActions.ts) läser detta för att avgöra om ContractDemands-
    // steget ska visas mellan SeasonSummary och styrelsemötet.
    pendingContractDemands: contractDemands.length > 0 ? contractDemands : undefined,
    seasonStartSnapshot: managerFired ? game.seasonStartSnapshot : (() => {
      const managedClub = game.clubs.find(c => c.id === game.managedClubId)
      const standing = game.standings.find(s => s.clubId === game.managedClubId)
      const academyPromoCount = (game.youthIntakeHistory ?? []).filter(r =>
        r.season === game.currentSeason && r.clubId === game.managedClubId
      ).reduce((sum, r) => sum + r.playerIds.length, 0)
      return {
        season: game.currentSeason,
        finalPosition: standing?.position ?? 12,
        finances: managedClub?.finances ?? 0,
        communityStanding: game.communityStanding ?? 50,
        squadSize: game.players.filter(p => p.clubId === game.managedClubId).length,
        supporterMembers: game.supporterGroup?.members ?? 0,
        academyPromotions: academyPromoCount,
        era: game.currentEra ?? 'unknown',
      }
    })(),
    managerFired: managerFired ? true : undefined,
    // O13 (DOM_TRANARMARKNADEN_2026-08-26): `game.currentSeason` är säsongen
    // som just SPELATS KLART — updatedGame bär redan nextSeason. Uppehålls-
    // simuleringen behöver veta vilken av dem avskedet gällde, annars kan
    // den inte skilja "resten av säsongen återstår" (konkursvägen) från
    // "säsongen är redan spelad" (den här vägen).
    firedAtSeason: managerFired ? game.currentSeason : game.firedAtSeason,
    fanMood: licenseCheck.action?.type === 'license_denied'
      ? Math.max(0, (game.fanMood ?? 50) - 15)
      : game.fanMood,
    seasonStartFinances: updatedClubs.find(c => c.id === game.managedClubId)?.finances,
    // mostImproved-källan för nästa säsong fryses EFTER sommarens
    // pensioner, kontraktsutgångar, AI-transfers och truppkomplettering.
    // Den avslutade säsongens summary ovan har redan läst den gamla snapshotten.
    seasonStartSquadSnapshot: buildSeasonStartSquadSnapshot(
      playersAfterLicense,
      game.managedClubId,
      nextSeason,
    ),
    // A-H1: rullar fram den frusna förväntan till NÄSTA säsongs "säsongsstart"
    // — updatedClubs bär redan den stegade boardExpectation (rad ~379), så
    // detta är samma värde som clubsAfterLicense[managedClubId].boardExpectation
    // vid det här laget. Retrospektiva ytor (generateSeasonSummary m.fl. ovan)
    // har redan läst det GAMLA värdet via game.seasonStartBoardExpectation
    // innan denna skrivning sker.
    seasonStartBoardExpectation: updatedClubs.find(c => c.id === game.managedClubId)?.boardExpectation,
    // Framgångskurvan steg 3 fix (2026-08-28): nollställ investSurplus'
    // säsongsräknare vid rollover — en klubb som investerade hårt i säsong N
    // ska inte bära det över till säsong N+1's utvärdering. Se SaveGame.ts.
    seasonContractExtensionCount: 0,
    seasonNetTransferSpend: 0,
    scoutReports: Object.fromEntries(
      Object.entries(game.scoutReports ?? {})
        .filter(([, r]) => nextSeason - r.scoutedSeason < 2)
    ),
    activeScoutAssignment: null,
    scoutBudget: 10,
    transferBids: [],
    pendingEvents: seasonEndPendingEvents,
    // 2026-08-17: deferredDecisions (KF3-avbrottsbudgetens FIFO-kö i
    // roundProcessor.ts) rensades aldrig vid säsongsslut, till skillnad från
    // pendingEvents (wholesale-ersatt ovan). Verifierat i headless
    // simulering: events undanträngda av budgetcapet mitt i säsong N (t.ex.
    // sponsorerbjudanden, mecenatevent, ett kvarglömt playoff-"Fokusera"-kort)
    // låg kvar i kön oförändrade och surfade upp i portalen flera omgångar in
    // i säsong N+1 — daterade och kontextuellt fel. pendingEvents fick redan
    // samma typ av wholesale-clear vid rollover; deferredDecisions är samma
    // sorts i-flight beslutskö och ska rensas på samma sätt, inte selektivt.
    //
    // HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md, 2026-08-31): kön
    // töms fortfarande här — läckage-garantin ovan är oförändrad — men
    // besluten försvinner inte längre TYST. Passet nedan (efter det här
    // objektet, resolveDeferredAtRollover) kör resolve-or-expire över exakt
    // den här kön: default-utfall tillämpat + EN inboxrad, eller en
    // uttrycklig utrinning. Slutläget är identiskt ([]), spåret är nytt.
    deferredDecisions: [],
    handledContractPlayerIds: [],
    sponsors: sponsorsAfterLicense,
    opponentAnalyses: {},
    activeTalentSearch: null,
    talentSearchResults: game.talentSearchResults ?? [],
    boardPatience: newBoardPatience,
    consecutiveFailures: newConsecutiveFailures,
    meritBuffer: newMeritBuffer,
    rivalryHistory: game.rivalryHistory ?? {},
    clubLegends: newLegends,
    mecenater: ageMecenater((game.mecenater ?? []).map(m => m.isActive ? updateSilentShout(m) : m))
      .map(m => ({
        ...m,
        pendingDemand: rolloverPendingDemand(m.pendingDemand, game.currentMatchday),
      })),
    facilityState: rolloverFacilityState(game),
    activeArcs: rolloverActiveArcs(game.activeArcs, game.currentMatchday),
    storylines: seasonEndStorylines,
    boardObjectives: newSeasonObjectives,
    boardObjectiveHistory: [
      ...(game.boardObjectiveHistory ?? []),
      ...objectiveResults,
    ],
    trainerArc: checkSeasonEndArc(
      game.trainerArc ?? { current: 'newcomer', history: [], seasonCount: 0, bestFinish: 12, titlesWon: 0, consecutiveLosses: 0, consecutiveWins: 0, boardWarningGiven: false },
      game.playoffBracket?.champion === game.managedClubId,
      game.currentSeason
    ),
    trainingProjects: [],
    communityActivities: game.communityActivities
      ? { ...game.communityActivities, julmarknad: false }
      : game.communityActivities,
    youthTeam: (() => {
      const managedClub = updatedClubs.find(c => c.id === game.managedClubId) ?? game.clubs.find(c => c.id === game.managedClubId)!
      const nextAcademyLevel = (() => {
        if (game.academyUpgradeInProgress && game.academyUpgradeSeason === nextSeason) {
          return game.academyLevel === 'basic' ? 'developing' : 'elite'
        }
        return game.academyLevel ?? 'basic'
      })()
      // Carry over existing youth players (age them up, retain under-20s) rather than generating fresh
      if (game.youthTeam && game.youthTeam.players.length > 0) {
        const carried = carryOverYouthTeam(game.youthTeam, managedClub, nextAcademyLevel, nextSeason, baseSeed + 77777)
        return {
          ...carried,
          players: rolloverYouthAvailability(carried.players, game.currentMatchday),
        }
      }
      return generateYouthTeam(managedClub, nextAcademyLevel, nextSeason, baseSeed + 77777)
    })(),
    academyLevel: (() => {
      // If upgrade was scheduled for this season, apply it
      if (game.academyUpgradeInProgress && game.academyUpgradeSeason === nextSeason) {
        return game.academyLevel === 'basic' ? 'developing' : 'elite'
      }
      return game.academyLevel ?? 'basic'
    })(),
    academyUpgradeInProgress: game.academyUpgradeSeason === nextSeason ? false : game.academyUpgradeInProgress,
    academyUpgradeSeason: game.academyUpgradeSeason === nextSeason ? undefined : game.academyUpgradeSeason,
    mentorships: [],
    mentorshipHistory: (() => {
      // Close open records: graduated = youth player now in main players array
      const mainPlayerIds = new Set(game.players.map(p => p.id))
      return (game.mentorshipHistory ?? []).map(r =>
        !r.endSeason && mainPlayerIds.has(r.youthPlayerId)
          ? { ...r, endSeason: game.currentSeason, outcome: 'graduated' as const }
          : r
      )
    })(),
    loanDeals: [],
    // V0.9 fields
    namedCharacters: updatedNamedCharacters,
    communityStanding: Math.min(100, newCommunityStanding + communityStandingDelta),
    journalistRelationship: newJournalistRelationship,
    journalist: game.journalist
      ? { ...game.journalist, relationship: newJournalistRelationship }
      : game.journalist,
    sponsorNetworkMood: game.sponsorNetworkMood ?? 70,
    patron: updatedPatron
      ? {
          ...updatedPatron,
          pendingDemand: rolloverPendingDemand(updatedPatron.pendingDemand, game.currentMatchday),
        }
      : updatedPatron,
    localPolitician: nextPolitician
      ? {
          ...nextPolitician,
          kommunBidrag: nextPolitician
            ? calculateKommunBidrag(
                nextPolitician,
                clubsAfterLicense.find(c => c.id === game.managedClubId) ?? managedClubForLicense!,
                newCommunityStanding,
                { ...game, communityStanding: newCommunityStanding }
              )
            : (game.localPolitician?.kommunBidrag ?? 0),
        }
      : game.localPolitician,
    politicianLastInteraction: {},
    recentMoments: [...seasonHighlightMoments, ...(game.recentMoments ?? [])]
      .sort((a, b) => (b.season - a.season) || (b.matchday - a.matchday))
      .slice(0, 5),
    eventLedger: appendMomentsAndEntriesToLedger(game.eventLedger ?? [], seasonHighlightMoments, retirementLedgerEntries),
    nemesisTracker: updatedNemesisTracker,
    resolvedEventIds: [
      ...(game.resolvedEventIds ?? []),
      gravId,
      raddId,
    ].slice(-200),
    aiTransferLog: nextAiTransferLog,
    // DREAM-013: flag that a team photo should be generated for this season
    lastTeamPhotoSeason: game.currentSeason,
    // DREAM-016/DREAM-010: reset per-season trackers
    bandyLetterThisSeason: undefined,
    schoolAssignmentThisSeason: undefined,
    // DREAM-002: reset crisis state at season rollover if resolved
    economicCrisisState: rolloverEconomicCrisis(game.economicCrisisState, game.currentMatchday),
    // Reset per-season finance warning flag so new season can trigger fresh warnings
    financeWarningGivenThisSeason: false,
    // Lager 3: Licensnämnden
    licenseStatus: newLicenseStatus,
    licenseRiskScore: newLicenseRiskScore,
    // pendingPointDeductions from this season → pointDeductions for next season
    pointDeductions: game.pendingPointDeductions ?? {},
    // pendingPointDeductions for next season: merge scandal-accumulated + license-generated
    pendingPointDeductions: (() => {
      const merged: Record<string, number> = {}
      for (const [id, pts] of Object.entries(licensePendingDeductions)) {
        merged[id] = (merged[id] ?? 0) + pts
      }
      return Object.keys(merged).length > 0 ? merged : undefined
    })(),
    // Säsongssignatur: ny för kommande säsong. Historik för den avslutade
    // säsongen bärs redan av seasonSummaries[].signatureRubric (skriven
    // ovan/nedan via seasonSummaryService) — pastSeasonSignatures-fältet
    // (rå SeasonSignature-historik, aldrig läst i produktion) retirerat
    // LIGGARE-PRIO 4 (2026-09-03).
    currentSeasonSignature: (() => {
      const sigRand = mulberry32(nextSeason * 1337 + 99)
      // Build a minimal game context for next season signature
      const nextGameCtx = { ...game, currentSeason: nextSeason }
      return createSeasonSignature(nextGameCtx, sigRand)
    })(),
    shownSeasonSignatureRevealSeason: game.shownSeasonSignatureRevealSeason,
    // Reset per-season anslag (fas-overlay)
    seenAnslag: [],
    // Reset per-season scandal trackers
    activeScandals: [],
    scandalHistory: [...(game.scandalHistory ?? []), ...(game.activeScandals ?? [])],
    // Reset per-season lager 2 trackers
    wageBudgetOverrunRounds: 0,
    wageBudgetWarningSent: false,
    riskySponsorOfferSentThisSeason: undefined,
    // C-B3 — Pensionsval
    pendingRetirementDecision,
    lastRetirementSeason,
    // P1 — Annandagen val: nollställ per säsong
    annandagsValGjort: null,
    pendingAnnandagsVal: false,
    pendingAnnandagsGratisentreVal: false,
    pendingAnnandagsMediaRubrik: undefined,
    pendingAnnandagsKlack: undefined,
  }

  // ── HIGH 11: rollover — aldrig tyst ────────────────────────────────────
  // Domen (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md): den tidigare engros-
  // nollställningen av deferredDecisions är förbjuden. Kön töms fortfarande i
  // objektet ovan (samma läckage-garanti som 2026-08-17-fixen, skyddad av
  // seasonRolloverStaleEvents.test.ts), men varje post får först sitt utfall:
  // default-val tillämpat + EN inboxrad, eller en uttrycklig utrinning.
  // Körs MOT den rollade-över staten — effekterna landar i den säsong
  // spelaren faktiskt går in i, och inboxraden daterar sig därefter.
  const deferredAtRollover = game.deferredDecisions ?? []
  const rolloverResolution = deferredAtRollover.length > 0
    ? resolveDeferredAtRollover(updatedGame, deferredAtRollover, game.currentSeason, mulberry32(baseSeed + 4242))
    : null
  // Granskning innan commit (2026-08-31): `.slice(-75)` tog fel ände av en
  // osorterad array — roundProcessor.ts:s etablerade konvention (rad ~1099,
  // MAX_INBOX=50) sorterar NYAST-FÖRST (`b.date.localeCompare(a.date)`) och
  // tar sedan `slice(0, MAX_INBOX)`. En omvänd `.slice(-N)` på en osorterad
  // lista behåller de ÄLDSTA posterna och tappar de nyaste så fort listan
  // växer förbi N — ofarligt just nu (inbox ≤50 + högst 10 deferrade poster,
  // långt under 75) men fel om säsongsslutets egna dussintals inbox_*-
  // tillägg (kontrakt/pension/styrelse/kommun ovan i filen) någonsin växer
  // förbi gränsen utan att nästa omgångs roundProcessor-trim hunnit köra
  // först. Samma sortering+gräns som roundProcessor.ts, inte en ny konvention.
  const gameAfterDeferred: SaveGame = rolloverResolution
    ? {
        ...rolloverResolution.game,
        // resolveDeferredAtRollover rör aldrig kön själv — håll den tom.
        deferredDecisions: [],
        inbox: [...rolloverResolution.game.inbox, ...rolloverResolution.inboxItems]
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 50),
      }
    : updatedGame

  const gameWithStorylineLedger = appendNewlyResolvedStorylines(
    game,
    gameAfterDeferred,
    game.currentMatchday,
  )

  return {
    game: {
      ...gameWithStorylineLedger,
      allTimeRecords: updateAllTimeRecords(gameWithStorylineLedger, seasonSummary),
    },
    roundPlayed: null,
    seasonEnded: true,
  }
}

function updateAllTimeRecords(
  game: SaveGame,
  summary: ReturnType<typeof generateSeasonSummary>,
): AllTimeRecords {
  const prev = game.allTimeRecords ?? {
    mostGoalsSeason: null,
    mostAssistsSeason: null,
    highestRatingSeason: null,
    bestFinish: null,
    biggestWin: null,
    championSeasons: [],
    cupWinSeasons: [],
  }

  const season = summary.season

  let mostGoalsSeason = prev.mostGoalsSeason
  if (summary.topScorer && (!mostGoalsSeason || summary.topScorer.goals > mostGoalsSeason.goals)) {
    mostGoalsSeason = { playerName: summary.topScorer.name, goals: summary.topScorer.goals, season }
  }

  let mostAssistsSeason = prev.mostAssistsSeason
  if (summary.topAssister && (!mostAssistsSeason || summary.topAssister.assists > mostAssistsSeason.assists)) {
    mostAssistsSeason = { playerName: summary.topAssister.name, assists: summary.topAssister.assists, season }
  }

  let highestRatingSeason = prev.highestRatingSeason
  if (summary.topRated && (!highestRatingSeason || summary.topRated.avgRating > highestRatingSeason.rating)) {
    highestRatingSeason = { playerName: summary.topRated.name, rating: summary.topRated.avgRating, season }
  }

  let bestFinish = prev.bestFinish
  if (!bestFinish || summary.finalPosition < bestFinish.position) {
    bestFinish = { position: summary.finalPosition, season }
  }

  let biggestWin = prev.biggestWin
  if (summary.biggestWin) {
    const [homeGoals, awayGoals] = summary.biggestWin.score.split('–').map(Number)
    const margin = Math.abs((homeGoals ?? 0) - (awayGoals ?? 0))
    const prevMargin = biggestWin
      ? Math.abs((Number(biggestWin.score.split('–')[0]) || 0) - (Number(biggestWin.score.split('–')[1]) || 0))
      : -1
    if (margin > prevMargin) {
      biggestWin = { score: summary.biggestWin.score, opponent: summary.biggestWin.opponent, season, round: summary.biggestWin.round }
    }
  }

  const championSeasons = summary.playoffResult === 'champion'
    ? [...prev.championSeasons, season]
    : prev.championSeasons

  const cupWinSeasons = summary.cupResult === 'winner'
    ? [...(prev.cupWinSeasons ?? []), season]
    : (prev.cupWinSeasons ?? [])

  return { mostGoalsSeason, mostAssistsSeason, highestRatingSeason, bestFinish, biggestWin, championSeasons, cupWinSeasons }
}
