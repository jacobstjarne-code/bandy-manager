import type { SaveGame, InboxItem } from '../../domain/entities/SaveGame'
import { getEventPriority } from '../../domain/entities/GameEvent'
import type { Moment } from '../../domain/entities/Moment'
import type { Player } from '../../domain/entities/Player'
import type { Fixture } from '../../domain/entities/Fixture'
import type { MatchWeather } from '../../domain/entities/Weather'
import { FixtureStatus, InboxItemType, PendingScreen, PlayoffStatus } from '../../domain/enums'
import { getTacticModifiers } from '../../domain/services/tacticModifiers'
import { generateMatchWeather } from '../../domain/services/weatherService'
import { calculateStandings } from '../../domain/services/standingsService'
import { generateWeeklyDecision } from '../../domain/services/weeklyDecisionService'
import { mulberry32 } from '../../domain/utils/random'

import type { AdvanceResult } from './advanceTypes'
import { derivePreRoundContext } from './processors/preRoundContextProcessor'
import { applyPostRoundFlags } from './processors/postRoundFlagsProcessor'
import { applyRoundTraining } from './processors/trainingProcessor'
import { detectSceneTrigger } from '../../domain/services/sceneTriggerService'
import { applyPlayerStateUpdates } from './processors/playerStateProcessor'
import { updatePlayerMatchStats } from './processors/statsProcessor'
import { processPlayoffRound } from './processors/playoffProcessor'
import { isPlayoffNarrativeCardStillValid } from '../../domain/services/playoffNarrativeService'
import { processCupRound } from './processors/cupProcessor'
import { appendFinanceLog, applyFinanceChange } from '../../domain/services/economyService'
import { processEconomy } from './processors/economyProcessor'
import { applyCommunityConsequences, applyCommunityRoundResult, processCommunity } from './processors/communityProcessor'
import { processScouts } from './processors/scoutProcessor'
import { executeAcceptedTransfers, generateDeadlineDayBidInbox, processLoans, processTransferBids } from './processors/transferProcessor'
import { processSponsors, applyRiskySponsorMaturation } from './processors/sponsorProcessor'
import { checkContextualSponsors, applyOneTimeKommunstod } from '../../domain/services/contextualSponsorService'
import { calculateClubEra, eraLabel } from '../../domain/services/clubEraService'
import { simulateRound } from './processors/matchSimProcessor'
import { processYouth } from './processors/youthProcessor'
import { logNarrativeBeat, filterSystemhandelseBudget } from '../../domain/services/narrativeLogService'
import { appendMomentsAndEntriesToLedger } from '../../domain/services/momentLedgerService'
import {
  applySurfacingBudget,
  isExemptFromSurfacingBudget,
  recentlySurfaced,
  CHANNEL_BY_EVENT_TYPE,
  RECENCY_WINDOW_BY_CHANNEL,
} from '../../domain/services/narrativeCoordinatorService'
import { processNarrative, processPlayerArcs, processUpcomingDerbyNotification } from './processors/narrativeProcessor'
import { processCommunityStandingPress, processJournalistRelationshipRound, processMedia } from './processors/mediaProcessor'
import { processGameEvents, applyMecenatSpawn, applyMecenatCapEviction, processScandals, checkForPlayThroughInjuryOffer, maintainEventQueues, processBoardObjectiveCheckIn, processPatronCommunityEvents, processPendingFollowUps, processRoundMilestoneInbox } from './processors/eventProcessor'
import { applyCaptainMoraleCascade } from './processors/playerStateProcessor'
import { applyRipples, mergeRippleDeltas, describeRippleChain, rippleChainSignificance } from '../../domain/services/rippleEffectService'
import { buildSystemRippleLedgerEntry } from '../../domain/services/orsakVerkanService'
import { applyMatchInjury, generateInjuryInboxItem } from '../../domain/services/matchInjuryService'
import { generatePostMatchEvents } from '../../domain/services/postMatchEventService'
import { checkSeasonGoalHalfwayEvent } from '../../domain/services/seasonGoalService'
import { decrementCooldowns } from '../../domain/services/sourceCooldownService'
import { buildCommunityShiftLedgerEntry, detectCommunityShiftDirection } from '../../domain/services/clubHistoryLedgerService'
import { appendNewlyResolvedStorylines } from '../../domain/services/storylineLedgerService'
import { recordPressLedgerQuestionShown } from '../../domain/services/pressConferenceService'
import {
  ensureManagerChoiceLog,
  processUpcomingFixtureInbox,
  stripCompletedFixture,
} from './processors/fixtureProcessor'
import { processManagedDevelopment } from './processors/developmentProcessor'
import { processNationalTeamRound } from './processors/nationalTeamProcessor'
import { processRoundNotifications } from './processors/notificationProcessor'
import { processManagedMatchOutcome } from './processors/matchOutcomeProcessor'
import { processMarketValues } from './processors/marketValueProcessor'
import { processTrainerState } from './processors/trainerProcessor'
import { processManagerRoundState } from './processors/managerRoundProcessor'
import { finalizeInboxDelivery } from '../../domain/services/inboxDeliveryService'

export type { AdvanceResult }

