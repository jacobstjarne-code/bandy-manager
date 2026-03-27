import type { SaveGame, Patron, LocalPolitician, BoardMember, CommunityActivities } from '../../domain/entities/SaveGame'
import type { Fixture, TeamSelection } from '../../domain/entities/Fixture'
import type { League } from '../../domain/entities/League'
import type { Player } from '../../domain/entities/Player'
import { FixtureStatus, TrainingType, TrainingIntensity, PlayerPosition, ClubStyle } from '../../domain/enums'
import { generateWorld } from '../../domain/services/worldGenerator'
import { generateYouthTeam } from '../../domain/services/academyService'
import { generateSchedule } from '../../domain/services/scheduleGenerator'
import { calculateStandings } from '../../domain/services/standingsService'
import { generateMatchWeather } from '../../domain/services/weatherService'
import type { MatchWeather } from '../../domain/entities/Weather'
import { generateCupFixtures } from '../../domain/services/cupService'
import { mulberry32 } from '../../domain/utils/random'
import { PATRON_PROFILES, PATRON_RELATIONS } from '../../domain/data/patronData'
import { FUNCTIONARY_TEMPLATES } from '../../domain/data/functionaries'
import { POLITICIAN_PROFILES } from '../../domain/data/politicianData'
import { BOARD_PROFILES } from '../../domain/data/boardData'
import { VOLUNTEER_FIRST_NAMES, LOCAL_PAPER_NAMES } from '../../domain/data/communityNames'
import { initCharacterPlayers } from '../../domain/services/characterPlayerService'

function pickRandom<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}

function pickUnique<T>(arr: T[], count: number, rand: () => number): T[] {
  const shuffled = [...arr].sort(() => rand() - 0.5)
  return shuffled.slice(0, count)
}

function generatePatron(
  clubReputation: number,
  managedPlayers: Player[],
  rand: () => number,
): Patron | undefined {
  if (clubReputation < 35 || rand() > 0.75) return undefined
  const profile = pickRandom(PATRON_PROFILES, rand)
  const influence = 30 + Math.floor(rand() * 60)
  const contribution = Math.round(
    (influence * 500 + clubReputation * 300 + rand() * 30000) / 1000
  ) * 1000
  const lowAbilityPlayers = managedPlayers.filter(p => p.currentAbility < 50)
  const favPlayer = rand() < 0.40 && lowAbilityPlayers.length > 0
    ? pickRandom(lowAbilityPlayers, rand)
    : undefined
  const relation = favPlayer ? pickRandom(PATRON_RELATIONS, rand) : undefined
  const wantsStyle = rand() < 0.50
    ? (rand() < 0.5 ? ClubStyle.Attacking : ClubStyle.Physical)
    : undefined

  return {
    name: `${profile.first} ${profile.last}`,
    business: profile.biz,
    influence,
    happiness: 60,
    contribution,
    favoritePlayerId: favPlayer?.id,
    favoriteRelation: relation,
    wantsStyle,
    isActive: true,
    hasBeenWarned: false,
  }
}

function generatePolitician(rand: () => number): LocalPolitician {
  const profile = pickRandom(POLITICIAN_PROFILES, rand)
  const agendas: Array<'youth' | 'inclusion' | 'prestige' | 'savings' | 'infrastructure'> =
    ['youth', 'inclusion', 'prestige', 'savings', 'infrastructure']
  const agenda = pickRandom(agendas, rand)
  const generosity = agenda === 'savings'
    ? Math.round(20 + rand() * 20)
    : Math.round(50 + rand() * 40)
  return {
    name: `${profile.first} ${profile.last}`,
    title: `${profile.title} ${profile.party}`,
    party: profile.party,
    agenda,
    relationship: 50,
    kommunBidrag: 50000 + Math.round(rand() * 100000),
    generosity,
    mandatExpires: (new Date().getFullYear()) + 4,
    corruption: Math.round(rand() * 60),
  }
}

function generateBoardMembers(rand: () => number): BoardMember[] {
  const ordforanden = BOARD_PROFILES.filter(p => p.role === 'ordförande')
  const kassorer = BOARD_PROFILES.filter(p => p.role === 'kassör')
  const ledamoter = BOARD_PROFILES.filter(p => p.role === 'ledamot')

  const chair = pickRandom(ordforanden, rand)
  const treasurer = pickRandom(kassorer, rand)
  const memberCount = 1 + Math.floor(rand() * 3)
  const members = pickUnique(ledamoter, memberCount, rand)

  return [chair, treasurer, ...members].map(p => ({
    name: `${p.first} ${p.last}`,
    role: p.role,
    personality: p.personality,
  }))
}

export interface CreateNewGameInput {
  managerName: string
  clubId: string
  season?: number
  seed?: number
}


