import type { SaveGame, InboxItem } from '../../domain/entities/SaveGame'
import { getEventPriority } from '../../domain/entities/GameEvent'
import type { Moment } from '../../domain/entities/Moment'
import type { Player } from '../../domain/entities/Player'
import type { Fixture, ManagerChoiceEntry } from '../../domain/entities/Fixture'
import type { MatchWeather } from '../../domain/entities/Weather'
import { FixtureStatus, MatchEventType, InboxItemType, PendingScreen, PlayoffStatus, TrainingType, TrainingIntensity } from '../../domain/enums'
import { getTacticModifiers } from '../../domain/services/tacticModifiers'
import { getRivalry } from '../../domain/data/rivalries'
import { generateMatchWeather } from '../../domain/services/weatherService'
import { calculateStandings } from '../../domain/services/standingsService'
import {
  createInjuryItem,
  createSuspensionItem,
  createRecoveryItem,
  createPlayThroughAftermathItem,
} from '../../domain/services/inboxService'
import { updateAllMarketValues } from '../../domain/services/marketValueService'
import { generateWeeklyDecision } from '../../domain/services/weeklyDecisionService'
import { evaluateBoard, generateBoardMessage, updateRunningBoardPatience } from '../../domain/services/boardService'
import { mulberry32 } from '../../domain/utils/random'
import { deriveUtfall } from '../../domain/services/matchTypeAxes'

import type { AdvanceResult } from './advanceTypes'
import { derivePreRoundContext } from './processors/preRoundContextProcessor'
import { applyPostRoundFlags } from './processors/postRoundFlagsProcessor'
import { applyRoundTraining } from './processors/trainingProcessor'
import { detectSceneTrigger } from '../../domain/services/sceneTriggerService'
import { applyPlayerStateUpdates } from './processors/playerStateProcessor'
import { updatePlayerMatchStats } from './processors/statsProcessor'
import { applyRoundDevelopment } from '../../domain/services/playerDevelopmentService'
import { MENTOR_FORM_THRESHOLD } from '../../domain/services/mentorshipConstants'
import { processPlayoffRound } from './processors/playoffProcessor'
import { isPlayoffNarrativeCardStillValid } from '../../domain/services/playoffNarrativeService'
import { processCupRound } from './processors/cupProcessor'
import { appendFinanceLog, applyFinanceChange } from '../../domain/services/economyService'
import { updatePlayerAvailability, updateLowMoraleDays } from '../../domain/services/playerAvailabilityService'
import { updateTrainerArc } from '../../domain/services/trainerArcService'
import { checkInObjectives } from '../../domain/services/boardObjectiveService'
import { processEconomy } from './processors/economyProcessor'
import { processCommunity } from './processors/communityProcessor'
import { processScouts } from './processors/scoutProcessor'
import { processTransferBids, processLoans, executeAcceptedTransfers } from './processors/transferProcessor'
import { processSponsors, applyRiskySponsorMaturation } from './processors/sponsorProcessor'
import { checkContextualSponsors, applyOneTimeKommunstod } from '../../domain/services/contextualSponsorService'
import { calculateClubEra, eraLabel } from '../../domain/services/clubEraService'
import { simulateRound } from './processors/matchSimProcessor'
import { processYouth } from './processors/youthProcessor'
import { detectArcTriggers, progressArcs } from '../../domain/services/arcService'
import { logNarrativeBeat, filterSystemhandelseBudget } from '../../domain/services/narrativeLogService'
import { appendMomentsToLedger } from '../../domain/services/momentLedgerService'
import {
  applySurfacingBudget,
  isExemptFromSurfacingBudget,
  recentlySurfaced,
  CHANNEL_BY_EVENT_TYPE,
  RECENCY_WINDOW_BY_CHANNEL,
} from '../../domain/services/narrativeCoordinatorService'
import { processNarrative, processUpcomingDerbyNotification } from './processors/narrativeProcessor'
import { appendJournalistRelationshipStoryline, detectRelationshipEvent } from '../../domain/services/journalistVisibilityService'
import { processMedia } from './processors/mediaProcessor'
import { checkMidSeasonEvents } from '../../domain/services/midSeasonEventService'
import { processGameEvents, applyMecenatSpawn, applyMecenatCapEviction, processScandals, checkForPlayThroughInjuryOffer, isPlayThroughInjuryCardStillValid } from './processors/eventProcessor'
import { applyCaptainMoraleCascade } from './processors/playerStateProcessor'
import { applyRipples, mergeRippleDeltas, describeRippleChain, rippleChainSignificance } from '../../domain/services/rippleEffectService'
import type { RippleChain } from '../../domain/entities/SaveGame'
import type { EventLedgerEntry } from '../../domain/entities/Narrative'
import { buildSystemRippleLedgerEntry } from '../../domain/services/orsakVerkanService'
import { applyMatchInjury, generateInjuryInboxItem } from '../../domain/services/matchInjuryService'
import {
  annandagsbandyInbox,
  finaldagInboxPlaying,
  finaldagInboxSpectator,
  cupFinalInboxPlaying,
  type SpecialDateContext,
} from '../../domain/data/specialDateStrings'
import { generatePostMatchEvents } from '../../domain/services/postMatchEventService'
import { checkSeasonGoalHalfwayEvent } from '../../domain/services/seasonGoalService'
import { canAddDecision, partitionInterruptBudget, MAX_DEFERRED_DECISIONS } from '../../domain/services/decisionBudgetService'
import { getFatigueState } from '../../domain/services/decisionFatigueService'
import { decrementCooldowns } from '../../domain/services/sourceCooldownService'
import { detectNotableResult, decayKlackEcho } from '../../domain/services/klackEchoService'
import { DEADLINE_AI_BID_TEXT } from '../../domain/data/windowDeadlineText'
import { computeCSStreak, shouldTriggerCSPress, pickCSPressPlayer, buildCSPressEvent } from '../../domain/services/csPressEventService'
import { adjustSupporterMood } from '../../domain/services/supporterService'
import { selectNationalTeam, applyCallupEffects, applyReturnEffects, LANDSLAGS_CA_TROSKEL, CALLUP_CAP } from '../../domain/services/nationalTeamService'
import {
  SNUB_SCENE_LINES,
} from '../../domain/data/landslagText'
import { updateManagerBurnout, updateH2HRecord, deriveCoachNemesis, getBurnoutZone, shouldShowBurnoutMark, shouldShowBurnoutRelief, shouldShowBurnoutClose, isBurnoutRelapse, BURNOUT_MARK_FIRED_KEY, BURNOUT_RELIEF_FIRED_KEY, BURNOUT_CLOSE_FIRED_KEY } from '../../domain/services/managerProfileService'
import { pickBurnoutQuoteIndex, pickBurnoutHelperIndex, pickBurnoutRelapseQuoteIndex, pickBurnoutRelapseHelperIndex, BURNOUT_QUOTE_PREFIX, BURNOUT_HELPER_PREFIX, BURNOUT_RELAPSE_QUOTE_PREFIX, BURNOUT_RELAPSE_HELPER_PREFIX } from '../../domain/services/burnoutReliefService'
import { BURNOUT_MARK, BURNOUT_MARK_RELAPSE } from '../../domain/data/managerKaraktarText'
import { generatePatronEmergenceEvent } from '../../domain/services/events/patronEvents'
import { PATRON_EMERGE_CS } from '../../domain/data/patronData'

export type { AdvanceResult }

type Lineup = Fixture['homeLineup']

function stripLineup(lineup: Lineup): Lineup {
  if (!lineup) return undefined
  return {
    startingPlayerIds: lineup.startingPlayerIds,
    benchPlayerIds: [],
    tactic: {
      mentality: lineup.tactic.mentality,
      tempo: lineup.tactic.tempo,
      press: lineup.tactic.press,
      passingRisk: lineup.tactic.passingRisk,
      width: lineup.tactic.width,
      attackingFocus: lineup.tactic.attackingFocus,
      cornerStrategy: lineup.tactic.cornerStrategy,
      penaltyKillStyle: lineup.tactic.penaltyKillStyle,
    },
  }
}

function generateSpecialDateInbox(
  fixture: Fixture,
  game: SaveGame,
  matchday: number,
): InboxItem[] {
  const items: InboxItem[] = []
  const isHome = fixture.homeClubId === game.managedClubId
  const homeClub = game.clubs.find(c => c.id === fixture.homeClubId)
  const awayClub = game.clubs.find(c => c.id === fixture.awayClubId)
  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)

  const ctx: SpecialDateContext = {
    isHomePlayer: isHome,
    homeClubName: homeClub?.name ?? '',
    awayClubName: awayClub?.name ?? '',
    arenaName: homeClub?.arenaName ?? 'arenan',
    venueCity: homeClub?.shortName ?? '',
    rivalryName: rivalry?.name,
  }

  if (fixture.isFinaldag) {
    const { subject, body } = finaldagInboxPlaying(ctx)
    items.push({
      id: `inbox_finaldag_${game.currentSeason}`,
      date: game.currentDate,
      type: InboxItemType.Playoff,
      title: subject,
      body,
      isRead: false,
    })
    return items
  }

  // Use stored seasonCalendar as single source of truth
  const storedCal = game.seasonCalendar ?? []
  const slot = storedCal.find(s => s.matchday === matchday)

  if (slot?.isAnnandagen || fixture.isAnnandagen) {
    const { subject, body } = annandagsbandyInbox(ctx)
    items.push({
      id: `inbox_annandagen_match_${game.currentSeason}`,
      date: game.currentDate,
      type: InboxItemType.Derby,
      title: subject,
      body,
      isRead: false,
    })
  } else if (slot?.isCupFinalhelgen && fixture.isCup && fixture.roundNumber === 4) {
    const { subject, body } = cupFinalInboxPlaying(ctx)
    items.push({
      id: `inbox_cupfinalhelg_${fixture.id}`,
      date: game.currentDate,
      type: InboxItemType.Derby,
      title: subject,
      body,
      isRead: false,
    })
  }
  // Nyårsbandy: ingen inbox per spec

  return items
}

