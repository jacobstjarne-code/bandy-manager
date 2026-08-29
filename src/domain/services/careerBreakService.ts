/**
 * O13 / M11 — TRÄNARMARKNADEN (DOM_TRANARMARKNADEN_2026-08-26.md).
 *
 * Rena funktioner: managerns renommé, hur många samtal det ger, och vilka
 * klubbar som ringer. Ingen simulering här (den ligger i
 * application/useCases/simulateCareerBreak.ts) och ingen text — allt
 * spelarvänt språk är '[Opus]' tills Opus skrivit det.
 *
 * Domens tre skärpningar, och var de bor i den här filen:
 *   1. "Erbjudandena matchar vad du åstadkommit" → computeManagerRenomme +
 *      offerCountForRenomme + `betterClubUnlocked`-spärren i buildCareerOffers.
 *   2. "Din gamla klubb kan vara en av de tre" → `formerClubDidWorse` (satt av
 *      simuleringen) släpper in gamla klubben som kandidat, och den läggs
 *      FÖRST så taket aldrig kan råka sålla bort den. Domen kallar den den
 *      bästa berättelsen i hela mekaniken; då får den inte tävla om platsen.
 *   3. "Karriären ska kunna ta slut" → MAX_FIRINGS + renommétröskeln i
 *      offerCountForRenomme, som returnerar 0.
 */

import type { SaveGame } from '../entities/SaveGame'
import type { SeasonSummary } from '../entities/SeasonSummary'
import { ClubExpectation } from '../enums'
import { RELEGATION_ZONE_SIZE } from './boardService'

// ── Renommé ────────────────────────────────────────────────────────────────

/**
 * MAGNITUDER — FÖRESLAGNA AV CODE, INTE DÖMDA AV JACOB.
 *
 * Domen säger "hög managerrenommé ger tre erbjudanden, låg ger ett eller
 * inget" men sätter ingen siffra. Talen nedan är valda mot fördelningen av
 * faktiska karriärer, inte mot magkänsla — tre referensfall:
 *
 *  A. Sparkad efter två-tre mittenmässiga säsonger, inga titlar, en bottenplacering:
 *     40 − 6 − 12 = 22  → ETT samtal. Karriären fortsätter, men knappt.
 *  B. Vann ligan och SM, sparkades säsongen efter en kollaps:
 *     40 + 20 + 8 − 12 = 56  → TRE samtal. Domens uttryckliga exempel
 *     ("en manager som vann ligan innan han sparkades får andra samtal").
 *  C. Tredje avskedet, ingen merit:
 *     spärras av MAX_FIRINGS oavsett poäng → INGET samtal.
 *
 * Avskedsavdraget (−12) är medvetet större än en enskild bottenplacering
 * (−6): det är styrelsens beslut som väger i tränarkretsar, inte tabellraden
 * i sig. Basen 40 gör att en karriär utan meriter men utan katastrof landar
 * strax över ett-samtal-gränsen — "någon ringer, men inte många".
 *
 * Ändras dessa: uppdatera D-fact-posten i samma commit (CLAUDE.md, LÖPANDE
 * KVALITET punkt 5).
 */
export const RENOMME_BASE = 40
export const RENOMME_SM_GOLD = 20
export const RENOMME_CUP_WIN = 10
export const RENOMME_LEAGUE_WIN = 8
export const RENOMME_PODIUM = 4
export const RENOMME_PLAYOFF_QUALIFIED = 3
export const RENOMME_RELEGATION_ZONE = -6
export const RENOMME_FIRING = -12

/** Tröskel för tre samtal (referensfall B ovan landar på 56). */
export const RENOMME_TIER_THREE = 55
/** Tröskel för två samtal. */
export const RENOMME_TIER_TWO = 30
/** Under denna ringer ingen alls (referensfall A ligger på 22, strax över). */
export const RENOMME_TIER_ONE = 15
/** Skärpning 3: efter tredje avskedet kommer inget samtal, oavsett renommé. */
export const MAX_FIRINGS = 3

function isRelegationZone(position: number, totalTeams: number): boolean {
  return position >= totalTeams - RELEGATION_ZONE_SIZE + 1
}

/**
 * MAGNITUD — FÖRESLAGEN AV CODE, INTE DÖMD AV JACOB.
 *
 * Hur djup "ligans botten" är när tränarstolar blir lediga. Domen vill kunna
 * ge TRE samtal ("Tre av dem, ur ligans botten"). Nedflyttningszonen
 * (RELEGATION_ZONE_SIZE = 2) kan aldrig producera tre — och i praktiken inte
 * ens två, eftersom en av de två platserna nästan alltid hålls av en
 * Survive-klubb som inte sparkar någon för att hamna där (mätt över tolv
 * simulerade karriärer 2026-08-29: en enda ledig klubb i elva av tolv fall).
 * En tredjedel av tabellen är det minsta bandet som kan bära domens tre, och
 * läses fortfarande som "botten": plats 9–12 i en tolvlagsliga.
 *
 * Golvet mot RELEGATION_ZONE_SIZE gör regeln säker för mindre ligor.
 */
