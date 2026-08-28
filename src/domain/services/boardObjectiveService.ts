import type { SaveGame, BoardObjective, BoardMember } from '../entities/SaveGame'
import type { Club } from '../entities/Club'
import type { Player } from '../entities/Player'
import type { SupporterGroup } from '../entities/Community'
import { ClubExpectation } from '../enums'
import { getRivalClubId } from '../data/rivalries'
import { RELEGATION_ZONE_SIZE } from './boardService'

interface BoardObjectiveGameContext {
  currentSeason: number
  boardObjectiveHistory?: Array<{ season: number; objectiveId: string; result: 'met' | 'failed'; ownerReaction: string }>
  players: Player[]
  fanMood?: number
  supporterGroup?: SupporterGroup
  rivalryHistory?: Record<string, { wins: number; losses: number; draws: number; lastResult?: 'win' | 'loss' | 'draw'; currentStreak: number }>
  clubs: Club[]
}

// ── Objective factories ─────────────────────────────────────────────────────

// KF4 (2026-06-21): BoardMember bär firstName/lastName (inte längre .name).
// ownerId behåller visningsnamnet (renderas i OrtenTab/BoardObjectivesList/inbox-titlar).
function displayName(m: BoardMember): string {
  return `${m.firstName} ${m.lastName}`
}

function makeObjective(
  id: string, type: BoardObjective['type'], label: string, description: string,
  owner: BoardMember, measureFn: string, targetValue: number,
  successReward: string, failureConsequence: string, carryOver: boolean,
  season: number,
): BoardObjective {
  return {
    id, type, label, description,
    ownerId: displayName(owner),
    ownerPersonality: owner.personality,
    targetValue, currentValue: 0, measureFn,
    status: 'active',
    assignedSeason: season,
    successReward, failureConsequence, carryOver,
  }
}

const BALANCE_DESCRIPTIONS = [
  'Vi kan inte fortsätta blöda pengar. Jag vill se en klubbkassa som inte är röd vid säsongsslut. Det är mitt krav.',
  'Siffrorna är röda. Det enda jag ber om är att vi inte ligger minus vid årets slut.',
  'Jag har gått igenom räkenskaperna. Vi måste vända det här. Plusminusnoll — minst.',
  'Varje krona räknas. Håll budgeten. Det är inte förhandlingsbart.',
]

function balanceBudget(owner: BoardMember, season: number): BoardObjective {
  const desc = `${displayName(owner)}: "${BALANCE_DESCRIPTIONS[season % BALANCE_DESCRIPTIONS.length]}"`
  return makeObjective(
    'balanceBudget', 'economic',
    'Håll ekonomin i balans',
    desc,
    owner, 'balanceBudget', 0,
    `${displayName(owner)}: "Tack. Klokt hanterat."`,
    `${displayName(owner)}: "Minus igen. Jag noterar mitt missnöje."`,
    true, season,
  )
}

/**
 * Reward-strängens sanningshalt grundas av syskonfunktionen
 * evaluateObjective('growFinances'), som läser club.finances mot
 * game.seasonStartFinances vid utvärderingstillfället — citatdeklarationen
 * hör hemma DÄR (den funktionen läser fältet i sin egen kropp), inte här
 * (denna fabrik läser ingen speldata alls, se PÅSTÅENDEKARTAN-kommentaren
 * vid evaluateObjective).
 */
function growFinances(owner: BoardMember, season: number): BoardObjective {
  return makeObjective(
    'growFinances', 'economic',
    'Öka klubbkassan med 100 tkr',
    `${displayName(owner)}: "Ekonomin är stabil men vi kan bättre. Jag vill se 100 000 mer vid säsongsslut."`,
    owner, 'growFinances', 100000,
    `${displayName(owner)}: "Imponerande. Kassan växer."`,
    `${displayName(owner)}: "Vi nådde inte målet. Men vi överlevde."`,
    false, season,
  )
}

// O5 kraft 3 (Jacobs dom 2026-08-17, byggd 2026-08-23): styrelsens
// investeringskrav. Aktiveras när kassan passerat SURPLUS_CEILING —
// en full kassa ska inte längre vara konsekvenslös. targetValue är
// gränsen styrelsen vill se kassan UNDER igen (spenderad, inte sparad).
export const SURPLUS_CEILING = 2_000_000

