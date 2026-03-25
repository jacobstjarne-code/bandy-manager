import type { SaveGame, InboxItem } from '../../domain/entities/SaveGame'
import type { Player } from '../../domain/entities/Player'
import type { Club } from '../../domain/entities/Club'
import type { Fixture, TeamSelection } from '../../domain/entities/Fixture'
import type { MatchWeather } from '../../domain/entities/Weather'
import { FixtureStatus, MatchEventType, PlayerPosition, InboxItemType, TrainingType, TrainingIntensity, PlayoffStatus } from '../../domain/enums'
import { simulateMatch } from '../../domain/services/matchSimulator'
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
  createBoardFeedbackItem,
  createTrainingItem,
} from '../../domain/services/inboxService'
import { processScoutAssignment } from '../../domain/services/scoutingService'
import type { ScoutReport, ScoutAssignment } from '../../domain/entities/Scouting'
import { generateSeasonSummary } from '../../domain/services/seasonSummaryService'

export interface AdvanceResult {
  game: SaveGame
  roundPlayed: number | null
  seasonEnded: boolean
  playoffStarted?: boolean
}

// Simple mulberry32 for local random needs
function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return function (): number {
    s += 0x6d2b79f5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
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
    tactic: club.activeTactic,
  }
}

function advanceDate(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function advanceToNextEvent(game: SaveGame, seed?: number): AdvanceResult {
  const scheduledFixtures = game.fixtures.filter(f => f.status === FixtureStatus.Scheduled)

  // No scheduled fixtures — decide what comes next
  if (scheduledFixtures.length === 0) {
    if (!game.playoffBracket) {
      return handlePlayoffStart(game, seed)
    } else if (game.playoffBracket.status === PlayoffStatus.Completed) {
      return handleSeasonEnd(game, seed)
    }
    // Bracket exists but incomplete with no fixtures — shouldn't happen normally
    return handleSeasonEnd(game, seed)
  }

  // Find next round
  const nextRound = Math.min(...scheduledFixtures.map(f => f.roundNumber))
  // Include already-completed (live-played) fixtures so they are not re-simulated
  const roundFixtures = game.fixtures.filter(f =>
    f.roundNumber === nextRound &&
    (f.status === FixtureStatus.Scheduled || f.status === FixtureStatus.Completed)
  )

  const baseSeed = seed ?? (nextRound * 1000 + game.currentSeason * 7)
  const localRand = mulberry32(baseSeed + 9999)

  // Collect player IDs who played in this round (for fitness updates)
  const startersThisRound = new Set<string>()
  const benchThisRound = new Set<string>()

  const simulatedFixtures: Fixture[] = []
  const roundMatchWeathers: MatchWeather[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newInboxItems: any[] = []

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
    const result = simulateMatch({
      fixture,
      homeLineup,
      awayLineup,
      homePlayers,
      awayPlayers,
      homeAdvantage: 0.05,
      seed: baseSeed + i,
      weather: matchWeather.weather,
      isPlayoff: isPlayoffRound,
      rivalry: rivalry ?? undefined,
    })

    simulatedFixtures.push(result.fixture)
  }

  // Build updated fixtures list (mutable for cancelling decided series)
  const simulatedIds = new Set(simulatedFixtures.map(f => f.id))
  let allFixtures: Fixture[] = game.fixtures.map(f =>
    simulatedIds.has(f.id) ? (simulatedFixtures.find(sf => sf.id === f.id) ?? f) : f,
  )

  // Update standings
  const completedFixtures = allFixtures.filter(f => f.status === FixtureStatus.Completed)
  const standings = calculateStandings(game.league.teamIds, completedFixtures)

  // Snapshot injury state before updates (for recovery notifications)
  const injuredBeforeRound = new Set(
    trainingPlayers.filter(p => p.isInjured && p.clubId === game.managedClubId).map(p => p.id)
  )

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
      const fitnessLoss = 15 + Math.floor(localRand() * 10)
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
    const injuryChance = 0.06 * (proneFactor + 0.3) * fatigueFactor

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

  // Advance date by 7 days per round
  const newDate = advanceDate(game.currentDate, 7)

  const justCompletedManagedFixture = simulatedFixtures.find(
    f => (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
         f.status === FixtureStatus.Completed
  )

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

    // Check managed club elimination in this round
    const allSeriesAfter = [
      ...updatedBracket.quarterFinals,
      ...updatedBracket.semiFinals,
      ...(updatedBracket.final ? [updatedBracket.final] : []),
    ]
    for (const series of allSeriesAfter) {
      const managedLost = series.loserId === game.managedClubId
      const decidedThisRound = completedThisRound.some(f => series.fixtures.includes(f.id)) && isSeriesDecided(series)
      if (managedLost && decidedThisRound) {
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

  // Merge new playoff fixtures
  const finalAllFixtures = [...allFixtures, ...bracketNewFixtures]

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

  const updatedGame: SaveGame = {
    ...game,
    fixtures: finalAllFixtures,
    players: finalPlayers,
    standings,
    inbox: [...game.inbox, ...newInboxItems],
    currentDate: newDate,
    managedClubPendingLineup: undefined,
    lastCompletedFixtureId: justCompletedManagedFixture?.id ?? game.lastCompletedFixtureId,
    matchWeathers: [...(game.matchWeathers ?? []), ...roundMatchWeathers],
    trainingHistory: updatedTrainingHistory,
    playoffBracket: updatedBracket,
    scoutReports: updatedScoutReports,
    activeScoutAssignment: updatedScoutAssignment,
    scoutBudget: game.scoutBudget ?? 10,
  }

  return { game: updatedGame, roundPlayed: nextRound, seasonEnded: false }
}

function getPlayerRating(playerId: string, fixtures: Fixture[]): number | null {
  for (const fixture of fixtures) {
    if (fixture.report?.playerRatings[playerId] !== undefined) {
      return fixture.report.playerRatings[playerId]
    }
  }
  return null
}

function handlePlayoffStart(game: SaveGame, seed?: number): AdvanceResult {
  // Calculate standings from regular season completed fixtures
  const completedFixtures = game.fixtures.filter(f => f.status === FixtureStatus.Completed)
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
  void seed
  return { game: updatedGame, roundPlayed: null, seasonEnded: false, playoffStarted: true }
}

function handleSeasonEnd(game: SaveGame, seed?: number): AdvanceResult {
  const seasonSummary = generateSeasonSummary(game)

  const allFixtures = game.fixtures
  const completedFixtures = allFixtures.filter(f => f.status === FixtureStatus.Completed)
  const standings = calculateStandings(game.league.teamIds, completedFixtures)

  const newInboxItems = []

  // Board feedback for managed club
  const managedClubStanding = standings.find(s => s.clubId === game.managedClubId)
  if (managedClubStanding) {
    const managedClub = game.clubs.find(c => c.id === game.managedClubId)
    if (managedClub) {
      newInboxItems.push(
        createBoardFeedbackItem(
          managedClub,
          managedClubStanding,
          game.clubs.length,
          game.currentDate,
        ),
      )
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

  // Generate new schedule for next season
  const newScheduleFixtures = generateSchedule(updatedClubs.map(c => c.id), nextSeason)
  const newFixtures = newScheduleFixtures.map(sf => ({
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

  const newLeague = {
    ...game.league,
    id: `league_${nextSeason}`,
    season: nextSeason,
    fixtureIds: newFixtures.map(f => f.id),
  }

  // Reset player season stats, recover fitness
  const allPlayers = [...game.players, ...youthPlayers]
  const resetPlayers = allPlayers.map(player => ({
    ...player,
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

  const updatedGame: SaveGame = {
    ...game,
    currentSeason: nextSeason,
    currentDate: `${nextSeason}-10-01`,
    clubs: updatedClubs,
    players: resetPlayers,
    fixtures: newFixtures,
    league: newLeague,
    standings: calculateStandings(updatedClubs.map(c => c.id), []),
    inbox: [...game.inbox, ...newInboxItems],
    youthIntakeHistory: youthRecords,
    managedClubPendingLineup: undefined,
    matchWeathers: [],
    trainingHistory: [],
    playoffBracket: null,
    seasonSummaries: [...(game.seasonSummaries ?? []), seasonSummary],
    showSeasonSummary: true,
    seasonStartFinances: updatedClubs.find(c => c.id === game.managedClubId)?.finances,
    scoutReports: game.scoutReports ?? {},
    activeScoutAssignment: null,
    scoutBudget: 10,
  }

  return { game: updatedGame, roundPlayed: null, seasonEnded: true }
}
