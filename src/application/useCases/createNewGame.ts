import type { SaveGame, Patron, LocalPolitician, BoardMember, CommunityActivities, MediaProfile, PersonalInterest } from '../../domain/entities/SaveGame'
import type { Fixture, TeamSelection } from '../../domain/entities/Fixture'
import type { League } from '../../domain/entities/League'
import type { Player } from '../../domain/entities/Player'
import { FixtureStatus, TrainingType, TrainingIntensity, PlayerPosition, ClubStyle } from '../../domain/enums'
import { generateWorld, CLUB_TEMPLATES } from '../../domain/services/worldGenerator'
import { generateYouthTeam } from '../../domain/services/academyService'
import { generateSchedule, buildSeasonCalendar, stampFixturesFromCalendar } from '../../domain/services/scheduleGenerator'
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
import { createJournalist } from '../../domain/services/journalistService'
import { createTrainerArc } from '../../domain/services/trainerArcService'
import { generateBoardObjectives } from '../../domain/services/boardObjectiveService'
import { generateMecenat } from '../../domain/services/mecenatService'
import { generateSupporterGroup } from '../../domain/services/supporterService'
import { generateAICoaches } from '../../domain/services/aiCoachService'
import { generateAssistantCoach } from '../../domain/services/assistantCoachService'
import { updatePlayerAvailability } from '../../domain/services/playerAvailabilityService'
import { generateReferees } from '../../domain/services/refereeService'
import { createSeasonSignature } from '../../domain/services/seasonSignatureService'
import { generateManagerProfile, generateCoachRivalries } from '../../domain/services/managerProfileService'

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
    backstory: profile.backstory,
  }
}

// M33 (textaudit 2026-07-03): V/MP/SD finns i POLITICIAN_PROFILES men saknar
// vikt här — faller till den likformiga default-poolen nedan. Vilka agendor
// de partierna ska vägas mot är en smakfråga för Jacob/Fable, inte en Code-gissning.
const PARTY_AGENDA_WEIGHTS_CNG: Record<string, Array<'youth' | 'inclusion' | 'prestige' | 'savings' | 'infrastructure'>> = {
  S:      ['youth', 'inclusion', 'youth', 'inclusion'],
  M:      ['savings', 'prestige', 'savings', 'prestige'],
  C:      ['youth', 'infrastructure', 'youth'],
  L:      ['infrastructure', 'prestige'],
  KD:     ['youth', 'inclusion'],
  lokalt: ['youth', 'inclusion', 'prestige', 'savings', 'infrastructure'],
}

const CAMPAIGN_PROMISES_CNG: Record<string, string[]> = {
  youth:          ['Satsa på ungdomsidrott i alla skolor', 'Ny idrottshall för ungdomar senast nästa år', 'Fler kommunala idrottsstipendier'],
  inclusion:      ['Idrott ska vara tillgängligt för alla oavsett plånbok', 'Avgiftsfria aktiviteter för barn under 16', 'Integrationsprojekt via föreningslivet'],
  prestige:       ['Sätt orten på kartan med toppklass-idrott', 'Bygga ett kommunalt varumärke vi kan vara stolta över', 'Attrahera regionalt intresse till vår ort'],
  savings:        ['Hålla kommunbudgeten i balans utan nya lån', 'Effektivisera alla kommunala bidrag', 'Varje skattekrona ska synas i resultaten'],
  infrastructure: ['Bygg en modern idrottsanläggning senast 2028', 'Uppgradera kommunens sportinfrastruktur', 'Konstfryst is till alla utomhusanläggningar'],
}

function generatePolitician(rand: () => number, currentSeason: number): LocalPolitician {
  const profile = pickRandom(POLITICIAN_PROFILES, rand)
  // M33 (textaudit 2026-07-03): profile.party är parentiserat ("(S)") för visning
  // i titeln, men PARTY_AGENDA_WEIGHTS_CNG är nyckelad på bara koden ("S") — lagrad
  // party måste vara den strippade formen, annars matchar varken agendavikten här
  // eller scandalService.ts:355 (som själv lägger på parenteser runt party-fältet).
  const partyCode = profile.party.replace(/[()]/g, '')
  const agendaPool = PARTY_AGENDA_WEIGHTS_CNG[partyCode] ?? ['youth', 'inclusion', 'prestige', 'savings', 'infrastructure']
  const agenda = agendaPool[Math.floor(rand() * agendaPool.length)] as 'youth' | 'inclusion' | 'prestige' | 'savings' | 'infrastructure'
  const generosity = agenda === 'savings'
    ? Math.round(20 + rand() * 20)
    : Math.round(50 + rand() * 40)
  const mediaProfiles: MediaProfile[] = ['tystlåten', 'utåtriktad', 'populist']
  const interests: PersonalInterest[] = ['bandy', 'fotboll', 'kultur', 'ingenting']
  const promisePool = CAMPAIGN_PROMISES_CNG[agenda] ?? []
  return {
    name: `${profile.first} ${profile.last}`,
    title: `${profile.title} (${partyCode})`,
    party: partyCode,
    agenda,
    relationship: 50,
    kommunBidrag: 50000 + Math.round(rand() * 100000),
    generosity,
    // M33: new Date().getFullYear() bröt determinismen (samma seed gav olika
    // mandatExpires beroende på VILKET ÅR SPELET KÖRDES) — säsongsbaserat som
    // politicianService.ts:s ersättningsgenerator.
    mandatExpires: currentSeason + 4,
    corruption: Math.round(rand() * 60),
    campaignPromise: promisePool[Math.floor(rand() * promisePool.length)],
    personalInterest: interests[Math.floor(rand() * interests.length)],
    mediaProfile: mediaProfiles[Math.floor(rand() * mediaProfiles.length)],
  }
}