function investSurplus(owner: BoardMember, season: number): BoardObjective {
  return makeObjective(
    'investSurplus', 'economic',
    'Investera överskottet',
    `${displayName(owner)}: "Vi har över två miljoner på kontot och en anläggning som inte har rört sig på flera år. Använd pengarna."`,
    owner, 'investSurplus', SURPLUS_CEILING,
    `${displayName(owner)}: "Nu ser jag att pengarna gör nytta."`,
    `${displayName(owner)}: "Kassan bara växer. Vad väntar vi på?"`,
    false, season,
  )
}

const HOMEGROWN_DESCRIPTIONS = [
  'Vi har pojkar från orten i truppen. Minst tre av dem ska starta regelbundet. Det är så vi bygger en klubb.',
  'Jag vill se lokala grabbar på isen. Tre egenfostrade i startelvan — det borde vara självklart.',
  'Vi fostrar spelare för att de ska spela. Tre stycken i elvan — minst.',
  'Det finns talang i byn. Visa att ni ser den. Tre lokala förmågor i startelvan.',
]

function playHomegrown(owner: BoardMember, season: number): BoardObjective {
  const desc = `${displayName(owner)}: "${HOMEGROWN_DESCRIPTIONS[season % HOMEGROWN_DESCRIPTIONS.length]}"`
  return makeObjective(
    'playHomegrown', 'academy',
    'Minst 3 egenfostrade i startelvan',
    desc,
    owner, 'playHomegrown', 3,
    `${displayName(owner)}: "Så ska det se ut. Pojkarna från orten i startelvan."`,
    `${displayName(owner)}: "Inte en enda egenforstrad i startelvan. Det tar jag personligt."`,
    true, season,
  )
}

function growFanbase(owner: BoardMember, season: number): BoardObjective {
  return makeObjective(
    'growFanbase', 'community',
    'Publikens humör ska nå 70',
    `${displayName(owner)}: "Publiken måste tillbaka. Vi behöver stämning på läktarna. Humöret uppe i 70 — det är målet."`,
    owner, 'growFanbase', 70,
    `${displayName(owner)}: "Stämningen är tillbaka! Bra jobbat."`,
    `${displayName(owner)}: "Läktarna är fortfarande halvtomma. Vi måste hitta vägen tillbaka."`,
    false, season,
  )
}

function cupRun(owner: BoardMember, season: number): BoardObjective {
  return makeObjective(
    'cupRun', 'sporting',
    'Gå långt i cupen',
    `${displayName(owner)}: "Semifinal — det är allt jag ber om. Ge oss en cupresa att minnas."`,
    owner, 'cupRun', 3,
    // PÅSTÅENDEKARTAN SANNINGEN-SAKNAS-fix, låst av Jacob 2026-08-27: "15 år"
    // hävdade en cup-historik som aldrig spårats (ingen cupHistory/lastCupWin-
    // data finns). Ersatt med en sann, tidlös rad — ingen siffra att belägga.
    `${displayName(owner)}: "SEMIFINAL! Det var länge sedan sist."`,
    `${displayName(owner)}: "Cupen blev en besvikelse. Men ligan är viktigast."`,
    false, season,
  )
}

function improveFacilities(owner: BoardMember, season: number): BoardObjective {
  return makeObjective(
    'improveFacilities', 'community',
    'Förbättra anläggningen',
    `${displayName(owner)}: "Anläggningen är under all kritik. Starta minst ett projekt den här säsongen."`,
    owner, 'improveFacilities', 1,
    `${displayName(owner)}: "Bra! Äntligen händer det något."`,
    `${displayName(owner)}: "Ingenting gjort med anläggningen. Igen."`,
    true, season,
  )
}

