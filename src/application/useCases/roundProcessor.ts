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
} from '../../domain/services/inboxService'
import { updateAllMarketValues } from '../../domain/services/marketValueService'
import { generateWeeklyDecision } from '../../domain/services/weeklyDecisionService'
import { evaluateBoard, generateBoardMessage } from '../../domain/services/boardService'
import { mulberry32 } from '../../domain/utils/random'

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
import { processCupRound } from './processors/cupProcessor'
import { appendFinanceLog } from '../../domain/services/economyService'
import { updatePlayerAvailability, updateLowMoraleDays } from '../../domain/services/playerAvailabilityService'
import { updateTrainerArc } from '../../domain/services/trainerArcService'
import { checkInObjectives } from '../../domain/services/boardObjectiveService'
import { processEconomy } from './processors/economyProcessor'
import { processCommunity } from './processors/communityProcessor'
import { processScouts } from './processors/scoutProcessor'
import { processTransferBids, processLoans, executeAcceptedTransfers } from './processors/transferProcessor'
import { processSponsors } from './processors/sponsorProcessor'
import { checkContextualSponsors, applyOneTimeKommunstod } from '../../domain/services/contextualSponsorService'
import { calculateClubEra, eraLabel } from '../../domain/services/clubEraService'
import { simulateRound } from './processors/matchSimProcessor'
import { processYouth } from './processors/youthProcessor'
import { detectArcTriggers, progressArcs } from '../../domain/services/arcService'
import { processNarrative, processUpcomingDerbyNotification } from './processors/narrativeProcessor'
import { detectRelationshipEvent } from '../../domain/services/journalistVisibilityService'
import { processMedia } from './processors/mediaProcessor'
import { checkMidSeasonEvents } from '../../domain/services/midSeasonEventService'
import { processGameEvents, applyMecenatSpawn, processScandals } from './processors/eventProcessor'
import { applyCaptainMoraleCascade } from './processors/playerStateProcessor'
import { applyRipples, mergeRippleDeltas, describeRippleChain } from '../../domain/services/rippleEffectService'
import type { RippleChain } from '../../domain/entities/SaveGame'
import { applyMatchInjury, generateInjuryInboxItem } from '../../domain/services/matchInjuryService'
import {
  annandagsbandyInbox,
  finaldagInboxPlaying,
  finaldagInboxSpectator,
  cupFinalInboxPlaying,
  type SpecialDateContext,
} from '../../domain/data/specialDateStrings'
import { generatePostMatchEvents } from '../../domain/services/postMatchEventService'
import { canAddDecision, MAX_ACTIVE_DECISIONS, MAX_DEFERRED_DECISIONS } from '../../domain/services/decisionBudgetService'
import { getFatigueState } from '../../domain/services/decisionFatigueService'
import { decrementCooldowns } from '../../domain/services/sourceCooldownService'
import { detectNotableResult, decayKlackEcho } from '../../domain/services/klackEchoService'
import { DEADLINE_AI_BID_TEXT } from '../../domain/data/windowDeadlineText'
import { computeCSStreak, shouldTriggerCSPress, pickCSPressPlayer, buildCSPressEvent } from '../../domain/services/csPressEventService'
import { adjustSupporterMood } from '../../domain/services/supporterService'
import { selectNationalTeam } from '../../domain/services/nationalTeamService'
import {
  CALLUP_NOTICE_LINES,
  SNUB_SCENE_LINES,
} from '../../domain/data/landslagText'
import { updateManagerBurnout, updateH2HRecord, getBurnoutZone } from '../../domain/services/managerProfileService'
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
  const trainingResult = applyRoundTraining(game, baseSeed, currentLeagueRound ?? nextMatchday, { skipSideEffects: isSecondPassForManagedMatch })
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
  const completedFixtures = allFixtures.filter(f => f.status === FixtureStatus.Completed && !f.isCup)
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
        newInboxItems.push(generateInjuryInboxItem(player, event, game.currentSeason, nextMatchday))
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
    const intensityBucket = intensityRaw === TrainingIntensity.Light ? 'light'
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
  for (const { player, days } of newlyInjured) {
    const clubId = player.clubId
    if (clubId === game.managedClubId) {
      newInboxItems.push(createInjuryItem(player, days, game.currentDate))
      const beforeStarRipple = gameAfterRipples
      gameAfterRipples = applyRipples(gameAfterRipples, { type: 'star_injured', playerId: player.id })
      roundRippleChains.push(describeRippleChain(beforeStarRipple, gameAfterRipples, 'star_injured',
        `${player.firstName} ${player.lastName}`, nextMatchday, game.currentSeason))
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
  for (const { player } of newlySuspended) {
    if (player.clubId === game.managedClubId) {
      newInboxItems.push(createSuspensionItem(player, 3, game.currentDate))
    }
  }

  // Recovery notifications (players who were injured before this round and are now healed)
  for (const player of updatedPlayers) {
    if (player.clubId === game.managedClubId && injuredBeforeRound.has(player.id) && !player.isInjured) {
      newInboxItems.push(createRecoveryItem(player, game.currentDate))
    }
  }

  // ── Board milestone messages at league rounds 7, 14, 22 ──────────────
  const BOARD_MILESTONES = [7, 14, 22]
  if (!isCupRound && !isPlayoffRound && currentLeagueRound !== null && BOARD_MILESTONES.includes(currentLeagueRound)) {
    const managedClub = game.clubs.find(c => c.id === game.managedClubId)
    const managedStanding = standings.find(s => s.clubId === game.managedClubId)
    if (managedClub && managedStanding) {
      const totalRounds = 22
      const evaluation = evaluateBoard(
        managedClub.boardExpectation,
        managedStanding,
        game.clubs.length,
        currentLeagueRound,
        totalRounds,
      )
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

  // Trigger callup on landslagsuppehall round
  if (nationalTeamCalSlot?.isLandslagsuppehall && !isCupRound && !isPlayoffRound && !game.activeNationalTeamCamp) {
    const calledUpIds = selectNationalTeam({ ...game, players: nationalTeamUpdatedPlayers })
    if (calledUpIds.length > 0) {
      const calledUpPlayers = nationalTeamUpdatedPlayers.filter(p => calledUpIds.includes(p.id))
      const names = calledUpPlayers.map(p => p.lastName)
      const nameStr = names.length === 1
        ? names[0]
        : `${names.slice(0, -1).join(', ')} och ${names[names.length - 1]}`

      const noticeTemplates = calledUpIds.length === 1
        ? CALLUP_NOTICE_LINES.single
        : CALLUP_NOTICE_LINES.multi
      const noticeTemplate = noticeTemplates[game.currentSeason % noticeTemplates.length]
      const noticeBody = noticeTemplate
        .replace('{spelare}', nameStr)
        .replace('{spelare_lista}', nameStr)

      const callupInboxId = `inbox_vm_callup_${game.currentSeason}`
      if (!game.inbox.some(i => i.id === callupInboxId)) {
        newInboxItems.push({
          id: callupInboxId,
          date: game.currentDate,
          type: InboxItemType.Community,
          title: 'VM-uttagning',
          body: noticeBody,
          isRead: false,
        })
      }

      // Apply callup effects to players
      nationalTeamUpdatedPlayers = nationalTeamUpdatedPlayers.map(p => {
        if (!calledUpIds.includes(p.id)) return p
        return {
          ...p,
          nationalTeamCallups: (p.nationalTeamCallups ?? 0) + 1,
          lastNationalTeamCallup: game.currentSeason,
        }
      })
      nationalTeamCampState = {
        startRound: nextMatchday,
        endRound: nextMatchday + 1,
        playerIds: calledUpIds,
      }

      // Snub mechanic — high-form, high-CA player not selected
      const snubCandidate = nationalTeamUpdatedPlayers
        .filter(p =>
          p.clubId === game.managedClubId &&
          !calledUpIds.includes(p.id) &&
          p.form > 70 &&
          p.currentAbility > 75
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
  if (game.activeNationalTeamCamp && nextMatchday > game.activeNationalTeamCamp.endRound) {
    const camp = game.activeNationalTeamCamp
    nationalTeamUpdatedPlayers = nationalTeamUpdatedPlayers.map(p => {
      if (!camp.playerIds.includes(p.id)) return p
      return {
        ...p,
        form: Math.min(100, p.form + 4),
        morale: Math.min(100, p.morale + 6),
      }
    })
    nationalTeamCampState = undefined
    const returnInboxId = `inbox_vm_return_${game.currentSeason}`
    if (!game.inbox.some(i => i.id === returnInboxId)) {
      newInboxItems.push({
        id: returnInboxId,
        date: game.currentDate,
        type: InboxItemType.Community,
        title: 'Landslagsspelarena är tillbaka',
        body: 'Landslagslägret är över. Spelarna är hemma och redo.',
        isRead: false,
      })
    }
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
        choiceLog.push({ type: 'started_tired', playerId: pid, detail: `condition_${Math.round(player.fitness ?? 0)}` })
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
      const managedIsHome = justCompletedManagedFixture.homeClubId === game.managedClubId
      const managedScore = managedIsHome ? (justCompletedManagedFixture.homeScore ?? 0) : (justCompletedManagedFixture.awayScore ?? 0)
      const oppScore = managedIsHome ? (justCompletedManagedFixture.awayScore ?? 0) : (justCompletedManagedFixture.homeScore ?? 0)
      if (managedScore > oppScore) {
        const rivalClub = game.clubs.find(c => c.id === (justCompletedManagedFixture.homeClubId === game.managedClubId ? justCompletedManagedFixture.awayClubId : justCompletedManagedFixture.homeClubId))
        const beforeDerbyRipple = gameAfterRipples
        gameAfterRipples = applyRipples(gameAfterRipples, { type: 'big_derby_win', fixtureId: justCompletedManagedFixture.id })
        roundRippleChains.push(describeRippleChain(beforeDerbyRipple, gameAfterRipples, 'big_derby_win',
          rivalClub?.name, nextMatchday, game.currentSeason))
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
  if (justCompletedManagedFixture) {
    const echo = detectNotableResult(justCompletedManagedFixture, { ...game, fixtures: simulatedFixtures })
    if (echo) {
      updatedKlackEcho = { ...echo, currentWeight: echo.initialWeight }
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
  let updatedMecenater = eventResult.updatedMecenater
  newInboxItems.push(...eventResult.inboxItems)

  // Legibel konsekvens: mecenat_left ripple (VILANDE i eventProcessor, wiras här)
  const previousActiveIds = new Set((game.mecenater ?? []).filter(m => m.isActive).map(m => m.id))
  for (const m of updatedMecenater) {
    if (!m.isActive && previousActiveIds.has(m.id)) {
      const beforeMecRipple = gameAfterRipples
      gameAfterRipples = applyRipples(gameAfterRipples, { type: 'mecenat_left', mecenatId: m.id })
      roundRippleChains.push(describeRippleChain(beforeMecRipple, gameAfterRipples, 'mecenat_left',
        m.name, nextMatchday, game.currentSeason))
    }
  }

  // ── 2B: Risky sponsor risk maturation check ───────────────────────────────
  if (game.riskySponsorContract && game.riskySponsorContract.season === game.currentSeason) {
    const rc = game.riskySponsorContract
    if (nextMatchday >= rc.riskMaturityRound && localRand() < 0.25) {
      const matId = `risky_sponsor_exposed_${rc.sponsorId}`
      if (!game.inbox.some(i => i.id === matId)) {
        const sponsorName = game.sponsors?.find(s => s.id === rc.sponsorId)?.name ?? 'Sponsorn'
        const riskConsequences = [
          {
            title: `${sponsorName}: Skatteverket-granskning publik`,
            body: `Skatteverket har gripit in mot ${sponsorName}. Företagets bankmedel är frysta och avtal med tredje part avslutas. {KLUBB} förlorar sponsorn i förtid och måste betala tillbaka del av redan utbetalda medel. Anseendet tar en törn.`,
          },
          {
            title: `${sponsorName}: Försatt i konkurs`,
            body: `${sponsorName} har försatts i konkurs. Det fanns inget att granska — företaget hade inga riktiga kunder. {KLUBB}s avtal är värdelöst. Pengarna som kommit in betalas tillbaka till konkursboet.`,
          },
          {
            title: `${sponsorName} i lokaltidningen`,
            body: `Lokaltidningen har börjat skriva om ${sponsorName}. Reportagen handlar om okända ägare, suspekta bolagsstrukturer och kopplingar till en tidigare brottsmisstänkt person. {KLUBB} avslutar avtalet före det blir värre.`,
          },
        ]
        const clubName = game.clubs.find(c => c.id === game.managedClubId)?.name ?? 'Klubben'
        const picked = riskConsequences[game.currentSeason % riskConsequences.length]
        newInboxItems.push({
          id: matId,
          date: newDate,
          type: InboxItemType.BoardFeedback,
          title: picked.title,
          body: picked.body.replace(/{KLUBB}/g, clubName),
          isRead: false,
        } as InboxItem)
        // Remove the risky sponsor from sponsors list + claw back income
        // (handled in SaveGame assembly below)
      }
    }
  }

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

  // ── Post-match events: insändare, opponent quote (atmosfäriska, auto-resolved i Granska) ─
  if (justCompletedManagedFixture && !isSecondPassForManagedMatch) {
    const postMatchEvents = generatePostMatchEvents(game, justCompletedManagedFixture)
    allNewEvents.push(...postMatchEvents)
  }

  // Stamp new inbox items with creation matchday for cleanup
  // A4 — Notisdiet: dedup on id — same (kind+subject+round) must not create two items
  const existingIds = new Set(game.inbox.map(i => i.id))
  const dedupedNewItems = newInboxItems.filter(i => !existingIds.has(i.id))
  const stampedNewInboxItems = dedupedNewItems.map(i =>
    i.createdMatchday === undefined
      ? { ...i, createdMatchday: nextMatchday, createdRound: currentLeagueRound ?? undefined }
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
  // Apply one-time kommunstöd payment if triggered (80k to managed club finances)
  let kommunstodBonus = 0
  const kommunResult = applyOneTimeKommunstod({ ...game, sponsors: updatedSponsors }, { skipSideEffects: isSecondPassForManagedMatch })
  if (kommunResult.paid) {
    updatedSponsors = kommunResult.updatedGame.sponsors ?? updatedSponsors
    kommunstodBonus = kommunResult.updatedGame.clubs.find(c => c.id === game.managedClubId)?.finances ?? 0
    kommunstodBonus -= game.clubs.find(c => c.id === game.managedClubId)?.finances ?? 0
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
      lastRivalSaleInfo = { soldPlayerName: `${soldP.firstName} ${soldP.lastName}`, buyerClubName: buyerC.name, buyerClubId: buyerC.id }
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
  if (kommunstodBonus > 0) {
    postTransferClubs = postTransferClubs.map(c =>
      c.id === game.managedClubId ? { ...c, finances: c.finances + kommunstodBonus } : c
    )
  }

  // ── Matchhall completion: stage → 'klar' + hasIndoorArena ─────────────────
  if (communityResult.completedNodeId === 'matchhall' && updatedFacilityState?.hallTrial) {
    updatedFacilityState = {
      ...updatedFacilityState,
      hallTrial: { ...updatedFacilityState.hallTrial, stage: 'klar' },
    }
    postTransferClubs = postTransferClubs.map(c =>
      c.id === game.managedClubId ? { ...c, hasIndoorArena: true } : c
    )
  }

  // ── Scandals (Lager 1 — Världshändelser) ──────────────────────────────────
  const scandalResult = processScandals(preEventGame, nextMatchday, localRand, { skipSideEffects: isSecondPassForManagedMatch })
  newInboxItems.push(...scandalResult.inboxItems)
  // Apply scandal-driven club changes (finances/reputation) as deltas on top of postTransferClubs
  if (scandalResult.updatedClubs !== preEventGame.clubs) {
    for (const scandalClub of scandalResult.updatedClubs) {
      const baseline = preEventGame.clubs.find(c => c.id === scandalClub.id)
      if (!baseline) continue
      const fd = scandalClub.finances - baseline.finances
      const rd = scandalClub.reputation - baseline.reputation
      if (fd !== 0 || rd !== 0) {
        postTransferClubs = postTransferClubs.map(c =>
          c.id === scandalClub.id
            ? { ...c, finances: c.finances + fd, reputation: Math.max(0, Math.min(100, c.reputation + rd)) }
            : c,
        )
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
        game.inbox.some(i => i.id === emergeId) ||
        allNewEvents.some(e => e.id === emergeId)
      if (!alreadyQueued) {
        const emergeEvent = generatePatronEmergenceEvent(game, localRand)
        if (emergeEvent) allNewEvents.push(emergeEvent)
      }
    }
  }

  // Legibel konsekvens: välj mest signifikant kedja (mecenat_left > skada+styrelse > skada > derby)
  function chainSignificance(c: RippleChain): number {
    if (c.trigger === 'mecenat_left') return 4
    if (c.trigger === 'star_injured' && c.steps.some(s => s.label === 'Styrelsen')) return 3
    if (c.trigger === 'star_injured') return 2
    return 1
  }
  const pendingRippleChain = roundRippleChains.length > 0
    ? roundRippleChains.reduce((best, c) => chainSignificance(c) > chainSignificance(best) ? c : best)
    : undefined

  // M15: merge ripple-derived field changes via centralized function
  const rippleMerged = mergeRippleDeltas(game, gameAfterRipples, {
    fanMoodBase: newFanMood,
    sponsorNetworkMoodDelta,
    communityStandingDelta: csBoost,
    supporterGroupFallback: updatedSupporterGroup,
  })

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
        !playoffResult.staleEventIds.includes(e.id)
      ),
      ...allNewEvents,
    ],
    sponsors: updatedSponsors,
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
    pendingRippleChain,
    facilityState: updatedFacilityState ?? game.facilityState,
    volunteers: updatedVolunteers,
    volunteerMorale: updatedVolunteerMorale,
    trainerArc: updatedArc,
    previousKommunBidrag: game.localPolitician?.kommunBidrag,
    mecenater: updatedMecenater,
    // Spara förra omgångens seed — pick()-funktionen hoppar över det värdet för att undvika upprepning
    lastCoffeeQuoteHash: currentLeagueRound !== null ? (currentLeagueRound - 1) * 11 + game.currentSeason * 31 : game.lastCoffeeQuoteHash,
    lastEconomicStressRound: eventResult.lastEconomicStressRound,
    pendingPressConference: simResult.pressEvent ?? undefined,
    pendingRefereeMeeting: simResult.pendingRefereeMeeting ?? undefined,
    referees: simResult.updatedReferees,
    refereeRelations: game.refereeRelations ?? [],
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
      const newDecision = budgetOk
        ? generateWeeklyDecision(gameWithNewEvents, nextMatchday)
        : null
      return {
        pendingWeeklyDecision: newDecision ?? undefined,
        weeklyDecisionLastRound: newDecision ? nextMatchday : game.weeklyDecisionLastRound,
      }
    })(),
    resolvedEventIds: reputationResolvedIds,
    pendingVictoryEcho,
    victoryEchoExpires,
    recentMoments: (() => {
      // M14: check for era shift and push era_shift Moment
      const newEra = newClubEra
      const prevEra = game.currentEra
      const eraShiftMoments: Moment[] = []
      if (prevEra && prevEra !== newEra) {
        eraShiftMoments.push({
          id: `moment_era_shift_${game.currentSeason}_${nextMatchday}`,
          source: 'era_shift',
          matchday: nextMatchday,
          season: game.currentSeason,
          title: eraLabel(newEra),
          body: newEra === 'establishment'
            ? 'Klubben reser sig. Något har förändrats i hur orten ser på laget.'
            : newEra === 'legacy'
            ? 'Det är inte längre bara bandy. Det är ortens identitet.'
            : 'Tuffa tider. Men det är nu det verkligen gäller.',
        })
      }
      return [...(game.recentMoments ?? []), ...newMoments, ...eraShiftMoments]
        .sort((a, b) => (b.season - a.season) || (b.matchday - a.matchday))
        .slice(0, 5)
    })(),
    currentEra: newClubEra,
    activeScandals: scandalResult.updatedScandals,
    scandalHistory: scandalResult.updatedScandalHistory,
    pointDeductions: scandalResult.pointDeductions,
    pendingPointDeductions: scandalResult.pendingPointDeductions,
    // Lager 2 state
    wageBudgetOverrunRounds: eventResult.wageBudgetOverrunRounds,
    wageBudgetWarningSent: eventResult.wageBudgetWarningSent,
    riskySponsorOfferSentThisSeason: eventResult.riskySponsorOfferSentThisSeason,
    mecenatWithdrawnSeason: eventResult.mecenatWithdrawnSeason,
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
    // C-K1 — Landslagsuttagning
    activeNationalTeamCamp: nationalTeamCampState,
    lastNationalSnub: nationalTeamSnub,
  }

  // Append market value change notifications to inbox
  if (marketValueInbox.length > 0) {
    updatedGame = { ...updatedGame, inbox: [...updatedGame.inbox, ...marketValueInbox] }
  }

  // ── Arc processing ──────────────────────────────────────────────────────
  {
    const existingArcs = updatedGame.activeArcs ?? []
    const newTriggers = detectArcTriggers(updatedGame, justCompletedManagedFixture ?? undefined)
    const allArcs = [...existingArcs, ...newTriggers]
    const arcResult = progressArcs(
      { ...updatedGame, activeArcs: allArcs },
      nextMatchday,
      justCompletedManagedFixture ?? undefined,
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

    updatedGame = {
      ...updatedGame,
      activeArcs: cleanedArcs,
      pendingEvents: [...(updatedGame.pendingEvents ?? []), ...arcOtherEvents, ...arcLowAllowed],
      storylines: [...(updatedGame.storylines ?? []), ...arcResult.newStorylines],
      inbox: [...updatedGame.inbox, ...arcInbox, ...arcDroppedInbox],
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

    const actionable = allPending.filter(e => (e.choices?.length ?? 0) > 0)
    const nonActionable = allPending.filter(e => (e.choices?.length ?? 0) === 0)

    // Imminent-skydd: event med expiresRound ≤ nextMatchday+1 surfar alltid.
    // (expiresRound finns ej på GameEvent ännu — imminentSet är alltid tom tills tillagt.)
    const imminentSet = new Set(
      actionable
        .filter(e => (e as unknown as { expiresRound?: number }).expiresRound != null &&
          (e as unknown as { expiresRound?: number }).expiresRound! <= nextMatchday + 1)
        .map(e => e.id)
    )
    const imminent = actionable.filter(e => imminentSet.has(e.id))
    const flexible = actionable
      .filter(e => !imminentSet.has(e.id))
      .sort((a, b) => {
        const aExp = (a as unknown as { expiresRound?: number }).expiresRound ?? Infinity
        const bExp = (b as unknown as { expiresRound?: number }).expiresRound ?? Infinity
        return aExp - bExp
      })

    const budget = Math.max(0, MAX_ACTIVE_DECISIONS - imminent.length)
    const surface = [...imminent, ...flexible.slice(0, budget)]
    const newDeferred = flexible.slice(budget)

    if (newDeferred.length > 0 || priorDeferred.length > 0) {
      updatedGame = {
        ...updatedGame,
        pendingEvents: [...nonActionable, ...surface],
        deferredDecisions: newDeferred.slice(0, MAX_DEFERRED_DECISIONS),
      }
    }
  }

  // ── Förtroendepott — apply club finance bonus if earned this check-in ──────
  if (boardObjForetroendepott > 0) {
    updatedGame = {
      ...updatedGame,
      clubs: updatedGame.clubs.map(c =>
        c.id === game.managedClubId ? { ...c, finances: c.finances + boardObjForetroendepott } : c
      ),
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
        body: 'Läktaren fylldes en timme före nedsläpp. Glögg, en klack som höll i hela matchen och fyrverkeri efter slutsignalen — annandagen blev dagen orten samlades kring laget. Lokaltidningen kallar det säsongens folkfest.',
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
        const alreadyLogged = (enrichedProfile.narrativeLog ?? []).some(
          e => e.type === 'burnout_peak' && e.season === game.currentSeason)
        if (!alreadyLogged) {
          enrichedProfile = { ...enrichedProfile, narrativeLog: [
            ...(enrichedProfile.narrativeLog ?? []),
            { season: game.currentSeason, matchday: nextMatchday, type: 'burnout_peak' as const, text: newBurnoutZone === 'hog' ? 'Den säsongen tog nästan slut på dig. Du stannade ändå.' : 'Det började ta på dig den säsongen. Du sa inget om det.' },
          ]}
        }
      }
      if (eraChanged) {
        const alreadyLogged = (enrichedProfile.narrativeLog ?? []).some(
          e => e.type === 'era_shift' && e.season === game.currentSeason)
        if (!alreadyLogged) {
          enrichedProfile = { ...enrichedProfile, narrativeLog: [
            ...(enrichedProfile.narrativeLog ?? []),
            { season: game.currentSeason, matchday: nextMatchday, type: 'era_shift' as const, text: newClubEra === 'establishment' ? 'Klubben reste sig under dig. Orten började tro igen.' : newClubEra === 'legacy' ? 'Det blev mer än bandy under dig. Det blev ortens identitet.' : 'Tunga tider kom. Det var nu det gällde.' },
          ]}
        }
      }
      updatedGame = { ...updatedGame, managerProfile: enrichedProfile }
    }

    // H2H rivalry update after managed match result + rivalry narrative log
    if (
      justCompletedManagedFixture &&
      justCompletedManagedFixture.homeScore !== undefined &&
      justCompletedManagedFixture.awayScore !== undefined &&
      updatedGame.managerProfile?.coachRivalries?.length
    ) {
      const isHome = justCompletedManagedFixture.homeClubId === updatedGame.managedClubId
      const mScore = isHome ? justCompletedManagedFixture.homeScore : justCompletedManagedFixture.awayScore
      const oScore = isHome ? justCompletedManagedFixture.awayScore : justCompletedManagedFixture.homeScore
      const opponentClubId = isHome ? justCompletedManagedFixture.awayClubId : justCompletedManagedFixture.homeClubId
      let profileWithH2H = updateH2HRecord(updatedGame.managerProfile, opponentClubId, mScore, oScore)
      // Log rivalry once when a clear nemesis emerges (3+ losses, losses > wins)
      const existingRivalryLog = (profileWithH2H.narrativeLog ?? []).some(e => e.type === 'rivalry')
      if (!existingRivalryLog) {
        const nemesisCandidate = (profileWithH2H.coachRivalries ?? [])
          .find(r => r.h2hLosses >= 3 && r.h2hLosses > r.h2hWins)
        if (nemesisCandidate) {
          profileWithH2H = { ...profileWithH2H, narrativeLog: [
            ...(profileWithH2H.narrativeLog ?? []),
            { season: game.currentSeason, matchday: nextMatchday, type: 'rivalry' as const, text: `${game.clubs.find(c => c.id === nemesisCandidate.clubId)?.name ?? 'rivalen'} blev din nemesis. Det satte sig i kroppen, det här.` },
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

  return { game: updatedGame, roundPlayed: nextMatchday, seasonEnded: false, pendingEvents: allNewEvents, hasManagedCupMatch: hasManagedCupPending }
}
