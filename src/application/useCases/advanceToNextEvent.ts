import type { SaveGame, InboxItem, CommunityActivities, StandingRow } from '../../domain/entities/SaveGame'
import type { Player, CareerMilestone } from '../../domain/entities/Player'
import type { Club } from '../../domain/entities/Club'
import type { Fixture, TeamSelection } from '../../domain/entities/Fixture'
import type { MatchWeather } from '../../domain/entities/Weather'
import { FixtureStatus, MatchEventType, PlayerPosition, InboxItemType, TrainingType, TrainingIntensity, PlayoffStatus, ClubStyle } from '../../domain/enums'
import type { FormationType } from '../../domain/entities/Formation'
import { simulateMatch, computeWeatherTacticInteraction } from '../../domain/services/matchSimulator'
import { getTacticModifiers } from '../../domain/services/tacticModifiers'
import { getRivalry } from '../../domain/data/rivalries'
import { generateMatchWeather } from '../../domain/services/weatherService'
import { calculateStandings } from '../../domain/services/standingsService'
import { developPlayers } from '../../domain/services/playerDevelopmentService'
import { applyTrainingToSquad, selectAiTrainingFocus, getTrainingEffects } from '../../domain/services/trainingService'
import { generateYouthIntake } from '../../domain/services/youthIntakeService'
import { generateSchedule } from '../../domain/services/scheduleGenerator'
import {
  generatePlayoffBracket,
  generatePlayoffFixtures,
  updateSeriesAfterMatch,
  isSeriesDecided,
  advancePlayoffRound,
} from '../../domain/services/playoffService'
import {
  createMatchResultItem,
  createInjuryItem,
  createSuspensionItem,
  createRecoveryItem,
  createYouthIntakeItem,
  createTrainingItem,
} from '../../domain/services/inboxService'
import { processScoutAssignment } from '../../domain/services/scoutingService'
import { updateAllMarketValues } from '../../domain/services/marketValueService'
import { generateIncomingBids, resolveOutgoingBid } from '../../domain/services/transferService'
import { generatePostAdvanceEvents, generateEvents } from '../../domain/services/eventService'
import { generateMediaHeadlines } from '../../domain/services/mediaService'
import type { GameEvent, TransferBid } from '../../domain/entities/GameEvent'
import type { ScoutReport, ScoutAssignment } from '../../domain/entities/Scouting'
import { evaluateBoard, generateBoardMessage, generateSeasonVerdict, generatePreSeasonMessage } from '../../domain/services/boardService'
import { generateSeasonSummary } from '../../domain/services/seasonSummaryService'
import { executeTalentSearch } from '../../domain/services/talentScoutService'
import {
  generateCupFixtures,
  updateCupBracketAfterRound,
  generateNextCupRound,
  getCupRoundName,
} from '../../domain/services/cupService'
import type { CupBracket } from '../../domain/entities/Cup'
import { mulberry32 } from '../../domain/utils/random'
import { processTrainingProjectsPerRound, PROJECT_DEFINITIONS } from '../../domain/services/trainingProjectService'
import { simulateYouthMatch, generateYouthTeam } from '../../domain/services/academyService'
import { calculateKommunBidrag, generateNewPolitician } from '../../domain/services/politicianService'
import type { LicenseReview } from '../../domain/entities/SaveGame'

export interface AdvanceResult {
  game: SaveGame
  roundPlayed: number | null
  seasonEnded: boolean
  playoffStarted?: boolean
  pendingEvents?: GameEvent[]
}


const AI_FORMATIONS: Record<ClubStyle, FormationType> = {
  [ClubStyle.Defensive]: '4-3-3',
  [ClubStyle.Balanced]: '5-3-2',
  [ClubStyle.Attacking]: '2-3-2-3',
  [ClubStyle.Physical]: '4-2-4',
  [ClubStyle.Technical]: '3-4-3',
}

function generateAiLineup(club: Club, allPlayers: Player[]): TeamSelection {
  const available = allPlayers.filter(
    p =>
      club.squadPlayerIds.includes(p.id) &&
      !p.isInjured &&
      p.suspensionGamesRemaining <= 0,
  )

  // Sort by current ability descending
  const sorted = [...available].sort((a, b) => b.currentAbility - a.currentAbility)

  // Pick best GK first
  const gkPool = sorted.filter(p => p.position === PlayerPosition.Goalkeeper)
  const outfieldPool = sorted.filter(p => p.position !== PlayerPosition.Goalkeeper)

  const starters: Player[] = []

  if (gkPool.length > 0) {
    starters.push(gkPool[0])
  }

  // Fill remaining 10 with best outfield players
  for (const p of outfieldPool) {
    if (starters.length >= 11) break
    starters.push(p)
  }

  // If we still don't have 11, fill with remaining GKs
  if (starters.length < 11) {
    for (const p of gkPool.slice(1)) {
      if (starters.length >= 11) break
      starters.push(p)
    }
  }

  // Bench: next 5 best available not in starters
  const starterIds = new Set(starters.map(p => p.id))
  const bench: Player[] = []
  for (const p of sorted) {
    if (bench.length >= 5) break
    if (!starterIds.has(p.id)) {
      bench.push(p)
    }
  }

  // Captain: highest CA among starters
  const captain = starters.reduce(
    (best, p) => (p.currentAbility > (best?.currentAbility ?? -1) ? p : best),
    starters[0],
  )

  return {
    startingPlayerIds: starters.map(p => p.id),
    benchPlayerIds: bench.map(p => p.id),
    captainPlayerId: captain?.id,
    tactic: { ...club.activeTactic, formation: AI_FORMATIONS[club.preferredStyle] ?? '5-3-2' },
  }
}