function improveYouth(owner: BoardMember, season: number): BoardObjective {
  const descs = [
    'Vi lägger pengar på akademin. Jag vill se resultat — minst en spelare som tar klivet upp.',
    'Akademin måste leverera. En spelare till A-laget den här säsongen. Det är rimligt.',
    'Det finns pojkar i P19 som är redo. Ge dem chansen.',
  ]
  return makeObjective(
    'improveYouth', 'academy',
    'Lyft en spelare från akademin',
    `${displayName(owner)}: "${descs[season % descs.length]}"`,
    owner, 'improveYouth', 1,
    `${displayName(owner)}: "Bra — akademin levererar."`,
    `${displayName(owner)}: "Ingen ny spelare från akademin. Vad gör vi egentligen där nere?"`,
    false, season,
  )
}

/**
 * Reward-strängens sanningshalt grundas av syskonfunktionen
 * evaluateObjective('reduceInjuries'), som räknar game.players filtrerat
 * på clubId och isInjured vid utvärderingstillfället — citatdeklarationen
 * hör hemma DÄR, inte här (denna fabrik läser ingen speldata alls).
 */
function reduceInjuries(owner: BoardMember, season: number): BoardObjective {
  const descs = [
    'Skadeläget var en katastrof. Håll truppen frisk den här säsongen.',
    'Vi hade för många skador förra året. Max fem — det borde vara möjligt.',
    'Träningen måste anpassas. Jag vill inte se halva truppen på skadelistan igen.',
  ]
  return makeObjective(
    'reduceInjuries', 'sporting',
    'Max 5 skador under säsongen',
    `${displayName(owner)}: "${descs[season % descs.length]}"`,
    owner, 'reduceInjuries', 5,
    `${displayName(owner)}: "Friska spelare, bra säsong. Så enkelt är det."`,
    `${displayName(owner)}: "Skadeläget blev för dåligt. Vi måste se över träningen."`,
    false, season,
  )
}

function topHalfFinish(owner: BoardMember, season: number): BoardObjective {
  const descs = [
    'Jag begär inte SM-guld. Men topp 6 — det ska vi klara.',
    'Vi hör hemma i övre halvan. Bevisa det.',
    'Stabilt i toppen. Plats 1–6 vid säsongsslut.',
  ]
  return makeObjective(
    'topHalf', 'sporting',
    'Sluta topp 6',
    `${displayName(owner)}: "${descs[season % descs.length]}"`,
    owner, 'topHalf', 6,
    `${displayName(owner)}: "Topp 6! Vi är på rätt väg."`,
    `${displayName(owner)}: "Under nedre halvan. Inte godkänt."`,
    false, season,
  )
}

/**
 * Reward-strängens sanningshalt grundas av syskonfunktionen
 * evaluateObjective('beatRival'), som läser game.rivalryHistory[rivalId].lastResult
 * vid utvärderingstillfället — citatdeklarationen hör hemma DÄR, inte här
 * (denna fabrik läser ingen speldata alls).
 */
function beatRival(owner: BoardMember, rivalName: string, season: number): BoardObjective {
  return makeObjective(
    'beatRival', 'sporting',
    `Slå ${rivalName}`,
    `${displayName(owner)}: "Vi MÅSTE slå ${rivalName} den här säsongen. Jag vet inte vad jag ska säga till grabbarna på jobbet annars."`,
    owner, 'beatRival', 1,
    `${displayName(owner)}: "Vi slog ${rivalName}! Det räcker för hela säsongen."`,
    `${displayName(owner)}: "Vi förlorade derbyt. Igen. Tungt."`,
    false, season,
  )
}

/**
 * NY objektivtyp (Jacobs dom 2026-08-25, styrelseobjektiv-tier-uppdraget):
 * "En Survive-klubb ska inte få lättare krav, den ska få ANDRA krav:
 * överleva nedflyttning..." Fanns ingen befintlig objektivtyp för detta —
 * closest (topHalf) mäter fel sak för en klubb vars identitet är att
 * existera, inte klättra. targetValue = säkert-position (totalTeams minus
 * RELEGATION_ZONE_SIZE, delad konstant med boardService.ts:s egen
 * nedflyttningszon — aldrig en egen gissning om var gränsen går).
 *
 * SVENSK TEXT — CODE SKRIVER ALDRIG (CLAUDE.md): label/description/
 * successReward/failureConsequence är genuint NY text för en genuint ny
 * objektivtyp, ingen befintlig sträng att återanvända. '[Opus]'-platshållare
 * tills Opus skriver dem — samma disciplin som H4 Heros CEREMONIAL-texten.
 */