export function createNewGame(input: CreateNewGameInput): SaveGame {
  const season = input.season ?? 2026
  const rand = mulberry32((input.seed ?? 42) + 12345)

  const { clubs, players: rawPlayers } = generateWorld(season, input.seed)
  const players = initCharacterPlayers(rawPlayers, input.seed ?? 42)

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
  }

  const standings = calculateStandings(clubs.map(c => c.id), [])

  // Auto-select best valid lineup for the managed club
  const managedClubForLineup = clubs.find(c => c.id === input.clubId)!
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
    tactic: managedClubForLineup.activeTactic,
  }

  // Generate cup fixtures
  const cupSeed = (input.seed ?? 42) + 99999
  const cupRand = mulberry32(cupSeed)
  const { bracket: cupBracket, fixtures: cupFixtures } = generateCupFixtures(clubs.map(c => c.id), season, cupRand)

  // Pre-generate weather for round 1 so it's visible before first match
  const round1Fixtures = fixtures.filter(f => f.roundNumber === 1)
  const round1Weathers: MatchWeather[] = round1Fixtures.map((f, i) => {
    const homeClub = clubs.find(c => c.id === f.homeClubId)!
    return generateMatchWeather(season, 1, homeClub, f.id, (input.seed ?? 42) + 50000 + i * 7919)
  })

  const now = new Date().toISOString()

  const allFixtures = [...fixtures, ...cupFixtures]

  // Ensure the player's chosen club doesn't have hasIndoorArena
  const clubsFixed = clubs.map(c =>
    c.id === input.clubId ? { ...c, hasIndoorArena: false } : c
  )

  const managedClub = clubsFixed.find(c => c.id === input.clubId)!
  const managedPlayers = players.filter(p => p.clubId === input.clubId)

  const volunteers = pickUnique(VOLUNTEER_FIRST_NAMES, 6 + Math.floor(rand() * 3), rand)
  const localPaperName = pickRandom(LOCAL_PAPER_NAMES, rand)

  const patron = generatePatron(managedClub.reputation, managedPlayers, rand)
  const localPolitician = generatePolitician(rand)
  const boardPersonalities = generateBoardMembers(rand)

  const communityActivities: CommunityActivities = {
    kiosk: 'none',
    lottery: 'none',
    bandyplay: false,
    functionaries: false,
    julmarknad: false,
    bandySchool: false,
    socialMedia: false,
    vipTent: false,
  }

  // Generate ICA Maxi sponsor if reputation > 40 (50% chance)
  const icaMaxiSponsors: import('../../domain/entities/SaveGame').Sponsor[] = []
  if (managedClub.reputation > 40 && rand() < 0.5) {
    const shortName = managedClub.shortName || managedClub.name.split(' ')[0]
    icaMaxiSponsors.push({
      id: `sponsor_icamaxi_start`,
      name: `ICA Maxi ${shortName}`,
      category: 'Dagligvaruhandel',
      weeklyIncome: 3000 + Math.round(rand() * 2000),
      contractRounds: 8,
      signedRound: 0,
      icaMaxi: true,
    })
  }

  const game: SaveGame = {
    id: `save_${Date.now()}`,
    managerName: input.managerName,
    managedClubId: input.clubId,
    currentDate: `${season}-10-01`,
    currentSeason: season,
    clubs: clubsFixed,
    players,
    league,
    fixtures: allFixtures,
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
    cupBracket,
    seasonSummaries: [],
    showSeasonSummary: false,
    showBoardMeeting: true,
    tutorialSeen: true,
    seasonStartFinances: managedClub.finances,
    scoutReports: {},
    activeScoutAssignment: null,
    scoutBudget: 10,
    pendingEvents: [],
    transferBids: [],
    handledContractPlayerIds: [],
    sponsors: icaMaxiSponsors,
    fanMood: 50,
    boardPatience: 70,
    consecutiveFailures: 0,
    rivalryHistory: {},
    opponentAnalyses: {},
    activeTalentSearch: null,
    talentSearchResults: [],
    doctorQuestionsUsed: 0,
    communityActivities,
    volunteers,
    localPaperName,
    patron,
    localPolitician,
    boardPersonalities,
    hallDebateCount: 0,
    lastHallDebateRound: 0,
    youthTeam: generateYouthTeam(managedClub, 'basic', season, (input.seed ?? 42) + 77777),
    academyLevel: 'basic',
    mentorships: [],
    loanDeals: [],
    version: '0.1.0',
    lastSavedAt: now,
    // V0.9 fields
    communityStanding: 50,
    journalistRelationship: 50,
    sponsorNetworkMood: 70,
    licenseWarningCount: 0,
    namedCharacters: [
      ...(() => {
        let s = (input.seed ?? 1) + 99991
        function rand() { s = ((s * 1664525 + 1013904223) | 0) >>> 0; return s / 0xffffffff }
        return FUNCTIONARY_TEMPLATES.map((t, i) => ({
          id: `func_${i}`,
          name: t.namePool[Math.floor(rand() * t.namePool.length)],
          role: t.role,
          age: 45 + Math.floor(rand() * 25),
          isAlive: true,
          morale: 60 + Math.floor(rand() * 30),
        }))
      })(),
    ],
  }

  return game
}
