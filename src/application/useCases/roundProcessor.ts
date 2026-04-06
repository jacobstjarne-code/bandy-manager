import type { SaveGame, InboxItem } from '../../domain/entities/SaveGame'
import type { Player } from '../../domain/entities/Player'
import type { Club } from '../../domain/entities/Club'
import type { Fixture, TeamSelection } from '../../domain/entities/Fixture'
import type { MatchWeather } from '../../domain/entities/Weather'
import { FixtureStatus, MatchEventType, PlayerPosition, InboxItemType, PlayoffStatus, ClubStyle, TrainingType, TrainingIntensity } from '../../domain/enums'
import type { FormationType } from '../../domain/entities/Formation'
import { simulateMatch } from '../../domain/services/matchSimulator'
import { getTacticModifiers } from '../../domain/services/tacticModifiers'
import { getRivalry } from '../../domain/data/rivalries'
import { generateMatchWeather } from '../../domain/services/weatherService'
import { calculateStandings } from '../../domain/services/standingsService'
import {
  updateSeriesAfterMatch,
  isSeriesDecided,
  advancePlayoffRound,
} from '../../domain/services/playoffService'
import {
  createMatchResultItem,
  createInjuryItem,
  createSuspensionItem,
  createRecoveryItem,
} from '../../domain/services/inboxService'
import { processScoutAssignment } from '../../domain/services/scoutingService'
import { updateAllMarketValues } from '../../domain/services/marketValueService'
import { generateIncomingBids, resolveOutgoingBid, executeTransfer } from '../../domain/services/transferService'
import { generatePostAdvanceEvents, generateEvents } from '../../domain/services/eventService'
import { generateMediaHeadlines, generateTrendArticles } from '../../domain/services/mediaService'
import type { TransferBid } from '../../domain/entities/GameEvent'
import type { ScoutReport, ScoutAssignment } from '../../domain/entities/Scouting'
import { evaluateBoard, generateBoardMessage } from '../../domain/services/boardService'
import { executeTalentSearch } from '../../domain/services/talentScoutService'
import {
  updateCupBracketAfterRound,
  generateNextCupRound,
  getCupRoundName,
} from '../../domain/services/cupService'
import type { CupBracket } from '../../domain/entities/Cup'
import { mulberry32 } from '../../domain/utils/random'
import { getRoundDate } from '../../domain/services/scheduleGenerator'
import { simulateYouthMatch } from '../../domain/services/academyService'
import { handleSeasonEnd } from './seasonEndProcessor'
import { handlePlayoffStart } from './playoffTransition'
import type { AdvanceResult } from './advanceTypes'
import { applyRoundTraining } from './processors/trainingProcessor'
import { applyPlayerStateUpdates } from './processors/playerStateProcessor'
import { updatePlayerMatchStats } from './processors/statsProcessor'
import { applyRoundDevelopment } from '../../domain/services/playerDevelopmentService'
// Playoff logic extracted to processors/playoffProcessor.ts — wiring pending
// import { processPlayoffRound } from './processors/playoffProcessor'
import { calcRoundIncome, appendFinanceLog, applyFinanceChange, calcAttendance } from '../../domain/services/economyService'
import type { FinanceEntry } from '../../domain/services/economyService'
import { updatePlayerAvailability, updateLowMoraleDays } from '../../domain/services/playerAvailabilityService'
import { updateTrainerArc } from '../../domain/services/trainerArcService'
import { checkInObjectives } from '../../domain/services/boardObjectiveService'
import { checkProjectCompletion } from '../../domain/services/facilityService'
import { generateTransferRumor } from '../../domain/services/rumorService'
import { checkMidSeasonEvents } from '../../domain/services/midSeasonEventService'
import { generateSocialEvent, generateSilentShoutEvent } from '../../domain/services/mecenatService'

export type { AdvanceResult }


const AI_FORMATIONS: Record<ClubStyle, FormationType> = {
  [ClubStyle.Defensive]: '4-3-3',
  [ClubStyle.Balanced]: '5-3-2',
  [ClubStyle.Attacking]: '2-3-2-3',
  [ClubStyle.Physical]: '4-2-4',
  [ClubStyle.Technical]: '3-4-3',
}

function createRegenPlayer(club: Club, index: number, rand: () => number): Player {
  const positions = [PlayerPosition.Defender, PlayerPosition.Midfielder, PlayerPosition.Forward]
  const pos = positions[Math.floor(rand() * positions.length)]
  const emptyStats = { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 }
  const emptyCareer = { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 }
  const attrs = { skating: 40, acceleration: 40, stamina: 40, ballControl: 40, passing: 40, shooting: 40, dribbling: 40, vision: 40, decisions: 40, workRate: 50, positioning: 40, defending: 40, cornerSkill: 30, goalkeeping: 10 }
  return {
    id: `regen_${club.id}_${index}_${Math.floor(rand() * 99999)}`,
    firstName: 'Regen', lastName: `Spelare`, age: 20 + Math.floor(rand() * 10),
    nationality: 'svenska', clubId: club.id, isHomegrown: false,
    position: pos, archetype: 'TwoWaySkater' as Player['archetype'],
    salary: 3000, contractUntilSeason: 9999, marketValue: 10000,
    morale: 60, form: 50, fitness: 70, sharpness: 50,
    isFullTimePro: false, currentAbility: 25 + Math.floor(rand() * 15),
    potentialAbility: 40, developmentRate: 30,
    injuryProneness: 30, discipline: 60, attributes: attrs,
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    seasonStats: emptyStats, careerStats: emptyCareer,
  }
}