function avoidRelegation(owner: BoardMember, season: number, totalTeams: number): BoardObjective {
  const safePosition = totalTeams - RELEGATION_ZONE_SIZE
  return makeObjective(
    'avoidRelegation', 'sporting',
    'Undvik nedflyttning',
    `${displayName(owner)}: "Jag begär inte mycket. Håll oss kvar i serien till våren, så är jag nöjd."`,
    owner, 'avoidRelegation', safePosition,
    `${displayName(owner)}: "Vi klarade oss! Ett år till i serien."`,
    `${displayName(owner)}: "Nedflyttning. Det får inte hända en klubb som vår."`,
    false, season,
  )
}

/**
 * Styrelseobjektiv-tiern (Jacobs dom 2026-08-25): "objektiven HÄRLEDS ur
 * ClubExpectation. Skala inte kostnaden — byt uppsättningen." Ersätter den
 * gamla slumpmässiga rollbaserade poolen (kassör/traditionalist/modernist/
 * supporter, gated på klubbfält, aldrig på tier) — se RAPPORT_STYRELSEOBJEKTIV_
 * TIER_2026-08-25.md för den fullständiga utredningen bakom bytet.
 *
 * Två till tre objektiv per tier, överlapp där det är rimligt (Jacobs krav):
 * - Survive/AvoidBottom delar avoidRelegation (båda existentiellt oroade).
 * - Survive/MidTable delar improveYouth (utveckling värderas i båda ändar).
 * - ChallengeTop/WinLeague delar cupRun+beatRival (genuin ambition).
 * - MidTable/WinLeague delar topHalf — MidTables egen ankarposition (6) OCH
 *   WinLeagues golv (om ribban ändå inte hålls, håll åtminstone denna).
 *
 * Till skillnad från den gamla poolen är UPPSÄTTNINGEN FAST per tier — samma
 * objektiv återkommer så länge klubben ligger kvar på samma tier (det ÄR
 * identitetspoängen, inte en bugg att laga med variationslogik). Gamla
 * `lastSeasonObjectiveIds`-variationslogiken borttagen av samma skäl.
 */
const EXPECTATION_OBJECTIVE_TYPES: Record<ClubExpectation, string[]> = {
  [ClubExpectation.Survive]: ['avoidRelegation', 'balanceBudget', 'improveYouth'],
  [ClubExpectation.AvoidBottom]: ['avoidRelegation', 'reduceInjuries', 'growFinances'],
  [ClubExpectation.MidTable]: ['topHalf', 'growFanbase', 'improveYouth'],
  [ClubExpectation.ChallengeTop]: ['cupRun', 'beatRival', 'investSurplus'],
  [ClubExpectation.WinLeague]: ['topHalf', 'cupRun', 'beatRival'],
}

/**
 * Dispatcher: bygger EN BoardObjective för en given objektivtyp-id.
 * Returnerar null när förutsättningen för typen saknas för denna klubb just
 * nu (t.ex. ingen rival definierad) — anroparen hoppar över typen den
 * säsongen i stället för att krascha eller gissa en ersättare.
 */
function buildObjectiveByType(
  type: string, owner: BoardMember, season: number,
  club: Club, game: BoardObjectiveGameContext,
): BoardObjective | null {
  switch (type) {
    case 'balanceBudget': return balanceBudget(owner, season)
    case 'growFinances': return growFinances(owner, season)
    case 'investSurplus': return investSurplus(owner, season)
    case 'playHomegrown': return playHomegrown(owner, season)
    case 'improveYouth': return improveYouth(owner, season)
    case 'growFanbase': return growFanbase(owner, season)
    case 'improveFacilities': return improveFacilities(owner, season)
    case 'cupRun': return cupRun(owner, season)
    case 'reduceInjuries': return reduceInjuries(owner, season)
    case 'topHalf': return topHalfFinish(owner, season)
    case 'avoidRelegation': return avoidRelegation(owner, season, game.clubs.length)
    case 'beatRival': {
      const rivalId = getRivalClubId(club.id)
      const rivalClub = rivalId ? game.clubs.find(c => c.id === rivalId) : undefined
      return rivalClub ? beatRival(owner, rivalClub.name, season) : null
    }
    default: return null
  }
}

