import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { Player } from '../../../domain/entities/Player'
import type { Club } from '../../../domain/entities/Club'
import type { Fixture, TeamSelection } from '../../../domain/entities/Fixture'
import type { MatchWeather } from '../../../domain/entities/Weather'
import type { GameEvent } from '../../../domain/entities/GameEvent'
import { FixtureStatus, PlayerPosition, InboxItemType, ClubStyle } from '../../../domain/enums'
import type { FormationType } from '../../../domain/entities/Formation'
import { simulateMatch } from '../../../domain/services/matchSimulator'
import { getRivalry } from '../../../domain/data/rivalries'
import { generateMatchWeather } from '../../../domain/services/weatherService'
import { calcAttendance } from '../../../domain/services/economyService'
import { generatePressConference } from '../../../domain/services/pressConferenceService'
import { mulberry32 } from '../../../domain/utils/random'

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
    firstName: 'Regen', lastName: 'Spelare', age: 20 + Math.floor(rand() * 10),
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

export function generateAiLineup(club: Club, allPlayers: Player[], rand: () => number = Math.random): { selection: TeamSelection; regenPlayers: Player[] } {
  const available = allPlayers.filter(
    p =>
      club.squadPlayerIds.includes(p.id) &&
      !p.isInjured &&
      p.suspensionGamesRemaining <= 0,
  )

  const sorted = [...available].sort((a, b) => b.currentAbility - a.currentAbility)

  const gkPool = sorted.filter(p => p.position === PlayerPosition.Goalkeeper)
  const outfieldPool = sorted.filter(p => p.position !== PlayerPosition.Goalkeeper)

  const starters: Player[] = []
  const regenPlayers: Player[] = []

  if (gkPool.length > 0) {
    starters.push(gkPool[0])
  }

  for (const p of outfieldPool) {
    if (starters.length >= 11) break
    starters.push(p)
  }

  if (starters.length < 11) {
    for (const p of gkPool.slice(1)) {
      if (starters.length >= 11) break
      starters.push(p)
    }
  }

  let regenIndex = 0
  while (starters.length < 11) {
    const regen = createRegenPlayer(club, regenIndex++, rand)
    starters.push(regen)
    regenPlayers.push(regen)
  }

  const starterIds = new Set(starters.map(p => p.id))
  const bench: Player[] = []
  for (const p of sorted) {
    if (bench.length >= 5) break
    if (!starterIds.has(p.id)) {
      bench.push(p)
    }
  }

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

export interface MatchSimResult {
  simulatedFixtures: Fixture[]
  startersThisRound: Set<string>
  benchThisRound: Set<string>
  allRoundRegenPlayers: Player[]
  roundMatchWeathers: MatchWeather[]
  hasManagedCupPending: boolean
  inboxItems: InboxItem[]
  pressEvent: GameEvent | null
}

/**
 * Simulates all fixtures for the current matchday (or skips pending managed fixtures).
 * Returns the simulated fixtures, player tracking sets, weather data, and postpone notifications.
 *
 * @param roundFixtures - All fixtures scheduled (or already completed) for this matchday
 * @param nextMatchday - The matchday number being processed
 * @param baseSeed - Base seed for deterministic randomness
 * @param localRand - Seeded random function
 * @param isPlayoffRound - Whether this is a playoff round
 */
export function simulateRound(
  game: SaveGame,
  roundFixtures: Fixture[],
  nextMatchday: number,
  baseSeed: number,
  localRand: () => number,
  isPlayoffRound: boolean,
): MatchSimResult {
  const simulatedFixtures: Fixture[] = []
  const startersThisRound = new Set<string>()
  const benchThisRound = new Set<string>()
  const allRoundRegenPlayers: Player[] = []
  const roundMatchWeathers: MatchWeather[] = []
  const inboxItems: InboxItem[] = []
  let hasManagedCupPending = false

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
    if (
      !fixture.isCup &&
      fixture.status === FixtureStatus.Scheduled &&
      (fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId) &&
      game.managedClubPendingLineup === undefined
    ) {
      hasManagedCupPending = true
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

    const homeClub = game.clubs.find(c => c.id === fixture.homeClubId)!
    const awayClub = game.clubs.find(c => c.id === fixture.awayClubId)!

    const matchWeather = generateMatchWeather(
      game.currentSeason,
      nextMatchday,
      homeClub,
      fixture.id,
      baseSeed + i * 7919,
    )
    roundMatchWeathers.push(matchWeather)

    if (matchWeather.effects.cancelled) {
      const opponentId = fixture.homeClubId === game.managedClubId ? fixture.awayClubId : fixture.homeClubId
      const opponentClub = game.clubs.find(c => c.id === opponentId)
      const isManaged = fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId
      const postponedFixture: Fixture = { ...fixture, status: FixtureStatus.Postponed }
      simulatedFixtures.push(postponedFixture)
      if (isManaged) {
        inboxItems.push({
          id: `inbox_postpone_${fixture.id}`,
          date: game.currentDate,
          type: InboxItemType.MatchResult,
          title: 'Match inställd',
          body: `Matchen mot ${opponentClub?.name ?? 'motståndaren'} ställdes in på grund av dåliga isförhållanden.`,
          relatedFixtureId: fixture.id,
          isRead: false,
        })
      }
      continue
    }

    let homeLineup: TeamSelection
    let awayLineup: TeamSelection
    let homeRegenPlayers: Player[] = []
    let awayRegenPlayers: Player[] = []

    if (fixture.homeClubId === game.managedClubId && game.managedClubPendingLineup !== undefined) {
      homeLineup = game.managedClubPendingLineup
    } else {
      const { selection, regenPlayers } = generateAiLineup(homeClub, game.players, localRand)
      homeLineup = selection
      homeRegenPlayers = regenPlayers
    }

    if (fixture.awayClubId === game.managedClubId && game.managedClubPendingLineup !== undefined) {
      awayLineup = game.managedClubPendingLineup
    } else {
      const { selection, regenPlayers } = generateAiLineup(awayClub, game.players, localRand)
      awayLineup = selection
      awayRegenPlayers = regenPlayers
    }

    for (const regen of [...homeRegenPlayers, ...awayRegenPlayers]) {
      if (!allRoundRegenPlayers.find(r => r.id === regen.id)) {
        allRoundRegenPlayers.push(regen)
      }
    }

    const matchPlayers = [...game.players, ...homeRegenPlayers, ...awayRegenPlayers]
    const homePlayers = matchPlayers.filter(p => p.clubId === fixture.homeClubId)
    const awayPlayers = matchPlayers.filter(p => p.clubId === fixture.awayClubId)

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

    const homeClubForAttendance = game.clubs.find(c => c.id === fixture.homeClubId)
    const isFinalFixture = fixture.roundNumber > 22 && game.playoffBracket?.final?.fixtures.includes(fixture.id)
    const isSemiFixture = fixture.roundNumber > 22 && game.playoffBracket?.semiFinals.some(s => s.fixtures.includes(fixture.id))
    const attendance = homeClubForAttendance ? calcAttendance({
      club: homeClubForAttendance,
      fanMood: game.fanMood ?? 50,
      position: game.standings.find(s => s.clubId === fixture.homeClubId)?.position ?? 6,
      isKnockout: !!fixture.isKnockout,
      isCup: !!fixture.isCup,
      isDerby: !!rivalry,
      isFinal: isFinalFixture || (fixture.isCup && fixture.roundNumber === 4),
      isSemiFinal: isSemiFixture || (fixture.isCup && fixture.roundNumber === 3),
    }) : undefined
    simulatedFixtures.push({ ...result.fixture, attendance })
  }

  // Generate press conference for the managed club's completed fixture (snabbsim path)
  let pressEvent: GameEvent | null = null
  const managedFixture = simulatedFixtures.find(f =>
    f.status === FixtureStatus.Completed &&
    (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
    f.homeScore != null,
  )
  if (managedFixture) {
    const pressSeed = managedFixture.id.split('').reduce((h, c) => h * 31 + c.charCodeAt(0), 0)
    const pressRand = mulberry32(pressSeed + nextMatchday * 17)
    pressEvent = generatePressConference(managedFixture, game, pressRand)
  }

  return {
    simulatedFixtures,
    startersThisRound,
    benchThisRound,
    allRoundRegenPlayers,
    roundMatchWeathers,
    hasManagedCupPending,
    inboxItems,
    pressEvent,
  }
}
