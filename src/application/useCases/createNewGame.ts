import type { SaveGame } from '../../domain/entities/SaveGame'
import type { Fixture } from '../../domain/entities/Fixture'
import type { League } from '../../domain/entities/League'
import { FixtureStatus, TrainingType, TrainingIntensity } from '../../domain/enums'
import { generateWorld } from '../../domain/services/worldGenerator'
import { generateSchedule, buildSeasonCalendar, stampFixturesFromCalendar } from '../../domain/services/scheduleGenerator'
import { calculateStandings } from '../../domain/services/standingsService'
import { generateMatchWeather } from '../../domain/services/weatherService'
import type { MatchWeather } from '../../domain/entities/Weather'
import { generateCupFixtures } from '../../domain/services/cupService'
import { mulberry32 } from '../../domain/utils/random'
import { initCharacterPlayers } from '../../domain/services/characterPlayerService'
import { CURRENT_RULE_VERSION } from '../../domain/data/ruleVersion'
import { createTrainerArc } from '../../domain/services/trainerArcService'
import { generateAICoaches } from '../../domain/services/aiCoachService'
import { generateAssistantCoach } from '../../domain/services/assistantCoachService'
import { updatePlayerAvailability } from '../../domain/services/playerAvailabilityService'
import { generateReferees } from '../../domain/services/refereeService'
import { createSeasonSignature } from '../../domain/services/seasonSignatureService'
import { generateManagerProfile, generateCoachRivalries } from '../../domain/services/managerProfileService'
import { calculateWageBudget } from '../../domain/services/wageBudgetService'
// O13 (DOM_TRANARMARKNADEN_2026-08-26): det klubbspecifika steget är utbrutet
// till setupManagedClub.ts så att tränarmarknadens klubbyte kan köra EXAKT
// samma generering mot en redan existerande värld. rand-ordningen där är
// ordagrant den som stod här — se den filens huvud.
import { buildDefaultLineup, generateManagedClubEntourage, generateNamedCharacters, stampObjectiveStartValues } from './setupManagedClub'

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
  const defaultLineup = buildDefaultLineup(input.clubId, players, managedClubForLineup)

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
  const initialWageBudget = calculateWageBudget(players, input.clubId)
  const clubsFixed = clubs.map(c =>
    c.id === input.clubId ? { ...c, hasIndoorArena: false, wageBudget: initialWageBudget } : c
  )

  const managedClub = clubsFixed.find(c => c.id === input.clubId)!

  // O13: allt klubbspecifikt genereras nu av setupManagedClub.ts, i EXAKT den
  // ordning rand konsumerades här tidigare. Enda skillnaden är att youthTeam
  // och supporterGroup — som har egna seeds och därför inte rör rand-strömmen
  // — nu produceras i samma anrop i stället för nere i objektlitteralen.
  const entourage = generateManagedClubEntourage({
    clubId: input.clubId,
    season,
    // Se ManagedClubEntourageInput.civicSeason: `input.season ?? 2025` är
    // createNewGames egen, bevarade egenhet — inte samma default som `season`.
    civicSeason: input.season ?? 2025,
    clubs: clubsFixed,
    players,
    rand,
    entourageSeed: input.seed ?? 42,
    objectiveContext: { players, clubs: clubsFixed, rivalryHistory: {}, fanMood: 50, currentSeason: season, boardObjectiveHistory: [] },
  })

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
    lastPlayoffElimination: null,
    cupBracket,
    seasonSummaries: [],
    pendingScreen: null,
    coachMarksSeen: false,
    onboardingComplete: false,
    onboardingScreen: 'arrival',
    seasonStartFinances: managedClub.finances,
    // A-H1: fryser säsongens boardExpectation vid start — se SaveGame.ts.
    seasonStartBoardExpectation: managedClub.boardExpectation,
    // Framgångskurvan steg 3 fix (2026-08-28): nollställda säsongsräknare,
    // se SaveGame.ts's kommentar på seasonContractExtensionCount.
    seasonContractExtensionCount: 0,
    seasonNetTransferSpend: 0,
    financeLog: [],
    storylines: [],
    clubLegends: [],
    trainerArc: createTrainerArc(),
    boardObjectives: entourage.boardObjectives,
    boardObjectiveHistory: [],
    aiTransferLog: [],
    onboardingStep: 0,
    mecenater: entourage.mecenater,
    facilityState: { builtNodeIds: [] },
    previousMarketValues: {},
    scoutReports: {},
    activeScoutAssignment: null,
    scoutBudget: 10,
    pendingEvents: [],
    deferredDecisions: [],
    transferBids: [],
    handledContractPlayerIds: [],
    sponsors: entourage.sponsors,
    fanMood: 50,
    boardPatience: 70,
    consecutiveFailures: 0,
    rivalryHistory: {},
    opponentAnalyses: {},
    activeTalentSearch: null,
    talentSearchResults: [],
    doctorQuestionsUsed: 0,
    communityActivities: entourage.communityActivities,
    // ANSPRÅK 4, spak 3: staleness-klockan startar tom — inga aktiviteter är
    // igång vid tillträdet (setupManagedClub.ts sätter alla till av).
    communityActivitiesSince: {},
    volunteers: entourage.volunteers,
    localPaperName: entourage.localPaperName,
    journalist: entourage.journalist,
    doctor: entourage.doctor,
    patron: entourage.patron,
    localPolitician: entourage.localPolitician,
    board: entourage.board,
    youthTeam: entourage.youthTeam,
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
    supporterGroup: entourage.supporterGroup,
    namedCharacters: generateNamedCharacters((input.seed ?? 1) + 99991),
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
        diary: [{ season, matchday: 0, type: 'arrival' as const, text: `Du tog över ${managedClub.name}. Ingen visste riktigt vad du skulle med det till — inte du heller.` }],
      }
    })(),
    mentorshipHistory: [],
  }

  const playersWithAvailability = updatePlayerAvailability(game)
  const finalGame: SaveGame = { ...game, players: playersWithAvailability }

  // SLUTTEST 2026-08-08 (punkt 4b): se samma fix + rotorsak i
  // seasonEndProcessor.ts — currentValue måste fyllas i här också, annars
  // ljuger ankomstscenen (spelets FÖRSTA skärm) om nivåmålens läge redan
  // från säsong 1.
  return {
    ...finalGame,
    // SLUTTEST RUNDA 3 (punkt 3): startValue satt till SAMMA värde som den
    // initiala currentValue — "läget när målet sattes" är per definition läget
    // just nu, vid generering. Krävs av computeProgressPct (BoardObjectivesList.tsx)
    // för lägre-är-bättre-mål.
    boardObjectives: stampObjectiveStartValues(finalGame.boardObjectives ?? [], finalGame),
    // K4 (SLUTTEST-KÖN, 2026-08-17): faktiskt använt seed (samma värde som
    // generateWorld/initCharacterPlayers fick), inte input.seed rakt av —
    // om den någonsin blir undefined ska fältet spegla defaulten 42, inte
    // "okänt". O13 (2026-08-29): fältet HAR nu sin första konsument —
    // switchManagedClub.ts läser det för att generera den nya klubbens folk
    // deterministiskt utan att röra världen.
    worldSeed: input.seed ?? 42,
    ruleVersion: CURRENT_RULE_VERSION,
  }
}
