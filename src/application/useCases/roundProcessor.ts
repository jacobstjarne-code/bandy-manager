import type { SaveGame, InboxItem } from '../../domain/entities/SaveGame'
import type { Player } from '../../domain/entities/Player'
import type { Fixture } from '../../domain/entities/Fixture'
import type { MatchWeather } from '../../domain/entities/Weather'
import { FixtureStatus, MatchEventType, InboxItemType, PlayoffStatus, TrainingType, TrainingIntensity } from '../../domain/enums'
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
import { generatePostAdvanceEvents, generateEvents } from '../../domain/services/eventService'
import { generateMediaHeadlines, generateTrendArticles } from '../../domain/services/mediaService'
import { evaluateBoard, generateBoardMessage } from '../../domain/services/boardService'
import { mulberry32 } from '../../domain/utils/random'
import { getRoundDate } from '../../domain/services/scheduleGenerator'
import { handleSeasonEnd } from './seasonEndProcessor'
import { handlePlayoffStart } from './playoffTransition'
import type { AdvanceResult } from './advanceTypes'
import { applyRoundTraining } from './processors/trainingProcessor'
import { applyPlayerStateUpdates } from './processors/playerStateProcessor'
import { updatePlayerMatchStats } from './processors/statsProcessor'
import { applyRoundDevelopment } from '../../domain/services/playerDevelopmentService'
import { processPlayoffRound } from './processors/playoffProcessor'
import { processCupRound } from './processors/cupProcessor'
import { appendFinanceLog } from '../../domain/services/economyService'
import { updatePlayerAvailability, updateLowMoraleDays } from '../../domain/services/playerAvailabilityService'
import { updateTrainerArc } from '../../domain/services/trainerArcService'
import { checkInObjectives } from '../../domain/services/boardObjectiveService'
import { generateTransferRumor } from '../../domain/services/rumorService'
import { checkMidSeasonEvents } from '../../domain/services/midSeasonEventService'
import { generateSocialEvent, generateSilentShoutEvent } from '../../domain/services/mecenatService'
import { processEconomy } from './processors/economyProcessor'
import { processCommunity } from './processors/communityProcessor'
import { processScouts } from './processors/scoutProcessor'
import { processTransferBids, processLoans } from './processors/transferProcessor'
import { processSponsors } from './processors/sponsorProcessor'
import { simulateRound } from './processors/matchSimProcessor'
import { processYouth } from './processors/youthProcessor'

export type { AdvanceResult }




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

  // ── Process active scout assignment + talent search ───────────────────
  const scoutResult = processScouts(game, finalPlayers, nextMatchday, baseSeed, localRand)
  newInboxItems.push(...scoutResult.inboxItems)
  const updatedScoutReports = { ...scoutResult.updatedScoutReports }
  const updatedScoutAssignment = scoutResult.updatedScoutAssignment
  const updatedTalentSearch = scoutResult.updatedTalentSearch
  const updatedTalentResults = scoutResult.updatedTalentResults

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
  newInboxItems.push(...playoffResult.inboxItems)

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

  // ── Economy: wages, match revenue, sponsorship per round ─────────────────
  const economyResult = processEconomy(
    game,
    simulatedFixtures,
    availabilityUpdatedPlayers,
    currentFanMood,
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

  // ── Post-advance events ──────────────────────────────────────────────────
  const newEvents = generatePostAdvanceEvents(preEventGame, newBids, nextMatchday, localRand, justCompletedManagedFixture ?? undefined)
  const communityEvents = generateEvents(
    { ...preEventGame, communityActivities: game.communityActivities },
    nextMatchday,
    localRand,
  )
  const allNewEvents = [...newEvents, ...communityEvents]
  if (simResult.pressEvent) allNewEvents.push(simResult.pressEvent)

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

  // ── Sponsor chain effects, patron inbox, nudges ──────────────────────────
  const sponsorResult = processSponsors(
    game,
    justCompletedManagedFixture ?? null,
    finalPlayers,
    nextMatchday,
    newDate,
    baseSeed,
    localRand,
  )
  newInboxItems.push(...sponsorResult.inboxItems)
  const updatedSponsors = sponsorResult.updatedSponsors

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
  for (const bid of resolvedBids) {
    if (bid.direction !== 'outgoing' || bid.status !== 'accepted') continue
    const wasPending = prevBids.find(b => b.id === bid.id)?.status === 'pending'
    if (!wasPending) continue
    const tmpGame = { ...preEventGame, players: postTransferPlayers, clubs: postTransferClubs }
    const result = executeTransfer(tmpGame, bid)
    postTransferPlayers = result.players
    postTransferClubs = result.clubs
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
  const { csBoost, updatedFacilityProjects, facilityBonusTotal } = communityResult
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
    lineupConfirmedThisRound: false,
    visitedScreensThisRound: [],
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