// KF4 (2026-06-21): EN styrelsemodell. Namn/kön/ålder kommer från den managed klubbens
// CLUB_TEMPLATES.board (handskrivna namn vinner). Personlighet slumpas in med samma
// diversitets-logik som tidigare (kassör ≠ ordf, ledamot helst ny). BOARD_PROFILES
// degraderad till ren personlighetspool — dess namn visas inte längre.
function generateBoardMembers(clubId: string, rand: () => number): BoardMember[] {
  const template = CLUB_TEMPLATES.find(t => t.id === clubId)?.board

  // Personlighetspool per roll (från BOARD_PROFILES, namnen ignoreras nu)
  const ordfPers = BOARD_PROFILES.filter(p => p.role === 'ordförande').map(p => p.personality)
  const kassPers = BOARD_PROFILES.filter(p => p.role === 'kassör').map(p => p.personality)
  const ledaPers = BOARD_PROFILES.filter(p => p.role === 'ledamot').map(p => p.personality)

  const chairPersonality = pickRandom(ordfPers, rand)

  // Kassör: annan personlighet än ordförande om möjligt
  const treasurerCandidates = kassPers.filter(p => p !== chairPersonality)
  const treasurerPersonality = treasurerCandidates.length > 0
    ? pickRandom(treasurerCandidates, rand)
    : pickRandom(kassPers, rand)

  // Ledamot: helst en personlighet som inte redan används
  const used = new Set([chairPersonality, treasurerPersonality])
  const diverse = ledaPers.filter(p => !used.has(p))
  const memberPersonality = diverse.length > 0
    ? pickRandom(diverse, rand)
    : pickRandom(ledaPers, rand)

  // Namn/kön/ålder från template. Fallback (defensivt — alla klubbar har template):
  const fallback = { firstName: 'Okänd', lastName: 'Styrelseledamot', age: 55, gender: 'm' as const }
  const chair = template?.chairman ?? fallback
  const treasurer = template?.treasurer ?? fallback
  const member = template?.member ?? fallback

  return [
    { id: 'ordforande-0', firstName: chair.firstName, lastName: chair.lastName, age: chair.age, gender: chair.gender, role: 'ordförande' as const, personality: chairPersonality },
    { id: 'kassor-0', firstName: treasurer.firstName, lastName: treasurer.lastName, age: treasurer.age, gender: treasurer.gender, role: 'kassör' as const, personality: treasurerPersonality },
    { id: 'ledamot-0', firstName: member.firstName, lastName: member.lastName, age: member.age, gender: member.gender, role: 'ledamot' as const, personality: memberPersonality },
  ]
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
  const calendar = buildSeasonCalendar(season)

  const fixtures: Fixture[] = scheduleFixtures.map(sf => {
    const slot = calendar.find(s => s.type === 'league' && s.leagueRound === sf.roundNumber)
    if (!slot) console.error(`[SCHEDULE] No calendar slot for league round ${sf.roundNumber}`)
    return {
      id: `fixture_${season}_r${sf.roundNumber}_${sf.homeClubId}_vs_${sf.awayClubId}`,
      leagueId: `league_${season}`,
      season,
      roundNumber: sf.roundNumber,
      matchday: slot?.matchday ?? sf.roundNumber,
      date: slot?.date,
      tipoffHour: slot?.tipoffHour,
      homeClubId: sf.homeClubId,
      awayClubId: sf.awayClubId,
      status: FixtureStatus.Scheduled,
      homeScore: 0,
      awayScore: 0,
      events: [],
      report: undefined,
      homeLineup: undefined,
      awayLineup: undefined,
      ...(slot?.isAnnandagen ? { isAnnandagen: true } : {}),
      ...(slot?.isNyarsbandy ? { isNyarsbandy: true } : {}),
      ...(slot?.isWindowDeadlineDay ? { isWindowDeadlineDay: true } : {}),
    }
  })

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
  const clubsSortedByRep = [...clubs].sort((a, b) => (b.reputation ?? 50) - (a.reputation ?? 50))
  const { bracket: cupBracket, fixtures: rawCupFixtures } = generateCupFixtures(clubsSortedByRep.map(c => c.id), season, cupRand)
  const cupFixtures = stampFixturesFromCalendar(rawCupFixtures, calendar)

  // Pre-generate weather for round 1 so it's visible before first match
  const round1Fixtures = fixtures.filter(f => f.roundNumber === 1)
  const round1Weathers: MatchWeather[] = round1Fixtures.map((f, i) => {
    const homeClub = clubs.find(c => c.id === f.homeClubId)!
    return generateMatchWeather(season, 1, homeClub, f.id, (input.seed ?? 42) + 50000 + i * 7919)
  })

  const now = new Date().toISOString()
  const saveId = `save_${Date.now()}`

  const allFixtures = [...fixtures, ...cupFixtures]

  // Ensure the player's chosen club doesn't have hasIndoorArena
  const managedMonthlyWages = players
    .filter(p => p.clubId === input.clubId)
    .reduce((sum, p) => sum + p.salary, 0)
  const initialWageBudget = Math.ceil(managedMonthlyWages * 1.1 / 1000) * 1000
  const clubsFixed = clubs.map(c =>
    c.id === input.clubId ? { ...c, hasIndoorArena: false, wageBudget: initialWageBudget } : c
  )

  const managedClub = clubsFixed.find(c => c.id === input.clubId)!
  const managedPlayers = players.filter(p => p.clubId === input.clubId)

  const volunteers = pickUnique(VOLUNTEER_FIRST_NAMES, 6 + Math.floor(rand() * 3), rand)
  const localPaperName = pickRandom(LOCAL_PAPER_NAMES, rand)

  const journalist = createJournalist(localPaperName, rand)
  const initialMecenater = rand() < 0.5 ? [generateMecenat(input.clubId, input.season ?? 2025, rand)] : []
  const patron = generatePatron(managedClub.reputation, managedPlayers, rand)
  const localPolitician = generatePolitician(rand, input.season ?? 2025)
  const board = generateBoardMembers(input.clubId, rand)

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
    id: saveId,
    managerName: input.managerName,
    managedClubId: input.clubId,
    currentDate: `${season}-10-01`,
    currentSeason: season,
    currentMatchday: 0,
    seasonCalendar: calendar,
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
    pendingScreen: null,
    coachMarksSeen: false,
    onboardingComplete: false,
    seasonStartFinances: managedClub.finances,
    financeLog: [],
    storylines: [],
    clubLegends: [],
    trainerArc: createTrainerArc(),
    boardObjectives: generateBoardObjectives(managedClub, { players, clubs: clubsFixed, rivalryHistory: {}, fanMood: 50, currentSeason: season, boardObjectiveHistory: [] }, board, rand),
    boardObjectiveHistory: [],
    onboardingStep: 0,
    mecenater: initialMecenater,
    facilityState: { builtNodeIds: [] },
    previousMarketValues: {},
    scoutReports: {},
    activeScoutAssignment: null,
    scoutBudget: 10,
    pendingEvents: [],
    deferredDecisions: [],
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
    journalist,
    patron,
    localPolitician,
    board,
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
    supporterGroup: generateSupporterGroup(
      input.clubId,
      season,
      players.filter(p => p.clubId === input.clubId),
      input.seed ?? 42,
      CLUB_TEMPLATES.find(t => t.id === input.clubId)?.supporterGroupName,
      'Birger',
    ),
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
    aiCoaches: generateAICoaches(clubs.map(c => c.id), input.seed ?? 42),
    assistantCoach: generateAssistantCoach(saveId),
    averageAttendance: undefined,
    previousAverageAttendance: undefined,
    recentMoments: [],
    referees: generateReferees(),
    refereeRelations: [],
    currentSeasonSignature: createSeasonSignature({ clubs: clubsFixed, scandalHistory: [], currentSeason: season } as unknown as import('../../domain/entities/SaveGame').SaveGame, mulberry32((input.seed ?? 42) + season * 1337 + 99)),
    pastSeasonSignatures: [],
    phaseMarksSeen: [],
    sourceCooldowns: {},
    managerProfile: (() => {
      const base = generateManagerProfile((input.seed ?? 42) + 88001, season)
      const opponentIds = clubs.filter(c => c.id !== input.clubId).map(c => c.id)
      const nameParts = input.managerName.trim().split(/\s+/)
      const firstName = nameParts[0] ?? base.firstName
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : base.lastName
      return {
        ...base, firstName, lastName,
        coachRivalries: generateCoachRivalries(opponentIds, (input.seed ?? 42) + 88002),
        narrativeLog: [{ season, matchday: 0, type: 'arrival' as const, text: `Du tog över ${managedClub.name}. Ingen visste riktigt vad du skulle med det till — inte du heller.` }],
      }
    })(),
    mentorshipHistory: [],
  }

  const playersWithAvailability = updatePlayerAvailability(game)
  return { ...game, players: playersWithAvailability }
}