function advanceDate(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function stripCompletedFixture(f: Fixture, managedFixtureId?: string): Fixture {
  // Keep full data for the most recent managed match (for match report)
  if (f.id === managedFixtureId) return f
  // Keep full data for non-completed fixtures
  if (f.status !== FixtureStatus.Completed) return f

  // Strip heavy data from old completed fixtures
  return {
    ...f,
    // Keep only goal/card events, drop descriptions
    events: f.events
      .filter(e =>
        e.type === MatchEventType.Goal ||
        e.type === MatchEventType.RedCard ||
        e.type === MatchEventType.YellowCard
      )
      .map(e => ({ ...e, description: '' })),
    // Strip lineups — not needed after simulation
    homeLineup: f.homeLineup ? {
      startingPlayerIds: f.homeLineup.startingPlayerIds,
      benchPlayerIds: [],
      tactic: {
        mentality: f.homeLineup.tactic.mentality,
        tempo: f.homeLineup.tactic.tempo,
        press: f.homeLineup.tactic.press,
        passingRisk: f.homeLineup.tactic.passingRisk,
        width: f.homeLineup.tactic.width,
        attackingFocus: f.homeLineup.tactic.attackingFocus,
        cornerStrategy: f.homeLineup.tactic.cornerStrategy,
        penaltyKillStyle: f.homeLineup.tactic.penaltyKillStyle,
      },
    } : undefined,
    awayLineup: f.awayLineup ? {
      startingPlayerIds: f.awayLineup.startingPlayerIds,
      benchPlayerIds: [],
      tactic: {
        mentality: f.awayLineup.tactic.mentality,
        tempo: f.awayLineup.tactic.tempo,
        press: f.awayLineup.tactic.press,
        passingRisk: f.awayLineup.tactic.passingRisk,
        width: f.awayLineup.tactic.width,
        attackingFocus: f.awayLineup.tactic.attackingFocus,
        cornerStrategy: f.awayLineup.tactic.cornerStrategy,
        penaltyKillStyle: f.awayLineup.tactic.penaltyKillStyle,
      },
    } : undefined,
    // Clear playerRatings — only needed for match report screen
    report: f.report ? { ...f.report, playerRatings: {} } : undefined,
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

  // effectiveRound: cup fixtures use roundNumber - 100 so they interleave with league rounds
  // (cup QF at 103 → effective 3, SF at 107 → effective 7, Final at 111 → effective 11)
  function effectiveRound(f: { roundNumber: number; isCup?: boolean }): number {
    return f.isCup ? f.roundNumber - 100 : f.roundNumber
  }

  // nextRound is the effective round number (league round for league phases)
  const nextRound = Math.min(...scheduledFixtures.map(effectiveRound))

  // Include cup fixtures at the same effective round + already-completed live-played fixtures
  const roundFixtures = game.fixtures.filter(f =>
    effectiveRound(f) === nextRound &&
    (f.status === FixtureStatus.Scheduled || f.status === FixtureStatus.Completed)
  )

  const baseSeed = seed ?? (nextRound * 1000 + game.currentSeason * 7)
  const localRand = mulberry32(baseSeed + 9999)

  // Collect player IDs who played in this round (for fitness updates)
  const startersThisRound = new Set<string>()
  const benchThisRound = new Set<string>()

  const simulatedFixtures: Fixture[] = []
  const roundMatchWeathers: MatchWeather[] = []
  const newInboxItems: InboxItem[] = []

  // Determine if this round is a playoff round
  const isPlayoffRound = game.playoffBracket !== null && nextRound > 22

  // ── Apply training for all clubs this round ────────────────────────────
  let trainingPlayers = [...game.players]
  const managedClubTraining = game.managedClubTraining ?? { type: TrainingType.Physical, intensity: TrainingIntensity.Normal }

  for (const club of game.clubs) {
    const isManaged = club.id === game.managedClubId
    const focus = isManaged
      ? managedClubTraining
      : selectAiTrainingFocus(game.players, club.id)

    const trainingResult = applyTrainingToSquad(
      trainingPlayers,
      club.id,
      focus,
      club.facilities,
      baseSeed + club.id.length * 31 + nextRound,
    )
    trainingPlayers = trainingResult.updatedPlayers

    // Inbox for managed club injuries from training
    if (isManaged) {
      const injuredInTraining = trainingResult.injuredPlayerIds
        .map(id => trainingPlayers.find(p => p.id === id))
        .filter((p): p is Player => p !== undefined)

      newInboxItems.push(
        createTrainingItem(focus, nextRound, injuredInTraining, game.currentDate),
      )

      // Record training session in history
    }
  }

  // Build updated training history
  const trainingEffects = getTrainingEffects(managedClubTraining)
  const newTrainingSession = {
    season: game.currentSeason,
    roundNumber: nextRound,
    focus: managedClubTraining,
    effects: trainingEffects,
  }
  const updatedTrainingHistory = [...(game.trainingHistory ?? []), newTrainingSession]

  // ── Process training projects ─────────────────────────────────────────
  const projectRand = mulberry32(baseSeed + 88771)
  const activeProjects = (game.trainingProjects ?? []).filter(p => p.status === 'active')
  const projectResult = processTrainingProjectsPerRound(
    game.trainingProjects ?? [],
    trainingPlayers,
    game.managedClubId,
    projectRand,
    nextRound,
  )
  // Use project-updated players going forward
  trainingPlayers = projectResult.updatedPlayers

  // Inbox: notify for each completed project
  for (const p of projectResult.updatedProjects) {
    const wasActive = activeProjects.some(ap => ap.id === p.id)
    if (wasActive && p.status === 'completed') {
      const def = PROJECT_DEFINITIONS.find(d => d.type === p.type)
      if (def) {
        newInboxItems.push({
          id: `inbox_project_done_${p.id}`,
          date: game.currentDate,
          type: InboxItemType.BoardFeedback,
          title: `Träningsprojekt klart: ${def.label}`,
          body: `${def.emoji} ${def.label} är avslutat. Effekt: ${def.effectDescription}${p.injuredPlayerIds?.length ? ` · ⚠️ ${p.injuredPlayerIds.length} spelare skadades under projektet.` : ''}`,
          isRead: false,
        } as InboxItem)
      }
    }
  }

  for (let i = 0; i < roundFixtures.length; i++) {
    const fixture = roundFixtures[i]

    // Skip fixtures already played via live mode — track starters for fitness, don't re-simulate
    if (fixture.status === FixtureStatus.Completed) {
      simulatedFixtures.push(fixture)
      if (fixture.homeLineup) {
        for (const id of fixture.homeLineup.startingPlayerIds) startersThisRound.add(id)
        for (const id of fixture.homeLineup.benchPlayerIds) benchThisRound.add(id)
      }
      if (fixture.awayLineup) {
        for (const id of fixture.awayLineup.startingPlayerIds) startersThisRound.add(id)
        for (const id of fixture.awayLineup.benchPlayerIds) benchThisRound.add(id)
      }
      continue
    }

    // Determine lineups
    let homeLineup: TeamSelection
    let awayLineup: TeamSelection

    const homeClub = game.clubs.find(c => c.id === fixture.homeClubId)!
    const awayClub = game.clubs.find(c => c.id === fixture.awayClubId)!

    const homePlayers = game.players.filter(p => p.clubId === fixture.homeClubId)
    const awayPlayers = game.players.filter(p => p.clubId === fixture.awayClubId)

    // Generate weather
    const matchWeather = generateMatchWeather(
      game.currentSeason,
      nextRound,
      homeClub,
      fixture.id,
      baseSeed + i * 7919
    )
    roundMatchWeathers.push(matchWeather)

    // Handle cancelled fixtures
    if (matchWeather.effects.cancelled) {
      const opponentId = fixture.homeClubId === game.managedClubId ? fixture.awayClubId : fixture.homeClubId
      const opponentClub = game.clubs.find(c => c.id === opponentId)
      const isManaged = fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId
      const postponedFixture: Fixture = { ...fixture, status: FixtureStatus.Postponed }
      simulatedFixtures.push(postponedFixture)
      if (isManaged) {
        const newInboxPostpone = {
          id: `inbox_postpone_${fixture.id}`,
          date: game.currentDate,
          type: InboxItemType.MatchResult,
          title: 'Match inställd',
          body: `Matchen mot ${opponentClub?.name ?? 'motståndaren'} ställdes in på grund av dåliga isförhållanden.`,
          relatedFixtureId: fixture.id,
          isRead: false,
        }
        newInboxItems.push(newInboxPostpone)
      }
      continue
    }

    if (
      fixture.homeClubId === game.managedClubId &&
      game.managedClubPendingLineup !== undefined
    ) {
      homeLineup = game.managedClubPendingLineup
    } else {
      homeLineup = generateAiLineup(homeClub, game.players)
    }

    if (
      fixture.awayClubId === game.managedClubId &&
      game.managedClubPendingLineup !== undefined
    ) {
      awayLineup = game.managedClubPendingLineup
    } else {
      awayLineup = generateAiLineup(awayClub, game.players)
    }

    // Track starters/bench
    for (const id of homeLineup.startingPlayerIds) startersThisRound.add(id)
    for (const id of homeLineup.benchPlayerIds) benchThisRound.add(id)
    for (const id of awayLineup.startingPlayerIds) startersThisRound.add(id)
    for (const id of awayLineup.benchPlayerIds) benchThisRound.add(id)

    const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)
    const isManagedHome = fixture.homeClubId === game.managedClubId
    const homeAdv = homeClub?.hasIndoorArena ? 0.05 * 0.85 : 0.05
    const result = simulateMatch({
      fixture,
      homeLineup,
      awayLineup,
      homePlayers,
      awayPlayers,
      homeAdvantage: homeAdv,
      seed: baseSeed + i,
      weather: matchWeather.weather,
      isPlayoff: isPlayoffRound,
      rivalry: rivalry ?? undefined,
      fanMood: game.fanMood ?? 50,
      managedIsHome: isManagedHome,
    })

    simulatedFixtures.push(result.fixture)
  }

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
  const updatedPlayers = trainingPlayers.map(player => {
    let updated = { ...player }

    // ── Injury recovery (every round ≈ 7 days) ──────────────────────────
    if (updated.isInjured && updated.injuryDaysRemaining > 0) {
      updated.injuryDaysRemaining = Math.max(0, updated.injuryDaysRemaining - 7)
      if (updated.injuryDaysRemaining <= 0) {
        updated.isInjured = false
        updated.injuryDaysRemaining = 0
        updated.fitness = Math.max(30, updated.fitness - 15)
      }
    }

    // ── Suspension recovery (decrement every round for non-playing suspended players) ──
    if (updated.suspensionGamesRemaining > 0 && !startersThisRound.has(player.id)) {
      updated.suspensionGamesRemaining = Math.max(0, updated.suspensionGamesRemaining - 1)
    }

    if (startersThisRound.has(player.id)) {
      // Reduce fitness 15-25
      const baseFitnessLoss = 15 + Math.floor(localRand() * 10)
      const tacticFatigue = managedTacticMods && player.clubId === game.managedClubId
        ? managedTacticMods.fatigueRate
        : 1.0
      // Tactic × weather extra fatigue for managed players
      let weatherTacticFatigue = 1.0
      if (player.clubId === game.managedClubId && managedFixtureWeather && managedClubForTactic) {
        const twi = computeWeatherTacticInteraction(managedFixtureWeather, managedClubForTactic.activeTactic)
        weatherTacticFatigue = 1.0 + twi.extraFatigue
      }
      const fitnessLoss = Math.round(baseFitnessLoss * tacticFatigue * weatherTacticFatigue)
      updated.fitness = Math.max(0, updated.fitness - fitnessLoss)

      // Form update based on match rating
      const rating = getPlayerRating(player.id, simulatedFixtures)
      if (rating !== null) {
        if (rating >= 7) updated.form = Math.min(100, updated.form + 3)
        else if (rating <= 5) updated.form = Math.max(0, updated.form - 3)
        else updated.form = Math.min(100, updated.form + 1)
      }

      // Sharpness increases
      updated.sharpness = Math.min(100, updated.sharpness + 10)

      // Reduce suspension
      if (updated.suspensionGamesRemaining > 0) {
        updated.suspensionGamesRemaining = Math.max(0, updated.suspensionGamesRemaining - 1)
      }
    } else if (benchThisRound.has(player.id)) {
      updated.fitness = Math.min(100, updated.fitness + 5)
      updated.sharpness = Math.max(0, updated.sharpness - 5)
    } else {
      // Did not play
      updated.fitness = Math.min(100, updated.fitness + 8)
      updated.sharpness = Math.max(0, updated.sharpness - 3)
    }

    // Day job morale effects
    const isFullTimePro = player.isFullTimePro ?? false
    const flexibility = player.dayJob?.flexibility ?? 75
    if (!isFullTimePro && flexibility < 65) {
      // Check if played in last 2 completed fixtures for managed club
      const recentCompleted = simulatedFixtures
        .filter(f => f.status === FixtureStatus.Completed)
        .slice(-2)
      const playedRecently = recentCompleted.some(f =>
        (f.homeLineup?.startingPlayerIds ?? []).includes(player.id) ||
        (f.awayLineup?.startingPlayerIds ?? []).includes(player.id)
      )
      if (playedRecently) {
        // Hard week: day job + matches
        updated.morale = Math.max(0, updated.morale - 2)
      }
    }
    if (isFullTimePro && updated.fitness > 70) {
      updated.morale = Math.min(100, updated.morale + 1)
    }

    return updated
  })

  // Process match events for suspensions
  const newlyInjured: Array<{ player: Player; days: number }> = []
  const newlySuspended: Array<{ player: Player }> = []

  for (const fixture of simulatedFixtures) {
    for (const event of fixture.events) {
      if (event.type === MatchEventType.RedCard && event.playerId) {
        const idx = updatedPlayers.findIndex(p => p.id === event.playerId)
        if (idx !== -1) {
          const prev = updatedPlayers[idx].suspensionGamesRemaining
          updatedPlayers[idx] = { ...updatedPlayers[idx], suspensionGamesRemaining: 3 }
          if (prev === 0) {
            newlySuspended.push({ player: updatedPlayers[idx] })
          }
        }
      }
    }
  }

  // Post-match injury check for every starter
  // ~5-8% base chance per match player with average fitness/proneness
  for (const playerId of startersThisRound) {
    const idx = updatedPlayers.findIndex(p => p.id === playerId)
    if (idx === -1) continue
    const player = updatedPlayers[idx]
    if (player.isInjured) continue

    // injury chance = base × proneness factor × fatigue factor
    // base 0.06 → ~6% for average player (proneness 50, fitness 70)
    const proneFactor = player.injuryProneness / 100        // 0–1
    const fatigueFactor = (100 - player.fitness) / 100 + 0.3 // 0.3–1.3
    let tacticInjuryMod = managedTacticMods && player.clubId === game.managedClubId
      ? 1.0 + (managedTacticMods.fatigueRate - 1.0) * 0.5
      : 1.0
    if (player.clubId === game.managedClubId && managedFixtureWeather && managedClubForTactic) {
      const twi = computeWeatherTacticInteraction(managedFixtureWeather, managedClubForTactic.activeTactic)
      tacticInjuryMod += twi.extraInjuryRisk
    }
    const injuryChance = 0.06 * (proneFactor + 0.3) * fatigueFactor * tacticInjuryMod

    if (localRand() < injuryChance) {
      const days = 7 + Math.floor(localRand() * 28)  // 1–5 weeks
      updatedPlayers[idx] = {
        ...player,
        isInjured: true,
        injuryDaysRemaining: days,
      }
      newlyInjured.push({ player: updatedPlayers[idx], days })
    }
  }

  // Player development every 2 rounds
  let finalPlayers = updatedPlayers
  if (nextRound % 2 === 0) {
    const clubFacilities = Object.fromEntries(game.clubs.map(c => [c.id, c.facilities]))
    const devResult = developPlayers({
      players: updatedPlayers,
      clubFacilities,
      weekNumber: nextRound,
    })
    finalPlayers = devResult.updatedPlayers
  }

  // Update seasonStats and careerStats for all players in completed fixtures this round
  // Also detect career milestones for managed club players
  const newMilestoneInboxItems: InboxItem[] = []

  for (const fixture of simulatedFixtures) {
    if (fixture.status !== FixtureStatus.Completed) continue
    const allStarters = [
      ...(fixture.homeLineup?.startingPlayerIds ?? []),
      ...(fixture.awayLineup?.startingPlayerIds ?? []),
    ]
    for (const id of allStarters) {
      const idx = finalPlayers.findIndex(p => p.id === id)
      if (idx === -1) continue
      const p = finalPlayers[idx]
      const rating = fixture.report?.playerRatings[id]
      const goals = fixture.events.filter(
        e => e.type === MatchEventType.Goal && e.playerId === id
      ).length
      const assists = fixture.events.filter(
        e => e.type === MatchEventType.Assist && e.playerId === id
      ).length
      const cornerGoals = fixture.events.filter(
        e => e.type === MatchEventType.Goal && e.playerId === id && e.isCornerGoal
      ).length
      const yellows = fixture.events.filter(
        e => e.type === MatchEventType.YellowCard && e.playerId === id
      ).length
      const reds = fixture.events.filter(
        e => e.type === MatchEventType.RedCard && e.playerId === id
      ).length

      const prevGames = p.seasonStats.gamesPlayed
      const prevAvgRating = p.seasonStats.averageRating
      const newAvgRating = rating !== undefined
        ? (prevAvgRating * prevGames + rating) / (prevGames + 1)
        : prevAvgRating

      // Update careerStats
      const prevCareerGames = p.careerStats.totalGames
      const prevCareerGoals = p.careerStats.totalGoals
      const prevCareerAssists = p.careerStats.totalAssists
      const newCareerGames = prevCareerGames + 1
      const newCareerGoals = prevCareerGoals + goals
      const newCareerAssists = prevCareerAssists + assists

      // Detect milestones for managed club players
      const isManaged = p.clubId === game.managedClubId
      const newMilestones: CareerMilestone[] = [...(p.careerMilestones ?? [])]
      const existingTypes = new Set(newMilestones.map(m => `${m.type}_${m.season}`))

      if (isManaged) {
        const playerName = `${p.firstName} ${p.lastName}`

        // Hat trick milestone (3+ goals this fixture)
        if (goals >= 3) {
          if (!newMilestones.some(m => m.type === 'hatTrick' && m.season === game.currentSeason && m.round === nextRound)) {
            newMilestones.push({
              type: 'hatTrick',
              season: game.currentSeason,
              round: nextRound,
              description: `${playerName} satte ${goals} mål i en match`,
            })
            newMilestoneInboxItems.push({
              id: `inbox_milestone_hatTrick_${p.id}_r${nextRound}_${game.currentSeason}`,
              date: game.currentDate,
              type: InboxItemType.BoardFeedback,
              title: `Karriärsmilstolpe: ${playerName}`,
              body: `${playerName} satte hattrick och nådde en karriärsmilstolpe!`,
              relatedPlayerId: p.id,
              isRead: false,
            } as InboxItem)
          }
        }

        // 100 games milestone
        if (prevCareerGames < 100 && newCareerGames >= 100) {
          const msKey = `games100_${game.currentSeason}`
          if (!existingTypes.has(msKey)) {
            newMilestones.push({
              type: 'games100',
              season: game.currentSeason,
              round: nextRound,
              description: `${playerName} spelade sin 100:e karriärmatch`,
            })
            newMilestoneInboxItems.push({
              id: `inbox_milestone_games100_${p.id}_${game.currentSeason}`,
              date: game.currentDate,
              type: InboxItemType.BoardFeedback,
              title: `Karriärsmilstolpe: ${playerName}`,
              body: `${playerName} spelade sin 100:e karriärmatch — en fantastisk bedrift!`,
              relatedPlayerId: p.id,
              isRead: false,
            } as InboxItem)
          }
        }

        // 50 goals milestone
        if (prevCareerGoals < 50 && newCareerGoals >= 50) {
          const msKey = `goals50_${game.currentSeason}`
          if (!existingTypes.has(msKey)) {
            newMilestones.push({
              type: 'goals50',
              season: game.currentSeason,
              round: nextRound,
              description: `${playerName} nådde 50 karriärmål`,
            })
            newMilestoneInboxItems.push({
              id: `inbox_milestone_goals50_${p.id}_${game.currentSeason}`,
              date: game.currentDate,
              type: InboxItemType.BoardFeedback,
              title: `Karriärsmilstolpe: ${playerName}`,
              body: `${playerName} nådde 50 mål i karriären — ett historiskt ögonblick!`,
              relatedPlayerId: p.id,
              isRead: false,
            } as InboxItem)
          }
        }
      }

      finalPlayers[idx] = {
        ...p,
        seasonStats: {
          ...p.seasonStats,
          gamesPlayed: prevGames + 1,
          goals: p.seasonStats.goals + goals,
          assists: p.seasonStats.assists + assists,
          cornerGoals: p.seasonStats.cornerGoals + cornerGoals,
          yellowCards: p.seasonStats.yellowCards + yellows,
          redCards: p.seasonStats.redCards + reds,
          averageRating: Math.round(newAvgRating * 100) / 100,
          minutesPlayed: p.seasonStats.minutesPlayed + 90,
        },
        careerStats: {
          ...p.careerStats,
          totalGames: newCareerGames,
          totalGoals: newCareerGoals,
          totalAssists: newCareerAssists,
        },
        careerMilestones: isManaged ? newMilestones : p.careerMilestones,
      }
    }
  }

  // Push milestone inbox items
  newInboxItems.push(...newMilestoneInboxItems)

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

  // Injury notifications
  for (const { player, days } of newlyInjured) {
    const clubId = player.clubId
    if (clubId === game.managedClubId) {
      newInboxItems.push(createInjuryItem(player, days, game.currentDate))
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

  // ── Board milestone messages at rounds 7, 14, 22 ─────────────────────
  const BOARD_MILESTONES = [7, 14, 22]
  if (!isPlayoffRound && BOARD_MILESTONES.includes(nextRound)) {
    const managedClub = game.clubs.find(c => c.id === game.managedClubId)
    const managedStanding = standings.find(s => s.clubId === game.managedClubId)
    if (managedClub && managedStanding) {
      const totalRounds = 22
      const evaluation = evaluateBoard(
        managedClub.boardExpectation,
        managedStanding,
        game.clubs.length,
        nextRound,
        totalRounds,
      )
      const { title, body } = generateBoardMessage(evaluation, managedClub.name, nextRound)
      const alreadySent = game.inbox.some(
        i => i.id === `inbox_board_r${nextRound}_${game.currentSeason}`
      )
      if (!alreadySent) {
        newInboxItems.push({
          id: `inbox_board_r${nextRound}_${game.currentSeason}`,
          date: game.currentDate,
          type: InboxItemType.BoardFeedback,
          title,
          body,
          isRead: false,
        })
      }
    }
  }

  // ── Process active scout assignment ───────────────────────────────────
  let updatedScoutReports = game.scoutReports ?? {}
  let updatedScoutAssignment: ScoutAssignment | null = game.activeScoutAssignment ?? null

  if (updatedScoutAssignment) {
    updatedScoutAssignment = {
      ...updatedScoutAssignment,
      roundsRemaining: updatedScoutAssignment.roundsRemaining - 1,
    }
    if (updatedScoutAssignment.roundsRemaining <= 0) {
      const target = finalPlayers.find(p => p.id === updatedScoutAssignment!.targetPlayerId)
      if (target) {
        const scoutAccuracy = 70   // default accuracy; could vary by club facilities later
        const scoutSeed = baseSeed + nextRound * 17 + target.id.charCodeAt(0)
        const report: ScoutReport = processScoutAssignment(
          updatedScoutAssignment,
          target,
          scoutAccuracy,
          scoutSeed,
          game.currentSeason,
        )
        updatedScoutReports = { ...updatedScoutReports, [target.id]: report }
        const targetClub = game.clubs.find(c => c.id === updatedScoutAssignment!.targetClubId)
        newInboxItems.push({
          id: `inbox_scout_${target.id}_${game.currentSeason}_r${nextRound}`,
          date: game.currentDate,
          type: InboxItemType.ScoutReport,
          title: `Scoutrapport: ${target.firstName} ${target.lastName}`,
          body: `${report.notes} Beräknad styrka: ${report.estimatedCA}. Spelar i ${targetClub?.name ?? 'okänd klubb'}.`,
          relatedPlayerId: target.id,
          relatedClubId: updatedScoutAssignment.targetClubId,
          isRead: false,
        })
      }
      updatedScoutAssignment = null
    }
  }

  // ── Process active talent search ──────────────────────────────────────
  let updatedTalentSearch = game.activeTalentSearch ?? null
  let updatedTalentResults = [...(game.talentSearchResults ?? [])]
  if (updatedTalentSearch) {
    updatedTalentSearch = { ...updatedTalentSearch, roundsRemaining: updatedTalentSearch.roundsRemaining - 1 }
    if (updatedTalentSearch.roundsRemaining <= 0) {
      const result = executeTalentSearch(
        updatedTalentSearch,
        finalPlayers,
        game.clubs,
        game.managedClubId,
        localRand,
        game.currentSeason,
        nextRound,
      )
      updatedTalentResults = [...updatedTalentResults, result].slice(-3)
      updatedTalentSearch = null
      newInboxItems.push({
        id: `inbox_talent_${result.id}`,
        date: game.currentDate,
        type: InboxItemType.ScoutReport,
        title: 'Spaningsrapport klar',
        body: `Din scout har hittat ${result.players.length} intressanta spelare. Se Transfermarknaden för detaljer.`,
        isRead: false,
      })
    }
  }

  // Advance date by 7 days per round
  const newDate = advanceDate(game.currentDate, 7)

  const justCompletedManagedFixture = simulatedFixtures.find(
    f => (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
         f.status === FixtureStatus.Completed
  )

  // Fan mood update
  const currentFanMood = game.fanMood ?? 50
  let newFanMood = currentFanMood
  if (justCompletedManagedFixture) {
    const isHome = justCompletedManagedFixture.homeClubId === game.managedClubId
    const myScore = isHome ? justCompletedManagedFixture.homeScore : justCompletedManagedFixture.awayScore
    const theirScore = isHome ? justCompletedManagedFixture.awayScore : justCompletedManagedFixture.homeScore
    const won = (myScore ?? 0) > (theirScore ?? 0)
    const lost = (myScore ?? 0) < (theirScore ?? 0)
    const bigWin = won && (myScore ?? 0) >= (theirScore ?? 0) + 3
    const bigLoss = lost && (theirScore ?? 0) >= (myScore ?? 0) + 3
    const fanDelta = bigWin ? 8 : won ? 4 : bigLoss ? -8 : lost ? -4 : 1
    newFanMood = Math.max(0, Math.min(100, currentFanMood + fanDelta))
  }

  // ── Update rivalry history ────────────────────────────────────────────
  let updatedRivalryHistory = { ...(game.rivalryHistory ?? {}) }
  if (justCompletedManagedFixture) {
    const isHome = justCompletedManagedFixture.homeClubId === game.managedClubId
    const myScore = isHome ? justCompletedManagedFixture.homeScore : justCompletedManagedFixture.awayScore
    const theirScore = isHome ? justCompletedManagedFixture.awayScore : justCompletedManagedFixture.homeScore
    const opponentId = isHome ? justCompletedManagedFixture.awayClubId : justCompletedManagedFixture.homeClubId

    const won = myScore > theirScore
    const lost = myScore < theirScore
    const resultLabel: 'win' | 'loss' | 'draw' = won ? 'win' : lost ? 'loss' : 'draw'

    const prev = updatedRivalryHistory[opponentId] ?? { wins: 0, losses: 0, draws: 0, currentStreak: 0 }
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

    updatedRivalryHistory = {
      ...updatedRivalryHistory,
      [opponentId]: {
        wins: newWins,
        losses: newLosses,
        draws: newDraws,
        lastResult: resultLabel,
        currentStreak: newStreak,
      },
    }

    // Rivalry context inbox item: if long history (4+ meetings), generate flavor text
    const totalMeetings = newWins + newLosses + newDraws
    if (totalMeetings >= 4) {
      const rival = game.clubs.find(c => c.id === opponentId)
      const managedClub = game.clubs.find(c => c.id === game.managedClubId)
      const alreadySentId = `inbox_rivalry_context_${opponentId}_r${nextRound}_${game.currentSeason}`
      if (!game.inbox.some(i => i.id === alreadySentId)) {
        let rivalryBody = ''
        if (newWins > newLosses + newLosses * 0.5 && won) {
          rivalryBody = `${managedClub?.name ?? 'Ni'} dominerar mötet mot ${rival?.name ?? 'motståndaren'} med ${newWins}–${newLosses} i matcher. Dominansen håller i sig.`
        } else if (newLosses > newWins && won) {
          rivalryBody = `Revansch! ${managedClub?.name ?? 'Ni'} bröt den negativa sviten mot ${rival?.name ?? 'motståndaren'} som lett ${newLosses}–${newWins} i möten.`
        } else if (Math.abs(newStreak) >= 2) {
          const streakText = newStreak > 0 ? `${newStreak} raka segrar` : `${Math.abs(newStreak)} raka förluster`
          rivalryBody = `${managedClub?.name ?? 'Ni'} har nu ${streakText} mot ${rival?.name ?? 'motståndaren'}.`
        }
        if (rivalryBody) {
          newInboxItems.push({
            id: alreadySentId,
            date: game.currentDate,
            type: InboxItemType.BoardFeedback,
            title: `Rivalmöte: ${rival?.name ?? 'Motståndaren'}`,
            body: rivalryBody,
            relatedClubId: opponentId,
            isRead: false,
          } as InboxItem)
        }
      }
    }
  }

  // ── Update playoff bracket if active ─────────────────────────────────
  let updatedBracket = game.playoffBracket
  let bracketNewFixtures: Fixture[] = []

  if (updatedBracket !== null) {
    const completedThisRound = simulatedFixtures.filter(f => f.status === FixtureStatus.Completed)

    type AnyPlayoffSeries = (typeof updatedBracket.quarterFinals)[0]

    const updateSeries = (series: AnyPlayoffSeries): AnyPlayoffSeries => {
      let s = { ...series }
      for (const f of completedThisRound) {
        if (s.fixtures.includes(f.id)) {
          s = updateSeriesAfterMatch(s, f)
        }
      }
      return s
    }

    updatedBracket = {
      ...updatedBracket,
      quarterFinals: updatedBracket.quarterFinals.map(updateSeries),
      semiFinals: updatedBracket.semiFinals.map(updateSeries),
      final: updatedBracket.final ? updateSeries(updatedBracket.final) : null,
    }

    // Cancel game 3 fixtures for decided series
    const allSeriesNow = [
      ...updatedBracket.quarterFinals,
      ...updatedBracket.semiFinals,
      ...(updatedBracket.final ? [updatedBracket.final] : []),
    ]
    for (const series of allSeriesNow) {
      if (series.winnerId !== null) {
        allFixtures = allFixtures.map(f => {
          if (series.fixtures.includes(f.id) && f.status === FixtureStatus.Scheduled) {
            return { ...f, status: FixtureStatus.Postponed }
          }
          return f
        })
      }
    }

    // Check if current phase is complete and advance
    const currentPhaseComplete = (() => {
      if (updatedBracket.status === PlayoffStatus.QuarterFinals) return updatedBracket.quarterFinals.every(s => s.winnerId !== null)
      if (updatedBracket.status === PlayoffStatus.SemiFinals) return updatedBracket.semiFinals.every(s => s.winnerId !== null)
      if (updatedBracket.status === PlayoffStatus.Final) return updatedBracket.final?.winnerId !== null
      return false
    })()

    if (currentPhaseComplete) {
      const nextRoundStart = updatedBracket.status === PlayoffStatus.QuarterFinals ? 26
        : updatedBracket.status === PlayoffStatus.SemiFinals ? 29
        : 32
      const { bracket: newBracket, newFixtures } = advancePlayoffRound(updatedBracket, game.currentSeason, nextRoundStart)
      updatedBracket = newBracket
      bracketNewFixtures = newFixtures
    }

    // Check managed club advancement or elimination in this round
    const allSeriesAfter = [
      ...updatedBracket.quarterFinals,
      ...updatedBracket.semiFinals,
      ...(updatedBracket.final ? [updatedBracket.final] : []),
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
        newInboxItems.push({
          id: `inbox_elim_${game.currentSeason}_${series.id}`,
          date: game.currentDate,
          type: InboxItemType.Playoff,
          title: `Utslagen ur ${roundName}`,
          body: `${winner?.name ?? 'Motståndaren'} gick vidare med ${theirWins}-${myWins} i matcher. En stark insats, men slutspelet är nu över för er del.`,
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
        newInboxItems.push({
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

    // Check if the final is complete — announce champion
    if (updatedBracket.status === PlayoffStatus.Completed && updatedBracket.champion) {
      const champion = game.clubs.find(c => c.id === updatedBracket!.champion)
      const managedClubWon = updatedBracket.champion === game.managedClubId
      if (managedClubWon) {
        newInboxItems.push({
          id: `inbox_champion_${game.currentSeason}`,
          date: game.currentDate,
          type: InboxItemType.Playoff,
          title: 'SVENSKA MÄSTARE!',
          body: `GRATTIS! ${champion?.name} är svenska mästare ${game.currentSeason}! En historisk säsong som aldrig glöms!`,
          isRead: false,
        } as InboxItem)
      } else {
        newInboxItems.push({
          id: `inbox_champion_other_${game.currentSeason}`,
          date: game.currentDate,
          type: InboxItemType.Playoff,
          title: `${champion?.name} är svenska mästare!`,
          body: `${champion?.name} tar SM-guldet ${game.currentSeason}!`,
          isRead: false,
        } as InboxItem)
      }
    }
  }

  // ── Update cup bracket if active ─────────────────────────────────────
  let updatedCupBracket: CupBracket | null = game.cupBracket ?? null
  let cupNewFixtures: Fixture[] = []

  if (updatedCupBracket !== null && !updatedCupBracket.completed) {
    const completedThisRound = simulatedFixtures.filter(f => f.status === FixtureStatus.Completed && f.isCup)

    if (completedThisRound.length > 0) {
      updatedCupBracket = updateCupBracketAfterRound(updatedCupBracket, completedThisRound)

      // Check if the current cup round is fully decided
      const roundsWithMatches = [...new Set(updatedCupBracket.matches.map(m => m.round))]
      const maxRound = Math.max(...roundsWithMatches)
      const currentRoundMatches = updatedCupBracket.matches.filter(m => m.round === maxRound)
      const currentRoundComplete = currentRoundMatches.every(m => m.winnerId)

      if (currentRoundComplete) {
        if (maxRound === 3) {
          // Final is complete — set winner and mark completed
          const finalMatch = currentRoundMatches[0]
          updatedCupBracket = {
            ...updatedCupBracket,
            winnerId: finalMatch.winnerId,
            completed: true,
          }

          // Prize money: winner +100k, runner-up +50k
          const winnerId = finalMatch.winnerId!
          const loserId = finalMatch.homeClubId === winnerId
            ? finalMatch.awayClubId
            : finalMatch.homeClubId

          // Apply prize money (will be merged into financiallyUpdatedClubs later, but
          // we must update before that block — do it inline here by mutating allFixtures indirectly
          // We'll apply it to a separate clubs update after financiallyUpdatedClubs is built)

          // Inbox for managed club
          const managedIsWinner = winnerId === game.managedClubId
          const managedIsRunnerUp = loserId === game.managedClubId
          if (managedIsWinner) {
            const winnerClub = game.clubs.find(c => c.id === winnerId)
            newInboxItems.push({
              id: `inbox_cup_winner_${game.currentSeason}`,
              date: game.currentDate,
              type: InboxItemType.Playoff,
              title: '🏆 CUPVINNARE!',
              body: `${winnerClub?.name} vinner Svenska Cupen ${game.currentSeason}! En fantastisk bedrift!`,
              isRead: false,
            } as InboxItem)
          } else if (managedIsRunnerUp) {
            const winnerClub = game.clubs.find(c => c.id === winnerId)
            newInboxItems.push({
              id: `inbox_cup_final_loss_${game.currentSeason}`,
              date: game.currentDate,
              type: InboxItemType.Playoff,
              title: 'Cupfinalen förlorad',
              body: `${winnerClub?.name ?? 'Motståndaren'} tog cuptiteln. En stark insats att ta sig till finalen.`,
              isRead: false,
            } as InboxItem)
          }
        } else {
          // Generate next cup round fixtures
          const { updatedBracket, newFixtures } = generateNextCupRound(
            updatedCupBracket,
            maxRound,
            game.currentSeason,
          )
          updatedCupBracket = updatedBracket
          cupNewFixtures = newFixtures
        }
      }

      // Check if managed club was eliminated this round
      if (!updatedCupBracket.completed) {
        for (const match of currentRoundMatches) {
          if (match.winnerId && match.winnerId !== game.managedClubId &&
            (match.homeClubId === game.managedClubId || match.awayClubId === game.managedClubId)) {
            const winner = game.clubs.find(c => c.id === match.winnerId)
            const roundName = getCupRoundName(match.round)
            newInboxItems.push({
              id: `inbox_cup_elim_${game.currentSeason}_r${match.round}`,
              date: game.currentDate,
              type: InboxItemType.Playoff,
              title: `Utslagna ur cup${roundName}`,
              body: `${winner?.name ?? 'Motståndaren'} gick vidare. Cupäventyret är över för i år.`,
              isRead: false,
            } as InboxItem)
            break
          }
        }
      }
    }
  }

  // Merge new playoff fixtures and cup fixtures
  const finalAllFixtures = [...allFixtures, ...bracketNewFixtures, ...cupNewFixtures]

  // Derby notification: if next round has a derby for managed club
  const remainingScheduled = finalAllFixtures.filter(f => f.status === FixtureStatus.Scheduled)
  if (remainingScheduled.length > 0) {
    const upcomingRound = Math.min(...remainingScheduled.map(f => f.roundNumber))
    const upcomingManagedFixture = remainingScheduled.find(
      f => f.roundNumber === upcomingRound &&
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
        }
      }
    }
  }

  const marketUpdatedPlayers = updateAllMarketValues(finalPlayers, game.currentSeason)

  // ── Dynamic match revenue (Del F) ─────────────────────────────────
  function calculateMatchRevenue(
    club: Club,
    isHomeManagedMatch: boolean,
    standing: StandingRow | null,
    fanMood: number,
    communityActivities: CommunityActivities | undefined,
    rand: () => number,
    isKnockout: boolean,
    isCup: boolean,
    hasRivalry: boolean,
  ): number {
    if (!isHomeManagedMatch) return 0

    const baseRevenue = club.reputation * 400

    const position = standing?.position ?? 8
    const formBonus = position <= 3 ? 1.30
      : position <= 6 ? 1.10
      : position >= 10 ? 0.80 : 1.0

    const moodBonus = 0.85 + (fanMood / 100) * 0.30

    const eventBonus = isKnockout ? 1.50 : isCup ? 1.25 : 1.0

    const derbyBonus = hasRivalry ? 1.40 : 1.0

    const base = Math.round(
      baseRevenue * formBonus * moodBonus * eventBonus * derbyBonus
      + rand() * 5000
    )

    // Community income
    const activities = communityActivities
    let communityIncome = 0
    if (activities) {
      const moodMult = 0.7 + (fanMood / 100) * 0.6
      const kioskBase = activities.kiosk === 'upgraded' ? 10000
        : activities.kiosk === 'basic' ? 5000 : 0
      communityIncome += Math.round(kioskBase * moodMult)
      communityIncome += activities.functionaries ? 4000 : 0
      communityIncome += activities.bandyplay
        ? 1000 + Math.round(rand() * 1000) : 0

      // VIP-tält — hög intäkt per hemmamatch
      if (activities.vipTent) {
        communityIncome += 5000 + Math.round(rand() * 10000)
      }

      // Running costs (dras per hemmamatch)
      let runningCost = 0
      if (activities.kiosk === 'upgraded') runningCost += 2500
      else if (activities.kiosk === 'basic') runningCost += 1500
      if (activities.bandyplay) runningCost += 1000
      if (activities.vipTent) runningCost += 2000
      communityIncome -= runningCost
    }

    return base + communityIncome
  }

  // Per-round community income (lottery, bandyschool, social media — regardless of home match)
  function calculateLotteryIncome(
    communityActivities: CommunityActivities | undefined,
    rand: () => number,
  ): number {
    if (!communityActivities) return 0
    let income = 0
    if (communityActivities.lottery === 'intensive') {
      income += (3000 + Math.round(rand() * 2000)) - 800
    } else if (communityActivities.lottery === 'basic') {
      income += (1000 + Math.round(rand() * 1500)) - 500
    }
    if (communityActivities.bandyplay) {
      income += (500 + Math.round(rand() * 1000)) - 1000  // deltagaravgifter minus driftskostnad
    }
    if (communityActivities.socialMedia) {
      income -= 500  // bara kostnad, reputation-bonus hanteras separat
    }
    return income
  }

  const managedClubStanding = standings.find(s => s.clubId === game.managedClubId) ?? null

  // Economy: wages, match revenue, sponsorship per round
  const financiallyUpdatedClubs = game.clubs.map(c => {
    const clubPlayers = marketUpdatedPlayers.filter(p => p.clubId === c.id)
    const totalWages = clubPlayers.reduce((sum, p) => sum + p.salary, 0)
    const weeklyWages = Math.round(totalWages / 4)

    const homeMatch = simulatedFixtures.find(
      f => f.homeClubId === c.id && f.status === FixtureStatus.Completed
    )

    let matchRevenue: number
    if (c.id === game.managedClubId) {
      const isHomeManagedMatch = !!homeMatch
      const matchIsKnockout = homeMatch?.isKnockout ?? false
      const matchIsCup = homeMatch?.isCup ?? false
      const matchHasRivalry = homeMatch
        ? !!getRivalry(homeMatch.homeClubId, homeMatch.awayClubId)
        : false
      matchRevenue = calculateMatchRevenue(
        c,
        isHomeManagedMatch,
        managedClubStanding,
        currentFanMood,
        game.communityActivities,
        localRand,
        matchIsKnockout,
        matchIsCup,
        matchHasRivalry,
      )
    } else {
      matchRevenue = homeMatch
        ? Math.round(c.reputation * 600 + localRand() * 10000)
        : 0
    }

    const weeklySponsorship = Math.round(c.reputation * 250)

    const sponsorIncome = c.id === game.managedClubId
      ? (game.sponsors ?? []).filter(s => s.contractRounds > 0).reduce((sum, s) => sum + s.weeklyIncome, 0)
      : 0

    const lotteryIncome = c.id === game.managedClubId
      ? calculateLotteryIncome(game.communityActivities, localRand)
      : 0

    return {
      ...c,
      finances: c.finances + matchRevenue + weeklySponsorship + sponsorIncome + lotteryIncome - weeklyWages,
      // NOTE: Finances can go negative (salary drain, no revenue). This is intentional — don't add
      // a hard floor here as it would mask the underlying economic problem. If finances drop below
      // -500000, consider triggering a board crisis event in the future. The UI handles negative
      // display with a warning label.
    }
  })

  // ── Cup prize money ──────────────────────────────────────────────────────
  // Apply cup prizes to club budgets based on this round's cup results
  let cupPrizedClubs = financiallyUpdatedClubs
  if (updatedCupBracket && game.cupBracket) {
    const CUP_PRIZES: Record<number, number> = { 1: 10000, 2: 30000, 3: 100000 }
    const RUNNER_UP_PRIZE = 50000

    const completedCupThisRound = simulatedFixtures.filter(
      f => f.status === FixtureStatus.Completed && f.isCup
    )

    for (const fixture of completedCupThisRound) {
      const match = updatedCupBracket.matches.find(m => m.fixtureId === fixture.id)
      if (!match || !match.winnerId) continue

      const winnerId = match.winnerId
      const loserId = fixture.homeClubId === winnerId ? fixture.awayClubId : fixture.homeClubId
      const winPrize = CUP_PRIZES[match.round] ?? 0
      const losePrize = match.round === 3 ? RUNNER_UP_PRIZE : 0

      cupPrizedClubs = cupPrizedClubs.map(c => {
        if (c.id === winnerId) return { ...c, finances: c.finances + winPrize }
        if (c.id === loserId && losePrize > 0) return { ...c, finances: c.finances + losePrize }
        return c
      })
    }
  }

  // Social media reputation boost (+1 var 5:e omgång)
  const socialMediaBoostedClubs = (game.communityActivities?.socialMedia && nextRound % 5 === 0)
    ? cupPrizedClubs.map(c =>
        c.id === game.managedClubId
          ? { ...c, reputation: Math.min(100, c.reputation + 1) }
          : c
      )
    : cupPrizedClubs

  // ── Transfer bids ────────────────────────────────────────────────────────
  // Resolve pending outgoing bids (1 round to answer)
  const existingBids: TransferBid[] = game.transferBids ?? []
  const resolvedBids: TransferBid[] = existingBids.map(b => {
    if (b.direction === 'outgoing' && b.status === 'pending' && nextRound >= b.expiresRound) {
      const outcome = resolveOutgoingBid(b, game, localRand)
      return { ...b, status: outcome }
    }
    // Expire stale bids (incoming bids expire at expiresRound, outgoing already resolved above)
    if (b.status === 'pending' && nextRound >= b.expiresRound) {
      return { ...b, status: 'expired' as const }
    }
    return b
  })

  // Partially updated game state for bid/event generation (with market-updated players)
  const preEventGame: SaveGame = {
    ...game,
    players: marketUpdatedPlayers,
    transferBids: resolvedBids,
  }

  const newBids = generateIncomingBids(preEventGame, nextRound, localRand)
  const allBids: TransferBid[] = [...resolvedBids, ...newBids]

  // Transfer rumour: newly active outgoing bids get a 50% chance of inbox rumour
  const newlyActiveBids = resolvedBids.filter(
    b => b.direction === 'outgoing' && b.status === 'pending' && b.createdRound === nextRound
  )
  for (const bid of newlyActiveBids) {
    if (localRand() > 0.50) continue
    const target = game.players.find(p => p.id === bid.playerId)
    const sellingClub = game.clubs.find(c => c.id === bid.sellingClubId)
    if (!target || !sellingClub) continue
    newInboxItems.push({
      id: `inbox_rumour_${bid.id}`,
      date: newDate,
      type: InboxItemType.Media,
      title: `📰 Rykten: ${target.firstName} ${target.lastName} på väg?`,
      body: `Det florera rykten om att ${target.firstName} ${target.lastName} från ${sellingClub.name} kan vara på väg mot en ny utmaning. Inga officiella kommentarer ännu.`,
      isRead: false,
    })
  }

  // ── Post-advance events ──────────────────────────────────────────────────
  const newEvents = generatePostAdvanceEvents(preEventGame, newBids, nextRound, localRand, justCompletedManagedFixture ?? undefined)
  const communityEvents = generateEvents(
    { ...preEventGame, communityActivities: game.communityActivities },
    nextRound,
    localRand,
  )
  const allNewEvents = [...newEvents, ...communityEvents]

  // ── P17 Youth match simulation (every other round) ──────────────────────
  let updatedYouthTeam = game.youthTeam
  if (nextRound % 2 === 0 && game.youthTeam && game.youthTeam.players.length > 0) {
    const youthSeed = baseSeed + nextRound * 97
    const youthRand = mulberry32(youthSeed)
    const youthSim = simulateYouthMatch(game.youthTeam, game.academyLevel ?? 'basic', youthRand, nextRound)

    updatedYouthTeam = {
      ...game.youthTeam,
      players: youthSim.updatedPlayers,
      results: [...game.youthTeam.results.slice(-10), youthSim.matchResult],
      seasonRecord: youthSim.updatedRecord,
      tablePosition: youthSim.updatedPosition,
    }

    const { matchResult } = youthSim
    const won = matchResult.goalsFor > matchResult.goalsAgainst
    const drew = matchResult.goalsFor === matchResult.goalsAgainst
    const resultStr = won ? 'vann' : drew ? 'spelade oavgjort' : 'förlorade'
    const scoreStr = `${matchResult.goalsFor}–${matchResult.goalsAgainst}`
    const scorerStr = matchResult.scorers.length > 0
      ? `\nMålgörare: ${matchResult.scorers.join(', ')}.`
      : ''
    const bestStr = matchResult.bestPlayer ? `\n${matchResult.bestPlayer} utsågs till matchens spelare.` : ''
    const record = youthSim.updatedRecord
    const tableStr = `Laget ligger ${youthSim.updatedPosition}:a i ungdomsserien (${record.w}V ${record.d}O ${record.l}F).`

    // Check if any player is newly ready for promotion
    const readyPlayers = youthSim.updatedPlayers.filter(p => p.readyForPromotion)
    const scoutNote = readyPlayers.length > 0
      ? `\n\n⭐ SCOUTRAPPORTEN: ${readyPlayers[0].firstName} ${readyPlayers[0].lastName} (${readyPlayers[0].age} år) börjar bli mogen för A-truppen.`
      : ''

    newInboxItems.push({
      id: `inbox_p17_r${nextRound}_${game.currentSeason}`,
      date: newDate,
      type: InboxItemType.YouthP17,
      title: `📋 P17 ${resultStr} mot ${matchResult.opponentName} ${scoreStr}`,
      body: `Pojklaget ${resultStr} mot ${matchResult.opponentName} med ${scoreStr}.${scorerStr}${bestStr}\n${tableStr}${scoutNote}`,
      isRead: false,
    } as InboxItem)
  }

  // ── Mentor effects per round ─────────────────────────────────────────────
  let mentorUpdatedYouthPlayers = updatedYouthTeam?.players ?? []
  const activeMentorships = (game.mentorships ?? []).filter(m => m.isActive)
  for (const m of activeMentorships) {
    const mentor = marketUpdatedPlayers.find(p => p.id === m.seniorPlayerId)
    if (!mentor) continue
    const youthIdx = mentorUpdatedYouthPlayers.findIndex(p => p.id === m.youthPlayerId)
    if (youthIdx >= 0 && mentor.form >= 40) {
      const devBoost = mentor.discipline / 20
      mentorUpdatedYouthPlayers = mentorUpdatedYouthPlayers.map((p, i) => i === youthIdx ? {
        ...p,
        developmentRate: Math.min(100, p.developmentRate + devBoost * 0.1),
        confidence: Math.min(100, p.confidence + 1),
      } : p)
    }
  }
  if (updatedYouthTeam) {
    updatedYouthTeam = { ...updatedYouthTeam, players: mentorUpdatedYouthPlayers }
  }

  // ── Loan deal processing ─────────────────────────────────────────────────
  let loanUpdatedPlayers = [...marketUpdatedPlayers]
  const activeLoanDeals = (game.loanDeals ?? []).filter(d => nextRound <= d.endRound)
  const returnedLoanPlayerIds: string[] = []

  for (const deal of activeLoanDeals) {
    if (nextRound >= deal.endRound) {
      returnedLoanPlayerIds.push(deal.playerId)
      loanUpdatedPlayers = loanUpdatedPlayers.map(p => p.id === deal.playerId
        ? { ...p, isOnLoan: false, loanClubName: undefined }
        : p
      )
      const participationRate = deal.totalMatches > 0 ? deal.matchesPlayed / deal.totalMatches : 0
      const caBoost = participationRate >= 0.75 ? 3 + Math.floor(localRand() * 3)
        : participationRate >= 0.5 ? 1 + Math.floor(localRand() * 2) : 0
      if (caBoost > 0) {
        loanUpdatedPlayers = loanUpdatedPlayers.map(p => p.id === deal.playerId
          ? { ...p, currentAbility: Math.min(p.potentialAbility, p.currentAbility + caBoost), morale: Math.min(100, (p.morale ?? 50) + 10) }
          : p
        )
      }
      const returnedPlayer = loanUpdatedPlayers.find(p => p.id === deal.playerId)
      if (returnedPlayer) {
        const confStr = participationRate >= 0.75 ? 'spelade regelbundet och kom tillbaka stärkt'
          : participationRate >= 0.5 ? 'fick speltid och har utvecklats'
          : 'satt mest på bänken och är lite besviken'
        newInboxItems.push({
          id: `inbox_loan_return_${deal.playerId}_${nextRound}`,
          date: newDate,
          type: InboxItemType.YouthIntake,
          title: `🏒 ${returnedPlayer.firstName} ${returnedPlayer.lastName} är tillbaka från lån`,
          body: `${returnedPlayer.firstName} ${returnedPlayer.lastName} återvänder från ${deal.destinationClubName}. Han ${confStr}.${caBoost > 0 ? ` CA +${caBoost}.` : ''}`,
          isRead: false,
        })
      }
    }
  }

  // Return loaned players to squad
  const managedClubAfterLoan = returnedLoanPlayerIds.length > 0
    ? socialMediaBoostedClubs.map(c => {
        if (c.id !== game.managedClubId) return c
        const newIds = returnedLoanPlayerIds.filter(id => !c.squadPlayerIds.includes(id))
        return newIds.length > 0 ? { ...c, squadPlayerIds: [...c.squadPlayerIds, ...newIds] } : c
      })
    : socialMediaBoostedClubs

  const updatedLoanDeals = (game.loanDeals ?? [])
    .filter(d => !returnedLoanPlayerIds.includes(d.playerId))
    .map(d => {
      if (nextRound % 2 === 0 && nextRound < d.endRound) {
        const played = localRand() > 0.25
        const rating = played ? Math.round((5 + localRand() * 3) * 10) / 10 : 0
        const goals = played && localRand() > 0.6 ? 1 : 0
        const newMatchesPlayed = d.matchesPlayed + (played ? 1 : 0)
        return {
          ...d,
          matchesPlayed: newMatchesPlayed,
          averageRating: newMatchesPlayed > 0
            ? Math.round(((d.averageRating * d.matchesPlayed + rating) / newMatchesPlayed) * 10) / 10
            : rating,
          reports: [...d.reports.slice(-5), { round: nextRound, played, rating, goals, assists: 0 }],
        }
      }
      return d
    })

  // ── Academy events ───────────────────────────────────────────────────────
  if (game.youthTeam && nextRound >= 3 && nextRound <= 18) {
    const conflictPlayers = updatedYouthTeam?.players.filter(p => p.schoolConflict) ?? []
    if (conflictPlayers.length > 0 && localRand() < 0.12) {
      const player = conflictPlayers[Math.floor(localRand() * conflictPlayers.length)]
      allNewEvents.push({
        id: `event_school_conflict_${player.id}_${nextRound}`,
        type: 'communityEvent',
        title: `Skolkonflikt — ${player.firstName} ${player.lastName}`,
        body: `${player.firstName} har nationellt prov imorgon. Han missar träningen om han pluggar.`,
        choices: [
          {
            id: 'let_study',
            label: 'Låt honom plugga',
            effect: { type: 'noOp' },
          },
          {
            id: 'train',
            label: 'Han bör komma på träningen',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  if (game.youthTeam && (nextRound === 8 || nextRound === 15)) {
    const callupCandidates = updatedYouthTeam?.players.filter(p => p.potentialAbility > 50) ?? []
    if (callupCandidates.length >= 1) {
      const selected = callupCandidates.slice(0, Math.min(2, callupCandidates.length))
      const names = selected.map(p => `${p.firstName} ${p.lastName}`).join(' och ')
      const districtName = ['Gävleborgs', 'Hälsinglands', 'Västmanlands', 'Dalarnas', 'Upplands'][Math.floor(localRand() * 5)]
      allNewEvents.push({
        id: `event_district_callup_${nextRound}_${game.currentSeason}`,
        type: 'communityEvent',
        title: `Distriktslagsuttag — ${names}`,
        body: `${names} är kallade till ${districtName} P17-samling. De missar 2 P17-matcher men kan få värdefull erfarenhet.`,
        choices: [
          {
            id: 'send',
            label: 'Skicka dem',
            effect: { type: 'noOp' },
          },
          {
            id: 'keep',
            label: 'Behåll i klubben',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // ── Academy reputation update ────────────────────────────────────────────
  const academyReputationDelta = (() => {
    if (!game.youthTeam || !updatedYouthTeam) return 0
    const newWins = updatedYouthTeam.seasonRecord.w - game.youthTeam.seasonRecord.w
    return newWins > 0 ? 1 : 0
  })()

  const academyUpdatedClubs = academyReputationDelta > 0
    ? managedClubAfterLoan.map(c =>
        c.id === game.managedClubId
          ? { ...c, academyReputation: Math.min(100, (c.academyReputation ?? 50) + academyReputationDelta) }
          : c
      )
    : managedClubAfterLoan

  // Media headlines
  const mediaHeadlines = generateMediaHeadlines(preEventGame, simulatedFixtures, nextRound, localRand)
  newInboxItems.push(...mediaHeadlines)

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
    b.status === 'pending' || (nextRound - b.createdRound) < 5
  )

  const managedFixtureId = justCompletedManagedFixture?.id
  const strippedFixtures = finalAllFixtures.map(f => stripCompletedFixture(f, managedFixtureId))

  // ── V0.9: Sponsor chain effects & ICA Maxi ─────────────────────────────────
  const v09Rand = mulberry32(baseSeed + 999777)
  let v09Sponsors = (game.sponsors ?? []).map(s => ({ ...s, contractRounds: s.contractRounds - 1 }))

  // Sponsor leaving chain effect: 30% chance another sponsor's income drops by 20%
  const leavingSponsors = v09Sponsors.filter(s => s.contractRounds <= 0)
  if (leavingSponsors.length > 0 && v09Rand() < 0.3) {
    const remaining = v09Sponsors.filter(s => s.contractRounds > 0)
    if (remaining.length > 0) {
      const idx = Math.floor(v09Rand() * remaining.length)
      const affectedSponsor = remaining[idx]
      v09Sponsors = v09Sponsors.map(s =>
        s.id === affectedSponsor.id
          ? { ...s, weeklyIncome: Math.round(s.weeklyIncome * 0.8) }
          : s
      )
      newInboxItems.push({
        id: `inbox_sponsor_chain_${nextRound}_${game.currentSeason}`,
        date: newDate,
        type: InboxItemType.SponsorNetwork,
        title: 'Sponsornätverket oroligt',
        body: `${affectedSponsor.name} har hört rykten om en avgång i sponsorgruppen. Deras bidrag minskar tillfälligt.`,
        isRead: false,
      } as InboxItem)
    }
  }

  // License warning makes sponsors nervous: 20% chance one leaves
  if (
    game.licenseReview?.status === 'warning' ||
    game.licenseReview?.status === 'continued_review'
  ) {
    const activeSponsorsForCheck = v09Sponsors.filter(s => s.contractRounds > 0)
    if (activeSponsorsForCheck.length > 0 && v09Rand() < 0.2) {
      const leavingIdx = Math.floor(v09Rand() * activeSponsorsForCheck.length)
      const leavingSponsor = activeSponsorsForCheck[leavingIdx]
      v09Sponsors = v09Sponsors.map(s =>
        s.id === leavingSponsor.id ? { ...s, contractRounds: 0 } : s
      )
      newInboxItems.push({
        id: `inbox_sponsor_license_leave_${nextRound}_${game.currentSeason}`,
        date: newDate,
        type: InboxItemType.SponsorNetwork,
        title: `${leavingSponsor.name} drar sig ur`,
        body: `${leavingSponsor.name} har fått kännedom om licensnämndens varning och väljer att avsluta samarbetet omedelbart.`,
        isRead: false,
      } as InboxItem)
    }
  }

  // Win streak sponsor bonus: 5% chance per win a new sponsor contact arrives
  if (justCompletedManagedFixture) {
    const isHome = justCompletedManagedFixture.homeClubId === game.managedClubId
    const myScore = isHome ? justCompletedManagedFixture.homeScore : justCompletedManagedFixture.awayScore
    const theirScore = isHome ? justCompletedManagedFixture.awayScore : justCompletedManagedFixture.homeScore
    const wonMatch = (myScore ?? 0) > (theirScore ?? 0)
    if (wonMatch && v09Rand() < 0.05) {
      newInboxItems.push({
        id: `inbox_sponsor_win_${nextRound}_${game.currentSeason}`,
        date: newDate,
        type: InboxItemType.SponsorNetwork,
        title: 'Spontant sponsorintresse',
        body: 'En lokal företagare hörde om segern och är intresserad av ett sponsorsamarbete. Se Ekonomi-fliken.',
        isRead: false,
      } as InboxItem)
    }
  }

  const updatedSponsors = v09Sponsors.filter(s => s.contractRounds > 0)

  // ── V0.9: Patron influence per-round inbox ─────────────────────────────────
  const v09Patron = game.patron
  if (v09Patron?.isActive) {
    const influence = v09Patron.influence ?? 30
    if (influence >= 30 && influence < 60) {
      const patronInboxId = `inbox_patron_invite_${game.currentSeason}`
      if (!game.inbox.some(i => i.id === patronInboxId)) {
        newInboxItems.push({
          id: patronInboxId,
          date: newDate,
          type: InboxItemType.PatronInfluence,
          title: `${v09Patron.name} vill bli inbjuden till matcher`,
          body: `${v09Patron.name} har bidragit generöst och hör av sig: "Jag skulle gärna se ett par matcher live i år."`,
          isRead: false,
        } as InboxItem)
      }
    }
  }

  let updatedGame: SaveGame = {
    ...game,
    clubs: academyUpdatedClubs,
    fixtures: strippedFixtures,
    players: loanUpdatedPlayers,
    standings,
    inbox: trimmedInbox,
    currentDate: newDate,
    managedClubPendingLineup: undefined,
    lastCompletedFixtureId: justCompletedManagedFixture?.id ?? game.lastCompletedFixtureId,
    matchWeathers: trimmedWeathers,
    trainingHistory: trimmedTrainingHistory,
    playoffBracket: updatedBracket,
    cupBracket: updatedCupBracket,
    scoutReports: updatedScoutReports,
    activeScoutAssignment: updatedScoutAssignment,
    scoutBudget: game.scoutBudget ?? 10,
    transferBids: trimmedBids,
    pendingEvents: allNewEvents,
    sponsors: updatedSponsors,
    activeTalentSearch: updatedTalentSearch,
    talentSearchResults: updatedTalentResults,
    fanMood: newFanMood,
    rivalryHistory: updatedRivalryHistory,
    doctorQuestionsUsed: 0,
    trainingProjects: projectResult.updatedProjects,
    youthTeam: updatedYouthTeam,
    academyLevel: game.academyLevel ?? 'basic',
    mentorships: game.mentorships ?? [],
    loanDeals: updatedLoanDeals,
  }

  // Pre-generate weather for next round so dashboard/matchScreen can show it
  const nextScheduled = finalAllFixtures.filter(f => f.status === FixtureStatus.Scheduled)
  if (nextScheduled.length > 0) {
    const upcomingRound = Math.min(...nextScheduled.map(f => f.roundNumber))
    const upcomingFixtures = nextScheduled.filter(f => f.roundNumber === upcomingRound)
    const nextWeathers: MatchWeather[] = []
    for (let i = 0; i < upcomingFixtures.length; i++) {
      const f = upcomingFixtures[i]
      if (updatedGame.matchWeathers.some(mw => mw.fixtureId === f.id)) continue
      const homeClub = game.clubs.find(c => c.id === f.homeClubId)
      if (!homeClub) continue
      const weather = generateMatchWeather(
        game.currentSeason,
        upcomingRound,
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

  return { game: updatedGame, roundPlayed: nextRound, seasonEnded: false, pendingEvents: allNewEvents }
}

function getPlayerRating(playerId: string, fixtures: Fixture[]): number | null {
  for (const fixture of fixtures) {
    if (fixture.report?.playerRatings[playerId] !== undefined) {
      return fixture.report.playerRatings[playerId]
    }
  }
  return null
}

function handlePlayoffStart(game: SaveGame, _seed?: number): AdvanceResult {
  // Calculate standings from regular season completed fixtures — exclude cup
  const completedFixtures = game.fixtures.filter(f => f.status === FixtureStatus.Completed && !f.isCup)
  const standings = calculateStandings(game.league.teamIds, completedFixtures)

  const bracket = generatePlayoffBracket(standings, game.currentSeason)
  const allQFFixtures: Fixture[] = []

  const bracketWithFixtures = {
    ...bracket,
    quarterFinals: bracket.quarterFinals.map(series => {
      const fixtures = generatePlayoffFixtures(series, game.currentSeason, 23)
      allQFFixtures.push(...fixtures)
      return { ...series, fixtures: fixtures.map(f => f.id) }
    }),
  }

  const managedStanding = standings.find(s => s.clubId === game.managedClubId)
  const isInPlayoffs = managedStanding && managedStanding.position <= 8

  const newInboxItems: InboxItem[] = []
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)!

  if (isInPlayoffs) {
    const managedSeries = bracketWithFixtures.quarterFinals.find(
      s => s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId
    )
    const opponentId = managedSeries
      ? (managedSeries.homeClubId === game.managedClubId ? managedSeries.awayClubId : managedSeries.homeClubId)
      : null
    const opponent = opponentId ? game.clubs.find(c => c.id === opponentId) : null

    newInboxItems.push({
      id: `inbox_playoff_start_${game.currentSeason}`,
      date: game.currentDate,
      type: InboxItemType.Playoff,
      title: 'Slutspelet börjar!',
      body: `Grundserien är klar! ${managedClub.name} har kvalificerat sig för slutspelet och möter ${opponent?.name ?? 'okänd motståndare'} i kvartsfinal.`,
      isRead: false,
    })
  } else {
    const position = managedStanding?.position ?? 0
    newInboxItems.push({
      id: `inbox_playoff_out_${game.currentSeason}`,
      date: game.currentDate,
      type: InboxItemType.Playoff,
      title: 'Grundserien avslutad',
      body: `Grundserien är avslutad. ${managedClub.name} slutade på plats ${position} och kvalificerade sig inte för slutspelet.`,
      isRead: false,
    })
  }

  const newDate = advanceDate(game.currentDate, 7)
  const updatedGame: SaveGame = {
    ...game,
    fixtures: [...game.fixtures, ...allQFFixtures],
    playoffBracket: bracketWithFixtures,
    standings,
    inbox: [...game.inbox, ...newInboxItems],
    currentDate: newDate,
  }

  // If managed club didn't make playoffs, we have scheduled fixtures for other teams
  // but the bracket is set. Return playoffStarted so UI can react.
  return { game: updatedGame, roundPlayed: null, seasonEnded: false, playoffStarted: true }
}

function handleSeasonEnd(game: SaveGame, seed?: number): AdvanceResult {
  // seasonSummary is generated AFTER all financial updates (prize money, patron, etc.)
  // so the financial change reflects the full season end income.
  // The variable is populated later in this function.
  let seasonSummary: ReturnType<typeof generateSeasonSummary>

  const allFixtures = game.fixtures
  const completedFixtures = allFixtures.filter(f => f.status === FixtureStatus.Completed && !f.isCup)
  const standings = calculateStandings(game.league.teamIds, completedFixtures)

  const newInboxItems = []

  // Board verdict at season end
  const managedClubStanding = standings.find(s => s.clubId === game.managedClubId)
  if (managedClubStanding) {
    const managedClub = game.clubs.find(c => c.id === game.managedClubId)
    if (managedClub) {
      const { title, body } = generateSeasonVerdict(
        managedClub.boardExpectation,
        managedClubStanding.position,
        game.clubs.length,
      )
      newInboxItems.push({
        id: `inbox_board_verdict_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.BoardFeedback,
        title,
        body,
        isRead: false,
      } as InboxItem)
    }
  }

  // ── License check (V0.9) ──────────────────────────────────────────────────
  const licenseRand = mulberry32((seed ?? game.currentSeason * 12345) + 777123)
  const managedClubForLicense = game.clubs.find(c => c.id === game.managedClubId)
  let licenseReview: LicenseReview | undefined = game.licenseReview
  let licenseWarningCount = game.licenseWarningCount ?? 0

  if (managedClubForLicense) {
    const licFinances = managedClubForLicense.finances
    const hasYouth = !!(game.youthTeam) || !!(game.communityActivities?.bandyplay)
    const prevDenied = game.licenseReview?.status === 'denied'

    let failCount = 0
    if (licFinances <= 0) failCount++
    if (!hasYouth) failCount++
    if (prevDenied) failCount++

    let licStatus: LicenseReview['status']
    if (licFinances < -200000 || licenseWarningCount >= 3) {
      licStatus = 'denied'
    } else if (failCount === 0) {
      licStatus = 'approved'
    } else if (failCount === 1) {
      licStatus = 'warning'
    } else {
      licStatus = 'continued_review'
    }

    if (licStatus === 'approved') {
      licenseWarningCount = 0
    } else if (licStatus === 'warning' || licStatus === 'continued_review') {
      licenseWarningCount++
    }

    licenseReview = {
      season: game.currentSeason,
      status: licStatus,
      requiredCapital: licFinances < 0 ? Math.abs(licFinances) : undefined,
      warningCount: licenseWarningCount,
    }

    if (licStatus === 'approved') {
      newInboxItems.push({
        id: `inbox_license_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.LicenseReview,
        title: 'Licensnämnden: Licens beviljad',
        body: `Licensnämnden har granskat ${managedClubForLicense.name} och beviljar licens för nästa säsong. Fortsätt det goda arbetet.`,
        isRead: false,
      } as InboxItem)
    } else if (licStatus === 'warning') {
      newInboxItems.push({
        id: `inbox_license_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.LicenseReview,
        title: 'Licensnämnden: Varning utfärdad',
        body: `Licensnämnden har identifierat brister hos ${managedClubForLicense.name}. En formell varning utfärdas. Handlingsplan krävs.`,
        isRead: false,
      } as InboxItem)
    } else if (licStatus === 'continued_review') {
      newInboxItems.push({
        id: `inbox_license_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.LicenseReview,
        title: 'Licensnämnden: Fortsatt granskning',
        body: `Licensnämnden ger ${managedClubForLicense.name} fortsatt villkorlig licens. Flera kriterier uppfylls inte. Omedelbara åtgärder krävs.`,
        isRead: false,
      } as InboxItem)
    } else if (licStatus === 'denied') {
      // Tvångsnedflyttning
      newInboxItems.push({
        id: `inbox_license_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.LicenseReview,
        title: 'LICENSNÄMNDEN: LICENS NEKAD — TVÅNGSNEDFLYTTNING',
        body: `Licensnämnden nekar ${managedClubForLicense.name} licens för elitbandyn. Klubben tvingas ta konsekvenserna. Tre spelare lämnar pga elitserieklausul. Majoriteten av sponsorerna drar sig ur. Styrelsen beslutar att tränaren stannar — men under hårt tryck.`,
        isRead: false,
      } as InboxItem)
    }

    // Inbox notification for handlingsplan (the actual GameEvent is created below in seasonEndPendingEvents)
    if (licStatus === 'warning' || licStatus === 'continued_review') {
      newInboxItems.push({
        id: `inbox_handlingsplan_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.LicenseReview,
        title: 'Licensnämnden kräver handlingsplan',
        body: 'Öppna händelserna för att svara på licensnämndens krav.',
        isRead: false,
      } as InboxItem)
    }
  }

  // Youth intake for all clubs
  const youthPlayers: Player[] = []
  const youthRecords = [...game.youthIntakeHistory]
  const updatedClubs = game.clubs.map(club => ({ ...club }))

  let youthIntakeResultForManagedClub: ReturnType<typeof generateYouthIntake> | null = null

  const baseSeed = seed ?? (game.currentSeason * 12345)

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

  // Prize money and transfer budget update for all clubs
  const PRIZE_MONEY = [200000, 150000, 120000, 100000, 80000,
    60000, 50000, 40000, 30000, 25000, 20000, 15000]

  for (let i = 0; i < updatedClubs.length; i++) {
    const clubStanding = standings.find(s => s.clubId === updatedClubs[i].id)
    const position = clubStanding?.position ?? 12
    const prize = PRIZE_MONEY[position - 1] ?? 10000
    updatedClubs[i] = {
      ...updatedClubs[i],
      finances: updatedClubs[i].finances + prize,
      transferBudget: Math.max(0, Math.round((updatedClubs[i].finances + prize) * 0.15)),
    }
  }

  // Patron contribution at season end
  if (game.patron?.isActive && (game.patron.contribution ?? 0) > 0) {
    const patronIdx = updatedClubs.findIndex(c => c.id === game.managedClubId)
    if (patronIdx !== -1) {
      updatedClubs[patronIdx] = {
        ...updatedClubs[patronIdx],
        finances: updatedClubs[patronIdx].finances + game.patron.contribution,
      }
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

  // KommunBidrag at season end — dynamic calculation (V0.9)
  if (game.localPolitician) {
    const politIdx = updatedClubs.findIndex(c => c.id === game.managedClubId)
    if (politIdx !== -1) {
      const polClub = updatedClubs[politIdx]
      const commStanding = game.communityStanding ?? 50
      const dynamicBidrag = calculateKommunBidrag(game.localPolitician, polClub, commStanding, game)
      // Update the stored kommunBidrag value for display
      // (we update the politician below in the updatedGame)
      updatedClubs[politIdx] = {
        ...updatedClubs[politIdx],
        finances: updatedClubs[politIdx].finances + dynamicBidrag,
      }
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

  // Generate season summary now that all financial updates (prize money, patron, etc.) are done
  seasonSummary = generateSeasonSummary({ ...game, clubs: updatedClubs })

  // Board pre-season message for managed club
  const managedClubAfterPrize = updatedClubs.find(c => c.id === game.managedClubId)
  if (managedClubAfterPrize) {
    const clubStanding = standings.find(s => s.clubId === managedClubAfterPrize.id)
    const lastPos = clubStanding?.position ?? 12
    const finChange = managedClubAfterPrize.finances - (game.seasonStartFinances ?? managedClubAfterPrize.finances)

    const { title, body, newExpectation } = generatePreSeasonMessage(
      managedClubAfterPrize, standings, lastPos, finChange
    )

    // Update club expectation for next season
    const managedIdx = updatedClubs.findIndex(c => c.id === game.managedClubId)
    if (managedIdx !== -1) {
      updatedClubs[managedIdx] = { ...updatedClubs[managedIdx], boardExpectation: newExpectation }
    }

    newInboxItems.push({
      id: `inbox_board_preseason_${nextSeason}`,
      date: `${nextSeason}-09-15`,
      type: InboxItemType.BoardFeedback,
      title,
      body,
      isRead: false,
    } as InboxItem)
  }

  // Generate new schedule for next season
  const newScheduleFixtures = generateSchedule(updatedClubs.map(c => c.id), nextSeason)
  const leagueFixtures = newScheduleFixtures.map(sf => ({
    id: `fixture_${nextSeason}_r${sf.roundNumber}_${sf.homeClubId}_vs_${sf.awayClubId}`,
    leagueId: `league_${nextSeason}`,
    season: nextSeason,
    roundNumber: sf.roundNumber,
    homeClubId: sf.homeClubId,
    awayClubId: sf.awayClubId,
    status: FixtureStatus.Scheduled,
    homeScore: 0,
    awayScore: 0,
    events: [],
    report: undefined,
    homeLineup: undefined,
    awayLineup: undefined,
  }))

  // Generate cup fixtures for next season
  const cupSeasonSeed = nextSeason * 7919 + 42
  const cupSeasonRand = mulberry32(cupSeasonSeed)
  const { bracket: newCupBracket, fixtures: newCupFixtures } = generateCupFixtures(
    updatedClubs.map(c => c.id),
    nextSeason,
    cupSeasonRand,
  )
  const newFixtures = [...leagueFixtures, ...newCupFixtures]

  const newLeague = {
    ...game.league,
    id: `league_${nextSeason}`,
    season: nextSeason,
    fixtureIds: leagueFixtures.map(f => f.id),
  }

  // Reset player season stats, recover fitness, age players
  const allPlayers = [...game.players, ...youthPlayers]
  const retirementRand = mulberry32(baseSeed + 99991)
  const retiredPlayerIds = new Set<string>()
  const retirementMessages: InboxItem[] = []

  const resetPlayers = allPlayers.map(player => ({
    ...player,
    age: player.age + 1,
    fitness: Math.min(100, player.fitness + 15),
    startSeasonCA: player.currentAbility,
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
  }))

  // Retirement check: age 34+ CA<40: 50%, age 37+: 70%, age 39+: always
  for (const player of resetPlayers) {
    const mustRetire = player.age >= 39
    const r = retirementRand()
    const retires = mustRetire
      || (player.age >= 37 && r < 0.7)
      || (player.age >= 34 && player.currentAbility < 40 && r < 0.5)
    if (retires) {
      retiredPlayerIds.add(player.id)
      if (player.clubId === game.managedClubId) {
        const seasonsActive = player.age - 18  // rough career length estimate
        retirementMessages.push({
          id: `inbox_retirement_${player.id}_${nextSeason}`,
          date: game.currentDate,
          type: InboxItemType.Retirement,
          title: `${player.firstName} ${player.lastName} avslutar karriären`,
          body: `${player.firstName} ${player.lastName} (${player.age} år) meddelar att han lägger skridskorna på hyllan efter ${Math.max(1, seasonsActive)} säsonger i bandyn. Tack för allt!`,
          isRead: false,
        } as InboxItem)
      }
    }
  }

  const activePlayers = resetPlayers.filter(p => !retiredPlayerIds.has(p.id))

  // ── Board patience update ─────────────────────────────────────────────
  const totalTeams = game.clubs.length
  const finalPos = managedClubStanding?.position ?? totalTeams
  const currentPatience = game.boardPatience ?? 70
  const currentFailures = game.consecutiveFailures ?? 0

  let newBoardPatience = currentPatience
  let newConsecutiveFailures = currentFailures
  let managerFired = false

  const topThird = Math.ceil(totalTeams / 3)
  const bottomThird = totalTeams - Math.floor(totalTeams / 3) + 1

  if (finalPos <= 2) {
    // Promotion zone
    newBoardPatience = Math.min(100, currentPatience + 20)
    newConsecutiveFailures = 0
  } else if (finalPos <= topThird) {
    // Top 3 (but not top 2)
    newBoardPatience = Math.min(100, currentPatience + 15)
    newConsecutiveFailures = 0
  } else if (finalPos >= bottomThird) {
    // Bottom 3
    newBoardPatience = Math.max(0, currentPatience - 20)
    newConsecutiveFailures = currentFailures + 1
  } else {
    // Mid-table (pos 4-7 approximately)
    newConsecutiveFailures = 0
  }

  if (newBoardPatience <= 15 || newConsecutiveFailures >= 3) {
    managerFired = true
  }

  // Remove retired players from all club squads
  const clubsWithRetirements = updatedClubs.map(club => ({
    ...club,
    squadPlayerIds: club.squadPlayerIds.filter(id => !retiredPlayerIds.has(id)),
  }))

  // ── Tvångsnedflyttning effects (license denied) ───────────────────────────
  let clubsAfterLicense = clubsWithRetirements
  let playersAfterLicense = activePlayers
  let sponsorsAfterLicense = game.sponsors ?? []
  let licFireManager = false

  if (licenseReview?.status === 'denied' && managedClubForLicense) {
    // Remove 3 random managed players
    const managedSquadIds = clubsAfterLicense.find(c => c.id === game.managedClubId)?.squadPlayerIds ?? []
    const shuffledIds = [...managedSquadIds].sort(() => licenseRand() - 0.5)
    const removedIds = new Set(shuffledIds.slice(0, Math.min(3, shuffledIds.length)))
    playersAfterLicense = playersAfterLicense.map(p =>
      removedIds.has(p.id) && p.clubId === game.managedClubId
        ? { ...p, clubId: 'free_agent' }
        : p
    )
    clubsAfterLicense = clubsAfterLicense.map(c =>
      c.id === game.managedClubId
        ? {
            ...c,
            reputation: Math.max(0, (c.reputation ?? 50) - 15),
            squadPlayerIds: c.squadPlayerIds.filter(id => !removedIds.has(id)),
          }
        : c
    )
    // Remove 60% of sponsors
    const keepCount = Math.ceil(sponsorsAfterLicense.length * 0.4)
    sponsorsAfterLicense = sponsorsAfterLicense.slice(0, keepCount)

    licFireManager = false  // Manager survives but demoted
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
  let newJournalistRelationship = game.journalistRelationship ?? 50
  let newCommunityStanding = game.communityStanding ?? 50

  // Grävande artikel trigger: journalist unhappy + bad finances or license warning
  const managedClubFin = clubsWithRetirements.find(c => c.id === game.managedClubId)?.finances ?? 0
  const gravId = `gravande_artikel_${game.currentSeason}`
  const resolvedSet = new Set(game.resolvedEventIds ?? [])
  if (
    newJournalistRelationship < 30 &&
    (managedClubFin < -50000 || licenseReview?.status === 'warning' || licenseReview?.status === 'continued_review') &&
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
  const seasonEndPendingEvents: GameEvent[] = []
  if (licenseReview?.status === 'warning' || licenseReview?.status === 'continued_review') {
    const handlingsplanEvent: GameEvent = {
      id: `licenseHandlingsplan_${game.currentSeason}`,
      type: 'licenseHandlingsplan',
      title: 'Licensnämndens krav: Handlingsplan',
      body: `Licensnämnden kräver en handlingsplan för att säkra ${managedClubForLicense?.name ?? 'klubbens'} framtida licens. Välj er strategi noggrant.`,
      choices: [
        {
          id: 'sparplan',
          label: 'Sparplan — dra ner på löner och kostnader',
          effect: { type: 'multiEffect', subEffects: JSON.stringify([
            { type: 'income', amount: Math.round((licenseReview.requiredCapital ?? 50000) * 0.8) },
          ]) },
        },
        {
          id: 'membership',
          label: 'Medlemsdrivning — engagera lokala krafter',
          effect: { type: 'communityStanding', amount: 8 },
        },
        {
          id: 'sponsors',
          label: 'Fler sponsorer — lova synlighet och PR',
          effect: { type: 'reputation', amount: 3 },
        },
        ...(updatedPatron?.isActive ? [{
          id: 'patron',
          label: `Patronen — be ${updatedPatron.name} om hjälp`,
          effect: { type: 'patronHappiness' as const, amount: 15 },
        }] : []),
      ],
      resolved: false,
    }
    seasonEndPendingEvents.push(handlingsplanEvent)
  }

  const updatedGame: SaveGame = {
    ...game,
    currentSeason: nextSeason,
    currentDate: `${nextSeason}-10-01`,
    clubs: clubsAfterLicense,
    players: playersAfterLicense,
    fixtures: newFixtures,
    league: newLeague,
    standings: calculateStandings(updatedClubs.map(c => c.id), []),
    inbox: [...game.inbox, ...newInboxItems, ...retirementMessages].slice(-75),
    youthIntakeHistory: youthRecords,
    managedClubPendingLineup: undefined,
    matchWeathers: [],
    trainingHistory: [],
    playoffBracket: null,
    cupBracket: newCupBracket,
    seasonSummaries: [...(game.seasonSummaries ?? []), seasonSummary].slice(-5),
    showSeasonSummary: true,
    showBoardMeeting: (managerFired || licFireManager) ? false : undefined,
    showPreSeason: (managerFired || licFireManager) ? false : true,
    managerFired: managerFired ? true : undefined,
    fanMood: licenseReview?.status === 'denied'
      ? Math.max(0, (game.fanMood ?? 50) - 15)
      : game.fanMood,
    seasonStartFinances: updatedClubs.find(c => c.id === game.managedClubId)?.finances,
    scoutReports: game.scoutReports ?? {},
    activeScoutAssignment: null,
    scoutBudget: 10,
    transferBids: [],
    pendingEvents: seasonEndPendingEvents,
    handledContractPlayerIds: [],
    sponsors: sponsorsAfterLicense,
    opponentAnalyses: {},
    activeTalentSearch: null,
    talentSearchResults: game.talentSearchResults ?? [],
    boardPatience: newBoardPatience,
    consecutiveFailures: newConsecutiveFailures,
    rivalryHistory: game.rivalryHistory ?? {},
    trainingProjects: [],
    communityActivities: game.communityActivities
      ? { ...game.communityActivities, julmarknad: false }
      : game.communityActivities,
    youthTeam: generateYouthTeam(
      updatedClubs.find(c => c.id === game.managedClubId) ?? game.clubs.find(c => c.id === game.managedClubId)!,
      (() => {
        if (game.academyUpgradeInProgress && game.academyUpgradeSeason === nextSeason) {
          return game.academyLevel === 'basic' ? 'developing' : 'elite'
        }
        return game.academyLevel ?? 'basic'
      })(),
      nextSeason,
      baseSeed + 77777,
    ),
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
    loanDeals: [],
    // V0.9 fields
    licenseReview,
    licenseWarningCount,
    communityStanding: newCommunityStanding,
    journalistRelationship: newJournalistRelationship,
    sponsorNetworkMood: game.sponsorNetworkMood ?? 70,
    patron: updatedPatron,
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
    resolvedEventIds: [
      ...(game.resolvedEventIds ?? []),
      ...(licenseReview?.status !== 'denied' ? [] : []),
      gravId,
      raddId,
    ].slice(-200),
  }

  return { game: updatedGame, roundPlayed: null, seasonEnded: true }
}