function generateSpecialDateInboxSpectator(game: SaveGame): InboxItem[] {
  const smFinal = game.fixtures.find(f =>
    f.isFinaldag &&
    f.status !== 'completed' &&
    f.homeClubId !== game.managedClubId &&
    f.awayClubId !== game.managedClubId
  )
  if (!smFinal) return []

  const alreadySent = game.inbox.some(i => i.id === `inbox_finaldag_spectator_${game.currentSeason}`)
  if (alreadySent) return []

  const homeClub = game.clubs.find(c => c.id === smFinal.homeClubId)
  const awayClub = game.clubs.find(c => c.id === smFinal.awayClubId)
  const ctx: SpecialDateContext = {
    isHomePlayer: false,
    homeClubName: homeClub?.name ?? '',
    awayClubName: awayClub?.name ?? '',
    arenaName: homeClub?.arenaName ?? 'arenan',
    venueCity: homeClub?.shortName ?? '',
  }
  const { subject, body } = finaldagInboxSpectator(ctx)
  return [{
    id: `inbox_finaldag_spectator_${game.currentSeason}`,
    date: game.currentDate,
    type: InboxItemType.Playoff,
    title: subject,
    body,
    isRead: false,
  }]
}

function stripCompletedFixture(f: Fixture, managedFixtureId?: string, managedClubId?: string): Fixture {
  if (f.id === managedFixtureId) return f
  if (f.status !== FixtureStatus.Completed) return f

  const isManagedFixture = managedClubId != null &&
    (f.homeClubId === managedClubId || f.awayClubId === managedClubId)
  const margin = Math.abs((f.homeScore ?? 0) - (f.awayScore ?? 0))
  // Derby/playoff/blowout managed fixtures keep playerRatings for GranskaScreen
  const preserveRatings = isManagedFixture && (
    getRivalry(f.homeClubId, f.awayClubId) !== null || f.matchday > 22 || margin >= 3
  )

  // ── Event retention after match completion ──────────────────────────────────
  // PERSISTENT (kept in fix.events for all completed fixtures):
  //   Goal      — primary scoring record; carries isCornerGoal + isPenaltyGoal flags
  //   RedCard   — bandy 10-min suspensions (MatchEventType.Suspension used for all suspensions)
  //   YellowCard — kept for completeness (not emitted in current bandy engine)
  //
  // TRANSIENT (stripped to save memory — not available after this point):
  //   Assist, Save, Corner, Penalty, Substitution, Shot, Injury, FullTime
  //
  // IF YOU ADD NEW TRACKING that needs to survive beyond the live match:
  //   Option A — add a boolean flag on a persistent event (like isPenaltyGoal on Goal)
  //   Option B — add the event type to the filter below
  //   Do NOT use a transient event as your source of truth in stats.ts or any
  //   post-match analysis. See LESSONS.md §20.
  const strippedEvents = f.events
    .filter(e => e.type === MatchEventType.Goal || e.type === MatchEventType.Suspension)
    .map(e => ({ ...e, description: '' }))

  return {
    ...f,
    events: strippedEvents,
    homeLineup: stripLineup(f.homeLineup),
    awayLineup: stripLineup(f.awayLineup),
    report: preserveRatings || !f.report ? f.report : { ...f.report, playerRatings: {} },
  }
}

