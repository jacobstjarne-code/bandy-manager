import type { SaveGame } from '../entities/SaveGame'
import { getCurrentAct } from './seasonActService'
import { pickPoolIndexAvoidingCooldown } from './narrativeLogService'

/**
 * DOM_PEPTALK_YTA_2026-09-02 (Opus + Jacob): wirad till förbered-fasen som
 * en tränar-reflektion inför nästa match (INTE ambient PortalBeat — dessa
 * repliker är efter-match-reflektioner som blickar framåt, "omklädningsrums-
 * tal", för specifika/reaktiva för bakgrund). Konsumeras av MatchScreen.tsx
 * i förbered-fasen. Texten (21 låsta repliker, fem kategorier) och den
 * deterministiska round-seedningen är oförändrade sedan `f7580371`.
 *
 * Beslut 3 (cooldown): replikvalet undviker nu samma index den senast
 * visade genom `pickPoolIndexAvoidingCooldown` (narrativeBeatLog, samma
 * primitiv som burnoutReliefService.ts) — samma peptalk kommer inte upprepat
 * innan hela poolen för kategorin har roterat. RÄTT lager per
 * DOM_LIGGARE_COOLDOWN_GRANS: detta är VISNING-cooldown, inte kanon.
 */

export type PepTalkCategory = 'win' | 'loss' | 'draw' | 'crisis' | 'top'

export const PEPTALK_QUOTE_PREFIX = 'peptalk_'

const PEP_WIN = [
  'Vi vann inte för att vi var bäst. Vi vann för att vi ville mest.',
  'Två poäng. Inget snack. Nu fokuserar vi framåt.',
  'Det fanns ett beslut i omklädningsrummet före avslag. Ni valde rätt.',
  'Jag ser spelare som tror på varandra. Det är farligare än talang.',
  'Bra matcher vinner man med skridskorna. Stora matcher vinner man med huvudet.',
]

const PEP_LOSS = [
  'Vi förlorade en match. Inte vår identitet. Tillbaka på isen imorgon.',
  'Ingen kommer ihåg den här matchen i mars. Men de kommer ihåg hur vi reagerade.',
  'Ibland lär man sig mer av en förlust än tio vinster. Frågan är om ni har modet att lyssna.',
  'Det enda jag inte accepterar är att ge upp. Och det gjorde ni inte idag.',
  'Vi var inte tillräckligt bra. Punkt. Nu jobbar vi.',
]

const PEP_DRAW = [
  'En poäng kan vara guld eller skit. Beror på vad vi gör med den.',
  'Vi hämtade en poäng borta. Minns det i mars när det skiljer ett poäng.',
  'Inte nöjd. Men inte besviken. Det är mellanrummet där lag formas.',
]

const PEP_CRISIS = [
  'Ingen räddare kommer. Vi är räddarna. Varje omgång, varje duell.',
  'Jag har sett lag i sämre läge vända. Men inte lag som slutade träna.',
  'Om ni vill ha en tränare som ljuger — hämta honom. Jag säger sanningen: vi måste bli bättre.',
]

const PEP_TOP = [
  'Vi är där. Att stanna kvar är nästa steg.',
  'Varje lag under oss jagar. Vi kan inte slappna av en sekund.',
  'Njut inte ännu. Njut i mars.',
]

const POOL_BY_CATEGORY: Record<PepTalkCategory, string[]> = {
  win: PEP_WIN,
  loss: PEP_LOSS,
  draw: PEP_DRAW,
  crisis: PEP_CRISIS,
  top: PEP_TOP,
}

export interface PepTalkSelection {
  category: PepTalkCategory
  index: number
  /** roundNumber på matchen reflektionen gäller — bara relevant för win/loss/draw:s aktsuffix. */
  lastFixtureRoundNumber: number
}

/**
 * Ren härledning: vilken kategori/replikindex gäller för spelarens senast
 * spelade match. Delad av getPepTalk (render) och roundProcessor.ts (loggar
 * `${PEPTALK_QUOTE_PREFIX}${category}_${index}` som en narrativeBeatLog-post
 * när matchen avgörs, samma "logga NÄR DE VISAS"-mönster som burnout).
 */
export function selectPepTalk(game: SaveGame): PepTalkSelection | null {
  const standing = game.standings.find(s => s.clubId === game.managedClubId)
  if (!standing || standing.played === 0) return null

  const lastFixture = game.fixtures
    .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => b.matchday - a.matchday)[0]

  if (!lastFixture) return null

  const isHome = lastFixture.homeClubId === game.managedClubId
  const myScore = isHome ? lastFixture.homeScore : lastFixture.awayScore
  const theirScore = isHome ? lastFixture.awayScore : lastFixture.homeScore

  // Use round number as deterministic tie-break seed for quote selection
  const seed = lastFixture.roundNumber

  let category: PepTalkCategory
  // Crisis: position 11-12 or way more losses than wins
  if (standing.position >= 11 || standing.losses >= standing.wins + 3) {
    category = 'crisis'
  // Top: position 1-3 after 5+ rounds
  } else if (standing.position <= 3 && standing.played >= 5) {
    category = 'top'
  } else if (myScore > theirScore) {
    category = 'win'
  } else if (myScore < theirScore) {
    category = 'loss'
  } else {
    category = 'draw'
  }

  const poolLength = POOL_BY_CATEGORY[category].length
  const index = pickPoolIndexAvoidingCooldown(game, game.currentSeason, poolLength, `${PEPTALK_QUOTE_PREFIX}${category}_`, seed, 1)

  return { category, index, lastFixtureRoundNumber: lastFixture.roundNumber }
}

export function getPepTalk(game: SaveGame): string | null {
  const selection = selectPepTalk(game)
  if (!selection) return null
  const { category, index, lastFixtureRoundNumber } = selection
  const text = POOL_BY_CATEGORY[category][index]

  if (category === 'crisis' || category === 'top') return text

  // Act-based suffix added to result quotes
  const act = getCurrentAct(lastFixtureRoundNumber)
  const ACT_SUFFIX: Record<typeof act, string> = {
    1: ' Säsongen är ung — varje match är lärdom.',
    2: ' Vintern testar viljan. Ni bestämmer.',
    3: ' Tabellen klarnar. Varje poäng räknas nu.',
    4: ' Det är avgörandet. Inget mer att spara.',
  }
  const suffix = act >= 3 ? ACT_SUFFIX[act] : ''

  return text + suffix
}