// ── Generate objectives for a new season ────────────────────────────────────

function ownerForObjectiveType(
  type: string,
  kassör: BoardMember | undefined, traditionalist: BoardMember | undefined,
  modernist: BoardMember | undefined, supporter: BoardMember | undefined,
): BoardMember | undefined {
  switch (type) {
    case 'balanceBudget': case 'growFinances': case 'investSurplus': return kassör
    case 'playHomegrown': case 'improveYouth': return traditionalist
    case 'growFanbase': case 'improveFacilities': return modernist
    case 'cupRun': case 'reduceInjuries': case 'topHalf': case 'beatRival': case 'avoidRelegation': return supporter
    default: return undefined
  }
}

export function generateBoardObjectives(
  club: Club,
  game: BoardObjectiveGameContext,
  boardMembers: BoardMember[],
  rand: () => number,
): BoardObjective[] {
  const season = game.currentSeason
  const kassör = boardMembers.find(m => m.role === 'kassör')
  const traditionalist = boardMembers.find(m => m.personality === 'traditionalist')
  const modernist = boardMembers.find(m => m.personality === 'modernist')
  const supporter = boardMembers.find(m => m.personality === 'supporter')

  const types = EXPECTATION_OBJECTIVE_TYPES[club.boardExpectation] ?? EXPECTATION_OBJECTIVE_TYPES[ClubExpectation.MidTable]
  const objectives: BoardObjective[] = []
  for (const type of types) {
    const owner = ownerForObjectiveType(type, kassör, traditionalist, modernist, supporter)
    if (!owner) continue
    const objective = buildObjectiveByType(type, owner, season, club, game)
    if (objective) objectives.push(objective)
  }

  // Guarantee at least 1 objektiv: samma fallback som innan tier-bytet,
  // oförändrat skäl (en styrelse utan ett enda krav är inte trovärdig).
  if (objectives.length === 0) {
    const fallbackOwner = supporter ?? kassör ?? boardMembers[0]
    if (fallbackOwner) {
      objectives.push(rand() < 0.5
        ? cupRun(fallbackOwner, season)
        : growFinances(fallbackOwner, season)
      )
    }
  }

  return objectives
}

// ── Evaluate objectives ─────────────────────────────────────────────────────

/**
 * PÅSTÅENDEKARTAN (2026-08-24): growFanbase-fallet mättes tidigare mot
 * game.fanMood (matchmotor/attendance-fält), läser nu supporterGroup.mood
 * (klackens faktiska humör). playHomegrown-fallet sorterar på matchday med
 * roundNumber som fallback ENDAST när matchday saknas (äldre fixtures) —
 * inte den primära ordningen, se sort-uttryckets ?? .
 *
 * PÅSTÅENDEKARTAN omsvep (2026-08-24): growFinances/reduceInjuries/
 * beatRival är rena reward-textfabriker (ingen speldata läst i dem själva —
 * se deras egna kommentarer) — deras reward-strängars sanningshalt grundas
 * HÄR, i evaluateObjective, inte i fabrikerna. seasonStartFinances/isInjured/
 * rivalryHistory hör därför hemma i DENNA funktions @cites, inte fabrikernas.
 *
 * Styrelseobjektiv-tiern (2026-08-25): avoidRelegation tillagd, läser
 * game.standings (samma fält topHalf redan läste, saknades i taggen sedan
 * innan — fixat i samma pass, inte introducerat av avoidRelegation).
 *
 * @cites SupporterGroup.mood, matchday, roundNumber, game.seasonStartFinances, player.isInjured, game.rivalryHistory, game.standings
 */
