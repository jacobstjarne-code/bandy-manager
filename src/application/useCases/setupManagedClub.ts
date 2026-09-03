/**
 * O13 / M11 — TRÄNARMARKNADEN (DOM_TRANARMARKNADEN_2026-08-26.md), sömmen.
 *
 * Domens enda verkliga nybyggnad: "att byta `managedClubId` utan att generera
 * en ny värld". Den var omöjlig eftersom allt klubbspecifikt (styrelse,
 * patron, kommunalråd, journalist, doktor, mecenat, klack, volontärer,
 * lokaltidning, akademi, sponsorer, styrelsemål, startelva) genererades
 * inuti `createNewGame` — i samma svep som världen. Att byta klubb betydde
 * därför att kasta världen.
 *
 * Den här filen bryter ut EXAKT det klubbspecifika steget, oförändrat, så att
 * det kan köras två gånger i en karriär: en gång vid `createNewGame` (ny
 * värld + ny klubb) och en gång vid `switchManagedClub` (BEFINTLIG värld, ny
 * klubb). Ordningen som `rand` konsumeras i är bevarad ordagrant från
 * createNewGame — den ordningen ÄR determinismkontraktet (samma seed ⇒ samma
 * karriär), och en omkastning här hade tyst ändrat varje befintlig
 * regressions-seed i projektet.
 *
 * Varför `worldSeed` (K4, 19 aug) är den här funktionens konsument, och inte
 * `generateWorld`: världen ska INTE regenereras vid ett klubbyte. `generateWorld`
 * bygger klubbar och spelare från grunden — att köra den igen hade raderat
 * spelarutveckling, transfers och tabellhistorik, alltså precis det domen
 * säger är hela värdet ("Inte en ny värld"). `worldSeed` läses och BEVARAS
 * genom bytet, och används som deterministisk grund för den NYA klubbens
 * folk — inte för att återskapa världen.
 */

import type {
  Patron, LocalPolitician, BoardMember, CommunityActivities, MediaProfile,
  PersonalInterest, Sponsor, Mecenat, SupporterGroup, BoardObjective, SaveGame,
  NamedCharacter,
} from '../../domain/entities/SaveGame'
import type { Club } from '../../domain/entities/Club'
import type { Player } from '../../domain/entities/Player'
import type { TeamSelection } from '../../domain/entities/Fixture'
import type { YouthTeam } from '../../domain/entities/Academy'
import { PlayerPosition, ClubStyle } from '../../domain/enums'
import { CLUB_TEMPLATES } from '../../domain/services/worldGenerator'
import { generateYouthTeam } from '../../domain/services/academyService'
import { PATRON_PROFILES, PATRON_RELATIONS } from '../../domain/data/patronData'
import { POLITICIAN_PROFILES } from '../../domain/data/politicianData'
import { BOARD_PROFILES } from '../../domain/data/boardData'
import { VOLUNTEER_FIRST_NAMES, LOCAL_PAPER_NAMES } from '../../domain/data/communityNames'
import { FUNCTIONARY_TEMPLATES } from '../../domain/data/functionaries'
import { createJournalist } from '../../domain/services/journalistService'
import { createDoctor } from '../../domain/data/injuryDoctorText'
import { generateBoardObjectives, evaluateObjective, type BoardObjectiveGameContext } from '../../domain/services/boardObjectiveService'
import { generateMecenat } from '../../domain/services/mecenatService'
import { generateSupporterGroup } from '../../domain/services/supporterService'

export function pickRandom<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}

export function pickUnique<T>(arr: T[], count: number, rand: () => number): T[] {
  const shuffled = [...arr].sort(() => rand() - 0.5)
  return shuffled.slice(0, count)
}

