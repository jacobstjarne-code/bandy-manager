import type { SaveGame, InboxItem, CommunityActivities, StandingRow } from '../../domain/entities/SaveGame'
import type { Player } from '../../domain/entities/Player'
import type { Club } from '../../domain/entities/Club'
import type { Fixture, TeamSelection } from '../../domain/entities/Fixture'
import type { MatchWeather } from '../../domain/entities/Weather'
import { FixtureStatus, MatchEventType, PlayerPosition, InboxItemType, PlayoffStatus, ClubStyle } from '../../domain/enums'
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
import { generateIncomingBids, resolveOutgoingBid } from '../../domain/services/transferService'
import { generatePostAdvanceEvents, generateEvents } from '../../domain/services/eventService'
import { generateMediaHeadlines } from '../../domain/services/mediaService'
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
import { simulateYouthMatch } from '../../domain/services/academyService'
import { handleSeasonEnd } from './seasonEndProcessor'
import { handlePlayoffStart } from './playoffTransition'
import type { AdvanceResult } from './advanceTypes'
import { applyRoundTraining } from './processors/trainingProcessor'
import { applyPlayerStateUpdates } from './processors/playerStateProcessor'
import { updatePlayerMatchStats } from './processors/statsProcessor'

export type { AdvanceResult }


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

  // Determine if this round is a playoff round (cup fixtures have IDs containing 'cup_')
  const isCupRound = roundFixtures.some(f => f.id.includes('cup_'))
  const isPlayoffRound = !isCupRound && game.playoffBracket !== null && nextRound > 22

  // ── Apply training for all clubs this round ────────────────────────────
  const trainingResult = applyRoundTraining(game, baseSeed, nextRound)
  let trainingPlayers = trainingResult.players
  const updatedTrainingHistory = trainingResult.trainingHistory
  newInboxItems.push(...trainingResult.inboxItems)

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
  const playerStateResult = applyPlayerStateUpdates(
    trainingPlayers,
    startersThisRound,
    benchThisRound,
    game,
    managedTacticMods,
    managedFixtureWeather,
    managedClubForTactic,
    baseSeed,
    nextRound,
    simulatedFixtures,
  )
  const updatedPlayers = playerStateResult.updatedPlayers
  const newlyInjured = playerStateResult.newlyInjured
  const newlySuspended = playerStateResult.newlySuspended
  let finalPlayers = updatedPlayers

  // Update seasonStats and careerStats for all players in completed fixtures this round
  // Also detect career milestones for managed club players
  const statsResult = updatePlayerMatchStats(finalPlayers, simulatedFixtures, game, nextRound)
  finalPlayers = statsResult.finalPlayers
  const milestoneInboxItems = statsResult.milestoneInboxItems

  // Push milestone inbox items
  newInboxItems.push(...milestoneInboxItems)

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

    const capacity = club.arenaCapacity ?? Math.round(club.reputation * 80 + 2000)
    const position = standing?.position ?? 8
    const attendanceRate = Math.min(0.95, 0.40 + (fanMood / 100) * 0.45 + (position <= 3 ? 0.10 : 0))
    const ticketPrice = 80 + Math.round((club.reputation ?? 50) * 0.8)
    const baseRevenue = Math.round(capacity * attendanceRate * ticketPrice)

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
    trainingProjects: trainingResult.trainingProjects,
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