export function evaluateObjective(
  objective: BoardObjective,
  game: SaveGame,
): { value: number; status: 'met' | 'failed' | 'at_risk' | 'active' } {
  switch (objective.measureFn) {
    case 'balanceBudget': {
      const club = game.clubs.find(c => c.id === game.managedClubId)!
      const value = club.finances
      return { value, status: value >= 0 ? 'met' : value > -100000 ? 'at_risk' : 'failed' }
    }
    case 'growFinances': {
      const club = game.clubs.find(c => c.id === game.managedClubId)!
      const start = game.seasonStartFinances ?? 0
      const delta = club.finances - start
      return { value: delta, status: delta >= objective.targetValue ? 'met' : delta >= 0 ? 'active' : 'at_risk' }
    }
    case 'investSurplus': {
      // Framgångskurvan steg 3, del 2 (DOM_FRAMGANGSKURVAN_2026-08-27, anspråk 3):
      // rot till varför femte koefficientrundan (nedan, historik) bara kunde mäta
      // kassasaldo — spårning av VERKLIG investeringsaktivitet (byggda noder,
      // kontraktsförlängningar, nettotransferutgift) fanns inte förrän nu:
      // FacilityState.builtSeasons var text-utan-konsument, och
      // kontraktsförlängningar loggades inte alls till financeLog (fixat i
      // renewContract, transferActions.ts, samma leverans).
      //
      // FIX (2026-08-28): läste tidigare financeLog direkt (filtrerat på
      // round <= currentMatchday) för kontraktsförlängningar/nettotransfer.
      // Empiriskt bevisat trasigt (scripts/framgangskurvan-ansprak3-
      // investsurplus-matning-2026-08-28.ts): financeLog är en ROLLANDE
      // VISNINGSLOGG capad till FINANCE_LOG_MAX=50 DELAT över alla kategorier
      // (wages, match_revenue, m.fl.) — en dominant klubbs säsong (cup+slutspel,
      // 35-40 omgångar × 5-9 poster/omgång = 180-330+ poster) trängde ut en
      // matchday 6/10-post innan säsongsslut, vilket tystnade räkningen just
      // för de klubbar featuren är till för att belöna. Läser nu i stället
      // game.seasonContractExtensionCount/seasonNetTransferSpend — dedikerade,
      // ocappade fält som räknas direkt vid handlingstillfället och nollställs
      // vid säsongsstart (samma mönster som seasonStartFinances, se SaveGame.ts).
      const club = game.clubs.find(c => c.id === game.managedClubId)!
      const builtSeasons = game.facilityState?.builtSeasons ?? {}
      const builtNodesThisSeason = Object.values(builtSeasons)
        .filter(s => s === game.currentSeason).length

      const contractExtensionsThisSeason = game.seasonContractExtensionCount ?? 0

      // Teckenkonvention (oförändrad, verifierad mot transferService.ts):
      // netTransferSpend = summan av transfer_in/transfer_out denna säsong;
      // negativ = nettoutgift (köpt mer än sålt).
      const netTransferSpend = game.seasonNetTransferSpend ?? 0

      const investmentCount = builtNodesThisSeason + contractExtensionsThisSeason
        + (netTransferSpend < 0 ? 1 : 0)

      const cashGrowth = club.finances - (game.seasonStartFinances ?? 0)

      const status: 'met' | 'failed' | 'active' =
        investmentCount >= 1 ? 'met'
        : cashGrowth > 1_000_000 ? 'failed'
        : 'active'

      return { value: investmentCount, status }
    }
    case 'playHomegrown': {
      const recent = game.fixtures
        .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
        .sort((a, b) => (b.matchday ?? b.roundNumber) - (a.matchday ?? a.roundNumber))
        .slice(0, 5)
      const homegrownIds = new Set(game.players.filter(p => p.isHomegrown && p.clubId === game.managedClubId).map(p => p.id))
      const avg = recent.reduce((sum, f) => {
        const isHome = f.homeClubId === game.managedClubId
        const starters = isHome ? (f.homeLineup?.startingPlayerIds ?? []) : (f.awayLineup?.startingPlayerIds ?? [])
        return sum + starters.filter(id => homegrownIds.has(id)).length
      }, 0) / Math.max(1, recent.length)
      return { value: Math.round(avg * 10) / 10, status: avg >= 3 ? 'met' : avg >= 2 ? 'at_risk' : 'active' }
    }
    case 'growFanbase': {
      // PÅSTÅENDEKARTAN (2026-08-24): objektivets egen text talar om
      // "stämning på läktarna"/"publikens humör" — klackens domän — men
      // mättes tidigare mot game.fanMood, ett annat fält (matchmotor/
      // hemmaplansfördel/attendance). game.supporterGroup.mood är fältet
      // resten av kodbasen (rippleEffectService.ts, gameInvariants.ts:s
      // supporterMood-koll, hallProcessService.ts) redan behandlar som
      // klackens/publikens verkliga humör.
      const fm = game.supporterGroup?.mood ?? 50
      return { value: fm, status: fm >= 70 ? 'met' : fm >= 55 ? 'active' : 'at_risk' }
    }
    case 'cupRun': {
      const bracket = game.cupBracket
      if (!bracket) return { value: 0, status: 'active' }
      const managedMatches = bracket.matches.filter(m =>
        m.homeClubId === game.managedClubId || m.awayClubId === game.managedClubId
      )
      const maxRound = Math.max(0, ...managedMatches.filter(m => m.winnerId === game.managedClubId).map(m => m.round))
      const eliminated = managedMatches.some(m => m.winnerId && m.winnerId !== game.managedClubId)
      if (maxRound >= 3) return { value: maxRound, status: 'met' }
      if (eliminated) return { value: maxRound, status: 'failed' }
      return { value: maxRound, status: maxRound >= 2 ? 'active' : 'at_risk' }
    }
    case 'beatRival': {
      const history = game.rivalryHistory ?? {}
      const won = Object.values(history).some(h => h.lastResult === 'win')
      if (won) return { value: 1, status: 'met' }
      const rivalIds = Object.keys(history)
      const allDerbiesPlayed = rivalIds.length > 0 && rivalIds.every(rivalId => {
        const played = game.fixtures.filter(f =>
          f.status === 'completed' &&
          ((f.homeClubId === game.managedClubId && f.awayClubId === rivalId) ||
           (f.awayClubId === game.managedClubId && f.homeClubId === rivalId))
        )
        return played.length >= 2
      })
      return { value: 0, status: allDerbiesPlayed ? 'failed' : 'active' }
    }
    case 'improveFacilities': {
      const fs = game.facilityState
      const started = (fs?.builtNodeIds.length ?? 0) + (fs?.activeProject ? 1 : 0)
      return { value: started, status: started >= 1 ? 'met' : 'active' }
    }
    case 'improveYouth': {
      const promoted = game.players.filter(p =>
        p.clubId === game.managedClubId && p.isHomegrown && p.age <= 20 &&
        (p.seasonStats?.gamesPlayed ?? 0) >= 3
      ).length
      return { value: promoted, status: promoted >= 1 ? 'met' : 'active' }
    }
    case 'reduceInjuries': {
      const injuryCount = game.players.filter(p =>
        p.clubId === game.managedClubId && p.isInjured
      ).length
      return { value: injuryCount, status: injuryCount <= 5 ? 'met' : injuryCount <= 8 ? 'active' : 'at_risk' }
    }
    case 'topHalf': {
      const pos = game.standings?.find(s => s.clubId === game.managedClubId)?.position ?? 12
      return { value: pos, status: pos <= 6 ? 'met' : pos <= 8 ? 'active' : 'at_risk' }
    }
    case 'avoidRelegation': {
      // objective.targetValue = safePosition (totalTeams - RELEGATION_ZONE_SIZE,
      // satt vid generering, se avoidRelegation()-fabriken ovan) — samma
      // nedflyttningszon boardService.ts:s RELEGATION_ZONE_SIZE definierar,
      // aldrig en egen gissning om var gränsen går.
      const pos = game.standings?.find(s => s.clubId === game.managedClubId)?.position ?? 12
      const safe = objective.targetValue
      return { value: pos, status: pos <= safe ? 'met' : pos <= safe + 1 ? 'at_risk' : 'failed' }
    }
    default:
      return { value: 0, status: 'active' }
  }
}

