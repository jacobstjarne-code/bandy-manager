import type { SaveGame, InboxItem } from '../../domain/entities/SaveGame'
import type { Moment } from '../../domain/entities/Moment'
import type { Player } from '../../domain/entities/Player'
import type { Fixture } from '../../domain/entities/Fixture'
import type { MatchWeather } from '../../domain/entities/Weather'
import { FixtureStatus, MatchEventType, InboxItemType, PendingScreen, PlayoffStatus, TrainingType, TrainingIntensity } from '../../domain/enums'
import { getTacticModifiers } from '../../domain/services/tacticModifiers'
import { getRivalry } from '../../domain/data/rivalries'
import { generateMatchWeather } from '../../domain/services/weatherService'
import { calculateStandings } from '../../domain/services/standingsService'
import {
  createMatchResultItem,
  createInjuryItem,
  createSuspensionItem,
  createRecoveryItem,
} from '../../domain/services/inboxService'
import { updateAllMarketValues } from '../../domain/services/marketValueService'
import { executeTransfer } from '../../domain/services/transferService'
import { generateWeeklyDecision } from '../../domain/services/weeklyDecisionService'
import { evaluateBoard, generateBoardMessage } from '../../domain/services/boardService'
import { mulberry32 } from '../../domain/utils/random'
import { getRoundDate, buildSeasonCalendar } from '../../domain/services/scheduleGenerator'
import { handleSeasonEnd } from './seasonEndProcessor'
import { handlePlayoffStart } from './playoffTransition'
import type { AdvanceResult } from './advanceTypes'
import { applyRoundTraining } from './processors/trainingProcessor'
import { applyPlayerStateUpdates } from './processors/playerStateProcessor'
import { updatePlayerMatchStats } from './processors/statsProcessor'
import { applyRoundDevelopment } from '../../domain/services/playerDevelopmentService'
import { processPlayoffRound } from './processors/playoffProcessor'
import { processCupRound } from './processors/cupProcessor'
import { appendFinanceLog, applyFinanceChange } from '../../domain/services/economyService'
import { updatePlayerAvailability, updateLowMoraleDays } from '../../domain/services/playerAvailabilityService'
import { updateTrainerArc } from '../../domain/services/trainerArcService'
import { checkInObjectives } from '../../domain/services/boardObjectiveService'
import { generateMecenat, generateMecenatIntroEvent } from '../../domain/services/mecenatService'
import { processEconomy } from './processors/economyProcessor'
import { processCommunity } from './processors/communityProcessor'
import { processScouts } from './processors/scoutProcessor'
import { processTransferBids, processLoans } from './processors/transferProcessor'
import { processSponsors } from './processors/sponsorProcessor'
import { checkContextualSponsors, applyOneTimeKommunstod } from '../../domain/services/contextualSponsorService'
import { calculateClubEra, eraLabel } from '../../domain/services/clubEraService'
import { simulateRound } from './processors/matchSimProcessor'
import { processYouth } from './processors/youthProcessor'
import { detectArcTriggers, progressArcs } from '../../domain/services/arcService'
import { generatePreMatchOpponentQuote } from '../../domain/services/opponentManagerService'
import { generateAwayTrip } from '../../domain/services/awayTripService'
import { processNarrative } from './processors/narrativeProcessor'
import { processMedia } from './processors/mediaProcessor'
import { processGameEvents } from './processors/eventProcessor'
import { applyRipples, mergeRippleDeltas } from '../../domain/services/rippleEffectService'

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

  const strippedEvents = f.events
    .filter(e => e.type === MatchEventType.Goal || e.type === MatchEventType.RedCard || e.type === MatchEventType.YellowCard)
    .map(e => ({ ...e, description: '' }))

  return {
    ...f,
    events: strippedEvents,
    homeLineup: stripLineup(f.homeLineup),
    awayLineup: stripLineup(f.awayLineup),
    report: preserveRatings || !f.report ? f.report : { ...f.report, playerRatings: {} },
  }
}