export function advanceToNextEvent(game: SaveGame, seed?: number): AdvanceResult {
  const preRound = derivePreRoundContext(game, seed)
  if (preRound.kind === 'earlyReturn') return preRound.result
  const {
    nextMatchday,
    roundFixtures,
    currentLeagueRound,
    isCupRound,
    isPlayoffRound,
    isSecondPassForManagedMatch,
    baseSeed,
  } = preRound.context

  const localRand = mulberry32(baseSeed + 9999)

  // Collect player IDs who played in this round (for fitness updates)
  const startersThisRound = new Set<string>()
  const benchThisRound = new Set<string>()
  // Regen players created this round (for AI squads short on players) — persisted to game state
  const allRoundRegenPlayers: Player[] = []

  const simulatedFixtures: Fixture[] = []
  const roundMatchWeathers: MatchWeather[] = []
  const newInboxItems: InboxItem[] = []
  const newMoments: Moment[] = []

  // Detect if there is a pending (unplayed) cup match for the managed club this round
  let hasManagedCupPending = false

  // ── Apply training for all clubs this round ────────────────────────────
  const trainingResult = applyRoundTraining(game, baseSeed, currentLeagueRound, nextMatchday, { skipSideEffects: isSecondPassForManagedMatch })
  let trainingPlayers = trainingResult.players
  const updatedTrainingHistory = trainingResult.trainingHistory
  newInboxItems.push(...trainingResult.inboxItems)

  const simResult = simulateRound(game, roundFixtures, nextMatchday, baseSeed, localRand, isPlayoffRound)
  simulatedFixtures.push(...simResult.simulatedFixtures)
  for (const id of simResult.startersThisRound) startersThisRound.add(id)
  for (const id of simResult.benchThisRound) benchThisRound.add(id)
  allRoundRegenPlayers.push(...simResult.allRoundRegenPlayers)
  roundMatchWeathers.push(...simResult.roundMatchWeathers)
  hasManagedCupPending = simResult.hasManagedCupPending
  newInboxItems.push(...simResult.inboxItems)

  // Build updated fixtures list (mutable for cancelling decided series)
  const simulatedIds = new Set(simulatedFixtures.map(f => f.id))
  let allFixtures: Fixture[] = game.fixtures.map(f =>
    simulatedIds.has(f.id) ? (simulatedFixtures.find(sf => sf.id === f.id) ?? f) : f,
  )

  // Update standings — exclude cup fixtures so they don't inflate played/goal counts
  const completedFixtures = allFixtures.filter(f => f.status === FixtureStatus.Completed && !f.isCup && !f.isKnockout)
  const standings = calculateStandings(game.league.teamIds, completedFixtures, game.pointDeductions)

  // Snapshot injury state before updates (for recovery notifications)
  const injuredBeforeRound = new Set(
    trainingPlayers.filter(p => p.isInjured && p.clubId === game.managedClubId).map(p => p.id)
  )

  const managedClubForTactic = game.clubs.find(c => c.id === game.managedClubId)
  const managedTacticMods = managedClubForTactic
    ? getTacticModifiers(managedClubForTactic.activeTactic)
    : null

  const managedFixtureInRound = simulatedFixtures.find(
    f => (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
         f.status === FixtureStatus.Completed
  )
  const managedFixtureWeather = managedFixtureInRound
    ? roundMatchWeathers.find(mw => mw.fixtureId === managedFixtureInRound.id)?.weather
    : undefined

  // Player fitness / form / sharpness updates (start from training-updated players)
  const playerStateResult = applyPlayerStateUpdates(
    trainingPlayers,
    startersThisRound,
    benchThisRound,
    game,
    managedTacticMods,
    managedFixtureWeather,
    managedClubForTactic,
    baseSeed,
    nextMatchday,
    simulatedFixtures,
  )
  const updatedPlayers = playerStateResult.updatedPlayers
  const newlyInjured = playerStateResult.newlyInjured
  const newlySuspended = playerStateResult.newlySuspended
  const playThroughResolutions = playerStateResult.playThroughResolutions
  let finalPlayers = updatedPlayers

  // Apply match injuries from matchSimProcessor (post-match batch injury checks)
  if (simResult.injuredPlayers.length > 0) {
    for (const { player, event } of simResult.injuredPlayers) {
      const playerInFinal = finalPlayers.find(p => p.id === player.id)
      if (!playerInFinal || playerInFinal.isInjured) continue
      const injuredPlayer = applyMatchInjury(playerInFinal, event)
      finalPlayers = finalPlayers.map(p => p.id === injuredPlayer.id ? injuredPlayer : p)
      // Only generate inbox for managed club players with ≥1 week out
      if (player.clubId === game.managedClubId && event.weeksOut >= 1) {
        newInboxItems.push(generateInjuryInboxItem(player, event, game.currentSeason, nextMatchday, game.doctor))
      }
    }
  }

  // Update seasonStats and careerStats for all players in completed fixtures this round
  // Also detect career milestones for managed club players
  const statsResult = updatePlayerMatchStats(finalPlayers, simulatedFixtures, game, nextMatchday)
  finalPlayers = statsResult.finalPlayers
  const milestoneInboxItems = statsResult.milestoneInboxItems
  const playerMilestoneLedgerEntries = statsResult.ledgerEntries

  // Push milestone inbox items
  newInboxItems.push(...milestoneInboxItems)

  // ── WEAK-006/DEV-009: Captain morale cascade ──────────────────────────────
  {
    const cascadeResult = applyCaptainMoraleCascade(finalPlayers, game, nextMatchday, newInboxItems)
    finalPlayers = cascadeResult.updatedPlayers
    if (cascadeResult.captainCrisisMoment) newMoments.push(cascadeResult.captainCrisisMoment)
  }

  // ── Per-round development for managed club players ────────────────────────
  const developmentResult = processManagedDevelopment(game, finalPlayers, simulatedFixtures, nextMatchday)
  finalPlayers = developmentResult.players
  const updatedChemistryStats = developmentResult.chemistryStats

  // A1 — Notisdiet: egna matchresultat skapas INTE i inkorgen.
  // Spelaren har just upplevt matchen och ser allt i Granska.

  const notificationResult = processRoundNotifications({
    game,
    updatedPlayers,
    injuredBeforeRound,
    newlyInjured,
    newlySuspended,
    playThroughResolutions,
    nextMatchday,
    initialLedgerEntries: playerMilestoneLedgerEntries,
  })
  let gameAfterRipples = notificationResult.gameAfterRipples
  const roundRippleChains = notificationResult.rippleChains
  const roundLedgerEntries = notificationResult.ledgerEntries
  newInboxItems.push(...notificationResult.inboxItems)
  newMoments.push(...notificationResult.moments)

  newInboxItems.push(...processRoundMilestoneInbox(
    game,
    standings,
    allFixtures,
    currentLeagueRound,
    isCupRound,
    isPlayoffRound,
  ))

  // ── C-K1: Landslagsuttagning, snub och återkomst ──────────────────────
  const nationalTeamResult = processNationalTeamRound(
    game,
    finalPlayers,
    nextMatchday,
    isCupRound,
    isPlayoffRound,
  )
  finalPlayers = nationalTeamResult.players
  newInboxItems.push(...nationalTeamResult.inboxItems)
  roundLedgerEntries.push(...nationalTeamResult.ledgerEntries)
  const nationalTeamCampState = nationalTeamResult.activeCamp
  const nationalTeamSnub = nationalTeamResult.lastSnub
  const nationalTeamCallupBonusTkr = nationalTeamResult.callupBonusTkr
  const nationalTeamCallupModal = nationalTeamResult.pendingCallupModal
  const nationalTeamReturnLine = nationalTeamResult.pendingReturn
  const nationalTeamReturnExpiresState = nationalTeamResult.returnExpires

  // Release-svepet 2026-07-21 (Block 3c) — hallprövningens resolution-eko.
  // Satt av eventResolver.ts (spelaraktion, inte rundtakt) — samma expiry-
  // klarering här som nationalTeamReturnLine ovan, eftersom det bara är
  // roundProcessor som tickar varje omgång.
  let hallEchoLine = game.pendingHallEcho
  let hallEchoExpiresState = game.hallEchoExpires
  if (hallEchoLine && nextMatchday > (hallEchoExpiresState ?? 0)) {
    hallEchoLine = undefined
    hallEchoExpiresState = undefined
  }

  // ── Process active scout assignment + talent search ───────────────────
  const scoutResult = processScouts(game, finalPlayers, nextMatchday, baseSeed, localRand)
  newInboxItems.push(...scoutResult.inboxItems)
  const updatedScoutReports = { ...scoutResult.updatedScoutReports }
  const updatedScoutAssignment = scoutResult.updatedScoutAssignment
  const updatedTalentSearch = scoutResult.updatedTalentSearch
  const updatedTalentResults = scoutResult.updatedTalentResults

  // Date from stored seasonCalendar — single source of truth, no on-demand recalculation
  const storedCalendar = game.seasonCalendar ?? []
  const calendarSlot = storedCalendar.find(s => s.matchday === nextMatchday)
  // Fallback: look for the date on the next fixture itself (stamped at creation)
  const nextFixtureForDate = roundFixtures[0]
  const newDate = calendarSlot?.date ?? nextFixtureForDate?.date ?? game.currentDate

  // Both snabbsim and live fixtures land in simulatedFixtures:
  //   snabbsim — added by simulateMatch at line 403 of matchSimProcessor
  //   live     — already Completed before advance(); pushed unchanged at line 197-198 of matchSimProcessor
  // matchday === nextMatchday is the correct discriminator for both paths.
  let justCompletedManagedFixture = simulatedFixtures.find(
    f => (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
         f.status === FixtureStatus.Completed &&
         f.matchday === nextMatchday
  )

  // D1: snabbsim-vägen har inget T3-block (saveLiveMatchResult körs ej). Bygg managerChoiceLog här
  // om det saknas — kapten + started_tired + bench_fit. Halvtid utgår (matchen spelades ej live).
  if (justCompletedManagedFixture) {
    const enriched = ensureManagerChoiceLog(justCompletedManagedFixture, game)
    if (enriched !== justCompletedManagedFixture) {
      justCompletedManagedFixture = enriched
      allFixtures = allFixtures.map(f => f.id === enriched.id ? enriched : f)
    }
  }

  const matchOutcomeResult = processManagedMatchOutcome(
    game,
    justCompletedManagedFixture,
    simulatedFixtures,
    gameAfterRipples,
    nextMatchday,
    allFixtures,
  )
  gameAfterRipples = matchOutcomeResult.gameAfterRipples
  roundRippleChains.push(...matchOutcomeResult.rippleChains)
  roundLedgerEntries.push(...matchOutcomeResult.ledgerEntries)
  newMoments.push(...matchOutcomeResult.moments)
  const updatedKlackEcho = matchOutcomeResult.klackEcho
  const newKlackEchoType = matchOutcomeResult.newKlackEchoType

  // ── Narrative: fan mood, victory echo, rivalry, nemesis ─────────────────
  const narrativeResult = processNarrative(
    game,
    justCompletedManagedFixture ?? null,
    nextMatchday,
    newDate,
    localRand,
  )
  let newFanMood = narrativeResult.fanMood
  const updatedSupporterGroup = narrativeResult.supporterGroup
  const pendingVictoryEcho = narrativeResult.pendingVictoryEcho
  const victoryEchoExpires = narrativeResult.victoryEchoExpires
  const updatedRivalryHistory = narrativeResult.rivalryHistory
  let updatedNemesisTracker = narrativeResult.nemesisTracker ?? {}
  newInboxItems.push(...narrativeResult.inboxItems)

  // Track which fixtures were already completed before this round (for dedup in processors)
  const fixturesCompletedBeforeRound = new Set(
    game.fixtures.filter(f => f.status === FixtureStatus.Completed).map(f => f.id)
  )

  // ── Update playoff bracket if active ─────────────────────────────────
  // All fixtures completed this round (incl. live-played) — for advancement/elimination messages
  const completedThisRound = simulatedFixtures.filter(f => f.status === FixtureStatus.Completed)

  const playoffResult = processPlayoffRound(
    game,
    simulatedFixtures,
    allFixtures,
    fixturesCompletedBeforeRound,
    completedThisRound,
  )
  const updatedBracket = playoffResult.updatedBracket
  const bracketNewFixtures = playoffResult.bracketNewFixtures
  const playoffCsBoost = playoffResult.playoffCsBoost
  const triggerQFSummary = playoffResult.triggerQFSummary
  newInboxItems.push(...playoffResult.inboxItems)
  // A2 (2026-08-17): only overwritten in the round the managed club is eliminated
  // — otherwise carries forward, same accumulator pattern as lastRivalSaleInfo above.
  const lastPlayoffElimination = playoffResult.lastPlayoffElimination ?? game.lastPlayoffElimination ?? null
  // playoff narrative events collected here, pushed to allNewEvents after it's declared below

  // Apply playoff fixture cancellations to allFixtures
  if (playoffResult.cancelledFixtureIds.length > 0) {
    const cancelledSet = new Set(playoffResult.cancelledFixtureIds)
    allFixtures = allFixtures.map(f =>
      cancelledSet.has(f.id) ? { ...f, status: FixtureStatus.Postponed } : f
    )
  }

  // ── Update cup bracket if active ─────────────────────────────────────
  const cupResult = processCupRound(
    game,
    simulatedFixtures,
    fixturesCompletedBeforeRound,
    game.currentDate,
  )
  const updatedCupBracket = cupResult.updatedCupBracket
  const cupNewFixtures = cupResult.cupNewFixtures
  newInboxItems.push(...cupResult.cupInboxItems)

  // Merge new playoff fixtures and cup fixtures (dedup by id to prevent double-add)
  const finalAllFixtures = [...new Map(
    [...allFixtures, ...bracketNewFixtures, ...cupNewFixtures].map(f => [f.id, f])
  ).values()]

  // Derby notification: if next matchday has a derby for managed club
  newInboxItems.push(...processUpcomingDerbyNotification(finalAllFixtures, game))

  const upcomingFixtureResult = processUpcomingFixtureInbox(finalAllFixtures, game, nextMatchday)
  newInboxItems.push(...upcomingFixtureResult.inboxItems)
  const pendingAnnandagsVal = upcomingFixtureResult.pendingAnnandagsVal
  const upcomingManagedFix = upcomingFixtureResult.upcomingManagedFixture

  newInboxItems.push(...generateDeadlineDayBidInbox(game, upcomingManagedFix, nextMatchday, localRand))

  const marketValueResult = processMarketValues(game, finalPlayers, nextMatchday)
  const availabilityUpdatedPlayers = marketValueResult.players
  const newPrevValues = marketValueResult.previousMarketValues
  const marketValueInbox = marketValueResult.inboxItems

  const trainerState = processTrainerState(game, availabilityUpdatedPlayers, finalAllFixtures, standings)

  // ── Board objectives check-in (round 7, 14, 22) ──────────────────────
  const leagueRound = currentLeagueRound ?? 0
  const boardObjectiveResult = processBoardObjectiveCheckIn(
    game,
    availabilityUpdatedPlayers,
    finalAllFixtures,
    standings,
    leagueRound,
  )
  const updatedBoardObjectives = boardObjectiveResult.objectives
  const boardObjSponsorDelta = boardObjectiveResult.sponsorNetworkMoodDelta
  const boardObjTrustDelta = boardObjectiveResult.boardTrustDelta
  const boardObjForetroendepott = boardObjectiveResult.foretroendepottAmount
  newInboxItems.push(...boardObjectiveResult.inboxItems)

  // ── Economy: wages, match revenue, sponsorship per round ─────────────────
  const economyResult = processEconomy(
    game,
    simulatedFixtures,
    availabilityUpdatedPlayers,
    game.fanMood ?? 50,
    standings,
    nextMatchday,
    cupResult.prizeMoneyByClub,
    localRand,
    {
      scope: hasManagedCupPending
        ? 'ai-only'
        : isSecondPassForManagedMatch
          ? 'managed-only'
          : 'all',
    },
  )
  const { roundFinanceLog, updatedClubs: socialMediaBoostedClubs, clearAnnandagsGratisentreVal } = economyResult

  // ── Transfer bids ────────────────────────────────────────────────────────
  const transferResult = processTransferBids(game, availabilityUpdatedPlayers, nextMatchday, newDate, localRand)
  newInboxItems.push(...transferResult.inboxItems)
  roundLedgerEntries.push(...transferResult.ledgerEntries)
  const { resolvedBids, newBids, allBids } = transferResult

  // Partially updated game state for event generation
  const preEventGame: SaveGame = {
    ...game,
    players: availabilityUpdatedPlayers,
    transferBids: resolvedBids,
  }

  // ── Events: post-advance, finance warning, economic stress, mecenat ────────
  // WEAK-002 + DEV-002: press event goes to pendingPressConference (shown directly in GranskaScreen)
  // — NOT pushed to allNewEvents to avoid appearing in the general event queue
  const eventResult = processGameEvents(
    preEventGame,
    newBids,
    justCompletedManagedFixture,
    nextMatchday,
    localRand,
  )
  const allNewEvents = [...eventResult.gameEvents, ...playoffResult.gameEvents]
  // O3 — halvtidsraden måste läsa samma omgångs färdigspelade fixtures,
  // tabell, spelarstatistik och globala matchday. eventProcessor körde den
  // tidigare mot pre-round-snapshotten och kunde därför visa gårdagens facit.
  const seasonGoalHalfwayEvent = checkSeasonGoalHalfwayEvent({
    ...preEventGame,
    fixtures: finalAllFixtures,
    standings,
    currentMatchday: nextMatchday,
  })
  if (seasonGoalHalfwayEvent) allNewEvents.push(seasonGoalHalfwayEvent)
  let updatedMecenater = eventResult.updatedMecenater
  let updatedPatron = eventResult.updatedPatron
  let mecenatWithdrawnSeason = eventResult.mecenatWithdrawnSeason
  newInboxItems.push(...eventResult.inboxItems)
  // liggare-k5 (2026-09-03): kravsuppföljningens patron_withdrawal nådde
  // aldrig liggaren — bara eventResolver-vägen (spelarinitierad) gjorde det.
  if (eventResult.patronLedgerEntry) roundLedgerEntries.push(eventResult.patronLedgerEntry)

  // Legibel konsekvens: mecenat_left ripple (VILANDE i eventProcessor, wiras här)
  //
  // MIGRATIONSPLAN_HANDELSELIGGAREN Fas 4+ (2026-09-02) — tredje och sista
  // systemtriggern migrerad (mecenat_withdrawal, Narrative.ts). subject =
  // mecenaten (id finns redan här), ingen madeByPlayer (systemhändelse).
  const previousActiveIds = new Set((game.mecenater ?? []).filter(m => m.isActive).map(m => m.id))
  for (const m of updatedMecenater) {
    if (!m.isActive && previousActiveIds.has(m.id)) {
      const beforeMecRipple = gameAfterRipples
      gameAfterRipples = applyRipples(gameAfterRipples, { type: 'mecenat_left', mecenatId: m.id })
      const mecenatChain = describeRippleChain(beforeMecRipple, gameAfterRipples, 'mecenat_left',
        m.name, nextMatchday, game.currentSeason)
      roundRippleChains.push(mecenatChain)
      const mecenatLedgerEntry = buildSystemRippleLedgerEntry(mecenatChain, 'mecenat_withdrawal', { kind: 'mecenat', id: m.id })
      if (mecenatLedgerEntry) roundLedgerEntries.push(mecenatLedgerEntry)
    }
  }

  // O1-uppföljning (2026-08-22): risky sponsor-maturationens check+konsekvens
  // flyttad till EN plats, efter `updatedGame` finns — se kommentaren där.
  // Låg tidigare här (före sponsors/clubs var färdigmonterade) med en
  // kommentar som LOVADE att sponsorn togs bort och pengar krävdes tillbaka
  // "i SaveGame-monteringen nedan" — ingen sådan kod fanns någonsin.

  // ── Youth processing (P19 sim, mentor effects, academy events, rep delta) ─
  const youthResult = processYouth(game, availabilityUpdatedPlayers, nextMatchday, newDate, baseSeed, localRand)
  newInboxItems.push(...youthResult.inboxItems)
  const updatedYouthTeam = youthResult.updatedYouthTeam
  const academyReputationDelta = youthResult.academyReputationDelta

  // ── Loan deal processing ─────────────────────────────────────────────────
  const loanResult = processLoans(game, availabilityUpdatedPlayers, socialMediaBoostedClubs, nextMatchday, newDate, localRand)
  newInboxItems.push(...loanResult.inboxItems)
  roundLedgerEntries.push(...loanResult.ledgerEntries)
  const loanUpdatedPlayers = loanResult.loanUpdatedPlayers
  const managedClubAfterLoan = loanResult.updatedClubs
  const updatedLoanDeals = loanResult.updatedLoanDeals

  // ── Academy events (from youthResult) ───────────────────────────────────
  allNewEvents.push(...youthResult.gameEvents)

  const academyUpdatedClubs = academyReputationDelta > 0
    ? managedClubAfterLoan.map(c =>
        c.id === game.managedClubId
          ? { ...c, academyReputation: Math.min(100, (c.academyReputation ?? 50) + academyReputationDelta) }
          : c
      )
    : managedClubAfterLoan

  // ── Media: headlines, journalist, rumors, milestones, deadline ──────────
  const mediaResult = processMedia(
    preEventGame,
    simulatedFixtures,
    justCompletedManagedFixture ?? null,
    nextMatchday,
    currentLeagueRound,
    newDate,
    localRand,
    { skipSideEffects: isSecondPassForManagedMatch, hasPressConference: simResult.pressEvent !== null },
  )
  // A3 — Notisdiet: max ett pressklipp per omgång. Håll det högst prioriterade (managed-subject > övriga).
  const mediaInbox = mediaResult.inboxItems
  const pressTypes = new Set([InboxItemType.Media, InboxItemType.MediaEvent])
  const pressItems = mediaInbox.filter(i => pressTypes.has(i.type))
  const nonPressItems = mediaInbox.filter(i => !pressTypes.has(i.type))
  const cappedPress = pressItems.length > 0 ? [pressItems[0]] : []
  newInboxItems.push(...nonPressItems, ...cappedPress)
  const rumorScoutReports = { ...game.scoutReports, ...mediaResult.scoutReportUpdates }
  const reputationResolvedIds = mediaResult.resolvedEventIds
  // Apply reputation delta from milestones
  if (mediaResult.reputationDelta !== 0) {
    const managedIdx = academyUpdatedClubs.findIndex(c => c.id === game.managedClubId)
    if (managedIdx >= 0) {
      academyUpdatedClubs[managedIdx] = {
        ...academyUpdatedClubs[managedIdx],
        reputation: Math.max(0, Math.min(100, (academyUpdatedClubs[managedIdx].reputation ?? 50) + mediaResult.reputationDelta)),
      }
    }
  }

  const MAX_TRAINING_HISTORY = 22
  const trimmedTrainingHistory = updatedTrainingHistory.slice(-MAX_TRAINING_HISTORY)

  const activeFixtureIds = new Set(finalAllFixtures
    .filter(f => f.status === FixtureStatus.Scheduled)
    .map(f => f.id))
  const trimmedWeathers = [...(game.matchWeathers ?? []), ...roundMatchWeathers]
    .filter(mw => activeFixtureIds.has(mw.fixtureId))

  const trimmedBids = allBids.filter(b =>
    b.status === 'pending' || (nextMatchday - b.createdRound) < 5
  )

  const managedFixtureId = justCompletedManagedFixture?.id
  const strippedFixtures = finalAllFixtures.map(f => stripCompletedFixture(f, managedFixtureId, game.managedClubId))

  // ── Sponsor chain effects, patron inbox, nudges ──────────────────────────
  const sponsorResult = processSponsors(
    game,
    justCompletedManagedFixture ?? null,
    finalPlayers,
    nextMatchday,
    newDate,
    baseSeed,
    localRand,
    { skipSideEffects: isSecondPassForManagedMatch },
  )
  newInboxItems.push(...sponsorResult.inboxItems)
  allNewEvents.push(...sponsorResult.jobLossEvents)
  let updatedSponsors = sponsorResult.updatedSponsors

  // M13: contextual sponsors (top4, CS>70, attendance>1000)
  const contextualResult = checkContextualSponsors(
    { ...game, sponsors: updatedSponsors },
    standings,
    nextMatchday,
    { skipSideEffects: isSecondPassForManagedMatch },
  )
  if (contextualResult.newSponsors.length > 0) {
    updatedSponsors = [...updatedSponsors, ...contextualResult.newSponsors]
    newMoments.push(...contextualResult.newMoments)
  }
  // Apply one-time kommunstöd payment if triggered (tak 80k, kontinuerlig CS-skala)
  let kommunstodBonus = 0
  let kommunstodPaidSeason = game.kommunstodPaidSeason
  const kommunResult = applyOneTimeKommunstod({ ...game, sponsors: updatedSponsors }, { skipSideEffects: isSecondPassForManagedMatch })
  if (kommunResult.paid) {
    updatedSponsors = kommunResult.updatedGame.sponsors ?? updatedSponsors
    kommunstodBonus = kommunResult.amount
    kommunstodPaidSeason = kommunResult.updatedGame.kommunstodPaidSeason
    // financelog-gap-diagnos-2026-09-01.ts (Jacobs körorder 2026-09-01): denna
    // utbetalningen mutade tidigare club.finances utan en enda financeLog-post
    // — en av flera källor till en ~150-220k/säsong ospårad differens.
    roundFinanceLog.push({
      round: nextMatchday,
      amount: kommunstodBonus,
      reason: 'kommunstod',
      label: 'Kommunstöd (engångsbidrag)',
    })
  }

  // Persist regen players created this round: add to player list + club squads
  let loanAndRegenPlayers = loanUpdatedPlayers
  let regenUpdatedClubs = academyUpdatedClubs
  if (allRoundRegenPlayers.length > 0) {
    const existingIds = new Set(loanAndRegenPlayers.map(p => p.id))
    const newRegens = allRoundRegenPlayers.filter(r => !existingIds.has(r.id))
    loanAndRegenPlayers = [...loanAndRegenPlayers, ...newRegens]
    // Add regen IDs to their clubs' squadPlayerIds
    regenUpdatedClubs = regenUpdatedClubs.map(c => {
      const clubRegens = newRegens.filter(r => r.clubId === c.id).map(r => r.id)
      if (clubRegens.length === 0) return c
      const existing = new Set(c.squadPlayerIds)
      const toAdd = clubRegens.filter(id => !existing.has(id))
      return toAdd.length > 0 ? { ...c, squadPlayerIds: [...c.squadPlayerIds, ...toAdd] } : c
    })
  }

  // Apply accepted transfer bids to final player/club state
  const prevBids = game.transferBids ?? []
  const transferExecResult = executeAcceptedTransfers({
    game,
    preEventGame,
    players: loanAndRegenPlayers,
    clubs: regenUpdatedClubs,
    resolvedBids,
    prevBids,
    nemesisTracker: updatedNemesisTracker,
    nextMatchday,
  })
  let postTransferPlayers = transferExecResult.players
  let postTransferClubs = transferExecResult.clubs
  updatedNemesisTracker = transferExecResult.nemesisTracker
  let sponsorNetworkMoodDelta = transferExecResult.sponsorNetworkMoodDelta
  // Drift sponsorNetworkMood toward 50 (3%/round) — speglar FANMOOD_DRIFT i narrativeProcessor
  sponsorNetworkMoodDelta += (50 - (game.sponsorNetworkMood ?? 50)) * 0.03
  // Board objective deltas (only non-zero at rounds 7, 14, 22)
  sponsorNetworkMoodDelta += boardObjSponsorDelta
  newMoments.push(...transferExecResult.moments)
  roundLedgerEntries.push(...transferExecResult.ledgerEntries)

  // C-T1/T9 — Transfer consequence fan mood deltas
  let lastRivalSaleMatchday = game.lastRivalSaleMatchday
  // C-O2 — incoming bid on managed player
  const hasNewIncomingBidForManagedPlayer = newBids.some(
    b => b.direction === 'incoming' && game.players.find(p => p.id === b.playerId)?.clubId === game.managedClubId,
  )
  let lastIncomingBidMatchday = hasNewIncomingBidForManagedPlayer ? nextMatchday : game.lastIncomingBidMatchday
  // Player rejection: morale +5 for player, fanMood -5
  for (const item of transferResult.inboxItems) {
    if ((item as InboxItem & { bidRejectedByPlayer?: boolean }).bidRejectedByPlayer) {
      newFanMood = Math.max(0, Math.min(100, newFanMood - 5))
      // Find the bid for this inbox item to get the player
      const bidId = item.id.replace('inbox_bid_rejected_', '')
      const bid = resolvedBids.find(b => b.id === bidId)
      if (bid) {
        postTransferPlayers = postTransferPlayers.map(p =>
          p.id === bid.playerId ? { ...p, morale: Math.min(100, (p.morale ?? 60) + 5) } : p
        )
      }
    }
  }
  // Rival sale: fanMood -20, set lastRivalSaleMatchday
  const rivalSaleMoment = transferExecResult.moments.find(m => m.source === 'rival_sale')
  let lastRivalSaleInfo = game.lastRivalSaleInfo
  if (rivalSaleMoment) {
    newFanMood = Math.max(0, Math.min(100, newFanMood - 20))
    lastRivalSaleMatchday = nextMatchday
    // B1 — namn-anchor för Efterklang-premiss (spelaren har redan bytt klubb, läs ur moment)
    const soldP = postTransferPlayers.find(p => p.id === rivalSaleMoment.subjectPlayerId)
    const buyerC = postTransferClubs.find(c => c.id === rivalSaleMoment.subjectClubId)
    if (soldP && buyerC) {
      lastRivalSaleInfo = {
        soldPlayerName: `${soldP.firstName} ${soldP.lastName}`,
        buyerClubName: buyerC.name,
        buyerClubId: buyerC.id,
        saleSeason: game.currentSeason,
        saleMatchday: nextMatchday,
      }
    }
  }

  // ── Community standing, politician/mecenat inbox, facility projects ────────
  const communityResult = processCommunity(
    game,
    justCompletedManagedFixture ?? null,
    playoffCsBoost,
    standings,
    nextMatchday,
  )
  newInboxItems.push(...communityResult.inboxItems)
  const appliedCommunity = applyCommunityRoundResult(
    game,
    postTransferClubs,
    communityResult,
    kommunstodBonus,
    nextMatchday,
  )
  let { csBoost } = appliedCommunity
  let updatedFacilityState = appliedCommunity.facilityState
  postTransferClubs = appliedCommunity.clubs
  roundLedgerEntries.push(...appliedCommunity.ledgerEntries)
  const { updatedVolunteers, updatedVolunteerMorale } = communityResult
  // ANSPRÅK 4, spak 3: staleness-klockan (backfylld i processCommunity).
  const updatedCommunityActivitiesSince = communityResult.updatedCommunityActivitiesSince

  // ── Scandals (Lager 1 — Världshändelser) ──────────────────────────────────
  const scandalResult = processScandals(preEventGame, nextMatchday, localRand, { skipSideEffects: isSecondPassForManagedMatch })
  newInboxItems.push(...scandalResult.inboxItems)
  roundLedgerEntries.push(...scandalResult.ledgerEntries)

  // ── Post-match events: insändare, opponent quote (ambient i Granska) ─────
  // Citatets skandalpremiss måste läsa den här omgångens canonical resultat,
  // inte roundProcessor-ingångens stale activeScandals/scandalHistory.
  if (justCompletedManagedFixture && !isSecondPassForManagedMatch) {
    const postMatchEvents = generatePostMatchEvents({
      ...game,
      activeScandals: scandalResult.updatedScandals,
      scandalHistory: scandalResult.updatedScandalHistory,
    }, justCompletedManagedFixture)
    allNewEvents.push(...postMatchEvents)
  }

  // Apply scandal-driven club changes (finances/reputation) as deltas on top of postTransferClubs
  if (scandalResult.updatedClubs !== preEventGame.clubs) {
    for (const scandalClub of scandalResult.updatedClubs) {
      const baseline = preEventGame.clubs.find(c => c.id === scandalClub.id)
      if (!baseline) continue
      const fd = scandalClub.finances - baseline.finances
      const rd = scandalClub.reputation - baseline.reputation
      if (rd !== 0) {
        postTransferClubs = postTransferClubs.map(c =>
          c.id === scandalClub.id
            ? { ...c, reputation: Math.max(0, Math.min(100, c.reputation + rd)) }
            : c,
        )
      }
      // §6-arkitekturen (D042-fyndet, Jacobs körorder 2026-09-01): finansdelen
      // routad genom applyFinanceChange, reputationen hanteras separat (samma
      // funktion rör inte det fältet).
      if (fd !== 0) {
        postTransferClubs = applyFinanceChange(postTransferClubs, scandalClub.id, fd)
      }
    }
  }

  // ── Mecenat spawn ─────────────────────────────────────────────────────────
  {
    const mecenatResult = applyMecenatSpawn(
      game,
      isSecondPassForManagedMatch,
      currentLeagueRound,
      updatedMecenater,
      localRand,
    )
    updatedMecenater = mecenatResult.updatedMecenater
    allNewEvents.push(...mecenatResult.newEvents)

    // "Takmodellen" (Jacobs dom 2026-08-26): om communityStanding fallit
    // så taket ligger under antalet aktiva mecenater, tvinga fram ett
    // avhopp — se applyMecenatCapEviction i eventProcessor.ts.
    const evictionResult = applyMecenatCapEviction(game, updatedMecenater)
    updatedMecenater = evictionResult.updatedMecenater
    mecenatWithdrawnSeason = evictionResult.withdrawnSeason ?? mecenatWithdrawnSeason
    allNewEvents.push(...evictionResult.newEvents)
  }

  // ── Pool 1c: spela-på-erbjudandet ─────────────────────────────────────────
  if (!isSecondPassForManagedMatch) {
    allNewEvents.push(...checkForPlayThroughInjuryOffer(game, nextMatchday))
  }

  // ── B3/B4: Cap low-priority (atmospheric) events per round ───────────────
  // Maksimalt MAX_ATMOSPHERIC_PER_ROUND låg-prio events per omgång visas i kön.
  // Överskjutande events sparas i inboxen (inte kasseras).
  // Kritiska och medium events cappas aldrig.
  {
    const MAX_ATMOSPHERIC_PER_ROUND = 2
    const atmosphericNew = allNewEvents.filter(e => (e.priority ?? getEventPriority(e.type)) === 'low')
    const otherNew = allNewEvents.filter(e => (e.priority ?? getEventPriority(e.type)) !== 'low')

    const keptAtmospheric = atmosphericNew.slice(0, MAX_ATMOSPHERIC_PER_ROUND)
    const droppedAtmospheric = atmosphericNew.slice(MAX_ATMOSPHERIC_PER_ROUND)

    // Rebuild allNewEvents with cap applied
    allNewEvents.length = 0
    allNewEvents.push(...otherNew, ...keptAtmospheric)

    // Överskjutande lågprioriterade miljöhändelser bevaras som arkiv i inboxen,
    // men är redan lästa: en takmekanism ska inte skapa en ny notisstorm.
    if (droppedAtmospheric.length > 0) {
      const droppedInboxItems: InboxItem[] = droppedAtmospheric.map(e => ({
        id: `inbox_evt_${e.id}`,
        date: newDate,
        type: InboxItemType.Community,
        title: e.title,
        body: e.body,
        isRead: true,
      }))
      newInboxItems.push(...droppedInboxItems)
    }
  }

  const newClubEra = calculateClubEra(game)

  const patronCommunityResult = processPatronCommunityEvents(
    game,
    updatedPatron,
    eventResult.patronWithdrawnSeason,
    nextMatchday,
    currentLeagueRound,
    localRand,
    allNewEvents,
  )
  updatedPatron = patronCommunityResult.updatedPatron
  const patronWithdrawnSeasonAfterCsEviction = patronCommunityResult.patronWithdrawnSeason
  allNewEvents.push(...patronCommunityResult.gameEvents)
  roundLedgerEntries.push(...patronCommunityResult.ledgerEntries)

  // Alla producenter måste passera samma leveransgrind. Tidigare byggdes
  // trimmedInbox redan efter media-steget, så sponsor/community/skandal
  // skrevs efter ögonblicksbilden och försvann eller gick runt dedupen.
  newInboxItems.push(...marketValueInbox)
  const inboxDelivery = finalizeInboxDelivery(game, newInboxItems, {
    season: game.currentSeason,
    matchday: nextMatchday,
    leagueRound: currentLeagueRound ?? null,
    date: newDate,
  })

  // ÖVERLÄMNING 2 (2026-08-17, Jacobs korrigering): ingen kedja kastas
  // längre — alla sparas rangordnade. Rangordningen (rippleChainSignificance,
  // rippleEffectService.ts) väger nu det verkliga utfallet, inte vilken
  // trigger som orsakade det. Se den funktionens kommentar för rotorsaken.
  const pendingRippleChains = roundRippleChains.length > 0
    ? [...roundRippleChains].sort((a, b) => rippleChainSignificance(b) - rippleChainSignificance(a))
    : undefined

  // M15: merge ripple-derived field changes via centralized function
  const rippleMerged = mergeRippleDeltas(game, gameAfterRipples, {
    fanMoodBase: newFanMood,
    sponsorNetworkMoodDelta,
    communityStandingDelta: csBoost,
    supporterGroupFallback: updatedSupporterGroup,
  })

  // liggare-ny-community-shift: samma before/after-jämförelse M15 precis
  // gjorde för ripple-fälten, återanvänd rakt av (ingen ny beräkning av
  // communityStanding). Bara vid en FAKTISK tröskelkorsning (30/50/70) —
  // små rörelser inom samma band skriver ingen post.
  const csFrom = game.communityStanding ?? 50
  const csTo = rippleMerged.communityStanding ?? csFrom
  const communityShiftDirection = detectCommunityShiftDirection(csFrom, csTo)
  if (communityShiftDirection) {
    roundLedgerEntries.push(buildCommunityShiftLedgerEntry({
      clubId: game.managedClubId,
      season: game.currentSeason,
      matchday: nextMatchday,
      from: csFrom,
      to: csTo,
      direction: communityShiftDirection,
    }))
  }

  // M14: check for era shift and push era_shift Moment. Beräknad EN gång här
  // (inte i en IIFE inne i recentMoments längre) så samma lista kan mata
  // BÅDE dual-write-fälten nedan — MIGRATIONSPLAN_HANDELSELIGGAREN Fas 4.
  const eraShiftMoments: Moment[] = []
  if (game.currentEra && game.currentEra !== newClubEra) {
    eraShiftMoments.push({
      id: `moment_era_shift_${game.currentSeason}_${nextMatchday}`,
      source: 'era_shift',
      matchday: nextMatchday,
      season: game.currentSeason,
      title: eraLabel(newClubEra),
      body: newClubEra === 'establishment'
        ? 'Klubben reser sig. Något har förändrats i hur orten ser på laget.'
        : newClubEra === 'legacy'
        ? 'Det är inte längre bara bandy. Det är ortens identitet.'
        : 'Tuffa tider. Men det är nu det verkligen gäller.',
      // Skärpning 4 — eran den skiftade TILL, strukturerat (samma värde som
      // title-strängen ovan uttrycker i prosa via eraLabel()-funktionen).
      eraLabel: newClubEra,
    })
  }
  const allNewMomentsThisRound = [...newMoments, ...eraShiftMoments]

  let updatedGame: SaveGame = {
    ...game,
    ...rippleMerged,
    communityStandingDelta: (rippleMerged.communityStanding ?? game.communityStanding ?? 50) - (game.communityStanding ?? 50),
    clubs: postTransferClubs,
    fixtures: strippedFixtures,
    players: postTransferPlayers,
    standings,
    inbox: inboxDelivery.inbox,
    deferredInbox: inboxDelivery.deferredInbox,
    currentDate: newDate,
    currentMatchday: nextMatchday,
    lastStorySlotType: game.currentStorySlotType ?? game.lastStorySlotType,
    managedClubPendingLineup: undefined,
    lineupConfirmedThisRound: false,
    visitedScreensThisRound: [],
    pendingScreen: triggerQFSummary ? PendingScreen.QFSummary : game.pendingScreen,
    lastProcessedMatchday: hasManagedCupPending ? (game.lastProcessedMatchday ?? undefined) : nextMatchday,
    lastCompletedFixtureId: justCompletedManagedFixture?.id ?? game.lastCompletedFixtureId,
    chemistryStats: updatedChemistryStats,
    matchWeathers: trimmedWeathers,
    trainingHistory: trimmedTrainingHistory,
    playoffBracket: updatedBracket,
    lastPlayoffElimination,
    cupBracket: updatedCupBracket,
    scoutReports: { ...updatedScoutReports, ...rumorScoutReports },
    activeScoutAssignment: updatedScoutAssignment,
    lastRivalSaleMatchday,
    lastRivalSaleInfo,
    lastIncomingBidMatchday,
    scoutBudget: game.scoutBudget ?? 10,
    transferBids: trimmedBids,
    pendingEvents: [
      ...(game.pendingEvents ?? []).filter(e =>
        !e.resolved &&
        !allNewEvents.some(n => n.id === e.id) &&
        !playoffResult.staleEventIds.includes(e.id) &&
        // A3 (2026-08-17): bracket-giltighetsgrind utöver staleEventIds — se
        // playoffNarrativeService.ts's isPlayoffNarrativeCardStillValid.
        isPlayoffNarrativeCardStillValid(e.id, updatedBracket, game.managedClubId)
      ),
      ...allNewEvents,
    ],
    // 2026-08-17: staleEventIds fångade tidigare bara pendingEvents. Ett event
    // som blivit undanträngt till deferredDecisions (KF3-avbrottsbudgeten,
    // längre ned i denna funktion) av budgetcapet innan sin fas hann klaras av
    // missade rensningen helt — det låg kvar i FIFO-kön och kunde surfa upp
    // igen omgångar senare, efter att fasen redan var över (bekräftat: en
    // "playoff_sf_"-kort dök upp i portalen EFTER att finalen redan var vunnen,
    // eftersom kortet legat undanträngt i deferredDecisions genom hela SF- och
    // finalfasen). Samma filter som pendingEvents ovan, applicerat här.
    //
    // A3 (2026-08-17): staleEventIds rensar ett korts EGEN fas när den
    // avslutas som helhet (t.ex. SF-kortet först när BÅDA semifinalserierna
    // är avgjorda) — men managed clubs egen elimination kan ske omgångar
    // innan motståndarens parallella serie är klar. isPlayoffNarrativeCardStillValid
    // omvärderar mot den levande bracketen varje omgång och fångar
    // elimineringen samma omgång den sker, oavsett fasens helhetsstatus.
    deferredDecisions: (game.deferredDecisions ?? []).filter(e =>
      !allNewEvents.some(n => n.id === e.id) &&
      !playoffResult.staleEventIds.includes(e.id) &&
      isPlayoffNarrativeCardStillValid(e.id, updatedBracket, game.managedClubId)
    ),
    sponsors: updatedSponsors,
    kommunstodPaidSeason,
    activeTalentSearch: updatedTalentSearch,
    talentSearchResults: updatedTalentResults,
    rivalryHistory: updatedRivalryHistory,
    nemesisTracker: updatedNemesisTracker,
    doctorQuestionsUsed: 0,
    trainingProjects: trainingResult.trainingProjects,
    youthTeam: updatedYouthTeam,
    academyLevel: game.academyLevel ?? 'basic',
    mentorships: game.mentorships ?? [],
    loanDeals: updatedLoanDeals,
    financeLog: roundFinanceLog.reduce(
      (log, entry) => appendFinanceLog(log, entry),
      game.financeLog ?? []
    ),
    previousMarketValues: newPrevValues,
    storylines: game.storylines ?? [],
    clubLegends: game.clubLegends ?? [],
    boardObjectives: updatedBoardObjectives,
    boardTrust: Math.max(0, (game.boardTrust ?? 0) + boardObjTrustDelta),
    boardObjectiveHistory: game.boardObjectiveHistory ?? [],
    pendingRippleChains,
    facilityState: updatedFacilityState ?? game.facilityState,
    volunteers: updatedVolunteers,
    volunteerMorale: updatedVolunteerMorale,
    communityActivitiesSince: updatedCommunityActivitiesSince,
    trainerArc: trainerState.trainerArc,
    boardPatience: trainerState.boardPatience,
    boardPatienceLastCountedFixtureId: trainerState.boardPatienceLastCountedFixtureId,
    previousKommunBidrag: game.localPolitician?.kommunBidrag,
    mecenater: updatedMecenater,
    patron: updatedPatron,
    patronWithdrawnSeason: patronWithdrawnSeasonAfterCsEviction,
    // Spara förra omgångens seed — pick()-funktionen hoppar över det värdet för att undvika upprepning
    lastCoffeeQuoteHash: currentLeagueRound !== null ? (currentLeagueRound - 1) * 11 + game.currentSeason * 31 : game.lastCoffeeQuoteHash,
    lastEconomicStressRound: eventResult.lastEconomicStressRound,
    pendingPressConference: simResult.pressEvent ?? undefined,
    pendingRefereeMeeting: simResult.pendingRefereeMeeting ?? undefined,
    referees: simResult.updatedReferees,
    refereeRelations: simResult.updatedRefereeRelations,
    ...(() => {
      // Update rolling average attendance for home matches
      if (!justCompletedManagedFixture) return {}
      const isHomeMatch = justCompletedManagedFixture.homeClubId === game.managedClubId
      if (!isHomeMatch || !justCompletedManagedFixture.attendance) return {}
      const prev = game.averageAttendance ?? justCompletedManagedFixture.attendance
      const newAvg = Math.round((prev * 0.7) + (justCompletedManagedFixture.attendance * 0.3))
      return { previousAverageAttendance: prev, averageAttendance: newAvg }
    })(),
    ...(() => {
      // KF3: generate the weekly decision from its own cooldown/domain rules.
      // The shared final partition reserves its slot and queues event overflow.
      const gameWithNewEvents: SaveGame = {
        ...game,
        pendingEvents: [
          ...(game.pendingEvents ?? []).filter(e => !e.resolved),
          ...allNewEvents,
        ],
        resolvedWeeklyDecisions: game.resolvedWeeklyDecisions ?? [],
      }
      const rawNewDecision = generateWeeklyDecision(gameWithNewEvents, nextMatchday)
      // U5 forts (2026-08-20): systemhandelseBudgetOk gäller decisions också
      // (aggregat över events+decisions, samma säsongsbudget) — canAddDecision
      // ovan är en annan, redan befintlig spärr (allmän beslutskadens), inte
      // varsel-mallens "aldrig fler än tre systemhändelser/max en per omgång".
      const newDecision = rawNewDecision
        ? filterSystemhandelseBudget([rawNewDecision], game, game.currentSeason, nextMatchday)[0] ?? null
        : null
      return {
        pendingWeeklyDecision: newDecision ?? undefined,
        weeklyDecisionLastRound: newDecision ? nextMatchday : game.weeklyDecisionLastRound,
      }
    })(),
    resolvedEventIds: reputationResolvedIds,
    pendingVictoryEcho,
    victoryEchoExpires,
    // MIGRATIONSPLAN_HANDELSELIGGAREN Fas 4 — dual-write, INVARIANTEN håller:
    // fältet skrivs oförändrat (samma cap-5) tills dess sista läsare flyttat
    // till liggaren. collectActiveMemories retirerad LIGGARE-PRIO 4
    // (2026-09-03, noll produktionskonsumenter) — fältet skrivs fortfarande
    // för äldre saves/andra möjliga läsare, retireras separat, inte i denna
    // omgång.
    recentMoments: [...(game.recentMoments ?? []), ...allNewMomentsThisRound]
      .sort((a, b) => (b.season - a.season) || (b.matchday - a.matchday))
      .slice(0, 5),
    // Liggarposten — durabel, ocappad. ClubMemoryView (Moment-läsytan) läser
    // härifrån nu (getRecentMomentsFromLedger), se momentLedgerService.ts.
    // Ripple och Moment kan beskriva samma systemhändelse. De fogas då till
    // EN kanonisk post med både Moment-metadata och ripple-konsekvenser.
    eventLedger: appendMomentsAndEntriesToLedger(
      game.eventLedger ?? [],
      allNewMomentsThisRound,
      roundLedgerEntries,
      game.managedClubId,
      game.id,
    ),
    currentEra: newClubEra,
    activeScandals: scandalResult.updatedScandals,
    scandalHistory: scandalResult.updatedScandalHistory,
    pointDeductions: scandalResult.pointDeductions,
    pendingPointDeductions: scandalResult.pendingPointDeductions,
    // Lager 2 state
    wageBudgetOverrunRounds: eventResult.wageBudgetOverrunRounds,
    wageBudgetWarningSent: eventResult.wageBudgetWarningSent,
    riskySponsorOfferSentThisSeason: eventResult.riskySponsorOfferSentThisSeason,
    mecenatWithdrawnSeason,
    // O2 lager 2 (Jacobs dom 2026-08-24): fas 1 (event_crisis_awareness)
    // ambient — tillståndsövergången sker vid genereringen
    // (checkEconomicCrisis), måste tröskas ut hit precis som övriga
    // eventResult.*-fält ovan, annars sätts economicCrisisState aldrig och
    // fas 1 skulle annars generera om innan det ambienta eventet ens hunnit
    // konsumeras. resolvedEventIds ger dedup efter konsumtion; fas-state måste
    // fortfarande tröskas ut atomärt redan vid genereringen.
    economicCrisisState: eventResult.economicCrisisState,
    // P1 — Annandagen val-state
    pendingAnnandagsVal,
    pendingAnnandagsGratisentreVal: clearAnnandagsGratisentreVal ? false : (game.pendingAnnandagsGratisentreVal ?? false),
    // Beslutsekonomi cooldown tracking
    lastEventQueueRound: eventResult.lastEventQueueRound,
    lastRumorRound: mediaResult.lastRumorRound,
    // F1 Stage 2 — per-source cooldown decrement
    sourceCooldowns: decrementCooldowns(game.sourceCooldowns ?? {}),
    // C-B2 — klack echo
    klackEcho: updatedKlackEcho,
    // U5 (SLUTTEST_KO.md, 2026-08-17): narrativeBeatLog-skrivväg 7/9 — bara vid
    // en FAKTISKT ny eko (inte ren decay av en befintlig).
    narrativeBeatLog: newKlackEchoType
      ? logNarrativeBeat(game, `klack_echo_${newKlackEchoType}`, game.currentSeason, nextMatchday)
      : game.narrativeBeatLog,
    // C-K1 — Landslagsuttagning
    activeNationalTeamCamp: nationalTeamCampState,
    lastNationalSnub: nationalTeamSnub,
    pendingNationalTeamReturn: nationalTeamReturnLine,
    nationalTeamReturnExpires: nationalTeamReturnExpiresState,
    pendingCallupModal: nationalTeamCallupModal,
    pendingHallEcho: hallEchoLine,
    hallEchoExpires: hallEchoExpiresState,
  }

  // O1-uppföljning (2026-08-22): riskySponsorOffers maturation-konsekvens —
  // check + alla tre effekter, se applyRiskySponsorMaturation (sponsorProcessor.ts)
  // för rotorsak/historik. Ren funktion, samma seedade localRand som resten
  // av omgången.
  updatedGame = applyRiskySponsorMaturation(updatedGame, nextMatchday, newDate, localRand)

  // High 4 (Skutskär-auditen, 2026-08-22): press-storylinens narrativeBeatLog-post
  // skrivs här, NÄR FRÅGAN VISAS — inte vid resolution. storylineBudgetOk()
  // (pressConferenceService.ts) läser samma logg för att stoppa en tredje
  // gång. Se GameEvent.storylinePressKey.
  if (updatedGame.pendingPressConference?.pressQuestionKey) {
    updatedGame = {
      ...updatedGame,
      // Centralredaktören, punkt 2 (DOM_CENTRALREDAKTOREN_2026-08-31.md):
      // frågetextens egen recency, skrivs NÄR FRÅGAN VISAS — samma
      // mönster som storylinePressKey nedan. Se GameEvent.pressQuestionKey.
      narrativeBeatLog: logNarrativeBeat(
        updatedGame,
        updatedGame.pendingPressConference.pressQuestionKey,
        updatedGame.currentSeason,
        nextMatchday,
      ),
    }
  }

  if (updatedGame.pendingPressConference?.storylinePressKey) {
    updatedGame = {
      ...updatedGame,
      narrativeBeatLog: logNarrativeBeat(
        updatedGame,
        updatedGame.pendingPressConference.storylinePressKey,
        updatedGame.currentSeason,
        nextMatchday,
      ),
    }
  }

  // HIGH 7 (audit 2026-08-29): pressvarssvarens narrativeBeatLog-poster —
  // en per ERBJUDET svar (inte bara det spelaren klickar), skrivna NÄR
  // FRÅGAN VISAS, samma mönster som storylinePressKey ovan. Läses av
  // buildPressResponses() (pressConferenceService.ts) för att undvika att
  // exakt samma replik ("Derby vinner man med hjärtat", "Att förlora
  // hemma...") erbjuds igen samma säsong. Se GameEvent.pressResponseKeys.
  if (updatedGame.pendingPressConference?.pressResponseKeys) {
    let pressResponseLog = updatedGame.narrativeBeatLog
    for (const key of updatedGame.pendingPressConference.pressResponseKeys) {
      pressResponseLog = logNarrativeBeat(
        { ...updatedGame, narrativeBeatLog: pressResponseLog },
        key,
        updatedGame.currentSeason,
        nextMatchday,
      )
    }
    updatedGame = { ...updatedGame, narrativeBeatLog: pressResponseLog }
  }

  // Medium 2 (Skutskär-auditen, 2026-08-22): mecenat-socialpoolens
  // narrativeBeatLog-post skrivs här, en per genererat social-event denna
  // omgång (upp till två kan förekomma i SAMMA omgång om två mecenater
  // rullar samtidigt — budget/typ-uteslutning redan applicerad vid
  // genereringen, se GameEvent.mecenatSocialKey).
  for (const event of allNewEvents) {
    if (event.mecenatSocialKey) {
      updatedGame = {
        ...updatedGame,
        narrativeBeatLog: logNarrativeBeat(updatedGame, event.mecenatSocialKey, updatedGame.currentSeason, nextMatchday),
      }
    }
  }

  // A-H4a (SEXSÄSONGSAUDITEN 2026-08-26): journalistreportagets säsongs- och
  // spelarrotationsminne, samma skrivmönster som mecenatSocialKey ovan —
  // loggas NÄR EVENTET GENERERAS, inte vid resolution. Se
  // GameEvent.journalistExclusiveKey.
  for (const event of allNewEvents) {
    if (event.journalistExclusiveKey) {
      updatedGame = {
        ...updatedGame,
        narrativeBeatLog: logNarrativeBeat(updatedGame, event.journalistExclusiveKey, updatedGame.currentSeason, nextMatchday),
      }
    }
  }

  // Centralredaktören, punkt 3 (DOM_CENTRALREDAKTOREN_2026-08-31.md):
  // generiska personal-beats' subjekts-rotation (starPerformance/
  // playerPraise/playerMediaComment). Samma skrivmönster som
  // journalistExclusiveKey ovan — loggas NÄR EVENTET GENERERAS. Se
  // GameEvent.rotationKey.
  for (const event of allNewEvents) {
    if (event.rotationKey) {
      updatedGame = {
        ...updatedGame,
        narrativeBeatLog: logNarrativeBeat(updatedGame, event.rotationKey, updatedGame.currentSeason, nextMatchday),
      }
    }
  }

  // Centralredaktören (DOM_CENTRALREDAKTOREN_2026-08-31.md): kanal-
  // exklusivitet + innehålls-recency, EN gemensam gate som event-blocket
  // (allNewEvents) OCH pressen (pendingPressConference) konsulterar — se
  // narrativeCoordinatorService.ts. Placerad EFTER key-write-looparna ovan
  // med avsikt: mecenatSocialKey/journalistExclusiveKey loggar cooldown
  // för ANDRA syften (socialpool-/spelarrotation) och ska skrivas oavsett
  // om just DEN HÄR omgångens kort surfar eller trängs undan av taket
  // nedan — samma resonemang som gör att storylinePressKey/
  // pressResponseKeys ovan loggas även för en presskonferens som sedan
  // kan trängas undan här.
  //
  // Press placeras FÖRST i kandidatlistan: en presskonferens efter en
  // nyss spelad match är en starkare narrativ förpliktelse än
  // event-blockets valfria press-liknande flavor (playerMediaComment/
  // journalistExclusive). Domen tillåter uttryckligen bägge
  // riktningar ("håller event-blocket tillbaka en press-lik kanal, och
  // vice versa") — ordningen här är Codes tolkning, inte en explicit
  // ordning i domen.
  {
    const pressCandidate = updatedGame.pendingPressConference
    const roundCandidates = pressCandidate ? [pressCandidate, ...allNewEvents] : allNewEvents
    const recencyFiltered = roundCandidates.filter(event => {
      if (isExemptFromSurfacingBudget(event)) return true
      const channel = CHANNEL_BY_EVENT_TYPE[event.type]
      const window = channel ? RECENCY_WINDOW_BY_CHANNEL[channel] : undefined
      if (!window) return true
      return !recentlySurfaced(updatedGame, event.type, window, nextMatchday)
    })
    const { kept } = applySurfacingBudget(recencyFiltered)
    const keptSet = new Set(kept)

    if (pressCandidate && !keptSet.has(pressCandidate)) {
      updatedGame = { ...updatedGame, pendingPressConference: undefined }
    }
    const survivingEvents = allNewEvents.filter(event => keptSet.has(event))
    allNewEvents.length = 0
    allNewEvents.push(...survivingEvents)
  }

  // SPEC_BERATTAREN steg 7: först här vet vi att presskortet faktiskt blev
  // kvar som synlig yta. Kvittera då den exakta kanoniska post som gav
  // liggarfrågan; en bortbudgeterad presskonferens räknas aldrig som frågad.
  if (updatedGame.pendingPressConference?.pressLedgerPostKey) {
    updatedGame = recordPressLedgerQuestionShown(updatedGame)
  }

  // Release-svepet 2026-07-21 (Block 2c) — landslagsuttagningens +5 tkr/uttagen
  // (HANDOFF-C-K1-LANDSLAG-2026-05-23.md Q3, låst av Jacob). Samma efterhands-
  // mönster som marketValueInbox ovan, se kommentaren vid nationalTeamCallupBonusTkr.
  if (nationalTeamCallupBonusTkr > 0) {
    updatedGame = {
      ...updatedGame,
      clubs: applyFinanceChange(updatedGame.clubs, game.managedClubId, nationalTeamCallupBonusTkr * 1000),
      financeLog: appendFinanceLog(updatedGame.financeLog ?? [], {
        round: nextMatchday,
        amount: nationalTeamCallupBonusTkr * 1000,
        reason: 'national_team_bonus',
        label: 'Landslagsuttagning (bonus)',
      }),
    }
  }

  // ── Arc processing ──────────────────────────────────────────────────────
  updatedGame = processPlayerArcs(
    updatedGame,
    justCompletedManagedFixture ?? undefined,
    nextMatchday,
  )

  // ── Förtroendepott — apply club finance bonus if earned this check-in ──────
  if (boardObjForetroendepott > 0) {
    updatedGame = {
      ...updatedGame,
      // financelog-gap-diagnos-2026-09-01.ts (Jacobs körorder 2026-09-01):
      // förtroendepotten mutade tidigare club.finances utan en enda
      // financeLog-post — en av flera källor till en ~150-220k/säsong
      // ospårad differens. §6-arkitekturen: routad genom applyFinanceChange.
      clubs: applyFinanceChange(updatedGame.clubs, game.managedClubId, boardObjForetroendepott),
      financeLog: appendFinanceLog(updatedGame.financeLog ?? [], {
        round: nextMatchday,
        amount: boardObjForetroendepott,
        reason: 'board_objective',
        label: 'Förtroendepott (två raka flagship-mål godkända)',
      }),
    }
  }

  updatedGame = processPendingFollowUps(updatedGame, nextMatchday)

  updatedGame = applyCommunityConsequences(
    updatedGame,
    nextMatchday,
    communityResult.klackMoodDelta,
  )

  // Pre-generate weather for next matchday so dashboard/matchScreen can show it
  const nextScheduled = finalAllFixtures.filter(f => f.status === FixtureStatus.Scheduled)
  if (nextScheduled.length > 0) {
    const upcomingMatchdayNum = Math.min(...nextScheduled.map(f => f.matchday))
    const upcomingFixtures = nextScheduled.filter(f => f.matchday === upcomingMatchdayNum)
    const nextWeathers: MatchWeather[] = []
    for (let i = 0; i < upcomingFixtures.length; i++) {
      const f = upcomingFixtures[i]
      if (updatedGame.matchWeathers.some(mw => mw.fixtureId === f.id)) continue
      const homeClub = game.clubs.find(c => c.id === f.homeClubId)
      if (!homeClub) continue
      const weather = generateMatchWeather(
        game.currentSeason,
        upcomingMatchdayNum,
        homeClub,
        f.id,
        baseSeed + 50000 + i * 7919,
        game.currentSeasonSignature,
        f.date,
      )
      nextWeathers.push(weather)
    }
    if (nextWeathers.length > 0) {
      updatedGame = { ...updatedGame, matchWeathers: [...updatedGame.matchWeathers, ...nextWeathers] }
    }
  }

  // Auto-advance playoff rounds when managed club is eliminated
  if (isPlayoffRound && updatedBracket !== null && updatedBracket.status !== PlayoffStatus.Completed) {
    const managedHasMorePlayoffFixtures = finalAllFixtures.some(f =>
      f.status === FixtureStatus.Scheduled && !f.isCup && f.matchday > 26 &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    )
    if (!managedHasMorePlayoffFixtures) {
      return advanceToNextEvent(updatedGame, (seed ?? baseSeed) + 1)
    }
  }

  // Post-round flags (halftime trigger, onboarding, bankruptcy, formation recommendation)
  const flagsResult = applyPostRoundFlags({
    game: updatedGame,
    justCompletedManagedFixture,
    nextMatchday,
  })
  updatedGame = flagsResult.updatedGame

  // Scene-trigger (SPEC_SCENES_FAS_1) — sätter pendingScene som AppRouter plockar upp
  if (!updatedGame.pendingScene) {
    const sceneId = detectSceneTrigger(updatedGame)
    if (sceneId) {
      const isRecurring = sceneId === 'coffee_room'
      const alreadyShown = (updatedGame.shownScenes ?? []).includes(sceneId)
      if (isRecurring || !alreadyShown) {
        updatedGame = {
          ...updatedGame,
          pendingScene: { sceneId, triggeredAt: updatedGame.currentDate },
        }
      }
    }
  }

  updatedGame = processJournalistRelationshipRound(updatedGame)

  updatedGame = processCommunityStandingPress(
    updatedGame,
    justCompletedManagedFixture,
    nextMatchday,
    localRand,
  )

  // Spara senaste 22 liga-omgångars tabellplats/journalistrelation/lagform för trendgrafer
  if (!isCupRound && !isPlayoffRound && currentLeagueRound !== null && !isSecondPassForManagedMatch) {
    const managedId = updatedGame.managedClubId
    const pos = updatedGame.standings.find(s => s.clubId === managedId)?.position ?? null
    const jRel = updatedGame.journalist?.relationship ?? null
    const forms = updatedGame.players
      .filter(p => p.clubId === managedId)
      .map(p => p.form)
    const avgForm = forms.length > 0
      ? Math.round(forms.reduce((a, b) => a + b, 0) / forms.length)
      : null
    const prev = updatedGame.scoreSnapshots ?? { standingsPosition: [], journalistRelation: [], playerForm: [] }
    updatedGame = {
      ...updatedGame,
      scoreSnapshots: {
        standingsPosition: pos !== null ? [...prev.standingsPosition, pos].slice(-22) : prev.standingsPosition,
        journalistRelation: jRel !== null ? [...prev.journalistRelation, jRel].slice(-22) : prev.journalistRelation,
        playerForm: avgForm !== null ? [...prev.playerForm, avgForm].slice(-22) : prev.playerForm,
      },
    }
  }

  updatedGame = processManagerRoundState({
    previousGame: game,
    game: updatedGame,
    justCompletedManagedFixture,
    nextMatchday,
    newClubEra,
    burnoutCeilingQueuedThisRound: allNewEvents.some(event => event.type === 'burnoutCeiling'),
    skipSideEffects: isSecondPassForManagedMatch,
  })

  // U5 forts (SLUTTEST_KO.md, 2026-08-20): systemhandelseBudgetOk:s faktiska
  // gating (se filterSystemhandelseBudget, narrativeLogService.ts, för
  // rotorsaken till den provisoriska räkningen). Släppta events tappas för
  // denna omgång — samma konservativa avvägning som canAddDecision ovan.
  const budgetedNewEvents = filterSystemhandelseBudget(allNewEvents, updatedGame, game.currentSeason, nextMatchday)

  updatedGame = appendNewlyResolvedStorylines(game, updatedGame, nextMatchday)

  // KF3's post-ARCH choke point: all event producers, the weekly decision and
  // the scene trigger have now written their state. Re-run the same canonical
  // maintenance here immediately before the result is persisted.
  updatedGame = maintainEventQueues(updatedGame, nextMatchday)

  return { game: updatedGame, roundPlayed: nextMatchday, seasonEnded: false, pendingEvents: budgetedNewEvents, hasManagedCupMatch: hasManagedCupPending }
}