// Types that must never be auto-expired — user action may be required
const INBOX_PROTECTED_TYPES = new Set<InboxItemType>([
  InboxItemType.TransferOffer,
  InboxItemType.ContractExpiring,
  InboxItemType.Retirement,
  InboxItemType.TransferBidReceived,
  InboxItemType.YouthIntake,
  InboxItemType.ScoutReport,
  InboxItemType.TransferDeadline,
])

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

  // Push milestone inbox items
  newInboxItems.push(...milestoneInboxItems)

  // ── WEAK-006/DEV-009: Captain morale cascade ──────────────────────────────
  {
    const cascadeResult = applyCaptainMoraleCascade(finalPlayers, game, nextMatchday, newInboxItems)
    finalPlayers = cascadeResult.updatedPlayers
    if (cascadeResult.captainCrisisMoment) newMoments.push(cascadeResult.captainCrisisMoment)
  }

  // ── Per-round development for managed club players ────────────────────────
  const updatedChemistryStats = { ...(game.chemistryStats ?? {}) }
  {
    const managedFixture = simulatedFixtures.find(
      f => f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId
    )
    const playedIds = new Set<string>()
    const starterIds = new Set<string>()
    const ratings: Record<string, number> = {}

    if (managedFixture) {
      const isHome = managedFixture.homeClubId === game.managedClubId
      const lineup = isHome ? managedFixture.homeLineup : managedFixture.awayLineup
      if (lineup) {
        for (const id of lineup.startingPlayerIds ?? []) { starterIds.add(id); playedIds.add(id) }
        for (const id of lineup.benchPlayerIds ?? []) { playedIds.add(id) }
      }

      // Update chemistry stats — 90 min for each pair of starters
      const starters = Array.from(starterIds)
      for (let i = 0; i < starters.length; i++) {
        for (let j = i + 1; j < starters.length; j++) {
          const key = [starters[i], starters[j]].sort().join('|')
          updatedChemistryStats[key] = (updatedChemistryStats[key] ?? 0) + 90
        }
      }
      if (managedFixture.report?.playerRatings) {
        Object.assign(ratings, managedFixture.report.playerRatings)
      }
    }

    // Map TrainingType to the three focus buckets used by applyRoundDevelopment
    const trainingType = game.managedClubTraining?.type
    const focusBucket = (trainingType === TrainingType.Tactical || trainingType === TrainingType.MatchPrep)
      ? 'tactical'
      : (trainingType === TrainingType.Physical || trainingType === TrainingType.Skating)
        ? 'physical'
        : (trainingType === TrainingType.BallControl || trainingType === TrainingType.Passing || trainingType === TrainingType.Shooting)
          ? 'technical'
          : 'physical'

    const intensityRaw = game.managedClubTraining?.intensity
    // O4 (DOM_BURNOUT_2026-08-17.md, 2026-08-23): "Sänk tempot på träningen"
    // (burnoutRelief) tvingar 'light' till och med burnoutTrainingSlowdownUntilRound
    // — en override, INTE en ändring av spelarens egen Träna-flik-inställning
    // (game.managedClubTraining.intensity förblir orört, bara den EFFEKTIVA
    // intensiteten denna omgång sänks).
    const burnoutSlowdownActive = (game.burnoutTrainingSlowdownUntilRound ?? 0) >= nextMatchday
    const intensityBucket = burnoutSlowdownActive ? 'light'
      : intensityRaw === TrainingIntensity.Light ? 'light'
      : (intensityRaw === TrainingIntensity.Hard || intensityRaw === TrainingIntensity.Extreme) ? 'heavy'
      : 'normal'

    finalPlayers = applyRoundDevelopment(
      finalPlayers,
      game.managedClubId,
      focusBucket,
      intensityBucket,
      playedIds,
      starterIds,
      ratings,
      game.leadershipActions,
      nextMatchday,
    )

    // Mentor effect for A-team adepts (P19 is handled in youthProcessor — no overlap)
    const youthPlayerIds = new Set((game.youthTeam?.players ?? []).map(p => p.id))
    for (const m of (game.mentorships ?? []).filter(ms => ms.isActive)) {
      if (youthPlayerIds.has(m.youthPlayerId)) continue
      const mentor = finalPlayers.find(p => p.id === m.seniorPlayerId)
      if (!mentor || mentor.form < MENTOR_FORM_THRESHOLD) continue
      const devBoost = mentor.discipline / 20
      finalPlayers = finalPlayers.map(p => p.id === m.youthPlayerId
        ? { ...p, developmentRate: Math.min(100, p.developmentRate + devBoost * 0.1) }
        : p
      )
    }
  }

  // A1 — Notisdiet: egna matchresultat skapas INTE i inkorgen.
  // Spelaren har just upplevt matchen och ser allt i Granska.

  // Injury notifications + DREAM-003 star injury ripple
  let gameAfterRipples = game
  const roundRippleChains: RippleChain[] = []
  // MIGRATIONSPLAN_HANDELSELIGGAREN Fas 4+ (2026-09-02) — dual-write av alla
  // tre systemtriggarna (star_injured/big_derby_win/mecenat_left).
  const rippleLedgerEntries: EventLedgerEntry[] = []
  for (const { player, days } of newlyInjured) {
    const clubId = player.clubId
    if (clubId === game.managedClubId) {
      newInboxItems.push(createInjuryItem(player, days, game.currentDate, game.doctor))
      const beforeStarRipple = gameAfterRipples
      gameAfterRipples = applyRipples(gameAfterRipples, { type: 'star_injured', playerId: player.id })
      const starInjuryChain = describeRippleChain(beforeStarRipple, gameAfterRipples, 'star_injured',
        `${player.firstName} ${player.lastName}`, nextMatchday, game.currentSeason)
      roundRippleChains.push(starInjuryChain)
      const starInjuryLedgerEntry = buildSystemRippleLedgerEntry(starInjuryChain, 'star_injury', { kind: 'player', id: player.id })
      if (starInjuryLedgerEntry) rippleLedgerEntries.push(starInjuryLedgerEntry)
      if (player.currentAbility >= 65) {
        newMoments.push({
          id: `moment_injury_${player.id}_${nextMatchday}`,
          source: 'star_injury',
          matchday: nextMatchday,
          season: game.currentSeason,
          title: `${player.firstName} ${player.lastName} är borta`,
          body: `Sidan han spelade på blir tunnare. Klacken vet det. ${days} dagar minst.`,
          subjectPlayerId: player.id,
        })
      }
    }
  }

  // Suspension notifications
  // PÅSTÅENDEKARTAN (2026-08-24): hårdkodade tidigare 3 matcher oavsett
  // faktisk längd — sanningen (`player.suspensionGamesRemaining`, satt till
  // 1 av matchstraffet några steg tidigare i playerStateProcessor.ts) fanns
  // redan på samma objekt men lästes aldrig. Maskerat idag av att
  // SUSPENSION_INCIDENT_LINES saknar {kvar}-token, men den icke-mallade
  // fallback-raden ("avstängd i {gamesOut} match(er)") hade visat "3" rakt av.
  for (const { player } of newlySuspended) {
    if (player.clubId === game.managedClubId) {
      newInboxItems.push(createSuspensionItem(player, player.suspensionGamesRemaining, game.currentDate, game.currentSeason))
    }
  }

  // Recovery notifications (players who were injured before this round and are now healed)
  for (const player of updatedPlayers) {
    if (player.clubId === game.managedClubId && injuredBeforeRound.has(player.id) && !player.isInjured) {
      newInboxItems.push(createRecoveryItem(player, game.currentDate))
    }
  }

  // Pool 1c: spela-på-eftersnack (doktorns röst, PLAY_THROUGH_AFTERMATH)
  for (const { player, aftermathLine } of playThroughResolutions) {
    if (player.clubId === game.managedClubId) {
      newInboxItems.push(createPlayThroughAftermathItem(player, aftermathLine, game.currentDate))
    }
  }

  // ── Board milestone messages at league rounds 7, 14, 22 ──────────────
  const BOARD_MILESTONES = [7, 14, 22]
  if (!isCupRound && !isPlayoffRound && currentLeagueRound !== null && BOARD_MILESTONES.includes(currentLeagueRound)) {
    const managedClub = game.clubs.find(c => c.id === game.managedClubId)
    const managedStanding = standings.find(s => s.clubId === game.managedClubId)
    if (managedClub && managedStanding) {
      // Skutskär-auditens test 2, Jacobs dom 2026-08-24: evaluateBoard läser
      // nu game.boardPatience (samma ackumulerade värde som portalens
      // getBoardPatienceZone), inte längre position/expectation — se
      // boardService.ts:s kommentar på funktionen.
      const evaluation = evaluateBoard(game.boardPatience ?? 70)
      const { title, body } = generateBoardMessage(evaluation, managedClub.name, currentLeagueRound)
      const alreadySent = game.inbox.some(
        i => i.id === `inbox_board_r${currentLeagueRound}_${game.currentSeason}`
      )
      if (!alreadySent) {
        newInboxItems.push({
          id: `inbox_board_r${currentLeagueRound}_${game.currentSeason}`,
          date: game.currentDate,
          type: InboxItemType.BoardFeedback,
          title,
          body,
          isRead: false,
        })
      }
    }
  }

  // ── Mid-season triggers — Halvtidsrapport + 6 andra milstolpar ──────
  // Anropas med uppdaterade standings + allFixtures så lastMatchday och placering är aktuella.
  newInboxItems.push(...checkMidSeasonEvents({ ...game, standings, fixtures: allFixtures }))

  // ── C-K1: Landslagsuttagning — VM-uppehåll vid omgång 14 ─────────────
  // calendarSlot here uses same logic as the one declared below; resolved early for national team trigger
  const nationalTeamCalSlot = (game.seasonCalendar ?? []).find(s => s.matchday === nextMatchday)
  let nationalTeamUpdatedPlayers = finalPlayers
  let nationalTeamCampState = game.activeNationalTeamCamp
  let nationalTeamSnub = game.lastNationalSnub
  // Release-svepet 2026-07-21 (Block 2c) — se appendet vid updatedGame nedan
  // (samma "lägg på i efterhand"-mönster som marketValueInbox): finansbonusen
  // appliceras mot updatedGame.clubs i slutet, inte här, för att slippa tråckla
  // en ny clubs-variabel genom hela economy/transfer-kedjan (rad ~900-1400)
  // som redan ligger EFTER den här punkten i funktionen.
  let nationalTeamCallupBonusTkr = 0
  let nationalTeamCallupModal = game.pendingCallupModal

  // Trigger callup on landslagsuppehall round
  if (nationalTeamCalSlot?.isLandslagsuppehall && !isCupRound && !isPlayoffRound && !game.activeNationalTeamCamp) {
    const calledUpIds = selectNationalTeam({ ...game, players: nationalTeamUpdatedPlayers })
    if (calledUpIds.length > 0) {
      const callupResult = applyCallupEffects(game, nationalTeamUpdatedPlayers, calledUpIds, nextMatchday)
      nationalTeamUpdatedPlayers = callupResult.players
      nationalTeamCampState = callupResult.activeNationalTeamCamp
      newInboxItems.push(...callupResult.inboxItems)
      nationalTeamCallupBonusTkr = callupResult.callupModal.bonusTkr
      nationalTeamCallupModal = callupResult.callupModal
    }

    // M16 (regelboksanpassning 2026-07-03): snub-mekaniken flyttad utanför
    // calledUpIds.length > 0-grinden. Uttagningen är nu förtjänstgated (0-2,
    // LANDSLAGS_CA_TROSKEL) — det dramaturgiskt sanna ögonblicket är bästa
    // spelaren STRAX under tröskeln när 0 eller 1 tas ut, inte bara när någon
    // redan tagits ut. Vid cap (2 uttagna) triggar inte snuben — klubben fick
    // redan sin fulla tilldelning.
    if (calledUpIds.length < CALLUP_CAP) {
      const snubCandidate = nationalTeamUpdatedPlayers
        .filter(p =>
          p.clubId === game.managedClubId &&
          !calledUpIds.includes(p.id) &&
          p.currentAbility < LANDSLAGS_CA_TROSKEL &&
          p.currentAbility >= LANDSLAGS_CA_TROSKEL - 5
        )
        .sort((a, b) => b.currentAbility - a.currentAbility)[0]

      if (snubCandidate) {
        nationalTeamUpdatedPlayers = nationalTeamUpdatedPlayers.map(p => {
          if (p.id !== snubCandidate.id) return p
          return {
            ...p,
            form: Math.max(0, p.form - 3),
            morale: Math.max(0, p.morale - 5),
          }
        })
        nationalTeamSnub = {
          playerId: snubCandidate.id,
          season: game.currentSeason,
          round: nextMatchday,
        }
        const snubTemplate = SNUB_SCENE_LINES[game.currentSeason % SNUB_SCENE_LINES.length]
        const snubBody = snubTemplate.replace('{spelare}', `${snubCandidate.firstName} ${snubCandidate.lastName}`)
        const snubInboxId = `inbox_vm_snub_${game.currentSeason}`
        if (!game.inbox.some(i => i.id === snubInboxId)) {
          newInboxItems.push({
            id: snubInboxId,
            date: game.currentDate,
            type: InboxItemType.Community,
            title: 'Förbi utan VM-kallelse',
            body: snubBody,
            isRead: false,
          })
        }
      }
    }
  }

  // Return from national team camp
  // Release-svepet 2026-07-21 (Block 2a): pending+expires-mönster, samma
  // form som pendingVictoryEcho/victoryEchoExpires — konsumeras av
  // coffeeRoomService.ts som en ovillkorad kafferums-scen.
  let nationalTeamReturnLine = game.pendingNationalTeamReturn
  let nationalTeamReturnExpiresState = game.nationalTeamReturnExpires
  if (game.activeNationalTeamCamp && nextMatchday > game.activeNationalTeamCamp.endRound) {
    const returnResult = applyReturnEffects(game, nationalTeamUpdatedPlayers, game.activeNationalTeamCamp)
    nationalTeamUpdatedPlayers = returnResult.players
    nationalTeamCampState = undefined
    newInboxItems.push(...returnResult.inboxItems)
    nationalTeamReturnLine = { text: returnResult.returnLine }
    nationalTeamReturnExpiresState = nextMatchday + 1
  } else if (nextMatchday > (nationalTeamReturnExpiresState ?? 0)) {
    nationalTeamReturnLine = undefined
    nationalTeamReturnExpiresState = undefined
  }

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

  // Merge national team player updates into finalPlayers
  if (nationalTeamUpdatedPlayers !== finalPlayers) {
    finalPlayers = finalPlayers.map(p => {
      const updated = nationalTeamUpdatedPlayers.find(u => u.id === p.id)
      return updated ?? p
    })
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
  if (justCompletedManagedFixture && !justCompletedManagedFixture.report?.managerChoiceLog) {
    const isHome = justCompletedManagedFixture.homeClubId === game.managedClubId
    const lineup = isHome ? justCompletedManagedFixture.homeLineup : justCompletedManagedFixture.awayLineup
    const choiceLog: ManagerChoiceEntry[] = []
    if (game.captainPlayerId) {
      choiceLog.push({ type: 'captain', playerId: game.captainPlayerId, detail: game.captainPlayerId })
    }
    for (const pid of (lineup?.startingPlayerIds ?? [])) {
      const player = game.players.find(p => p.id === pid)
      if (player && (player.fitness ?? 100) < 40) {
        choiceLog.push({
          type: 'started_tired', playerId: pid, detail: `condition_${Math.round(player.fitness ?? 0)}`,
          ...(lineup?.autoSelected && { autoSelected: true }),
        })
      }
    }
    for (const pid of (lineup?.benchPlayerIds ?? [])) {
      const player = game.players.find(p => p.id === pid)
      if (player && (player.fitness ?? 100) > 80) {
        choiceLog.push({ type: 'bench_fit', playerId: pid, detail: `condition_${Math.round(player.fitness ?? 0)}` })
      }
    }
    if (choiceLog.length > 0) {
      const enriched = {
        ...justCompletedManagedFixture,
        report: { ...justCompletedManagedFixture.report!, managerChoiceLog: choiceLog },
      }
      justCompletedManagedFixture = enriched
      allFixtures = allFixtures.map(f => f.id === enriched.id ? enriched : f)
    }
  }

  // DREAM-003: derby win ripple — big margin win in a derby gives cross-system boosts
  if (justCompletedManagedFixture) {
    const isDerby = getRivalry(justCompletedManagedFixture.homeClubId, justCompletedManagedFixture.awayClubId) !== null
    if (isDerby) {
      if (deriveUtfall(justCompletedManagedFixture, game.managedClubId) === 'vunnet') {
        const rivalClub = game.clubs.find(c => c.id === (justCompletedManagedFixture.homeClubId === game.managedClubId ? justCompletedManagedFixture.awayClubId : justCompletedManagedFixture.homeClubId))
        const beforeDerbyRipple = gameAfterRipples
        gameAfterRipples = applyRipples(gameAfterRipples, { type: 'big_derby_win', fixtureId: justCompletedManagedFixture.id })
        const derbyChain = describeRippleChain(beforeDerbyRipple, gameAfterRipples, 'big_derby_win',
          rivalClub?.name, nextMatchday, game.currentSeason)
        roundRippleChains.push(derbyChain)
        const derbyLedgerEntry = buildSystemRippleLedgerEntry(derbyChain, 'derby_win', rivalClub ? { kind: 'club', id: rivalClub.id } : undefined)
        if (derbyLedgerEntry) rippleLedgerEntries.push(derbyLedgerEntry)
        newMoments.push({
          id: `moment_derby_${justCompletedManagedFixture.id}`,
          source: 'derby_win',
          matchday: nextMatchday,
          season: game.currentSeason,
          title: `Derbyt mot ${rivalClub?.name ?? 'rivalen'} sitter kvar`,
          body: 'Klacken sjöng hela vägen till bilen. Två sponsorer hörde av sig i morse. Hälsningar från orten.',
          subjectClubId: rivalClub?.id,
        })
      }
    }
  }

  // C-B2: detect notable result for klack echo (after match completes)
  let updatedKlackEcho = game.klackEcho ? decayKlackEcho(game.klackEcho) : undefined
  let newKlackEchoType: string | undefined  // U5: bara satt när en NY eko faktiskt triggas, inte vid ren decay
  if (justCompletedManagedFixture) {
    const echo = detectNotableResult(justCompletedManagedFixture, { ...game, fixtures: simulatedFixtures })
    if (echo) {
      updatedKlackEcho = { ...echo, currentWeight: echo.initialWeight }
      newKlackEchoType = echo.type
    }
  }

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

  // P1 — Annandagen val-trigger: 2 omgångar innan hemmamatch på annandagen
  let pendingAnnandagsVal = game.pendingAnnandagsVal ?? false
  const annandagenHomeFix = (!game.annandagsValGjort && !game.pendingAnnandagsVal)
    ? finalAllFixtures.find(f => f.isAnnandagen && f.homeClubId === game.managedClubId && f.status === FixtureStatus.Scheduled)
    : undefined
  if (annandagenHomeFix && annandagenHomeFix.matchday - nextMatchday === 2) {
    pendingAnnandagsVal = true
  }

  // Special-date day-before inbox: annandagen, nyårsbandy, finaldag, cup-finalhelgen
  const remainingScheduled2 = finalAllFixtures.filter(f => f.status === FixtureStatus.Scheduled)
  let upcomingManagedFix: typeof remainingScheduled2[0] | undefined = undefined
  if (remainingScheduled2.length > 0) {
    const upcomingMatchday2 = Math.min(...remainingScheduled2.map(f => f.matchday))
    upcomingManagedFix = remainingScheduled2.find(
      f => f.matchday === upcomingMatchday2 &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    )
    if (upcomingManagedFix) {
      const specialInboxItems = generateSpecialDateInbox(upcomingManagedFix, game, upcomingMatchday2)
      for (const item of specialInboxItems) {
        if (!game.inbox.some(i => i.id === item.id)) {
          newInboxItems.push(item)
        }
      }
    } else {
      // Managed club not playing — check for SM-final spectator inbox
      for (const item of generateSpecialDateInboxSpectator(game)) {
        newInboxItems.push(item)
      }
    }
  }

  // C-T2: deadline-dag — AI-bud om nästa match är transferfönstrets deadline-dag
  if (upcomingManagedFix?.isWindowDeadlineDay && localRand() < 0.35) {
    const deadlineBidId = `deadline_window_bid_${game.currentSeason}_${nextMatchday}`
    const alreadySent = game.inbox.some(i => i.id === deadlineBidId)
    if (!alreadySent) {
      const favPlayerId = game.supporterGroup?.favoritePlayerId
      const bestPlayer = game.players
        .filter(p =>
          p.clubId === game.managedClubId &&
          !p.isInjured &&
          p.id !== favPlayerId
        )
        .sort((a, b) => b.currentAbility - a.currentAbility)[0]
      const aiClubs = game.clubs.filter(c => c.id !== game.managedClubId)
      const randomAIClub = aiClubs.length > 0
        ? aiClubs[Math.floor(localRand() * aiClubs.length)]
        : null
      if (bestPlayer && randomAIClub) {
        const template = DEADLINE_AI_BID_TEXT[Math.floor(localRand() * DEADLINE_AI_BID_TEXT.length)]
        const playerName = `${bestPlayer.firstName} ${bestPlayer.lastName}`
        const body = template
          .replace('{club}', randomAIClub.name)
          .replace('{player}', playerName)
        newInboxItems.push({
          id: deadlineBidId,
          date: game.currentDate,
          type: InboxItemType.TransferDeadline,
          title: `Sent bud på deadline-dagen`,
          body,
          relatedPlayerId: bestPlayer.id,
          relatedClubId: randomAIClub.id,
          isRead: false,
        })
      }
    }
  }

  const marketUpdatedPlayers = updateAllMarketValues(
    updateLowMoraleDays(finalPlayers),
    game.currentSeason
  )

  // ── Player availability + trainer arc ──────────────────────────────────
  const availabilityUpdatedPlayers = updatePlayerAvailability({ ...game, players: marketUpdatedPlayers })
  const updatedArc = updateTrainerArc({ ...game, players: availabilityUpdatedPlayers, fixtures: finalAllFixtures, standings })
  // U1 andra halvan (2026-08-22): löpande boardPatience, samma omgång/samma
  // fixture-underlag som trainerArc — se boardService.ts:s egen kommentar
  // för rotorsaken (boardPatience kunde tidigare bara röra sig vid
  // säsongsslut). consecutiveLosses skickas in explicit (inte läst från
  // game.trainerArc, som fortfarande är FÖRRA omgångens värde här).
  const runningPatienceUpdate = updateRunningBoardPatience(
    { ...game, players: availabilityUpdatedPlayers, fixtures: finalAllFixtures, standings },
    updatedArc.consecutiveLosses,
  )

  // ── Board objectives check-in (round 7, 14, 22) ──────────────────────
  const leagueRound = currentLeagueRound ?? 0
  let updatedBoardObjectives = game.boardObjectives ?? []
  let boardObjSponsorDelta = 0
  let boardObjTrustDelta = 0
  let boardObjForetroendepott = 0
  if ([7, 14, 22].includes(leagueRound) && updatedBoardObjectives.length > 0) {
    const gameForEval = { ...game, players: availabilityUpdatedPlayers, fixtures: finalAllFixtures, standings }
    const { updated, inboxMessages, sponsorNetworkMoodDelta: objSponsorDelta, boardTrustDelta, foretroendepottAmount } = checkInObjectives(updatedBoardObjectives, gameForEval)
    updatedBoardObjectives = updated
    boardObjSponsorDelta = objSponsorDelta
    boardObjTrustDelta = boardTrustDelta
    boardObjForetroendepott = foretroendepottAmount
    for (const msg of inboxMessages) {
      newInboxItems.push({
        id: `inbox_boardobj_${leagueRound}_${msg.title.slice(0, 10)}_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.BoardFeedback,
        title: msg.title,
        body: msg.body,
        isRead: false,
      })
    }
    if (foretroendepottAmount > 0) {
      newInboxItems.push({
        id: `inbox_foretroendepott_${game.currentSeason}_${leagueRound}`,
        date: game.currentDate,
        type: InboxItemType.BoardFeedback,
        title: 'Styrelsens förtroendepott',
        body: `Två raka säsonger med uppfyllt flaggskeppsmål. Styrelsen tillskjuter 62 500 kr som anläggnings- eller transferkredit.`,
        isRead: false,
      })
    }
  }

  // ── Market value change tracking — inbox for significant changes ──────────
  const prevValues = game.previousMarketValues ?? {}
  const newPrevValues: Record<string, number> = {}
  const marketValueInbox: InboxItem[] = []
  for (const p of availabilityUpdatedPlayers.filter(pp => pp.clubId === game.managedClubId)) {
    const prev = prevValues[p.id] ?? p.marketValue
    newPrevValues[p.id] = p.marketValue
    const delta = p.marketValue - prev
    const pct = prev > 0 ? Math.abs(delta) / prev : 0
    if (pct >= 0.15 && Math.abs(delta) >= 10000) {
      const arrow = delta > 0 ? '↑' : '↓'
      const sign = delta > 0 ? '+' : ''
      marketValueInbox.push({
        id: `mv_${p.id}_${nextMatchday}`,
        date: game.currentDate,
        type: 'playerDevelopment' as InboxItemType,
        title: `${arrow} ${p.firstName} ${p.lastName} — marknadsvärde ${sign}${Math.round(delta / 1000)} tkr`,
        body: `Nytt värde: ${Math.round(p.marketValue / 1000)} tkr (${sign}${Math.round(pct * 100)}%)`,
        isRead: false,
      })
    }
  }

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
    { skipSideEffects: isSecondPassForManagedMatch },
  )
  const { roundFinanceLog, updatedClubs: socialMediaBoostedClubs, clearAnnandagsGratisentreVal } = economyResult

  // ── Transfer bids ────────────────────────────────────────────────────────
  const transferResult = processTransferBids(game, availabilityUpdatedPlayers, nextMatchday, newDate, localRand)
  newInboxItems.push(...transferResult.inboxItems)
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
      if (mecenatLedgerEntry) rippleLedgerEntries.push(mecenatLedgerEntry)
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

  // Stamp new inbox items with creation matchday for cleanup
  // A4 — Notisdiet: dedup on id — same (kind+subject+round) must not create two items
  const existingIds = new Set(game.inbox.map(i => i.id))
  const dedupedNewItems = newInboxItems.filter(i => !existingIds.has(i.id))
  const stampedNewInboxItems = dedupedNewItems.map(i =>
    i.createdMatchday === undefined
      ? { ...i, createdMatchday: nextMatchday, createdRound: currentLeagueRound ?? null }
      : i
  )

  const INBOX_GALLRING_ROUNDS = 2
  const INBOX_UNREAD_EXPIRY_ROUNDS = 4
  const gallredOldInbox = game.inbox.filter(i => {
    if (i.createdMatchday === undefined) return true
    const age = nextMatchday - i.createdMatchday
    if (i.isRead) return age < INBOX_GALLRING_ROUNDS
    if (INBOX_PROTECTED_TYPES.has(i.type)) return true
    return age < INBOX_UNREAD_EXPIRY_ROUNDS
  })

  // Trim accumulated data to prevent localStorage bloat
  const MAX_INBOX = 50
  let trimmedInbox = [...gallredOldInbox, ...stampedNewInboxItems]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_INBOX)

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
  let { csBoost, updatedFacilityState, facilityBonusTotal, facilityCapacityBonus, updatedVolunteers, updatedVolunteerMorale } = communityResult
  // ANSPRÅK 4, spak 3: staleness-klockan (backfylld i processCommunity).
  const updatedCommunityActivitiesSince = communityResult.updatedCommunityActivitiesSince

  // Sprint 26: mean reversion — puls driftar mot 60 med 3% per omgång.
  // Tillämpas INNAN övriga puls-ändringar så att matchresultat/aktiviteter aktivt motverkar driften.
  const DRIFT_TARGET = 60
  const DRIFT_STRENGTH = 0.03
  const currentCs = game.communityStanding ?? 50
  const driftDelta = (DRIFT_TARGET - currentCs) * DRIFT_STRENGTH
  csBoost += driftDelta

  if (facilityBonusTotal > 0 || facilityCapacityBonus > 0) {
    postTransferClubs = postTransferClubs.map(c =>
      c.id === game.managedClubId
        ? {
            ...c,
            facilities: Math.min(100, c.facilities + facilityBonusTotal),
            // B1 §3 (close-out): en byggd anläggning höjer kapacitetstaket PERMANENT, engång
            // vid completion. arenaCapacity = lagrad bas + Σ facility-bonusar (init från
            // reputation-deriverad bas om ostörd). Närvaron cappas dynamiskt mot taket.
            ...(facilityCapacityBonus > 0
              ? { arenaCapacity: (c.arenaCapacity ?? Math.round(c.reputation * 7 + 150)) + facilityCapacityBonus }
              : {}),
          }
        : c
    )
  }
  // M13: apply kommunstöd one-time bonus to club finances
  // §6-arkitekturen (D042-fyndet, Jacobs körorder 2026-09-01): routad genom
  // applyFinanceChange, economyService.ts:s ENDA dokumenterade mutationspunkt.
  if (kommunstodBonus > 0) {
    postTransferClubs = applyFinanceChange(postTransferClubs, game.managedClubId, kommunstodBonus)
  }

  // ── Matchhall completion: stage → 'klar' + hasIndoorArena ─────────────────
  if (communityResult.completedNodeId === 'matchhall' && updatedFacilityState?.hallTrial) {
    updatedFacilityState = {
      ...updatedFacilityState,
      // completedSeason (Block 3e): enda platsen stage sätts till 'klar' —
      // riktig säsong, inte en gissning (se HallTrial.completedSeason).
      hallTrial: { ...updatedFacilityState.hallTrial, stage: 'klar', completedSeason: game.currentSeason },
    }
    postTransferClubs = postTransferClubs.map(c =>
      c.id === game.managedClubId ? { ...c, hasIndoorArena: true } : c
    )
  }

  // ── Scandals (Lager 1 — Världshändelser) ──────────────────────────────────
  const scandalResult = processScandals(preEventGame, nextMatchday, localRand, { skipSideEffects: isSecondPassForManagedMatch })
  newInboxItems.push(...scandalResult.inboxItems)

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
      postTransferClubs,
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

    // Dropped events go to inbox as notiser so they're not lost
    if (droppedAtmospheric.length > 0) {
      const droppedInboxItems: InboxItem[] = droppedAtmospheric.map(e => ({
        id: `inbox_evt_${e.id}`,
        date: newDate,
        type: InboxItemType.Community,
        title: e.title,
        body: e.body,
        isRead: false,
      }))
      trimmedInbox = [...trimmedInbox, ...droppedInboxItems]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, MAX_INBOX)
    }
  }

  const newClubEra = calculateClubEra(game)

  // Del 1: Patron emergence — triggers when era ≥ fotfäste, CS threshold met, no active patron, not in cooldown
  if (
    newClubEra !== 'survival' &&
    !game.patron?.isActive &&
    (game.communityStanding ?? 50) >= PATRON_EMERGE_CS
  ) {
    const patronCooldownOk = !game.patronWithdrawnSeason ||
      game.currentSeason > game.patronWithdrawnSeason + 2
    if (patronCooldownOk) {
      const emergeId = `patron_emerge_${game.currentSeason}`
      const alreadyQueued = (game.pendingEvents ?? []).some(e => e.id === emergeId) ||
        (game.resolvedEventIds ?? []).includes(emergeId) ||
        game.inbox.some(i => i.id === emergeId) ||
        allNewEvents.some(e => e.id === emergeId)
      if (!alreadyQueued) {
        const emergeEvent = generatePatronEmergenceEvent(game, localRand)
        if (emergeEvent) allNewEvents.push(emergeEvent)
      }
    }
  }

  // "Takmodellen", patronens del (Jacobs dom 2026-08-26, RAPPORT_FYRA_
  // UTREDNINGAR_2026-08-26.md punkt 4): relationen var bekräftat
  // enkelriktad — communityStanding avgjorde bara ANKOMST (PATRON_EMERGE_CS
  // ovan), aldrig AVHOPP. Om ortstödet faller under samma tröskel medan en
  // patron är aktiv ska den lämna — annars är orten en spärr man passerar
  // en gång, inte en spak i båda riktningarna. Samma effekttyp
  // ('patronWithdrawn') som den befintliga happiness-baserade avgångsvägen
  // återanvänds för resolutionen — ETT ställe sätter patronWithdrawnSeason.
  let patronWithdrawnSeasonAfterCsEviction = eventResult.patronWithdrawnSeason
  if (updatedPatron?.isActive && (game.communityStanding ?? 50) < PATRON_EMERGE_CS) {
    const evictionId = `patron_cs_eviction_${game.currentSeason}`
    const alreadyQueued = (game.pendingEvents ?? []).some(e => e.id === evictionId) ||
      game.inbox.some(i => i.id === evictionId) ||
      allNewEvents.some(e => e.id === evictionId)
    if (!alreadyQueued) {
      updatedPatron = { ...updatedPatron, isActive: false }
      patronWithdrawnSeasonAfterCsEviction = game.currentSeason
      allNewEvents.push({
        id: evictionId,
        type: 'patronWithdrawal',
        // Orsaken är orten, inte relationen till patronen själv: ortstödet
        // (communityStanding) har fallit under tröskeln som förde patronen
        // hit, så premissen — en klubb bygden bär — är borta. Skild från den
        // happiness-baserade avgångstexten.
        title: `${updatedPatron.name ?? 'Patronen'} drar sig ur`,
        body: `${updatedPatron.name ?? 'Patronen'} ber att få träffas en sista gång. Lugnt, sakligt, utan bitterhet.\n\n"Jag gick in i det här när orten stod bakom laget. Det var det jag ville vara med och bära — en klubb som bygden trodde på. Nu har läktaren tunnats ut och samtalet tystnat, och då är det inte min klubb att bära längre. Jag drar mig ur medan det ännu är i godo."\n\n${updatedPatron.name ?? 'Patronen'} lämnar. Det som byggts står kvar ett tag till, men handen under är borta.`,
        choices: [{ id: 'acknowledge', label: 'Noterat', effect: { type: 'patronWithdrawn' } }],
        resolved: false,
      })
    }
  }

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
    inbox: trimmedInbox,
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
    trainerArc: updatedArc,
    boardPatience: runningPatienceUpdate.boardPatience,
    boardPatienceLastCountedFixtureId: runningPatienceUpdate.boardPatienceLastCountedFixtureId,
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
      // Beslutsekonomi: only generate a weekly decision if budget allows.
      // Note: canAddDecision uses game state BEFORE this round's events are merged,
      // so allNewEvents count is not yet reflected — this is intentional (conservative).
      const gameWithNewEvents: SaveGame = {
        ...game,
        pendingEvents: [
          ...(game.pendingEvents ?? []).filter(e => !e.resolved),
          ...allNewEvents,
        ],
        resolvedWeeklyDecisions: game.resolvedWeeklyDecisions ?? [],
      }
      const budgetOk = canAddDecision(gameWithNewEvents, nextMatchday)
      const rawNewDecision = budgetOk
        ? generateWeeklyDecision(gameWithNewEvents, nextMatchday)
        : null
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
    // fältet skrivs oförändrat (samma cap-5, samma konsumenter som idag,
    // t.ex. collectActiveMemories) tills dess sista läsare flyttat till
    // liggaren. Retireras sist, inte i denna omgång.
    recentMoments: [...(game.recentMoments ?? []), ...allNewMomentsThisRound]
      .sort((a, b) => (b.season - a.season) || (b.matchday - a.matchday))
      .slice(0, 5),
    // Liggarposten — durabel, ocappad. ClubMemoryView (Moment-läsytan) läser
    // härifrån nu (getRecentMomentsFromLedger), se momentLedgerService.ts.
    // rippleLedgerEntries: Fas 4+, alla tre systemtriggarna — se orsakVerkanService.ts.
    eventLedger: [...appendMomentsToLedger(game.eventLedger ?? [], allNewMomentsThisRound), ...rippleLedgerEntries],
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

  // Append market value change notifications to inbox
  if (marketValueInbox.length > 0) {
    updatedGame = { ...updatedGame, inbox: [...updatedGame.inbox, ...marketValueInbox] }
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
  {
    const existingArcs = updatedGame.activeArcs ?? []
    const newTriggers = detectArcTriggers(updatedGame, justCompletedManagedFixture ?? undefined)
    const allArcs = [...existingArcs, ...newTriggers]
    const arcResult = progressArcs(
      { ...updatedGame, activeArcs: allArcs },
      nextMatchday,
    )
    const arcInbox: InboxItem[] = arcResult.newInboxItems.map(item => ({
      ...item,
      date: updatedGame.currentDate,
      isRead: false,
    }))
    // BUG-009: prune stale resolving arcs (keep 2 matchdays for DEV-003 notification window)
    const cleanedArcs = arcResult.updatedArcs.filter(arc => {
      if (arc.phase !== 'resolving') return true
      return nextMatchday <= arc.expiresMatchday + 2
    })
    // B4 (arc): arc-events med low-prio går genom samma cap — slå inte igenom capet
    const MAX_LOW_IN_QUEUE = 5
    const existingLowCount = (updatedGame.pendingEvents ?? []).filter(
      e => !e.resolved && (e.priority ?? getEventPriority(e.type)) === 'low'
    ).length
    const arcLowEvents = arcResult.newEvents.filter(e => (e.priority ?? getEventPriority(e.type)) === 'low')
    const arcOtherEvents = arcResult.newEvents.filter(e => (e.priority ?? getEventPriority(e.type)) !== 'low')
    const arcLowAllowed = arcLowEvents.slice(0, Math.max(0, MAX_LOW_IN_QUEUE - existingLowCount))
    const arcLowDropped = arcLowEvents.slice(Math.max(0, MAX_LOW_IN_QUEUE - existingLowCount))
    const arcDroppedInbox: InboxItem[] = arcLowDropped.map(e => ({
      id: `inbox_arc_drop_${e.id}`,
      date: updatedGame.currentDate,
      type: InboxItemType.BoardFeedback,
      title: e.title,
      body: e.body,
      isRead: false,
    }))

    // U5 (SLUTTEST_KO.md, 2026-08-17): narrativeBeatLog-skrivväg 5/9. En post per
    // ny storyline (den faktiska narrativa "beat" som visas för spelaren) —
    // semanticKey = storyline.type, grovkornigt (skiljer inte per spelare;
    // det finkorniga per-karaktär-beslutet är medvetet skjutet till senare,
    // per DOM:en). Detta är exakt felklassen "Finalen. Birger…" upprepades.
    let narrativeBeatLogWithArcs = updatedGame.narrativeBeatLog
    for (const storyline of arcResult.newStorylines) {
      narrativeBeatLogWithArcs = logNarrativeBeat(
        { ...updatedGame, narrativeBeatLog: narrativeBeatLogWithArcs },
        storyline.type, storyline.season, storyline.matchday,
      )
    }

    updatedGame = {
      ...updatedGame,
      activeArcs: cleanedArcs,
      pendingEvents: [...(updatedGame.pendingEvents ?? []), ...arcOtherEvents, ...arcLowAllowed],
      storylines: [...(updatedGame.storylines ?? []), ...arcResult.newStorylines],
      inbox: [...updatedGame.inbox, ...arcInbox, ...arcDroppedInbox],
      narrativeBeatLog: narrativeBeatLogWithArcs,
    }
  }

  // ── B4: Globalt cap — low-prio events i kön (inte bara nya per omgång) ──
  {
    const MAX_LOW_IN_QUEUE = 5
    const allPending = updatedGame.pendingEvents ?? []
    const lowEvents = allPending.filter(e => !e.resolved && (e.priority ?? getEventPriority(e.type)) === 'low')
    if (lowEvents.length > MAX_LOW_IN_QUEUE) {
      const toSpill = lowEvents.slice(MAX_LOW_IN_QUEUE)
      const spillInbox: InboxItem[] = toSpill.map(e => ({
        id: `inbox_spill_${e.id}`,
        date: updatedGame.currentDate,
        type: InboxItemType.BoardFeedback,
        title: e.title,
        body: e.body,
        isRead: false,
      }))
      const toSpillIds = new Set(toSpill.map(e => e.id))
      updatedGame = {
        ...updatedGame,
        pendingEvents: allPending.filter(e => !toSpillIds.has(e.id)),
        inbox: [...updatedGame.inbox, ...spillInbox]
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, MAX_INBOX),
      }
    }
  }

  // ── B5: Rensa resolved events från state (sparar localStorage-utrymme) ──
  {
    const beforeClean = updatedGame.pendingEvents ?? []
    const cleaned = beforeClean.filter(e => !e.resolved)
    if (cleaned.length < beforeClean.length) {
      updatedGame = { ...updatedGame, pendingEvents: cleaned }
    }
  }

  // ── KF3: Avbrottsbudget — batch-cap på actionable decisions per omgång ──
  // Banden (informational/atmospheric) passerar oräknade.
  // Deferrade beslut från föregående omgångar promotas in i poolen (FIFO).
  {
    const priorDeferred = updatedGame.deferredDecisions ?? []
    // Slå ihop: äldre deferrade beslut har prioritet (prepend → surfar först)
    const allPending = [...priorDeferred, ...(updatedGame.pendingEvents ?? [])]

    // HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md): logiken är
    // extraherad till partitionInterruptBudget (decisionBudgetService.ts) —
    // oförändrad, plus måste-undantaget. Det här blocket ÄR kodbasens
    // faktiska deferrings-mekanism (tryQueueDecision har inget
    // produktionsanropsställe), så undantaget måste bo här för att vara
    // verkligt; extraktionen gör det testbart utan att köra en hel omgång.
    const { nonActionable, surface, deferred: newDeferred } =
      partitionInterruptBudget(allPending, nextMatchday)

    if (newDeferred.length > 0 || priorDeferred.length > 0) {
      updatedGame = {
        ...updatedGame,
        pendingEvents: [...nonActionable, ...surface],
        deferredDecisions: newDeferred.slice(0, MAX_DEFERRED_DECISIONS),
      }
    }
  }

  // Audit 2026-08-29 HIGH 9 (skadad-spela-vidare-kort på en frisk spelare).
  // Rotorsak: preconditionen prövades bara vid GENERERING, aldrig vid konsumtion.
  // Grinden bor nu i isPlayThroughInjuryCardStillValid (eventProcessor.ts, bredvid
  // generatorn) och körs på varje konsumtionspunkt — här, plus livematchvägen i
  // matchActions.ts (samma två-punkts-mönster som slutspelskorten redan har).
  //
  // Placerad EFTER KF3-avbrottsbudgeten, inte före: den gamla spärren låg ovanför
  // och rörde bara `pendingEvents`, så ett kort som trängts undan till
  // `deferredDecisions` promotades tillbaka in i poolen utan att någonsin ha
  // omprövats. Båda köerna filtreras nu, efter promoteringen.
  {
    const beforePending = updatedGame.pendingEvents ?? []
    const beforeDeferred = updatedGame.deferredDecisions ?? []
    const validPending = beforePending.filter(
      e => e.resolved || isPlayThroughInjuryCardStillValid(e, updatedGame),
    )
    const validDeferred = beforeDeferred.filter(
      e => e.resolved || isPlayThroughInjuryCardStillValid(e, updatedGame),
    )
    if (validPending.length < beforePending.length || validDeferred.length < beforeDeferred.length) {
      updatedGame = { ...updatedGame, pendingEvents: validPending, deferredDecisions: validDeferred }
    }
  }

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

  // ── Process pending follow-ups ──────────────────────────────────────────
  const followUps = updatedGame.pendingFollowUps ?? []
  if (followUps.length > 0) {
    const followUpInbox: InboxItem[] = []
    const remaining = followUps.filter(fu => {
      const elapsed = nextMatchday - fu.createdMatchday
      if (elapsed >= fu.matchdaysDelay) {
        // Follow-up triggered — create inbox notification
        const text = (fu.data?.text as string) ?? 'Uppföljning från tidigare händelse.'
        followUpInbox.push({
          id: `inbox_fu_${fu.id}`,
          date: updatedGame.currentDate,
          type: InboxItemType.BoardFeedback,
          title: 'Uppföljning',
          body: text,
          isRead: false,
        })
        return false // remove from pending
      }
      return true // keep
    })
    if (followUpInbox.length > 0) {
      updatedGame = {
        ...updatedGame,
        inbox: [...updatedGame.inbox, ...followUpInbox],
        pendingFollowUps: remaining,
      }
    } else {
      updatedGame = { ...updatedGame, pendingFollowUps: remaining }
    }
  }

  // P1 — Annandagen media-rubrik konsekvens (val B/C/D triggar omg+1 mediarubrik → inbox)
  if (updatedGame.pendingAnnandagsMediaRubrik && nextMatchday >= updatedGame.pendingAnnandagsMediaRubrik.triggerRound) {
    const { val } = updatedGame.pendingAnnandagsMediaRubrik
    const clubName = updatedGame.clubs.find(c => c.id === updatedGame.managedClubId)?.name ?? 'Klubben'
    const mediaRubrikTexts: Record<string, { title: string; body: string }> = {
      B: {
        title: `${clubName} gör annandagen till en folkfest`,
        body: 'Läktaren fylldes en timme före avslag. Glögg, en klack som höll i hela matchen och fyrverkeri efter slutsignalen — annandagen blev dagen orten samlades kring laget. Lokaltidningen kallar det säsongens folkfest.',
      },
      C: {
        title: `${clubName} öppnar portarna på annandagen`,
        body: 'Fri entré drog folk som annars stannar hemma. Många hade aldrig satt sin fot på arenan förr, och några lovade att komma tillbaka. En tom biljettkassa, men fullt på läktaren.',
      },
      D: {
        title: `${clubName} och mecenat firar annandag tillsammans`,
        body: 'Mecenaten stod för glöggen och lät sig synas på läktaren för en gångs skull. Det pratades mer om stämningen än om vem som betalade, vilket nog var poängen. En annandag att ta efter, skriver tidningen.',
      },
    }
    const rubrik = mediaRubrikTexts[val]
    if (rubrik) {
      const rubrikId = `inbox_annandagen_media_${updatedGame.currentSeason}`
      if (!updatedGame.inbox.some(i => i.id === rubrikId)) {
        updatedGame = {
          ...updatedGame,
          inbox: [{
            id: rubrikId,
            date: updatedGame.currentDate,
            type: InboxItemType.Community,
            title: rubrik.title,
            body: rubrik.body,
            isRead: false,
          }, ...updatedGame.inbox],
          pendingAnnandagsMediaRubrik: undefined,
        }
      }
    }
  }

  // Klack-matchreaktion (kartfynd 8a): mata supporterGroup.mood med matchutfallet.
  // Delta beräknas i communityProcessor (egen profil, skild från pulsen). Appliceras på den
  // narrativ-uppdaterade gruppen så medlems-/favoritändringar därifrån bevaras. Ingen mean
  // reversion (klacken har inget naturligt mitten — tänd eller sur); setter:n klamrar 0–100.
  if (updatedGame.supporterGroup && communityResult.klackMoodDelta !== 0) {
    updatedGame = {
      ...updatedGame,
      supporterGroup: adjustSupporterMood(updatedGame.supporterGroup, communityResult.klackMoodDelta),
    }
  }

  // P1 — Annandagen klack-reaktion konsekvens (val B/C/D triggar omg+2 → supporterGroup.mood boost)
  if (updatedGame.pendingAnnandagsKlack && nextMatchday >= updatedGame.pendingAnnandagsKlack.triggerRound) {
    const { val } = updatedGame.pendingAnnandagsKlack
    const moodBoost = val === 'C' ? 8 : val === 'B' ? 5 : val === 'D' ? 6 : 0
    if (moodBoost > 0 && updatedGame.supporterGroup) {
      updatedGame = {
        ...updatedGame,
        supporterGroup: adjustSupporterMood(updatedGame.supporterGroup, moodBoost),
        pendingAnnandagsKlack: undefined,
      }
    } else {
      updatedGame = { ...updatedGame, pendingAnnandagsKlack: undefined }
    }
  }

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

  // Journalist relationship event inbox (SPEC_JOURNALIST_KAPITEL_A)
  const relEvent = detectRelationshipEvent(updatedGame)
  if (relEvent) {
    updatedGame = appendJournalistRelationshipStoryline(updatedGame, relEvent)
  }
  if (relEvent === 'broken_under_20' && updatedGame.journalist) {
    updatedGame = {
      ...updatedGame,
      inbox: [...updatedGame.inbox, {
        id: `journalist_broken_${updatedGame.currentSeason}_${updatedGame.currentMatchday}`,
        date: updatedGame.currentDate,
        type: InboxItemType.MediaEvent,
        title: `${updatedGame.journalist.name} · ${updatedGame.journalist.outlet}`,
        body: 'Jag har försökt nå er i två veckor. Min chefredaktör börjar undra. Det går rykten i orten — och jag är den som ska skriva om dem. Hör av er innan veckan är slut.',
        isRead: false,
      }],
      journalist: { ...updatedGame.journalist, lastTriggeredRelationship: updatedGame.journalist.relationship },
    }
  }
  if (relEvent === 'recovered_above_75' && updatedGame.journalist) {
    updatedGame = {
      ...updatedGame,
      inbox: [...updatedGame.inbox, {
        id: `journalist_recovered_${updatedGame.currentSeason}_${updatedGame.currentMatchday}`,
        date: updatedGame.currentDate,
        type: InboxItemType.MediaEvent,
        title: `${updatedGame.journalist.name} · ${updatedGame.journalist.outlet}`,
        body: 'Tack för intervjun igår. Det märktes att ni var ärliga. Jag tänkte ringa om ett uppslag — kan vi prata?',
        isRead: false,
      }],
      journalist: { ...updatedGame.journalist, lastTriggeredRelationship: updatedGame.journalist.relationship },
    }
  }

  // C-B1 — CS-villkorad pressfråga
  if (justCompletedManagedFixture && !justCompletedManagedFixture.isCup &&
      justCompletedManagedFixture.homeClubId === updatedGame.managedClubId) {
    // Build a synthetic game view with completed fixture included so computeCSStreak can see it
    const gameWithFixture: SaveGame = {
      ...updatedGame,
      fixtures: [
        ...updatedGame.fixtures.filter(f => f.id !== justCompletedManagedFixture.id),
        justCompletedManagedFixture,
      ],
    }
    const csStreak = computeCSStreak(gameWithFixture, justCompletedManagedFixture)
    if (csStreak > 0 && shouldTriggerCSPress(gameWithFixture, justCompletedManagedFixture, csStreak, localRand)) {
      const csPressPlayer = pickCSPressPlayer(gameWithFixture, justCompletedManagedFixture, localRand)
      if (csPressPlayer) {
        const csPressEvent = buildCSPressEvent(gameWithFixture, justCompletedManagedFixture, csPressPlayer)
        updatedGame = {
          ...updatedGame,
          pendingCSPress: csPressEvent,
          lastCSPressMatchday: nextMatchday,
        }
      }
    }
  }

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

  // Uppdatera beslutsbörda varje omgång (ej dubbelkörning vid andra passet)
  if (!isSecondPassForManagedMatch) {
    const { meter, pressure } = getFatigueState(updatedGame)
    const newHistory = [...(updatedGame.fatigueHistory ?? []), meter].slice(-7)
    const prevStreak = updatedGame.fatigueHotStreak ?? 0
    const newStreak = pressure === 'hot' ? prevStreak + 1 : 0
    updatedGame = { ...updatedGame, fatigueHistory: newHistory, fatigueHotStreak: newStreak }

    // Manager burnout sampling + narrative log (burnout_peak, era_shift)
    const prevBurnoutZone = getBurnoutZone(updatedGame.managerProfile?.burnoutScore ?? 0)
    const eraChanged = !!(game.currentEra && game.currentEra !== newClubEra)
    const updatedManagerProfile = updateManagerBurnout(updatedGame)
    if (updatedManagerProfile) {
      let enrichedProfile = updatedManagerProfile
      const newBurnoutZone = getBurnoutZone(enrichedProfile.burnoutScore)
      const zoneRose = (prevBurnoutZone === 'frisk' && newBurnoutZone !== 'frisk') ||
                       (prevBurnoutZone === 'markbar' && newBurnoutZone === 'hog')
      if (zoneRose) {
        const alreadyLogged = (enrichedProfile.diary ?? []).some(
          e => e.type === 'burnout_peak' && e.season === game.currentSeason)
        if (!alreadyLogged) {
          enrichedProfile = { ...enrichedProfile, diary: [
            ...(enrichedProfile.diary ?? []),
            { season: game.currentSeason, matchday: nextMatchday, type: 'burnout_peak' as const, text: newBurnoutZone === 'hog' ? 'Den säsongen tog nästan slut på dig. Du stannade ändå.' : 'Det började ta på dig den säsongen. Du sa inget om det.' },
          ]}
        }
      }
      if (eraChanged) {
        const alreadyLogged = (enrichedProfile.diary ?? []).some(
          e => e.type === 'era_shift' && e.season === game.currentSeason)
        if (!alreadyLogged) {
          enrichedProfile = { ...enrichedProfile, diary: [
            ...(enrichedProfile.diary ?? []),
            { season: game.currentSeason, matchday: nextMatchday, type: 'era_shift' as const, text: newClubEra === 'establishment' ? 'Klubben reste sig under dig. Orten började tro igen.' : newClubEra === 'legacy' ? 'Det blev mer än bandy under dig. Det blev ortens identitet.' : 'Tunga tider kom. Det var nu det gällde.' },
          ]}
        }
      }
      // DOM_BURNOUT_TAK_2026-09-02 (A) — stämpla episoden som erbjuden SAMMA
      // omgång eventet faktiskt genereras (eventProcessor.ts). Ingen source-
      // cooldown/budget skyddar detta eventet (avsiktligt, se dess trigger) —
      // profil-stämpeln är den ENDA spärren mot att samma episod erbjuds om
      // och om igen så länge scoret ligger kvar på taket.
      if (allNewEvents.some(e => e.type === 'burnoutCeiling')) {
        enrichedProfile = { ...enrichedProfile, burnoutCeilingChoiceOffered: true }
      }

      // HIGH 10 (DOM_HIGH10_BURNOUT_BAGE_2026-08-29) — bågens tre beats,
      // ömsesidigt uteslutande i prioritetsordningen slut → lättnad →
      // eskalering. Villkoren kan per konstruktion inte överlappa (slut
      // kräver frisk, lättnad kräver sjunkande men inte frisk, eskalering
      // kräver ihållande hög), men ordningen är explicit if/else-if så att
      // en framtida villkorsändring inte tyst kan fyra två beats samma
      // omgång.
      //
      // Vilken som än fyrar stämplas lastShownBurnoutZone till NUVARANDE
      // zon i samma profiluppdatering. Det är hela systemets invariant:
      // fältet betyder alltid "zonen vi senast berättade om för spelaren",
      // och det är den som hindrar att ett oförändrat tillstånd
      // återpresenteras som en ny händelse varje omgång.
      //
      // lastBurnoutCause stämplas inte här — updateManagerBurnout sätter
      // det redan, på det enda stället där press-komponenterna räknas.
      const showBurnoutClose = shouldShowBurnoutClose(enrichedProfile)
      const showBurnoutRelief = !showBurnoutClose && shouldShowBurnoutRelief(enrichedProfile)
      const showBurnoutMark = !showBurnoutClose && !showBurnoutRelief &&
        shouldShowBurnoutMark(enrichedProfile) && newBurnoutZone !== 'frisk'
      if (showBurnoutClose || showBurnoutRelief || showBurnoutMark) {
        enrichedProfile = { ...enrichedProfile, lastShownBurnoutZone: newBurnoutZone }
      }

      updatedGame = { ...updatedGame, managerProfile: enrichedProfile }

      // A-H4a (SEXSÄSONGSAUDITEN 2026-08-26): loggar BurnoutMark.tsx:s
      // visade citat/hjälprad NÄR DE VISAS (samma skrivmönster som
      // coffee_pool_/journalist_exclusive_ ovan) — pickBurnoutQuoteIndex/
      // pickBurnoutHelperIndex läser samma logg för att undvika rader som
      // redan visats denna säsong.
      //
      // HIGH 10-FÖLJDFIX (2026-08-30, upptäckt vid granskning): utöver
      // citat/hjälprad loggas nu också en FAST nyckel per beat-typ
      // (BURNOUT_*_FIRED_KEY). Anledning: portalkorten (BurnoutMark.tsx,
      // BurnoutReliefMark.tsx) kan INTE avgöra "fyrade det HÄR just nu"
      // genom att återköra shouldShowBurnoutMark/Relief/Close mot det
      // lagrade profil-tillståndet — lastShownBurnoutZone stämplas till
      // NUVARANDE zon i samma steg ovan, så en sådan återkörning skulle
      // alltid ge nej (before===after efter stämplingen). Utan denna logg
      // hade korten aldrig renderats en enda gång — verifierat innan denna
      // fix landade. Se wasLoggedThisRound (narrativeLogService.ts).
      if (showBurnoutMark) {
        // Återfalls-läsningen (2026-09-02, Opus dom) — säsongsöverskridande,
        // se isBurnoutRelapse (managerProfileService.ts). Tom återfallspool
        // (Opus fyller den) degraderar säkert till intro-mallen, samma
        // "tom pool"-golv BURNOUT_CAUSE_LINES redan följer.
        const relapse = isBurnoutRelapse(enrichedProfile, updatedGame.currentSeason)
        const relapseQuotePool = BURNOUT_MARK_RELAPSE.quotesByZone[newBurnoutZone]
        const relapseHelperPool = BURNOUT_MARK_RELAPSE.helpersByZone[newBurnoutZone]
        const useRelapse = relapse && relapseQuotePool.length > 0 && relapseHelperPool.length > 0

        const quoteIdx = useRelapse
          ? pickBurnoutRelapseQuoteIndex(updatedGame, newBurnoutZone, relapseQuotePool.length)
          : pickBurnoutQuoteIndex(updatedGame, newBurnoutZone, BURNOUT_MARK.quotesByZone[newBurnoutZone].length)
        const helperIdx = useRelapse
          ? pickBurnoutRelapseHelperIndex(updatedGame, newBurnoutZone, relapseHelperPool.length)
          : pickBurnoutHelperIndex(updatedGame, newBurnoutZone, BURNOUT_MARK.helpersByZone[newBurnoutZone].length)
        const quoteKey = useRelapse
          ? `${BURNOUT_RELAPSE_QUOTE_PREFIX}${newBurnoutZone}_${quoteIdx}`
          : `${BURNOUT_QUOTE_PREFIX}${newBurnoutZone}_${quoteIdx}`
        const helperKey = useRelapse
          ? `${BURNOUT_RELAPSE_HELPER_PREFIX}${newBurnoutZone}_${helperIdx}`
          : `${BURNOUT_HELPER_PREFIX}${newBurnoutZone}_${helperIdx}`

        let burnoutLog = logNarrativeBeat(updatedGame, quoteKey, updatedGame.currentSeason, nextMatchday)
        burnoutLog = logNarrativeBeat({ ...updatedGame, narrativeBeatLog: burnoutLog }, helperKey, updatedGame.currentSeason, nextMatchday)
        burnoutLog = logNarrativeBeat({ ...updatedGame, narrativeBeatLog: burnoutLog }, BURNOUT_MARK_FIRED_KEY, updatedGame.currentSeason, nextMatchday)
        updatedGame = { ...updatedGame, narrativeBeatLog: burnoutLog }
      } else if (showBurnoutRelief) {
        updatedGame = { ...updatedGame, narrativeBeatLog: logNarrativeBeat(updatedGame, BURNOUT_RELIEF_FIRED_KEY, updatedGame.currentSeason, nextMatchday) }
      } else if (showBurnoutClose) {
        updatedGame = { ...updatedGame, narrativeBeatLog: logNarrativeBeat(updatedGame, BURNOUT_CLOSE_FIRED_KEY, updatedGame.currentSeason, nextMatchday) }
      }
    }

    // H2H rivalry update after managed match result + rivalry narrative log
    if (
      justCompletedManagedFixture &&
      justCompletedManagedFixture.homeScore !== undefined &&
      justCompletedManagedFixture.awayScore !== undefined &&
      updatedGame.managerProfile?.coachRivalries?.length
    ) {
      const isHome = justCompletedManagedFixture.homeClubId === updatedGame.managedClubId
      const opponentClubId = isHome ? justCompletedManagedFixture.awayClubId : justCompletedManagedFixture.homeClubId
      const h2hOutcome = deriveUtfall(justCompletedManagedFixture, updatedGame.managedClubId)
      let profileWithH2H = updateH2HRecord(
        updatedGame.managerProfile,
        opponentClubId,
        h2hOutcome === 'vunnet' ? 1 : 0,
        h2hOutcome === 'forlorat' ? 1 : 0,
      )
      // Log rivalry once when a clear nemesis emerges (3+ losses, losses > wins)
      const existingRivalryLog = (profileWithH2H.diary ?? []).some(e => e.type === 'rivalry')
      if (!existingRivalryLog) {
        const nemesisCandidate = deriveCoachNemesis(
          (profileWithH2H.coachRivalries ?? []).filter(r => r.h2hLosses >= 3),
        )
        if (nemesisCandidate) {
          profileWithH2H = { ...profileWithH2H, diary: [
            ...(profileWithH2H.diary ?? []),
            { season: game.currentSeason, matchday: nextMatchday, type: 'rivalry' as const, text: `${game.clubs.find(c => c.id === nemesisCandidate.clubId)?.name ?? 'rivalen'} blev din nemesis.` },
          ]}
        }
      }
      updatedGame = { ...updatedGame, managerProfile: profileWithH2H }
    }

    // Squad-pulse sampling — samlas på samma ställe som fatigueHistory
    const squadPlayers = updatedGame.players.filter(p => p.clubId === updatedGame.managedClubId)
    if (squadPlayers.length > 0) {
      const avgFitness = Math.round(squadPlayers.reduce((s, p) => s + p.fitness, 0) / squadPlayers.length)
      const avgMorale = Math.round(squadPlayers.reduce((s, p) => s + p.morale, 0) / squadPlayers.length)
      const avgSeasonForm = Math.round(squadPlayers.reduce((s, p) => s + (p.seasonForm ?? 60), 0) / squadPlayers.length)
      const avgSharpness = Math.round(squadPlayers.reduce((s, p) => s + p.sharpness, 0) / squadPlayers.length)
      const injuryCount = squadPlayers.filter(p => p.isInjured).length
      const newTFH = [...(updatedGame.teamFitnessHistory ?? []), { matchday: nextMatchday, avgFitness, avgMorale, avgSeasonForm, avgSharpness, injuryCount }].slice(-12)
      updatedGame = { ...updatedGame, teamFitnessHistory: newTFH }
    }
  }

  // U5 forts (SLUTTEST_KO.md, 2026-08-20): systemhandelseBudgetOk:s faktiska
  // gating (se filterSystemhandelseBudget, narrativeLogService.ts, för
  // rotorsaken till den provisoriska räkningen). Släppta events tappas för
  // denna omgång — samma konservativa avvägning som canAddDecision ovan.
  const budgetedNewEvents = filterSystemhandelseBudget(allNewEvents, updatedGame, game.currentSeason, nextMatchday)

  return { game: updatedGame, roundPlayed: nextMatchday, seasonEnded: false, pendingEvents: budgetedNewEvents, hasManagedCupMatch: hasManagedCupPending }
}
