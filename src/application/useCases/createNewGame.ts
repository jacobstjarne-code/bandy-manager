import type { SaveGame } from '../../domain/entities/SaveGame'
import type { Fixture, TeamSelection } from '../../domain/entities/Fixture'
import type { League } from '../../domain/entities/League'
import { FixtureStatus, TrainingType, TrainingIntensity, PlayerPosition } from '../../domain/enums'
import { generateWorld } from '../../domain/services/worldGenerator'
import { generateSchedule } from '../../domain/services/scheduleGenerator'
import { calculateStandings } from '../../domain/services/standingsService'
import { generateMatchWeather } from '../../domain/services/weatherService'
import type { MatchWeather } from '../../domain/entities/Weather'

export interface CreateNewGameInput {
  managerName: string
  clubId: string
  season?: number
  seed?: number
}

export function createNewGame(input: CreateNewGameInput): SaveGame {
  const season = input.season ?? 2025

  const { clubs, players } = generateWorld(season, input.seed)

  const scheduleFixtures = generateSchedule(clubs.map(c => c.id), season)

  const fixtures: Fixture[] = scheduleFixtures.map(sf => ({
    id: `fixture_${season}_r${sf.roundNumber}_${sf.homeClubId}_vs_${sf.awayClubId}`,
    leagueId: `league_${season}`,
    season,
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

  const league: League = {
    id: `league_${season}`,
    name: 'Bandyligan',
    season,
    teamIds: clubs.map(c => c.id),
    fixtureIds: fixtures.map(f => f.id),
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
  }

  const standings = calculateStandings(clubs.map(c => c.id), [])

  // Auto-select best valid lineup for the managed club
  const managedClub = clubs.find(c => c.id === input.clubId)!
  const available = players.filter(
    p => p.clubId === input.clubId && !p.isInjured && p.suspensionGamesRemaining <= 0
  )
  const sortedByCA = [...available].sort((a, b) => b.currentAbility - a.currentAbility)
  const gkPool = sortedByCA.filter(p => p.position === PlayerPosition.Goalkeeper)
  const outfieldPool = sortedByCA.filter(p => p.position !== PlayerPosition.Goalkeeper)
  const starters = gkPool.length > 0 ? [gkPool[0]] : []
  for (const p of outfieldPool) {
    if (starters.length >= 11) break
    starters.push(p)
  }
  for (const p of gkPool.slice(1)) {
    if (starters.length >= 11) break
    starters.push(p)
  }
  const starterSet = new Set(starters.map(p => p.id))
  const bench = sortedByCA.filter(p => !starterSet.has(p.id)).slice(0, 5)
  const defaultLineup: TeamSelection = {
    startingPlayerIds: starters.map(p => p.id),
    benchPlayerIds: bench.map(p => p.id),
    captainPlayerId: starters[0]?.id,
    tactic: managedClub.activeTactic,
  }

  // Pre-generate weather for round 1 so it's visible before first match
  const round1Fixtures = fixtures.filter(f => f.roundNumber === 1)
  const round1Weathers: MatchWeather[] = round1Fixtures.map((f, i) => {
    const homeClub = clubs.find(c => c.id === f.homeClubId)!
    return generateMatchWeather(season, 1, homeClub, f.id, (input.seed ?? 42) + 50000 + i * 7919)
  })

  const now = new Date().toISOString()

  const game: SaveGame = {
    id: `save_${Date.now()}`,
    managerName: input.managerName,
    managedClubId: input.clubId,
    currentDate: `${season}-10-01`,
    currentSeason: season,
    clubs,
    players,
    league,
    fixtures,
    standings,
    inbox: [],
    transferState: {
      freeAgents: [],
      pendingOffers: [],
    },
    youthIntakeHistory: [],
    matchWeathers: round1Weathers,
    managedClubPendingLineup: defaultLineup,
    managedClubTraining: { type: TrainingType.Physical, intensity: TrainingIntensity.Normal },
    trainingHistory: [],
    playoffBracket: null,
    seasonSummaries: [],
    showSeasonSummary: false,
    showBoardMeeting: true,
    tutorialSeen: true,
    seasonStartFinances: undefined,
    scoutReports: {},
    activeScoutAssignment: null,
    scoutBudget: 10,
    pendingEvents: [],
    transferBids: [],
    handledContractPlayerIds: [],
    sponsors: [],
    fanMood: 50,
    opponentAnalyses: {},
    activeTalentSearch: null,
    talentSearchResults: [],
    version: '0.1.0',
    lastSavedAt: now,
  }

  return game
}