export function advanceToNextEvent(game: SaveGame, seed?: number): AdvanceResult {
  const scheduledFixtures = game.fixtures.filter(f => f.status === FixtureStatus.Scheduled)
  // League fixtures only (non-cup) for deciding playoff/season-end triggers
  const scheduledLeagueFixtures = scheduledFixtures.filter(f => !f.isCup)

  // No scheduled league fixtures — decide what comes next
  if (scheduledLeagueFixtures.length === 0) {
    if (!game.playoffBracket) {
      return handlePlayoffStart(game, seed)
    } else if (game.playoffBracket.status === PlayoffStatus.Completed) {
      // Wait for cup to finish before ending the season
      const pendingCupFixtures = scheduledFixtures.filter(f => f.isCup)
      if (pendingCupFixtures.length === 0) {
        return handleSeasonEnd(game, seed)
      }
      // Cup still running — fall through to simulate cup round below
    } else {
      // Bracket exists but incomplete with no fixtures — shouldn't happen normally
      return handleSeasonEnd(game, seed)
    }
  }

  // nextMatchday is the global play order index — sort by matchday, not roundNumber
  const nextMatchday = Math.min(...scheduledFixtures.map(f => f.matchday))

  // Diagnostic: log advance state for omgångshopp debugging
  if (typeof window !== 'undefined') {
    console.log('[ADVANCE] nextMatchday:', nextMatchday,
      'scheduled:', scheduledFixtures.slice(0, 8).map(f => ({ md: f.matchday, isCup: !!f.isCup, r: f.roundNumber })))
  }

  // Guard: detect matchday skips (diagnostic for omgångshopp bug)
  const lastPlayedMatchday = game.fixtures
    .filter(f => f.status === FixtureStatus.Completed && !f.isCup)
    .reduce((max, f) => Math.max(max, f.matchday ?? f.roundNumber), 0)
  if (nextMatchday > lastPlayedMatchday + 2 && lastPlayedMatchday > 0) {
    console.warn(`[MATCHDAY SKIP] last=${lastPlayedMatchday} next=${nextMatchday} — possible scheduling gap`)
  }

  // Collect fixtures for this matchday (scheduled + already-completed live-played)
  const roundFixtures = game.fixtures.filter(f =>
    f.matchday === nextMatchday &&
    (f.status === FixtureStatus.Scheduled || f.status === FixtureStatus.Completed)
  )

  // Guard: detect cup+league collision on same matchday
  const hasCup = roundFixtures.some(f => f.isCup)
  const hasLeague = roundFixtures.some(f => !f.isCup && f.roundNumber <= 22)
  if (hasCup && hasLeague) {
    console.error(`[MATCHDAY CONFLICT] md${nextMatchday} has both cup and league fixtures!`)
  }

  // Detect second-pass scenario: advance() is called twice for cup/playoff matchdays —
  // first to sim AI matches (managed skipped), then again after user sets lineup.
  // On pass 2, all AI fixtures are already Completed. Skip training/economy/injuries
  // to avoid double side-effects; only the managed fixture simulation is needed.
  let aiCount = 0, aiCompletedCount = 0, hasManagedScheduled = false
  for (const f of roundFixtures) {
    const isManaged = f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId
    if (isManaged) {
      if (f.status === FixtureStatus.Scheduled) hasManagedScheduled = true
    } else {
      aiCount++
      if (f.status === FixtureStatus.Completed) aiCompletedCount++
    }
  }
  const isSecondPassForManagedMatch = aiCount > 0 && aiCompletedCount === aiCount && hasManagedScheduled

  const baseSeed = seed ?? (nextMatchday * 1000 + game.currentSeason * 7)
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

  // Determine if this round contains cup or playoff fixtures
  const isCupRound = roundFixtures.some(f => f.isCup)
  const isPlayoffRound = !isCupRound && game.playoffBracket !== null && nextMatchday > 26

  // League round number (1-22) for board milestones and training — null during cup/playoff rounds
  const currentLeagueRound = roundFixtures.find(f => !f.isCup && f.roundNumber <= 22)?.roundNumber ?? null

  // ── Apply training for all clubs this round ────────────────────────────
  // Skip on second pass (AI fixtures already done, only managed match left) to prevent double side-effects
  const trainingResult = isSecondPassForManagedMatch
    ? { players: game.players, trainingHistory: game.trainingHistory ?? [], inboxItems: [] as InboxItem[], trainingProjects: game.trainingProjects ?? [], trainingEffects: [] }
    : applyRoundTraining(game, baseSeed, currentLeagueRound ?? nextMatchday)
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
  const standings = calculateStandings(game.league.teamIds, completedFixtures)

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

  // Update seasonStats and careerStats for all players in completed fixtures this round
  // Also detect career milestones for managed club players
  const statsResult = updatePlayerMatchStats(finalPlayers, simulatedFixtures, game, nextMatchday)
  finalPlayers = statsResult.finalPlayers
  const milestoneInboxItems = statsResult.milestoneInboxItems

  // Push milestone inbox items
  newInboxItems.push(...milestoneInboxItems)

  // ── WEAK-006/DEV-009: Captain morale cascade ──────────────────────────────
  if (game.captainPlayerId) {
    const captain = finalPlayers.find(p => p.id === game.captainPlayerId)
    if (captain && captain.morale < 40) {
      const alreadySentId = `inbox_captain_crisis_r${nextMatchday}_${game.currentSeason}`
      const alreadySent = newInboxItems.some(i => i.id === alreadySentId) || game.inbox.some(i => i.id === alreadySentId)
      if (!alreadySent) {
        finalPlayers = finalPlayers.map(p => {
          if (p.clubId !== game.managedClubId || p.id === captain.id) return p
          return { ...p, morale: Math.max(0, p.morale - 5) }
        })
        newMoments.push({
          id: alreadySentId,
          source: 'captain_crisis',
          matchday: nextMatchday,
          season: game.currentSeason,
          title: 'Omklädningsrummet är tyst',
          body: `Kapten ${captain.firstName} ${captain.lastName} har inte sagt mycket denna vecka. Det märks i hela truppen.`,
          subjectPlayerId: captain.id,
        })
      }
    }
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
    )
  }

  // Match results for managed club
  for (const fixture of simulatedFixtures) {
    if (
      fixture.homeClubId === game.managedClubId ||
      fixture.awayClubId === game.managedClubId
    ) {
      newInboxItems.push(
        createMatchResultItem(fixture, game.managedClubId, game.currentDate),
      )
    }
  }

  // Injury notifications + DREAM-003 star injury ripple
  let gameAfterRipples = game
  for (const { player, days } of newlyInjured) {
    const clubId = player.clubId
    if (clubId === game.managedClubId) {
      newInboxItems.push(createInjuryItem(player, days, game.currentDate))
      gameAfterRipples = applyRipples(gameAfterRipples, { type: 'star_injured', playerId: player.id })
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

  // ── Process active scout assignment + talent search ───────────────────
  const scoutResult = processScouts(game, finalPlayers, nextMatchday, baseSeed, localRand)
  newInboxItems.push(...scoutResult.inboxItems)
  const updatedScoutReports = { ...scoutResult.updatedScoutReports }
  const updatedScoutAssignment = scoutResult.updatedScoutAssignment
  const updatedTalentSearch = scoutResult.updatedTalentSearch
  const updatedTalentResults = scoutResult.updatedTalentResults

  // Date from season calendar — look up by matchday so cup rounds get correct dates
  const calendar = buildSeasonCalendar(game.currentSeason)
  const calendarSlot = calendar.find(s => s.matchday === nextMatchday)
  const newDate = calendarSlot?.date ?? getRoundDate(game.currentSeason, nextMatchday)

  const justCompletedManagedFixture = simulatedFixtures.find(
    f => (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
         f.status === FixtureStatus.Completed
  )

  // DREAM-003: derby win ripple — big margin win in a derby gives cross-system boosts
  if (justCompletedManagedFixture) {
    const isDerby = getRivalry(justCompletedManagedFixture.homeClubId, justCompletedManagedFixture.awayClubId) !== null
    if (isDerby) {
      const managedIsHome = justCompletedManagedFixture.homeClubId === game.managedClubId
      const managedScore = managedIsHome ? (justCompletedManagedFixture.homeScore ?? 0) : (justCompletedManagedFixture.awayScore ?? 0)
      const oppScore = managedIsHome ? (justCompletedManagedFixture.awayScore ?? 0) : (justCompletedManagedFixture.homeScore ?? 0)
      if (managedScore > oppScore) {
        gameAfterRipples = applyRipples(gameAfterRipples, { type: 'big_derby_win', fixtureId: justCompletedManagedFixture.id })
        const rivalClub = game.clubs.find(c => c.id === (justCompletedManagedFixture.homeClubId === game.managedClubId ? justCompletedManagedFixture.awayClubId : justCompletedManagedFixture.homeClubId))
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

  // ── Narrative: fan mood, victory echo, rivalry, nemesis ─────────────────
  const narrativeResult = processNarrative(
    game,
    justCompletedManagedFixture ?? null,
    nextMatchday,
    newDate,
    localRand,
  )
  const newFanMood = narrativeResult.fanMood
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
  const remainingScheduled = finalAllFixtures.filter(f => f.status === FixtureStatus.Scheduled)
  if (remainingScheduled.length > 0) {
    const upcomingMatchday = Math.min(...remainingScheduled.map(f => f.matchday))
    const upcomingManagedFixture = remainingScheduled.find(
      f => f.matchday === upcomingMatchday &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    )

    if (upcomingManagedFixture) {
      const derbyRivalry = getRivalry(upcomingManagedFixture.homeClubId, upcomingManagedFixture.awayClubId)
      if (derbyRivalry) {
        const opponentClubId = upcomingManagedFixture.homeClubId === game.managedClubId
          ? upcomingManagedFixture.awayClubId
          : upcomingManagedFixture.homeClubId
        const opponentClub = game.clubs.find(c => c.id === opponentClubId)
        const managedClub = game.clubs.find(c => c.id === game.managedClubId)
        const alreadySent = game.inbox.some(
          item => item.id === `inbox_derby_${upcomingManagedFixture.id}`
        )
        if (!alreadySent) {
          newInboxItems.push({
            id: `inbox_derby_${upcomingManagedFixture.id}`,
            date: game.currentDate,
            type: InboxItemType.Derby,
            title: `🔥 Derby nästa omgång! ${derbyRivalry.name}`,
            body: `${managedClub?.name ?? 'Ni'} möter ${opponentClub?.name ?? 'motståndaren'} i ${derbyRivalry.name}. Intensiteten kommer vara hög.`,
            isRead: false,
          })

          // DREAM-001: pre-match opponent manager quote
          if (opponentClub) {
            const opponentQuote = generatePreMatchOpponentQuote(opponentClub, true)
            if (opponentQuote) {
              newInboxItems.push({
                id: `inbox_prematch_quote_${upcomingManagedFixture.id}`,
                date: game.currentDate,
                type: InboxItemType.MediaEvent,
                title: `Inför derbyt: ${opponentClub.shortName ?? opponentClub.name}`,
                body: opponentQuote,
                isRead: false,
              })
            }
          }
        }
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
  const leagueRound = finalAllFixtures
    .filter(f => f.status === FixtureStatus.Completed && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)
  let updatedBoardObjectives = game.boardObjectives ?? []
  if ([7, 14, 22].includes(leagueRound) && updatedBoardObjectives.length > 0) {
    const gameForEval = { ...game, players: availabilityUpdatedPlayers, fixtures: finalAllFixtures, standings }
    const { updated, inboxMessages } = checkInObjectives(updatedBoardObjectives, gameForEval)
    updatedBoardObjectives = updated
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
      const arrow = delta > 0 ? '📈' : '📉'
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
  // Skip on second pass to prevent double wage/income application
  const economyResult = isSecondPassForManagedMatch
    ? { roundFinanceLog: [], updatedClubs: game.clubs }
    : processEconomy(
        game,
        simulatedFixtures,
        availabilityUpdatedPlayers,
        game.fanMood ?? 50,
        standings,
        nextMatchday,
        cupResult.prizeMoneyByClub,
        localRand,
      )
  const { roundFinanceLog, updatedClubs: socialMediaBoostedClubs } = economyResult

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
    isSecondPassForManagedMatch,
    localRand,
  )
  newInboxItems.push(...mediaResult.inboxItems)
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

  // Trim accumulated data to prevent localStorage bloat
  const MAX_INBOX = 50
  const trimmedInbox = [...game.inbox, ...newInboxItems]
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
  // Skip on second pass (same as processEconomy) to prevent double contract-round decrement
  const sponsorResult = isSecondPassForManagedMatch
    ? { updatedSponsors: game.sponsors ?? [], inboxItems: [] }
    : processSponsors(
        game,
        justCompletedManagedFixture ?? null,
        finalPlayers,
        nextMatchday,
        newDate,
        baseSeed,
        localRand,
      )
  newInboxItems.push(...sponsorResult.inboxItems)
  let updatedSponsors = sponsorResult.updatedSponsors

  // M13: contextual sponsors (top4, CS>70, attendance>1000)
  const contextualResult = isSecondPassForManagedMatch
    ? { newSponsors: [], newMoments: [] }
    : checkContextualSponsors(
        { ...game, sponsors: updatedSponsors },
        standings,
        nextMatchday,
      )
  if (contextualResult.newSponsors.length > 0) {
    updatedSponsors = [...updatedSponsors, ...contextualResult.newSponsors]
    newMoments.push(...contextualResult.newMoments)
  }
  // Apply one-time kommunstöd payment if triggered (80k to managed club finances)
  let kommunstodBonus = 0
  const kommunResult = applyOneTimeKommunstod({ ...game, sponsors: updatedSponsors })
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
  let postTransferPlayers = loanAndRegenPlayers
  let postTransferClubs = regenUpdatedClubs
  let sponsorNetworkMoodDelta = 0
  for (const bid of resolvedBids) {
    if (bid.direction !== 'outgoing' || bid.status !== 'accepted') continue
    const wasPending = prevBids.find(b => b.id === bid.id)?.status === 'pending'
    if (!wasPending) continue
    const tmpGame = { ...preEventGame, players: postTransferPlayers, clubs: postTransferClubs }
    const result = executeTransfer(tmpGame, bid)
    postTransferPlayers = result.players
    postTransferClubs = result.clubs

    // Nemesis no more — om vi just värvat en nemesis-spelare
    const nemesis = updatedNemesisTracker[bid.playerId]
    if (nemesis && nemesis.goalsAgainstUs >= 3) {
      const signedPlayer = postTransferPlayers.find(p => p.id === bid.playerId)
      if (signedPlayer) {
        updatedNemesisTracker[bid.playerId] = { ...nemesis, signedBy: game.managedClubId }
        newMoments.push({
          id: `moment_nemesis_${bid.playerId}_${game.currentSeason}`,
          source: 'nemesis_signed',
          matchday: nextMatchday,
          season: game.currentSeason,
          title: `${signedPlayer.firstName} ${signedPlayer.lastName} — i rätt färger nu`,
          body: `${nemesis.goalsAgainstUs} mål MOT oss. Nu bär han våra.`,
          subjectPlayerId: bid.playerId,
        })
      }
    }

    // WEAK-022B: Mecenat cost-share vid transferköp (inkommande spelare)
    if (bid.direction === 'outgoing' && bid.status === 'accepted' && bid.offerAmount > 0) {
      const activeMec = (game.mecenater ?? []).find(m => m.isActive && (m.happiness ?? 50) >= 60 &&
        (m.businessType === 'brukspatron' || m.businessType === 'entrepreneur'))
      if (activeMec) {
        const share = Math.min(50000, Math.round(bid.offerAmount * 0.20))
        postTransferClubs = applyFinanceChange(postTransferClubs, game.managedClubId, share)
        const boughtPlayer = postTransferPlayers.find(p => p.id === bid.playerId)
        newMoments.push({
          id: `moment_mec_costshare_${bid.playerId}_${nextMatchday}`,
          source: 'mecenat_costshare',
          matchday: nextMatchday,
          season: game.currentSeason,
          title: `${activeMec.name} täcker 20%`,
          body: `${boughtPlayer ? `${boughtPlayer.firstName} ${boughtPlayer.lastName}` : 'Affären'} blev lite billigare. ${share.toLocaleString('sv-SE')} kr tillbaka i kassan.`,
          subjectPlayerId: boughtPlayer?.id,
        })
      }
    }

    // WEAK-022C: Sponsor-reaktion vid stora transferer
    const transferPlayer = postTransferPlayers.find(p => p.id === bid.playerId)
    if (transferPlayer) {
      if (bid.direction === 'outgoing' && bid.status === 'accepted' && transferPlayer.currentAbility > 70) {
        // Köp av stark spelare → sponsorer nöjda
        sponsorNetworkMoodDelta += 3
        newMoments.push({
          id: `moment_sponsor_buy_${bid.playerId}_${nextMatchday}`,
          source: 'sponsor_positive',
          matchday: nextMatchday,
          season: game.currentSeason,
          title: 'Sponsornätverket reagerar positivt',
          body: `Huvudsponsorn nöjd med värvningen av ${transferPlayer.firstName} ${transferPlayer.lastName}.`,
          subjectPlayerId: bid.playerId,
        })
      }
    }
  }

  // WEAK-022C: Försäljning av klackfavorit → sponsorer oroliga
  for (const bid of resolvedBids) {
    if (bid.direction !== 'incoming' || bid.status !== 'accepted') continue
    const wasPending = prevBids.find(b => b.id === bid.id)?.status === 'pending'
    if (!wasPending) continue
    const soldPlayer = loanAndRegenPlayers.find(p => p.id === bid.playerId)
    const isFavorite = soldPlayer && game.supporterGroup?.favoritePlayerId === bid.playerId
    if (isFavorite) {
      sponsorNetworkMoodDelta -= 5
      newMoments.push({
        id: `moment_sponsor_sell_${bid.playerId}_${nextMatchday}`,
        source: 'sponsor_negative',
        matchday: nextMatchday,
        season: game.currentSeason,
        title: 'Sponsornätverket oroligt',
        body: `Sponsornätverket oroligt efter stjärnförsäljningen av ${soldPlayer.firstName} ${soldPlayer.lastName}.`,
        subjectPlayerId: bid.playerId,
      })
    }

    // Hook 7: transfer story Moment for historically significant sales from managed club
    if (soldPlayer) {
      const isCaptain = game.captainPlayerId === bid.playerId
      const isFanFavorite = game.supporterGroup?.favoritePlayerId === bid.playerId
      const isLegend = soldPlayer.careerStats.totalGames >= 80
      const isHomegrown = !!(soldPlayer.isHomegrown && soldPlayer.academyClubId === game.managedClubId)
      if (isCaptain || isFanFavorite || isLegend || isHomegrown) {
        const buyerClub = game.clubs.find(c => c.id === bid.buyingClubId)
        const role = isCaptain ? 'kapten' : isFanFavorite ? 'klackfavorit' : isLegend ? 'legend' : 'akademiprodukt'
        newMoments.push({
          id: `moment_transfer_${bid.playerId}_${nextMatchday}`,
          source: 'transfer_story',
          matchday: nextMatchday,
          season: game.currentSeason,
          title: `${soldPlayer.firstName} ${soldPlayer.lastName} lämnar`,
          body: `Vår ${role} lämnar${buyerClub ? ` till ${buyerClub.name}` : ''}. Det är inte lätt att ta in.`,
          subjectPlayerId: bid.playerId,
          subjectClubId: buyerClub?.id,
        })
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
  const { csBoost, updatedFacilityProjects, facilityBonusTotal, updatedVolunteers, updatedVolunteerMorale } = communityResult
  if (facilityBonusTotal > 0) {
    postTransferClubs = postTransferClubs.map(c =>
      c.id === game.managedClubId
        ? { ...c, facilities: Math.min(100, c.facilities + facilityBonusTotal) }
        : c
    )
  }
  // M13: apply kommunstöd one-time bonus to club finances
  if (kommunstodBonus > 0) {
    postTransferClubs = postTransferClubs.map(c =>
      c.id === game.managedClubId ? { ...c, finances: c.finances + kommunstodBonus } : c
    )
  }

  // ── Mecenat spawn ─────────────────────────────────────────────────────────
  // Trigger: communityStanding >= 65, reputation >= 55, inga aktiva mecenater
  // Max 1 mecenat per säsong. Spawnar som GameEvent (intro) som spelaren accepterar/avvisar.
  if (
    !isSecondPassForManagedMatch &&
    currentLeagueRound !== null &&
    currentLeagueRound >= 6 &&
    currentLeagueRound <= 18
  ) {
    const cs = game.communityStanding ?? 50
    const rep = postTransferClubs.find(c => c.id === game.managedClubId)?.reputation ?? 50
    const activeMecenater = (game.mecenater ?? []).filter(m => m.isActive)
    const maxMecenater = cs >= 85 ? 3 : cs >= 70 ? 2 : 1
    const alreadySpawnedThisSeason = (game.mecenater ?? []).some(
      m => m.arrivedSeason === game.currentSeason
    )

    if (
      cs >= 65 &&
      rep >= 55 &&
      activeMecenater.length < maxMecenater &&
      !alreadySpawnedThisSeason &&
      localRand() < 0.15
    ) {
      const newMecenat = generateMecenat(game.managedClubId, game.currentSeason, localRand)
      const introEvent = generateMecenatIntroEvent(newMecenat)
      updatedMecenater = [...updatedMecenater, { ...newMecenat, isActive: false }]
      allNewEvents.push(introEvent)
    }
  }

  // ── WEAK-019: Away trip microdecision — generate for upcoming away fixture ──
  const upcomingAwayFixture = finalAllFixtures
    .filter(f => f.status === FixtureStatus.Scheduled && f.awayClubId === game.managedClubId)
    .sort((a, b) => a.matchday - b.matchday)[0] ?? null
  const nextManagedFixtureForTrip = finalAllFixtures
    .filter(f => f.status === FixtureStatus.Scheduled && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => a.matchday - b.matchday)[0] ?? null
  const isNextAway = nextManagedFixtureForTrip?.awayClubId === game.managedClubId
  const awayTripUpdate = (() => {
    // Clear if we just played away (trip consumed)
    if (justCompletedManagedFixture && justCompletedManagedFixture.awayClubId === game.managedClubId) {
      return undefined
    }
    // Keep existing trip if it's for the same upcoming fixture and already has a decision
    if (game.awayTrip && isNextAway && nextManagedFixtureForTrip && game.awayTrip.fixtureId === nextManagedFixtureForTrip.id) {
      return game.awayTrip
    }
    // Generate new trip if next managed fixture is away
    if (isNextAway && nextManagedFixtureForTrip && upcomingAwayFixture) {
      const tripWeather = trimmedWeathers.find(mw => mw.fixtureId === nextManagedFixtureForTrip.id)
      return generateAwayTrip(nextManagedFixtureForTrip, tripWeather)
    }
    return undefined
  })()

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
    scoutBudget: game.scoutBudget ?? 10,
    transferBids: trimmedBids,
    pendingEvents: [
      ...(game.pendingEvents ?? []).filter(e => !e.resolved && !allNewEvents.some(n => n.id === e.id)),
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
    boardObjectiveHistory: game.boardObjectiveHistory ?? [],
    facilityProjects: updatedFacilityProjects,
    volunteers: updatedVolunteers,
    volunteerMorale: updatedVolunteerMorale,
    trainerArc: updatedArc,
    previousKommunBidrag: game.localPolitician?.kommunBidrag,
    mecenater: updatedMecenater,
    lastCoffeeQuoteHash: currentLeagueRound !== null ? currentLeagueRound * 7 + game.currentSeason * 31 : game.lastCoffeeQuoteHash,
    lastEconomicStressRound: eventResult.lastEconomicStressRound,
    pendingPressConference: simResult.pressEvent ?? undefined,
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
      const newDecision = generateWeeklyDecision(
        { ...game, resolvedWeeklyDecisions: game.resolvedWeeklyDecisions ?? [] },
        nextMatchday,
      )
      return {
        pendingWeeklyDecision: newDecision ?? undefined,
        weeklyDecisionLastRound: newDecision ? nextMatchday : game.weeklyDecisionLastRound,
      }
    })(),
    resolvedEventIds: reputationResolvedIds,
    awayTrip: awayTripUpdate,
    pendingVictoryEcho,
    victoryEchoExpires,
    recentMoments: (() => {
      // M14: check for era shift and push era_shift Moment
      const newEra = calculateClubEra(game)
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
    currentEra: calculateClubEra(game),
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
    updatedGame = {
      ...updatedGame,
      activeArcs: cleanedArcs,
      pendingEvents: [...(updatedGame.pendingEvents ?? []), ...arcResult.newEvents],
      storylines: [...(updatedGame.storylines ?? []), ...arcResult.newStorylines],
      inbox: [...updatedGame.inbox, ...arcInbox],
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
          title: '📬 Uppföljning',
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

  // ── Halvtidssummering — trigger efter liga-omgång 11 ───────────────────────
  if (
    justCompletedManagedFixture &&
    !justCompletedManagedFixture.isCup &&
    justCompletedManagedFixture.roundNumber === 11 &&
    game.pendingScreen !== PendingScreen.HalfTimeSummary
  ) {
    updatedGame = { ...updatedGame, pendingScreen: PendingScreen.HalfTimeSummary }
  }

  // Onboarding step progression (advances after first 3 managed matches)
  const currentOnboarding = updatedGame.onboardingStep ?? 0
  if (currentOnboarding < 4 && justCompletedManagedFixture) {
    updatedGame = { ...updatedGame, onboardingStep: currentOnboarding + 1 }
  }

  return { game: updatedGame, roundPlayed: nextMatchday, seasonEnded: false, pendingEvents: allNewEvents, hasManagedCupMatch: hasManagedCupPending }
}