function generateAiLineup(club: Club, allPlayers: Player[], rand: () => number = Math.random): { selection: TeamSelection; regenPlayers: Player[] } {
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
  const regenPlayers: Player[] = []

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

  // If still under 11, generate regen filler players and track them
  let regenIndex = 0
  while (starters.length < 11) {
    const regen = createRegenPlayer(club, regenIndex++, rand)
    starters.push(regen)
    regenPlayers.push(regen)
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
    selection: {
      startingPlayerIds: starters.map(p => p.id),
      benchPlayerIds: bench.map(p => p.id),
      captainPlayerId: captain?.id,
      tactic: { ...club.activeTactic, formation: AI_FORMATIONS[club.preferredStyle] ?? '5-3-2' },
    },
    regenPlayers,
  }
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

  // Detect if there is a pending (unplayed) cup match for the managed club this round
  let hasManagedCupPending = false

  // Determine if this round contains cup or playoff fixtures
  const isCupRound = roundFixtures.some(f => f.isCup)
  const isPlayoffRound = !isCupRound && game.playoffBracket !== null && nextMatchday > 26

  // League round number (1-22) for board milestones and training — null during cup/playoff rounds
  const currentLeagueRound = roundFixtures.find(f => !f.isCup && f.roundNumber <= 22)?.roundNumber ?? null

  // ── Apply training for all clubs this round ────────────────────────────
  const trainingResult = applyRoundTraining(game, baseSeed, currentLeagueRound ?? nextMatchday)
  let trainingPlayers = trainingResult.players
  const updatedTrainingHistory = trainingResult.trainingHistory
  newInboxItems.push(...trainingResult.inboxItems)

  for (let i = 0; i < roundFixtures.length; i++) {
    const fixture = roundFixtures[i]

    // Skip scheduled cup fixtures for the managed club unless they have a saved lineup
    if (
      fixture.isCup &&
      fixture.status === FixtureStatus.Scheduled &&
      (fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId) &&
      game.managedClubPendingLineup === undefined
    ) {
      hasManagedCupPending = true
      continue
    }

    // Skip scheduled LEAGUE fixtures for the managed club unless they have a saved lineup
    // (prevents auto-simulation with AI lineup when user hasn't set one)
    if (
      !fixture.isCup &&
      fixture.status === FixtureStatus.Scheduled &&
      (fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId) &&
      game.managedClubPendingLineup === undefined
    ) {
      hasManagedCupPending = true  // reuse flag — signals "managed club has an unplayed match"
      continue
    }

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

    // Generate weather
    const matchWeather = generateMatchWeather(
      game.currentSeason,
      nextMatchday,
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

    // Generate lineups — AI lineup may produce regen players if squad < 11
    let homeRegenPlayers: Player[] = []
    let awayRegenPlayers: Player[] = []

    if (
      fixture.homeClubId === game.managedClubId &&
      game.managedClubPendingLineup !== undefined
    ) {
      homeLineup = game.managedClubPendingLineup
    } else {
      const { selection, regenPlayers } = generateAiLineup(homeClub, game.players, localRand)
      homeLineup = selection
      homeRegenPlayers = regenPlayers
    }

    if (
      fixture.awayClubId === game.managedClubId &&
      game.managedClubPendingLineup !== undefined
    ) {
      awayLineup = game.managedClubPendingLineup
    } else {
      const { selection, regenPlayers } = generateAiLineup(awayClub, game.players, localRand)
      awayLineup = selection
      awayRegenPlayers = regenPlayers
    }

    // Accumulate regen players for persistence at end of round
    for (const regen of [...homeRegenPlayers, ...awayRegenPlayers]) {
      if (!allRoundRegenPlayers.find(r => r.id === regen.id)) {
        allRoundRegenPlayers.push(regen)
      }
    }

    // Players for simulation — include this match's regen players
    const matchPlayers = [...game.players, ...homeRegenPlayers, ...awayRegenPlayers]
    const homePlayers = matchPlayers.filter(p => p.clubId === fixture.homeClubId)
    const awayPlayers = matchPlayers.filter(p => p.clubId === fixture.awayClubId)

    // Track starters/bench
    for (const id of homeLineup.startingPlayerIds) startersThisRound.add(id)
    for (const id of homeLineup.benchPlayerIds) benchThisRound.add(id)
    for (const id of awayLineup.startingPlayerIds) startersThisRound.add(id)
    for (const id of awayLineup.benchPlayerIds) benchThisRound.add(id)

    const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)
    const isManagedHome = fixture.homeClubId === game.managedClubId
    const baseAdv = homeClub?.hasIndoorArena ? 0.05 * 0.85 : 0.05
    const isManaged = fixture.homeClubId === game.managedClubId
    const communityBonus = isManaged
      ? ((game.communityStanding ?? 50) - 50) / 50 * 0.02
      : 0
    const homeAdv = Math.max(0, baseAdv + communityBonus)
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
      storylines: (game.storylines ?? []).filter(s => s.resolved),
    })

    // Calculate attendance for home matches
    const homeClubForAttendance = game.clubs.find(c => c.id === fixture.homeClubId)
    const attendance = homeClubForAttendance ? calcAttendance({
      club: homeClubForAttendance,
      fanMood: game.fanMood ?? 50,
      position: game.standings.find(s => s.clubId === fixture.homeClubId)?.position ?? 6,
      isKnockout: !!fixture.isKnockout,
      isCup: !!fixture.isCup,
      isDerby: !!rivalry,
    }) : undefined
    simulatedFixtures.push({ ...result.fixture, attendance })
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

  // ── Per-round development for managed club players ────────────────────────
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
        const scoutSeed = baseSeed + nextMatchday * 17 + target.id.charCodeAt(0)
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
          id: `inbox_scout_${target.id}_${game.currentSeason}_r${nextMatchday}`,
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
        nextMatchday,
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

  // Date from season calendar table (grundserie okt-feb, slutspel mars)
  const newDate = getRoundDate(game.currentSeason, nextMatchday)

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
      const alreadySentId = `inbox_rivalry_context_${opponentId}_r${nextMatchday}_${game.currentSeason}`
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

  // Track which fixtures were already completed before this round (for dedup)
  const fixturesCompletedBeforeRound = new Set(
    game.fixtures.filter(f => f.status === FixtureStatus.Completed).map(f => f.id)
  )

  // ── Update playoff bracket if active ─────────────────────────────────
  let updatedBracket = game.playoffBracket
  let bracketNewFixtures: Fixture[] = []
  let playoffCsBoost = 0  // Bygdens puls-boost vid playoff-avancemang

  if (updatedBracket !== null) {
    const completedThisRound = simulatedFixtures.filter(f => f.status === FixtureStatus.Completed)

    // DIAGNOSTIC: Log playoff state for debugging match-skip bug
    if (process.env.NODE_ENV !== 'production') {
      const managedSeries = [...updatedBracket.quarterFinals, ...updatedBracket.semiFinals, ...(updatedBracket.final ? [updatedBracket.final] : [])]
        .find(s => s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId)
      if (managedSeries) {
        console.log(`[PLAYOFF] md${nextMatchday} Series ${managedSeries.id}: ${managedSeries.homeWins}-${managedSeries.awayWins}, winnerId=${managedSeries.winnerId}, completed this round: ${completedThisRound.filter(f => managedSeries.fixtures.includes(f.id)).map(f => f.id).join(',')}`)  
      }
    }

    // Only update series for fixtures NEWLY completed this round
    const newlyCompletedThisRound = simulatedFixtures.filter(f =>
      f.status === FixtureStatus.Completed && !fixturesCompletedBeforeRound.has(f.id)
    )

    type AnyPlayoffSeries = (typeof updatedBracket.quarterFinals)[0]

    const updateSeries = (series: AnyPlayoffSeries): AnyPlayoffSeries => {
      let s = { ...series }
      for (const f of newlyCompletedThisRound) {
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

    // DIAGNOSTIC: Log series state after update
    if (process.env.NODE_ENV !== 'production') {
      const managedSeriesAfter = allSeriesNow.find(s => s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId)
      if (managedSeriesAfter) {
        console.log(`[PLAYOFF AFTER] ${managedSeriesAfter.id}: ${managedSeriesAfter.homeWins}-${managedSeriesAfter.awayWins}, winnerId=${managedSeriesAfter.winnerId}, loserId=${managedSeriesAfter.loserId}`)
      }
    }
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
      const nextRoundStart = updatedBracket.status === PlayoffStatus.QuarterFinals ? 28
        : updatedBracket.status === PlayoffStatus.SemiFinals ? 33
        : 36
      const currentMaxMatchday = Math.max(0, ...allFixtures.map(f => f.matchday ?? 0))
      const nextMatchdayStart = currentMaxMatchday + 1
      const { bracket: newBracket, newFixtures } = advancePlayoffRound(updatedBracket, game.currentSeason, nextRoundStart, nextMatchdayStart)
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
        // Bygdens puls: playoff-avancemang ger boost
        playoffCsBoost += series.round === 'quarterFinal' ? 5 : 10
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
        playoffCsBoost += 20  // SM-guld: stor pulshöjning
        newInboxItems.push({
          id: `inbox_champion_${game.currentSeason}`,
          date: game.currentDate,
          type: InboxItemType.Playoff,
          title: 'SVENSKA MÄSTARE!',
          body: `GRATTIS! ${champion?.name} är svenska mästare ${game.currentSeason + 1}! En historisk säsong som aldrig glöms!`,
          isRead: false,
        } as InboxItem)
      } else {
        newInboxItems.push({
          id: `inbox_champion_other_${game.currentSeason}`,
          date: game.currentDate,
          type: InboxItemType.Playoff,
          title: `${champion?.name} är svenska mästare!`,
          body: `${champion?.name} tar SM-guldet ${game.currentSeason + 1}!`,
          isRead: false,
        } as InboxItem)
      }
    }
  }

  // ── Update cup bracket if active ─────────────────────────────────────
  let updatedCupBracket: CupBracket | null = game.cupBracket ?? null
  let cupNewFixtures: Fixture[] = []

  if (updatedCupBracket !== null && !updatedCupBracket.completed) {
    // Only process cup fixtures NEWLY completed this round (not live-played ones
    // that were already counted in saveLiveMatchResult)
    const newlyCompletedCupThisRound = simulatedFixtures.filter(f =>
      f.status === FixtureStatus.Completed && f.isCup && !fixturesCompletedBeforeRound.has(f.id)
    )

    if (newlyCompletedCupThisRound.length > 0) {
      updatedCupBracket = updateCupBracketAfterRound(updatedCupBracket, newlyCompletedCupThisRound)

      // Check if the current cup round is fully decided
      const roundsWithMatches = [...new Set(updatedCupBracket.matches.map(m => m.round))]
      const maxRound = Math.max(...roundsWithMatches)
      const currentRoundMatches = updatedCupBracket.matches.filter(m => m.round === maxRound)
      const currentRoundComplete = currentRoundMatches.every(m => m.winnerId)

      if (currentRoundComplete) {
        if (maxRound === 4) {
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

  const managedClubStanding = standings.find(s => s.clubId === game.managedClubId) ?? null

  // ── Economy: wages, match revenue, sponsorship per round ─────────────────
  // Managed club uses calcRoundIncome (canonical, same function used by EkonomiTab display).
  // AI clubs use a simplified flat estimate (no sponsor/community data available).
  let roundFinanceLog: FinanceEntry[] = []

  // Compute managed club income
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)!
  const managedClubPlayers = availabilityUpdatedPlayers.filter(p => p.clubId === game.managedClubId)
  const managedHomeMatch = simulatedFixtures.find(
    f => f.homeClubId === game.managedClubId && f.status === FixtureStatus.Completed
  )
  const isHomeMatch = !!managedHomeMatch
  const managedIncome = calcRoundIncome({
    club: managedClub,
    players: managedClubPlayers,
    sponsors: game.sponsors ?? [],
    communityActivities: game.communityActivities,
    fanMood: currentFanMood,
    isHomeMatch,
    matchIsKnockout: managedHomeMatch?.isKnockout ?? false,
    matchIsCup: managedHomeMatch?.isCup ?? false,
    matchHasRivalry: managedHomeMatch
      ? !!getRivalry(managedHomeMatch.homeClubId, managedHomeMatch.awayClubId)
      : false,
    standing: managedClubStanding,
    rand: localRand,
  })

  // Build finance log entries for this round
  if (managedIncome.weeklyBase !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: managedIncome.weeklyBase, reason: 'sponsorship', label: 'Grundintäkt (reputation)' })
  }
  if (managedIncome.sponsorIncome !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: managedIncome.sponsorIncome, reason: 'sponsorship', label: 'Sponsorintäkter' })
  }
  if (managedIncome.matchRevenue !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: managedIncome.matchRevenue, reason: 'match_revenue', label: `Matchintäkt${isHomeMatch ? ' (hemma)' : ''}` })
  }
  if (managedIncome.communityMatchIncome !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: managedIncome.communityMatchIncome, reason: 'community_round', label: 'Föreningsaktiviteter (match)' })
  }
  if (managedIncome.communityRoundIncome !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: managedIncome.communityRoundIncome, reason: 'community_round', label: 'Föreningsaktiviteter (omgång)' })
  }
  if (managedIncome.weeklyWages !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: -managedIncome.weeklyWages, reason: 'wages', label: 'Löner' })
  }

  // Apply managed club income
  // NOTE: Finances can go negative (salary drain, no revenue). This is intentional — don't add
  // a hard floor here as it would mask the underlying economic problem. If finances drop below
  // -500000, consider triggering a board crisis event in the future. The UI handles negative
  // display with a warning label.
  let financiallyUpdatedClubs = applyFinanceChange(game.clubs, game.managedClubId, managedIncome.netPerRound)

  // Apply AI club income: simplified flat estimate, no sponsor/community data
  for (const c of game.clubs) {
    if (c.id === game.managedClubId) continue
    const clubPlayers = availabilityUpdatedPlayers.filter(p => p.clubId === c.id)
    const homeMatch = simulatedFixtures.find(
      f => f.homeClubId === c.id && f.status === FixtureStatus.Completed
    )
    const totalWages = clubPlayers.reduce((sum, p) => sum + p.salary, 0)
    const weeklyWages = Math.round(totalWages / 4)
    const weeklySponsorship = Math.round(c.reputation * 60)
    const aiMatchRevenue = homeMatch
      ? Math.round(c.reputation * 600 + localRand() * 10000)
      : 0
    financiallyUpdatedClubs = applyFinanceChange(financiallyUpdatedClubs, c.id, weeklySponsorship + aiMatchRevenue - weeklyWages)
  }

  // ── Cup prize money ──────────────────────────────────────────────────────
  // Apply cup prizes to club budgets based on this round's cup results
  let cupPrizedClubs = financiallyUpdatedClubs
  if (updatedCupBracket && game.cupBracket) {
    const CUP_PRIZES: Record<number, number> = { 1: 10000, 2: 30000, 3: 50000, 4: 150000 }
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
      const losePrize = match.round === 4 ? RUNNER_UP_PRIZE : 0

      cupPrizedClubs = applyFinanceChange(cupPrizedClubs, winnerId, winPrize)
      if (losePrize > 0) cupPrizedClubs = applyFinanceChange(cupPrizedClubs, loserId, losePrize)
    }
  }

  // Social media reputation boost (+1 var 5:e omgång)
  const socialMediaBoostedClubs = (game.communityActivities?.socialMedia && nextMatchday % 5 === 0)
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
    if (b.direction === 'outgoing' && b.status === 'pending' && nextMatchday >= b.expiresRound) {
      const outcome = resolveOutgoingBid(b, game, localRand)
      return { ...b, status: outcome }
    }
    // Expire stale bids (incoming bids expire at expiresRound, outgoing already resolved above)
    if (b.status === 'pending' && nextMatchday >= b.expiresRound) {
      return { ...b, status: 'expired' as const }
    }
    return b
  })

  // Partially updated game state for bid/event generation (with market-updated players)
  const preEventGame: SaveGame = {
    ...game,
    players: availabilityUpdatedPlayers,
    transferBids: resolvedBids,
  }

  const newBids = generateIncomingBids(preEventGame, nextMatchday, localRand)
  const allBids: TransferBid[] = [...resolvedBids, ...newBids]

  // Transfer rumour: newly active outgoing bids get a 50% chance of inbox rumour
  const newlyActiveBids = resolvedBids.filter(
    b => b.direction === 'outgoing' && b.status === 'pending' && b.createdRound === nextMatchday
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

  // Bid resolution notifications + execute accepted transfers
  for (const bid of resolvedBids) {
    if (bid.direction !== 'outgoing') continue
    const wasPending = existingBids.find(b => b.id === bid.id)?.status === 'pending'
    if (!wasPending) continue

    const target = preEventGame.players.find(p => p.id === bid.playerId)
    const sellingClub = preEventGame.clubs.find(c => c.id === bid.sellingClubId)

    if (bid.status === 'accepted' && target) {
      newInboxItems.push({
        id: `inbox_bid_accepted_${bid.id}`,
        date: newDate,
        type: InboxItemType.Transfer,
        title: `Bud accepterat — ${target.firstName} ${target.lastName}`,
        body: `${sellingClub?.name ?? 'Klubben'} accepterar ditt bud på ${target.firstName} ${target.lastName}! Spelaren ansluter till truppen.`,
        isRead: false,
      })
    } else if (bid.status === 'rejected' && target) {
      newInboxItems.push({
        id: `inbox_bid_rejected_${bid.id}`,
        date: newDate,
        type: InboxItemType.Transfer,
        title: `Bud avslaget — ${target.firstName} ${target.lastName}`,
        body: `${sellingClub?.name ?? 'Klubben'} avslår ditt bud på ${target.firstName} ${target.lastName}.`,
        isRead: false,
      })
    }
  }

  // ── Post-advance events ──────────────────────────────────────────────────
  const newEvents = generatePostAdvanceEvents(preEventGame, newBids, nextMatchday, localRand, justCompletedManagedFixture ?? undefined)
  const communityEvents = generateEvents(
    { ...preEventGame, communityActivities: game.communityActivities },
    nextMatchday,
    localRand,
  )
  const allNewEvents = [...newEvents, ...communityEvents]

  // ── Mecenat social events, silent shout, and happiness decay ────────────
  let updatedMecenater = (game.mecenater ?? []).map(mec => {
    if (!mec.isActive) return mec

    // Happiness decay: -1 per round if no interaction in last 4 rounds
    const roundsSinceInteraction = nextMatchday - (mec.lastInteractionRound ?? 0)
    const decayedHappiness = roundsSinceInteraction > 4
      ? Math.max(0, mec.happiness - 1)
      : mec.happiness

    return { ...mec, happiness: decayedHappiness }
  })

  for (let i = 0; i < updatedMecenater.length; i++) {
    const mec = updatedMecenater[i]
    if (!mec.isActive) continue

    // Social event every ~4 rounds
    const roundsSinceLastSocial = nextMatchday - (mec.lastSocialRound ?? 0)
    if (roundsSinceLastSocial >= 4 && localRand() < 0.35) {
      const socialEvent = generateSocialEvent(mec, game.currentSeason, nextMatchday, localRand)
      allNewEvents.push(socialEvent)
      updatedMecenater = updatedMecenater.map((m, idx) =>
        idx === i ? { ...m, lastSocialRound: nextMatchday } : m
      )
    }

    // Silent shout event: unhappy mecenat with growing influence
    if (mec.happiness < 30 || mec.silentShout >= 30) {
      const randomPlayer = game.players.find(p => p.clubId === game.managedClubId)
      const playerName = randomPlayer ? `${randomPlayer.firstName} ${randomPlayer.lastName}` : undefined
      const shoutEvent = generateSilentShoutEvent(mec, playerName, localRand)
      if (shoutEvent) {
        allNewEvents.push(shoutEvent)
      }
    }

    // Demand reminder: active demands not yet addressed
    if (mec.demands.length > 0) {
      const demandId = `inbox_mec_demand_${mec.id}_${nextMatchday}`
      if (!game.inbox.some(item => item.id === demandId) && nextMatchday % 5 === 0) {
        const demandTexts = mec.demands.map(d => d.description ?? d.type).join(', ')
        newInboxItems.push({
          id: demandId,
          date: game.currentDate,
          type: InboxItemType.PatronInfluence,
          title: `📋 ${mec.name} påminner`,
          body: `${mec.name} har fortfarande önskemål som inte hanterats: ${demandTexts}.`,
          isRead: false,
        } as InboxItem)
      }
    }
  }

  // ── P19 Youth match simulation (every other round) ──────────────────────
  let updatedYouthTeam = game.youthTeam
  if (nextMatchday % 2 === 0 && game.youthTeam && game.youthTeam.players.length > 0) {
    const youthSeed = baseSeed + nextMatchday * 97
    const youthRand = mulberry32(youthSeed)
    const youthSim = simulateYouthMatch(game.youthTeam, game.academyLevel ?? 'basic', youthRand, nextMatchday)

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
      id: `inbox_p17_r${nextMatchday}_${game.currentSeason}`,
      date: newDate,
      type: InboxItemType.YouthP17,
      title: `📋 P19 ${resultStr} mot ${matchResult.opponentName} ${scoreStr}`,
      body: `Pojklaget ${resultStr} mot ${matchResult.opponentName} med ${scoreStr}.${scorerStr}${bestStr}\n${tableStr}${scoutNote}`,
      isRead: false,
    } as InboxItem)
  }

  // ── Mentor effects per round ─────────────────────────────────────────────
  let mentorUpdatedYouthPlayers = updatedYouthTeam?.players ?? []
  const activeMentorships = (game.mentorships ?? []).filter(m => m.isActive)
  for (const m of activeMentorships) {
    const mentor = availabilityUpdatedPlayers.find(p => p.id === m.seniorPlayerId)
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
  let loanUpdatedPlayers = [...availabilityUpdatedPlayers]
  const activeLoanDeals = (game.loanDeals ?? []).filter(d => nextMatchday <= d.endRound)
  const returnedLoanPlayerIds: string[] = []

  for (const deal of activeLoanDeals) {
    if (nextMatchday >= deal.endRound) {
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
          id: `inbox_loan_return_${deal.playerId}_${nextMatchday}`,
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
      if (nextMatchday % 2 === 0 && nextMatchday < d.endRound) {
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
          reports: [...d.reports.slice(-5), { round: nextMatchday, played, rating, goals, assists: 0 }],
        }
      }
      return d
    })

  // ── Academy events ───────────────────────────────────────────────────────
  if (game.youthTeam && nextMatchday >= 3 && nextMatchday <= 18) {
    const conflictPlayers = updatedYouthTeam?.players.filter(p => p.schoolConflict) ?? []
    if (conflictPlayers.length > 0 && localRand() < 0.12) {
      const player = conflictPlayers[Math.floor(localRand() * conflictPlayers.length)]
      allNewEvents.push({
        id: `event_school_conflict_${player.id}_${nextMatchday}`,
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

  if (game.youthTeam && (nextMatchday === 8 || nextMatchday === 15)) {
    const callupCandidates = updatedYouthTeam?.players.filter(p => p.potentialAbility > 50) ?? []
    if (callupCandidates.length >= 1) {
      const selected = callupCandidates.slice(0, Math.min(2, callupCandidates.length))
      const names = selected.map(p => `${p.firstName} ${p.lastName}`).join(' och ')
      allNewEvents.push({
        id: `event_district_callup_${nextMatchday}_${game.currentSeason}`,
        type: 'communityEvent',
        title: `Juniorlandslagssamling — ${names}`,
        body: `${names} är kallade till Sveriges P19-samling. De missar 2 P19-matcher men kan få värdefull erfarenhet.`,
        choices: [
          {
            id: 'send',
            label: selected.length === 1 ? 'Skicka honom' : 'Skicka dem',
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
  const mediaHeadlines = generateMediaHeadlines(preEventGame, simulatedFixtures, nextMatchday, localRand)
  newInboxItems.push(...mediaHeadlines)

  // Trend articles (win/loss streaks, standings position)
  const trendArticles = generateTrendArticles(preEventGame, nextMatchday, localRand)
  newInboxItems.push(...trendArticles)

  // Transfer rumors (matchday 5-18)
  const rumorResult = generateTransferRumor(preEventGame, localRand)
  let rumorScoutReports = { ...game.scoutReports }
  if (rumorResult) {
    newInboxItems.push(rumorResult.inboxItem)
    if (rumorResult.scoutHint) {
      rumorScoutReports = { ...rumorScoutReports, [rumorResult.scoutHint.playerId]: rumorResult.scoutHint }
    }
  }

  // Mid-season events (narrative triggers at key matchdays)
  const midSeasonItems = checkMidSeasonEvents(preEventGame)
  newInboxItems.push(...midSeasonItems)

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
        id: `inbox_sponsor_chain_${nextMatchday}_${game.currentSeason}`,
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
        id: `inbox_sponsor_license_leave_${nextMatchday}_${game.currentSeason}`,
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
        id: `inbox_sponsor_win_${nextMatchday}_${game.currentSeason}`,
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

  // ── Nudges: community activities, training, sponsor, morale ────────────────
  const nudgeManagedClub = game.clubs.find(c => c.id === game.managedClubId)
  const activeSponsorsCount = (game.sponsors ?? []).filter(s => s.contractRounds > 0).length
  const nudgeMaxSponsors = nudgeManagedClub ? Math.min(6, 2 + Math.floor(nudgeManagedClub.reputation / 20)) : 3

  // Community activity nudges (once per season, only if not started)
  const communityNudges: Array<{ round: number; id: string; title: string; body: string }> = [
    {
      round: 5,
      id: `inbox_nudge_kiosk_${game.currentSeason}`,
      title: 'Kioskverksamhet?',
      body: 'En grupp frivilliga har frågat om att starta en kiosk vid hemmamatcherna. Det skulle kosta 3 tkr att komma igång.',
    },
    {
      round: 3,
      id: `inbox_nudge_socialmedia_${game.currentSeason}`,
      title: 'Sociala medier?',
      body: 'Någon i styrelsen föreslår att klubben borde vara mer aktiv på sociala medier. Det kostar lite men ger synlighet. Kolla in Förening → Ekonomi.',
    },
    {
      round: 8,
      id: `inbox_nudge_lottery_${game.currentSeason}`,
      title: 'Lotteri för klubben?',
      body: 'En av supportrarna har föreslagit ett lotteri. Det kan ge ett bra tillskott till kassan. Se Förening → Ekonomi.',
    },
  ]
  for (const nudge of communityNudges) {
    if (nextMatchday === nudge.round && !game.inbox.some(i => i.id === nudge.id)) {
      newInboxItems.push({
        id: nudge.id,
        date: newDate,
        type: InboxItemType.Community,
        title: nudge.title,
        body: nudge.body,
        isRead: false,
      } as InboxItem)
    }
  }

  // BandySchool nudge: round 12, if not started and academyLevel > basic
  if (nextMatchday === 12 && !game.communityActivities?.bandySchool && (game.academyLevel ?? 'basic') !== 'basic') {
    const id = `inbox_nudge_bandyschool_${game.currentSeason}`
    if (!game.inbox.some(i => i.id === id)) {
      newInboxItems.push({
        id,
        date: newDate,
        type: InboxItemType.Community,
        title: 'Starta bandyskola?',
        body: 'Med er akademi på plats finns det möjlighet att starta en bandyskola för barn. Det stärker klubbens lokala förankring. Se Förening → Ekonomi.',
        isRead: false,
      } as InboxItem)
    }
  }

  // Training nudge: if user hasn't changed default training after round 3
  if (nextMatchday === 3) {
    const defaultTraining =
      (game.managedClubTraining?.type === TrainingType.Physical || game.managedClubTraining?.type === undefined) &&
      (game.managedClubTraining?.intensity === TrainingIntensity.Normal || game.managedClubTraining?.intensity === undefined)
    const id = `inbox_nudge_training_${game.currentSeason}`
    if (defaultTraining && !game.inbox.some(i => i.id === id)) {
      newInboxItems.push({
        id,
        date: newDate,
        type: InboxItemType.Training,
        title: 'Träningsschema',
        body: 'Spelarna undrar om det inte är dags att variera träningen? Kolla in träningstabben under Förening.',
        isRead: false,
      } as InboxItem)
    }
  }

  // Sponsor nudge: every 4th round, 25% chance if sponsors < maxSponsors
  if (nextMatchday % 4 === 0 && activeSponsorsCount < nudgeMaxSponsors && localRand() < 0.25) {
    const id = `inbox_nudge_sponsor_${nextMatchday}_${game.currentSeason}`
    if (!game.inbox.some(i => i.id === id)) {
      const sponsorNames = ['Johanssons Bygg AB', 'Karlssons Bil', 'Bergström El & Installation', 'Lindströms Åkeri', 'Erikssons Redovisning']
      const sponsorName = sponsorNames[Math.floor(localRand() * sponsorNames.length)]
      const incomePerRound = 500 + Math.round(localRand() * 1000)
      const durationRounds = 4 + Math.round(localRand() * 4)
      newInboxItems.push({
        id,
        date: newDate,
        type: InboxItemType.SponsorNetwork,
        title: `Sponsorerbjudande från ${sponsorName}`,
        body: `${sponsorName} vill teckna ett avtal värt ${incomePerRound} kr/omgång i ${durationRounds} omgångar. Gå till Förening → Ekonomi → Sponsorer.`,
        isRead: false,
      } as InboxItem)
    }
  }

  // Morale nudge: if any managed squad player drops below 30
  const managedSquadIds = nudgeManagedClub?.squadPlayerIds ?? []
  for (const player of finalPlayers.filter(p => managedSquadIds.includes(p.id) && (p.morale ?? 50) < 30)) {
    const id = `inbox_morale_${player.id}_r${nextMatchday}_${game.currentSeason}`
    if (!game.inbox.some(i => i.id === id)) {
      newInboxItems.push({
        id,
        date: newDate,
        type: InboxItemType.Community,
        title: `${player.firstName} ${player.lastName} vill prata`,
        body: `${player.firstName} ${player.lastName} verkar inte må bra. Kanske är det dags för ett spelarsamtal? Klicka på spelaren i Trupp.`,
        isRead: false,
      } as InboxItem)
      break // max one morale nudge per round
    }
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
  let postTransferPlayers = loanAndRegenPlayers
  let postTransferClubs = regenUpdatedClubs
  for (const bid of resolvedBids) {
    if (bid.direction !== 'outgoing' || bid.status !== 'accepted') continue
    const wasPending = existingBids.find(b => b.id === bid.id)?.status === 'pending'
    if (!wasPending) continue
    const tmpGame = { ...preEventGame, players: postTransferPlayers, clubs: postTransferClubs }
    const result = executeTransfer(tmpGame, bid)
    postTransferPlayers = result.players
    postTransferClubs = result.clubs
  }

  // ── Community standing update per round ────────────────────────────
  let csBoost = playoffCsBoost
  if (justCompletedManagedFixture) {
    const isHomeCs = justCompletedManagedFixture.homeClubId === game.managedClubId
    const myScoreCs = isHomeCs ? justCompletedManagedFixture.homeScore : justCompletedManagedFixture.awayScore
    const theirScoreCs = isHomeCs ? justCompletedManagedFixture.awayScore : justCompletedManagedFixture.homeScore
    const wonCs = (myScoreCs ?? 0) > (theirScoreCs ?? 0)
    const lostCs = (myScoreCs ?? 0) < (theirScoreCs ?? 0)
    const bigWinCs = wonCs && (myScoreCs ?? 0) >= (theirScoreCs ?? 0) + 3
    const bigLossCs = lostCs && (theirScoreCs ?? 0) >= (myScoreCs ?? 0) + 3
    if (bigWinCs) csBoost += 3
    else if (wonCs) csBoost += 1
    else if (bigLossCs) csBoost -= 3
    else if (lostCs) csBoost -= 2
    const matchRivalryCs = getRivalry(justCompletedManagedFixture.homeClubId, justCompletedManagedFixture.awayClubId)
    if (matchRivalryCs && wonCs) csBoost += 2
    if (matchRivalryCs && lostCs) csBoost -= 1
  }
  const csActivities = game.communityActivities
  if (csActivities?.kiosk && csActivities.kiosk !== 'none') csBoost += 0.08
  if (csActivities?.lottery && csActivities.lottery !== 'none') csBoost += 0.05
  if (csActivities?.bandyplay) csBoost += 0.08
  if (csActivities?.functionaries) csBoost += 0.05
  if (csActivities?.bandySchool) csBoost += 0.08
  if (csActivities?.socialMedia) csBoost += 0.03
  const csPos = standings.find(s => s.clubId === game.managedClubId)?.position ?? 6
  if (csPos <= 3) csBoost += 0.2
  else if (csPos >= 10) csBoost -= 0.15

  // ── Kommun/mecenat inbox-notiser ──────────────────────────────────────
  const pol = game.localPolitician
  if (pol && justCompletedManagedFixture && pol.relationship > 50) {
    const isHomeNotif = justCompletedManagedFixture.homeClubId === game.managedClubId
    const myScoreNotif = isHomeNotif ? justCompletedManagedFixture.homeScore : justCompletedManagedFixture.awayScore
    const theirScoreNotif = isHomeNotif ? justCompletedManagedFixture.awayScore : justCompletedManagedFixture.homeScore
    const wonNotif = (myScoreNotif ?? 0) > (theirScoreNotif ?? 0)
    if (wonNotif) {
    const opponent = game.clubs.find(c => c.id === (isHomeNotif ? justCompletedManagedFixture.awayClubId : justCompletedManagedFixture.homeClubId))
    newInboxItems.push({
      id: `inbox_pol_match_${nextMatchday}_${game.currentSeason}`,
      date: game.currentDate,
      type: InboxItemType.BoardFeedback,
      title: `🏛️ ${pol.name} noterade segern`,
      body: `Kommunalrådet ${pol.name} skickade ett meddelande: "Bra match mot ${opponent?.name ?? 'motståndaren'}. Fortsätt så."`,
      isRead: false,
    } as InboxItem)
    }
  }

  // Politician relationship milestones (25, 50, 75)
  if (pol) {
    const relMilestones = [25, 50, 75]
    for (const milestone of relMilestones) {
      const milestoneId = `inbox_pol_rel_${milestone}_${game.currentSeason}`
      if (pol.relationship >= milestone && pol.relationship < milestone + 5 && !game.inbox.some(i => i.id === milestoneId)) {
        const milestoneTexts: Record<number, string> = {
          25: `Kommunalrådet ${pol.name} börjar visa intresse för klubben. "Ni gör bra saker för ungdomarna i kommunen."`,
          50: `${pol.name} ser klubben som en viktig samhällsaktör. "Vi borde prata om framtida satsningar."`,
          75: `${pol.name} är en stark allierad. "Jag kommer att driva frågan om ökat kommunbidrag i nästa budgetomgång."`,
        }
        newInboxItems.push({
          id: milestoneId,
          date: game.currentDate,
          type: InboxItemType.KommunBidrag,
          title: `🏛️ Stärkt relation med ${pol.name}`,
          body: milestoneTexts[milestone] ?? '',
          isRead: false,
        } as InboxItem)
      }
    }
  }

  // KommunBidrag change notification (check if bidrag differs from previous round snapshot)
  if (pol) {
    const prevKommunBidrag = game.previousKommunBidrag ?? pol.kommunBidrag
    if (pol.kommunBidrag !== prevKommunBidrag) {
      const direction = pol.kommunBidrag > prevKommunBidrag ? 'höjt' : 'sänkt'
      const diff = pol.kommunBidrag - prevKommunBidrag
      const diffStr = diff > 0 ? `+${diff}` : `${diff}`
      newInboxItems.push({
        id: `inbox_kommun_bidrag_${nextMatchday}_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.KommunBidrag,
        title: `🏛️ Kommunbidraget ${direction}`,
        body: `Kommunen har ${direction} bidraget till klubben (${diffStr} kr/månad). Nytt bidrag: ${pol.kommunBidrag} kr.`,
        isRead: false,
      } as InboxItem)
    }
  }

  for (const mec of game.mecenater ?? []) {
    if (!mec.isActive) continue

    // Mecenat happiness thresholds: unhappy (<30) or very happy (>70)
    if (mec.happiness < 30 && mec.happiness > 20) {
      newInboxItems.push({
        id: `inbox_mec_unhappy_${mec.id}_${nextMatchday}`,
        date: game.currentDate,
        type: InboxItemType.PatronInfluence,
        title: `👥 ${mec.name} är missnöjd`,
        body: `${mec.name} från ${mec.business} uttrycker oro. "Jag hade hoppats på bättre resultat."`,
        isRead: false,
      } as InboxItem)
    }
    if (mec.happiness <= 20) {
      const critId = `inbox_mec_critical_${mec.id}_${game.currentSeason}`
      if (!game.inbox.some(i => i.id === critId)) {
        newInboxItems.push({
          id: critId,
          date: game.currentDate,
          type: InboxItemType.PatronInfluence,
          title: `⚠️ ${mec.name} överväger att lämna`,
          body: `${mec.name} är allvarligt missnöjd. "Om inget förändras snart får ni klara er utan mig."`,
          isRead: false,
        } as InboxItem)
      }
    }
    if (mec.happiness > 70) {
      const happyId = `inbox_mec_happy_${mec.id}_${game.currentSeason}`
      if (!game.inbox.some(i => i.id === happyId)) {
        newInboxItems.push({
          id: happyId,
          date: game.currentDate,
          type: InboxItemType.PatronInfluence,
          title: `🤝 ${mec.name} är nöjd`,
          body: `${mec.name} från ${mec.business} är mycket nöjd med klubbens utveckling. "Det här är precis vad jag ville se."`,
          isRead: false,
        } as InboxItem)
      }
    }
  }

  // New mecenat activated — notify
  for (const mec of game.mecenater ?? []) {
    if (mec.isActive && mec.arrivedSeason === game.currentSeason) {
      const arrivalId = `inbox_mec_new_${mec.id}_${game.currentSeason}`
      if (!game.inbox.some(i => i.id === arrivalId) && !newInboxItems.some(i => i.id === arrivalId)) {
        newInboxItems.push({
          id: arrivalId,
          date: game.currentDate,
          type: InboxItemType.PatronInfluence,
          title: `💰 Ny mecenat: ${mec.name}`,
          body: `${mec.name} (${mec.business}) vill stötta klubben ekonomiskt. Bidrag: ${mec.contribution} kr/månad.`,
          isRead: false,
        } as InboxItem)
      }
    }
  }

  // ── Apply facility project completion bonuses ──────────────────────────
  const updatedFacilityProjects = (game.facilityProjects ?? []).map(p => checkProjectCompletion(p, nextMatchday))
  const oldFacilityProjects = game.facilityProjects ?? []
  let facilityBonusTotal = 0
  for (const up of updatedFacilityProjects) {
    if (up.status === 'completed') {
      const old = oldFacilityProjects.find(o => o.id === up.id)
      if (old && old.status === 'in_progress') {
        facilityBonusTotal += up.facilitiesBonus
      }
    }
  }
  if (facilityBonusTotal > 0) {
    postTransferClubs = postTransferClubs.map(c =>
      c.id === game.managedClubId
        ? { ...c, facilities: Math.min(100, c.facilities + facilityBonusTotal) }
        : c
    )
  }

  let updatedGame: SaveGame = {
    ...game,
    communityStanding: Math.min(100, Math.max(0,
      Math.round((game.communityStanding ?? 50) + csBoost)
    )),
    clubs: postTransferClubs,
    fixtures: strippedFixtures,
    players: postTransferPlayers,
    standings,
    inbox: trimmedInbox,
    currentDate: newDate,
    managedClubPendingLineup: undefined,
    lastCompletedFixtureId: justCompletedManagedFixture?.id ?? game.lastCompletedFixtureId,
    matchWeathers: trimmedWeathers,
    trainingHistory: trimmedTrainingHistory,
    playoffBracket: updatedBracket,
    cupBracket: updatedCupBracket,
    scoutReports: { ...updatedScoutReports, ...rumorScoutReports },
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
    trainerArc: updatedArc,
    previousKommunBidrag: game.localPolitician?.kommunBidrag,
    mecenater: updatedMecenater,
  }

  // Append market value change notifications to inbox
  if (marketValueInbox.length > 0) {
    updatedGame = { ...updatedGame, inbox: [...updatedGame.inbox, ...marketValueInbox] }
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

  // Onboarding step progression (advances after first 3 managed matches)
  const currentOnboarding = updatedGame.onboardingStep ?? 0
  if (currentOnboarding < 4 && justCompletedManagedFixture) {
    updatedGame = { ...updatedGame, onboardingStep: currentOnboarding + 1 }
  }

  return { game: updatedGame, roundPlayed: nextMatchday, seasonEnded: false, pendingEvents: allNewEvents, hasManagedCupMatch: hasManagedCupPending }
}