export function generatePatron(
  clubReputation: number,
  managedPlayers: Player[],
  rand: () => number,
  season: number,
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
    // DOM_PATRON_MECENAT_LAST_2026-09-02.md — samma id-mönster som Mecenat
    // (mecenat_${namn}_${säsong}).
    id: `patron_${profile.first.toLowerCase()}_${season}`,
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

// M33 (textaudit 2026-07-03, profilering klar 2026-07-05): V/MP/SD fanns i
// POLITICIAN_PROFILES men saknade vikt här — föll till den likformiga
// default-poolen. Jacobs beslut: V → inclusion (tyngst) + infrastructure,
// MP → infrastructure + inclusion, SD → prestige + savings. Samma vikter
// som PARTY_AGENDA_WEIGHTS i politicianService.ts (duplicerad struktur,
// se den filens kommentar om de två separata generatorerna).
const PARTY_AGENDA_WEIGHTS_CNG: Record<string, Array<'youth' | 'inclusion' | 'prestige' | 'savings' | 'infrastructure'>> = {
  S:      ['youth', 'inclusion', 'youth', 'inclusion'],
  M:      ['savings', 'prestige', 'savings', 'prestige'],
  C:      ['youth', 'infrastructure', 'youth'],
  L:      ['infrastructure', 'prestige'],
  KD:     ['youth', 'inclusion'],
  V:      ['inclusion', 'infrastructure', 'inclusion'],
  MP:     ['infrastructure', 'inclusion'],
  SD:     ['prestige', 'savings'],
  lokalt: ['youth', 'inclusion', 'prestige', 'savings', 'infrastructure'],
}

const CAMPAIGN_PROMISES_CNG: Record<string, string[]> = {
  youth:          ['Satsa på ungdomsidrott i alla skolor', 'Ny idrottshall för ungdomar senast nästa år', 'Fler kommunala idrottsstipendier'],
  inclusion:      ['Idrott ska vara tillgängligt för alla oavsett plånbok', 'Avgiftsfria aktiviteter för barn under 16', 'Integrationsprojekt via föreningslivet'],
  prestige:       ['Sätt orten på kartan med toppklass-idrott', 'Bygga ett kommunalt varumärke vi kan vara stolta över', 'Attrahera regionalt intresse till vår ort'],
  savings:        ['Hålla kommunbudgeten i balans utan nya lån', 'Effektivisera alla kommunala bidrag', 'Varje skattekrona ska synas i resultaten'],
  infrastructure: ['Bygg en modern idrottsanläggning senast 2028', 'Uppgradera kommunens sportinfrastruktur', 'Konstfryst is till alla utomhusanläggningar'],
}

export function generatePolitician(rand: () => number, currentSeason: number): LocalPolitician {
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
export function generateBoardMembers(clubId: string, rand: () => number): BoardMember[] {
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

/**
 * Bästa giltiga startelva ur en trupp: en målvakt + tio utespelare efter
 * currentAbility, femmannabänk. Identisk med `createNewGame`s tidigare
 * inline-block — flyttad hit så klubbytet får samma startelva-kvalitet som
 * en ny karriär i stället för en egen, avvikande variant.
 */
export function buildDefaultLineup(clubId: string, players: Player[], club: Club): TeamSelection {
  const available = players.filter(
    p => p.clubId === clubId && !p.isInjured && p.suspensionGamesRemaining <= 0
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
  return {
    startingPlayerIds: starters.map(p => p.id),
    benchPlayerIds: bench.map(p => p.id),
    captainPlayerId: starters[0]?.id,
    tactic: club.activeTactic,
  }
}

export interface ManagedClubEntourageInput {
  clubId: string
  /** Säsongen akademi och klack genereras för. */
  season: number
  /**
   * Säsongen mecenat och kommunalråd genereras för. Skild från `season` för
   * att BEVARA en befintlig egenhet i createNewGame: där skickades
   * `input.season ?? 2025` till mecenat/kommunalråd men `input.season ?? 2026`
   * (via lokala `season`) till akademi/klack. Skillnaden syns bara när
   * anroparen utelämnar säsongen (stresstest, enhetstester) och påverkar
   * kommunalrådets `mandatExpires`. Att "städa" den här hade tyst ändrat
   * varje befintligt regressions-seed i projektet — den bevaras därför
   * ordagrant och rapporteras i stället.
   */
  civicSeason: number
  /** Klubblistan EFTER wageBudget/arena-justeringar — patron läser reputation här. */
  clubs: Club[]
  players: Player[]
  /**
   * Delas med anroparen och konsumeras i EXAKT den ordning createNewGame
   * konsumerade den. Ändra aldrig ordningen — se filhuvudet.
   */
  rand: () => number
  /** Basseed för de generatorer som tar ett eget seed (akademi, klack). */
  entourageSeed: number
  /** Kontext generateBoardObjectives behöver (fanMood/rivalryHistory/historik). */
  objectiveContext: BoardObjectiveGameContext
}

export interface ManagedClubEntourage {
  volunteers: string[]
  localPaperName: string
  journalist: ReturnType<typeof createJournalist>
  doctor: ReturnType<typeof createDoctor>
  mecenater: Mecenat[]
  patron?: Patron
  localPolitician: LocalPolitician
  board: BoardMember[]
  communityActivities: CommunityActivities
  sponsors: Sponsor[]
  boardObjectives: BoardObjective[]
  youthTeam: YouthTeam
  supporterGroup: SupporterGroup
}

/**
 * Genererar hela det klubbspecifika folkskiktet runt en managed klubb.
 *
 * `rand`-ordningen nedan är ordagrant createNewGames gamla ordning:
 * volontärer → lokaltidning → journalist → doktor → mecenat → patron →
 * kommunalråd → styrelse → ICA-sponsor → styrelsemål. Verifierat genom att
 * createNewGames egna determinism-tester (createNewGame.test.ts, grind0Truth)
 * ger identiskt utfall efter utbrytningen.
 */
export function generateManagedClubEntourage(input: ManagedClubEntourageInput): ManagedClubEntourage {
  const { clubId, season, civicSeason, clubs, players, rand, entourageSeed, objectiveContext } = input
  const managedClub = clubs.find(c => c.id === clubId)!
  const managedPlayers = players.filter(p => p.clubId === clubId)

  const volunteers = pickUnique(VOLUNTEER_FIRST_NAMES, 6 + Math.floor(rand() * 3), rand)
  const localPaperName = pickRandom(LOCAL_PAPER_NAMES, rand)

  const journalist = createJournalist(localPaperName, rand)
  const doctor = createDoctor(rand)
  const mecenater = rand() < 0.5 ? [generateMecenat(clubId, civicSeason, rand)] : []
  const patron = generatePatron(managedClub.reputation, managedPlayers, rand, civicSeason)
  const localPolitician = generatePolitician(rand, civicSeason)
  const board = generateBoardMembers(clubId, rand)

  const communityActivities: CommunityActivities = {
    kiosk: 'none',
    lottery: 'none',
    bandySchoolBasic: false,
    bandyplay: false,
    functionaries: false,
    julmarknad: false,
    bandySchool: false,
    socialMedia: false,
    vipTent: false,
  }

  // Generate ICA Maxi sponsor if reputation > 40 (50% chance)
  const sponsors: Sponsor[] = []
  if (managedClub.reputation > 40 && rand() < 0.5) {
    const shortName = managedClub.shortName || managedClub.name.split(' ')[0]
    sponsors.push({
      id: `sponsor_icamaxi_start`,
      name: `ICA Maxi ${shortName}`,
      category: 'Dagligvaruhandel',
      weeklyIncome: 3000 + Math.round(rand() * 2000),
      contractRounds: 8,
      signedRound: 0,
      icaMaxi: true,
    })
  }

  const boardObjectives = generateBoardObjectives(managedClub, objectiveContext, board, rand)

  const youthTeam = generateYouthTeam(managedClub, 'basic', season, entourageSeed + 77777)
  const supporterGroup = generateSupporterGroup(
    clubId,
    season,
    managedPlayers,
    entourageSeed,
    CLUB_TEMPLATES.find(t => t.id === clubId)?.supporterGroupName,
    'Birger',
  )

  return {
    volunteers, localPaperName, journalist, doctor, mecenater, patron,
    localPolitician, board, communityActivities, sponsors, boardObjectives,
    youthTeam, supporterGroup,
  }
}

/**
 * Klubbens funktionärer (kioskvakt, materialare, m.fl.). Ordagrant den
 * generator som stod inline i createNewGames objektlitteral — utbruten så
 * klubbytet ger den NYA klubben sina egna ansikten i stället för att låta den
 * gamla klubbens vaktmästare följa med managern.
 */
export function generateNamedCharacters(seed: number): NamedCharacter[] {
  let s = seed
  function rand() { s = ((s * 1664525 + 1013904223) | 0) >>> 0; return s / 0xffffffff }
  return FUNCTIONARY_TEMPLATES.map((t, i) => ({
    id: `func_${i}`,
    name: t.namePool[Math.floor(rand() * t.namePool.length)],
    role: t.role,
    age: 45 + Math.floor(rand() * 25),
    isAlive: true,
    morale: 60 + Math.floor(rand() * 30),
  }))
}

/**
 * `startValue`/`currentValue` för nygenererade styrelsemål — samma
 * efterbehandling som createNewGame gjorde inline (SLUTTEST 2026-08-08 punkt
 * 4b + RUNDA 3 punkt 3). Utbruten så klubbytet inte kan glömma den och
 * återintroducera den falska nollan.
 */
export function stampObjectiveStartValues(objectives: BoardObjective[], game: SaveGame): BoardObjective[] {
  return objectives.map(obj => {
    const startingValue = evaluateObjective(obj, game).value
    return { ...obj, currentValue: startingValue, startValue: startingValue }
  })
}