// ── Check-in: update objective status (called at round 7, 14, 22) ───────────

export function checkInObjectives(
  objectives: BoardObjective[],
  game: SaveGame,
): {
  updated: BoardObjective[]
  inboxMessages: Array<{ title: string; body: string }>
  sponsorNetworkMoodDelta: number
  boardTrustDelta: number
  foretroendepottAmount: number
} {
  const inboxMessages: Array<{ title: string; body: string }> = []
  let sponsorNetworkMoodDelta = 0
  let boardTrustDelta = 0
  let foretroendepottAmount = 0
  let flagshipMetThisCheckIn = false

  const updated = objectives.map(obj => {
    const result = evaluateObjective(obj, game)
    const newStatus = result.status === 'met' ? 'met' as const
      : result.status === 'failed' ? 'failed' as const
      : result.status === 'at_risk' ? 'at_risk' as const
      : 'active' as const

    if (newStatus === 'met' && obj.status !== 'met') {
      const isFlagship = obj.type === 'sporting' || obj.type === 'economic'
      sponsorNetworkMoodDelta += isFlagship ? 6 : 3
      boardTrustDelta += 1
      if (isFlagship) flagshipMetThisCheckIn = true
      inboxMessages.push({
        title: `📋 ${obj.ownerId}: Uppfyllt!`,
        body: obj.successReward,
      })
    } else if (newStatus === 'at_risk' && obj.status === 'active') {
      inboxMessages.push({
        title: `${obj.ownerId}: Varning`,
        body: `${obj.label} — vi är inte i fas. Nuvarande: ${result.value}.`,
      })
    } else if (newStatus === 'failed' && obj.status !== 'failed') {
      sponsorNetworkMoodDelta -= 4
      inboxMessages.push({
        title: `${obj.ownerId}: Misslyckat`,
        body: obj.failureConsequence,
      })
    }

    return { ...obj, currentValue: result.value, status: newStatus }
  })

  // Förtroendepott: fires when two consecutive flagship seasons are met
  // boardTrust ≥ 1 means last season's flagship was met; flagship met again → pott
  if (flagshipMetThisCheckIn && (game.boardTrust ?? 0) >= 1) {
    foretroendepottAmount = 62500  // 50–75 tkr kapat belopp (midpoint)
    // Net boardTrust stays at 1 (not 2) after pott fires
    boardTrustDelta = 1 - (game.boardTrust ?? 0)
  }

  return { updated, inboxMessages, sponsorNetworkMoodDelta, boardTrustDelta, foretroendepottAmount }
}