export function vacancyZoneSize(totalTeams: number): number {
  return Math.max(RELEGATION_ZONE_SIZE, Math.round(totalTeams / 3))
}

function isVacancyZone(position: number, totalTeams: number): boolean {
  return position >= totalTeams - vacancyZoneSize(totalTeams) + 1
}

/**
 * 0–100. Härledd ur karriärens faktiska utfall (seasonSummaries) plus antalet
 * avsked — aldrig lagrad, så den kan inte glida ifrån historiken.
 */
export function computeManagerRenomme(
  summaries: SeasonSummary[],
  firings: number,
  totalTeams: number,
): number {
  let score = RENOMME_BASE
  for (const s of summaries) {
    if (s.playoffResult === 'champion') score += RENOMME_SM_GOLD
    if (s.cupResult === 'winner') score += RENOMME_CUP_WIN
    if (s.finalPosition === 1) score += RENOMME_LEAGUE_WIN
    else if (s.finalPosition <= 3) score += RENOMME_PODIUM
    if (s.playoffResult !== null && s.playoffResult !== 'didNotQualify') score += RENOMME_PLAYOFF_QUALIFIED
    if (isRelegationZone(s.finalPosition, totalTeams)) score += RENOMME_RELEGATION_ZONE
  }
  score += firings * RENOMME_FIRING
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Skärpning 1 + 3 i en funktion. Returnerar 0–3.
 * `firings` inkluderar det avsked som just skett.
 */
export function offerCountForRenomme(renomme: number, firings: number): number {
  if (firings >= MAX_FIRINGS) return 0
  if (renomme >= RENOMME_TIER_THREE) return 3
  if (renomme >= RENOMME_TIER_TWO) return 2
  if (renomme >= RENOMME_TIER_ONE) return 1
  return 0
}

/**
 * Skärpning 1, andra halvan: "ett erbjudande från en bättre klubb än den du
 * lämnade ska kräva att du faktiskt presterade innan avskedet."
 *
 * "Presterade" mäts över HELA perioden i klubben, inte bara sista säsongen —
 * en manager som blir sparkad har nästan per definition ett dåligt sista år,
 * och en spärr på sista året hade gjort villkoret omöjligt att uppfylla och
 * därmed regeln död.
 */
export function performedAtClub(
  summaries: SeasonSummary[],
  clubId: string,
  totalTeams: number,
): boolean {
  const own = summaries.filter(s => s.clubId === clubId)
  if (own.length === 0) return false
  const topHalf = Math.floor(totalTeams / 2)
  return own.some(s =>
    s.finalPosition <= topHalf ||
    s.playoffResult === 'champion' ||
    s.cupResult === 'winner'
  )
}

// ── Uppehållets tillstånd ──────────────────────────────────────────────────

export interface CareerBreakSeasonLine {
  season: number
  /** Gamla klubbens slutplacering den säsongen, under efterträdaren. */
  formerClubPosition: number
  championClubId: string | null
  championClubName: string | null
}

export interface CareerBreakReport {
  formerClubId: string
  formerClubName: string
  /** Gamla klubbens placering SISTA säsongen under spelaren. */
  positionUnderPlayer: number
  /** Bästa (lägsta) placering gamla klubben nådde under efterträdaren. */
  bestPositionUnderReplacement: number
  seasons: CareerBreakSeasonLine[]
  /** Efterträdaren som tog över den klubb spelaren sparkades från. */
  replacementCoachName: string
  /**
   * Skärpning 2:s villkor. Sant när gamla klubben gjorde det SÄMRE under
   * efterträdaren än under spelarens sista säsong — det enda fall då den får
   * ringa tillbaka.
   */
  formerClubDidWorse: boolean
  seasonsSimulated: number
  /**
   * Sluttabellen för den SISTA simulerade säsongen — den som gjorde stolarna
   * lediga. Måste bäras här: `game.standings` nollställs av
   * seasonEndProcessor vid varje rollover (`calculateStandings(ids, [])`), så
   * efter uppehållet innehåller det live-fältet en tom tabell med godtycklig
   * ordning. Att läsa det gav erbjudanden från samma klubb oavsett vad som
   * faktiskt hänt (upptäckt i fördelningsmätningen 2026-08-29: en och samma
   * klubb i elva av tolv karriärer). Källan är i stället säsongens frysta
   * `SeasonSummary.standingsSnapshot`.
   */
  finalStandings: Array<{ clubId: string; position: number }>
}

export interface CareerOffer {
  clubId: string
  clubName: string
  /** Slutplacering säsongen som gjorde tränarstolen ledig. */
  lastPosition: number
  boardExpectation: ClubExpectation
  reputation: number
  /** Klubben spelaren sparkades från — domens skärpning 2. */
  isFormerClub: boolean
  /** Tränaren som fick gå, och vars stol erbjuds. */
  departedCoachName: string
  /** Klubbens egen pitch. '[Opus]' tills texten är skriven. */
  pitch: string
}

export interface CareerBreakState {
  firedAtSeason: number
  /**
   * Domens icke förhandlingsbara ordning: "Först ser du säsongen. Sedan får
   * du frågan." 'season' = spelaren har sett avskedet men inte utfallet.
   * 'market' = utfallet är sett, frågan är ställd.
   */
  stage: 'season' | 'market'
  report: CareerBreakReport
  renomme: number
  offers: CareerOffer[]
  /** Skärpning 3: inget samtal kom. `Ny karriär` är enda vägen vidare. */
  careerOver: boolean
}

// ── Erbjudandegenerering ───────────────────────────────────────────────────

/**
 * Klubbar som misslyckades medan spelaren satt hemma. Domen: "Inte ett urval
 * spelet gör åt dig — en följd av vad som hände."
 *
 * Kriteriet är rent positionellt: klubben slutade i bottenbandet
 * (`vacancyZoneSize`) den sista säsongen av uppehållet.
 *
 * Ordning: BÄST placerad först. Renommén styr HUR MÅNGA dörrar som är öppna,
 * inte vilken kvalitet den enskilda dörren har — en manager med ett enda
 * samtal ska inte dessutom straffas med det sämsta jobbet i bunten. Domen
 * gör antalet till signalen ("hög ger tre, låg ger ett eller inget"), och
 * prestigespärren sitter separat i `betterClubUnlocked` nedan.
 *
 * VARFÖR SURVIVE-UNDANTAGET INTE GÄLLER HÄR (medvetet, inte förbisett):
 * seasonEndProcessor undantar `Survive`-klubbar från spelarens EGET
 * avskedskontrakt ("att förlora är förväntat — det är premissen", Jacobs dom
 * 2026-08-25). Den regeln handlar om vad spelet lovar SPELAREN, inte om
 * huruvida små klubbar byter tränare. Att extrapolera den till AI-klubbar
 * mättes 2026-08-29 och tömde marknaden helt: efter tre säsonger hade
 * boardExpectation-stegningen gjort hela bottenbandet Survive-klassat i
 * flera världar, och en manager med renommé 100 fick noll samtal — stick i
 * stäv med domens "Tre av dem, ur ligans botten". Prestigeaxeln hanteras
 * i stället där den hör hemma: `betterClubUnlocked` i buildCareerOffers.
 */
export function findVacantClubs(
  game: SaveGame,
  standings: Array<{ clubId: string; position: number }>,
  excludeClubIds: string[],
): Array<{ clubId: string; position: number }> {
  const totalTeams = game.clubs.length
  const excluded = new Set(excludeClubIds)
  return standings
    .filter(row => !excluded.has(row.clubId))
    .filter(row => isVacancyZone(row.position, totalTeams))
    .filter(row => game.clubs.some(c => c.id === row.clubId))
    .map(row => ({ clubId: row.clubId, position: row.position }))
    .sort((a, b) => a.position - b.position)
}

export interface BuildOffersInput {
  game: SaveGame
  report: CareerBreakReport
  renomme: number
  firings: number
}

/**
 * Sätter ihop de 0–3 samtalen. Ordningen är avsiktlig: gamla klubben först
 * (skärpning 2 — domen kallar den den bästa berättelsen i hela mekaniken, då
 * får den inte kunna konkurreras bort av taket), sedan de lediga klubbarna
 * bäst placerad först.
 */
export function buildCareerOffers(input: BuildOffersInput): CareerOffer[] {
  const { game, report, renomme, firings } = input
  const count = offerCountForRenomme(renomme, firings)
  if (count === 0) return []

  const totalTeams = game.clubs.length
  const formerClub = game.clubs.find(c => c.id === report.formerClubId)
  const formerReputation = formerClub?.reputation ?? 50

  // Skärpning 1: en bättre klubb än den du lämnade kräver att du presterade
  // där. Utan spärren hade ett avsked kunnat vara en befordran.
  const betterClubUnlocked =
    renomme >= RENOMME_TIER_THREE &&
    performedAtClub(game.seasonSummaries ?? [], report.formerClubId, totalTeams)

  const candidates: Array<{ clubId: string; position: number; isFormerClub: boolean }> = []

  if (report.formerClubDidWorse) {
    candidates.push({
      clubId: report.formerClubId,
      position: report.bestPositionUnderReplacement,
      isFormerClub: true,
    })
  }

  for (const v of findVacantClubs(game, report.finalStandings, [report.formerClubId])) {
    const club = game.clubs.find(c => c.id === v.clubId)
    if (!club) continue
    if ((club.reputation ?? 50) > formerReputation && !betterClubUnlocked) continue
    candidates.push({ ...v, isFormerClub: false })
  }

  return candidates.slice(0, count).map(c => {
    const club = game.clubs.find(cl => cl.id === c.clubId)!
    return {
      clubId: club.id,
      clubName: club.name,
      lastPosition: c.position,
      boardExpectation: club.boardExpectation,
      reputation: club.reputation ?? 50,
      isFormerClub: c.isFormerClub,
      departedCoachName: c.isFormerClub
        ? report.replacementCoachName
        : (game.aiCoaches?.[club.id]?.name ?? ''),
      // SVENSK TEXT — CODE SKRIVER ALDRIG (CLAUDE.md). Opus skriver pitchen.
      pitch: '[Opus]',
    }
  })
}