/**
 * Femte koefficientrundan (Jacobs dom 2026-08-23, O5_FEMTE_PASSET_
 * AVSKEDSDIAGNOS_2026-08-23.md): meritbufferten (boardService.ts) skyddar
 * inte upprepade objektivmissar — "samma objective missat tre år i rad är
 * inte otur, det är att managern inte gör det styrelsen bad om."
 *
 * boardObjectiveHistory bär bara ETT binärt met/failed per objectiveId
 * (evaluateObjective()s fyra riktiga tillstånd — met/at_risk/active/failed —
 * plattas redan till två där, se seasonEndProcessor.ts:s kommentar om
 * varför). Det betyder att denna funktion INTE kan skilja en genuint
 * misslyckad tidigare säsong från en som bara var 'active' (på väg, aldrig
 * avgjord) — båda loggas som 'failed'. Det är den precisaste signal typen
 * faktiskt bär, inte en nygjord typ-utökning (Jacobs villkor: använd typen
 * som den är, bygg utan om den inte bär det). Rapporterat, inte löst.
 *
 * En kostnad räknas som "upprepad" om den är negativ (cost < 0, dvs.
 * at_risk eller failed denna säsong) OCH objectiveId:ts SENASTE
 * historikpost också var 'failed'. Historiken förutsätts kronologisk
 * (äldst→nyast, samma ordning boardObjectiveHistory alltid pushas i).
 */
export function isRepeatedObjectiveFailure(
  objectiveId: string,
  cost: number,
  history: Array<{ objectiveId: string; result: 'met' | 'failed' }>,
): boolean {
  if (cost >= 0) return false
  let latest: 'met' | 'failed' | undefined
  for (const h of history) {
    if (h.objectiveId === objectiveId) latest = h.result
  }
  return latest === 'failed'
}
