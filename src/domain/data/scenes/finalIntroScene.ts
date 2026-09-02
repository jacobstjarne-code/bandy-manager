/**
 * SM-final-uppspelet — scentext (B1 incoming fil 5 / A3-mock 2026-06-11).
 *
 * Mock: docs/incoming/2026-06-11_design_smfinal_uppspel.html (typografiska scenen i sekvens:
 * portal-ref → uppspel m. final-illustration → komponerad lagpresentation). Ersätter det gamla
 * FinalIntroScreen-uppspelet (jätte-🏆, GoldConfetti före avslag, NÄSTA-pill, "Säsong {season}").
 *
 * DET HÄR ÄR OPUS-TEXTEN. Komponenten (tier-prop gold=final/copper=kvarts-semi, illustration
 * som optional prop, typografisk scen) byggs av Code mot mocken — men texten är min, och den var
 * mis-parkerad: jag sköt fil 5 till "STEG 4 efter Förbättring 2+3", men det är prioritet, inte
 * beroende. Texten är skrivbar nu eftersom datan finns (klubbar, getFinalJourney, serieplacering,
 * väder, assistantCoach) — samma läge som Valet, inte hall-prövningen.
 *
 * Tonalitet: bruksort, understatement, allvar utan svulst. Finalen är stor — texten ska bära det
 * genom återhållsamhet, inte genom stora ord. Gold-tier (SM-final) = full vikt; copper-tier
 * (kvarts/semi) = samma form, nedtonad inramning, ingen titel-retorik.
 *
 * KANON-NOT: SM-finalen spelas tredje lördagen i mars på Studenternas IP, Uppsala (kalender-
 * refaktorn B11). Mockens "Annandagsbandy på Studenternas" är mock-flavor som motsäger den
 * låsningen — därför templatas hjälten mot finalens faktiska inramning, ej hårdkodad annandag.
 *
 * VAD CODE GÖR: bygger tier-prop-komponenten mot mocken; statradens SIFFROR härleds i Code
 * (serieplacering ur homeStanding/awayStanding, slutspelsresultat ur bracket — getFinalJourney
 * ger prosa, inte W–L-tal, så siffran är en egen liten derivation). Etiketterna nedan är mina.
 */

import type { SaveGame } from '../../entities/SaveGame'
import type { Fixture } from '../../entities/Fixture'
import type { MatchWeather } from '../../entities/Weather'
import type { CoachPersonality } from '../../entities/AssistantCoach'
import { getConditionLabel } from '../../services/weatherService'
import { rotateSubject } from '../../services/narrativeCoordinatorService'
import { seededPick } from '../../utils/random'

export type FinalTier = 'gold' | 'copper'  // gold = SM-final, copper = kvarts/semi

export interface FinalIntroScene {
  /** Genre-etikett — "⬩ SM-FINAL ⬩" (gold) / "⬩ KVARTSFINAL ⬩" etc (copper). */
  eyebrow: string
  /** Hjälteraden — finalens inramning, ej hårdkodad annandag. */
  hero: string
  /** Kursiv ingress — stakes i understatement. Komponerad ur väder + arena + klubb. */
  ingress: string
  /** Statradens etiketter (siffrorna härleds i Code). */
  statLabels: { serien: string; slutspel: string }
  /** Lagpresentationens nyckelreplik — assisterande tränaren. */
  keyline: { quote: string; speaker: string }
  /** Samma urvalsnycklar som scenen visar, skrivs när spelaren går till avslag. */
  narrativeKeys: readonly [hero: string, ingress: string, keyline: string]
  /** Scen-CTA:er (uppercase per mockens casing). */
  ctaToLineup: string
  ctaToKickoff: string
}

const VENUE = 'Studenternas IP'

/**
 * MB-repliken — assisterande tränarens ord före finalen, nyckfrom personlighet.
 * Två per personlighet (10 totalt, lärdom #7-golv). Talaren är assistantCoach.name;
 * tonen följer assistantCoach.personality. Underdog-vinkeln (mockens "vi har inget att
 * förlora") är default — Code kan välja annan rad om laget är favorit, men poolen håller
 * understatement oavsett.
 */
const KEYLINE_POOL: Record<CoachPersonality, string[]> = {
  calm: [
    'De har rutinen. Vi har ingenting att förlora. Jag vet vilket jag hellre har i en final.',
    'Vi har gjort det vi kan på träningarna. Nu är det bara att spela. Det är skönt, faktiskt.',
    'Ingen av oss har varit här förr. Det gör det enklare. Man kan inte tappa något man aldrig haft.',
    'Isen är sig lik. Målet är lika stort. Vi har spelat hundra matcher — det här är en till.',
  ],
  sharp: [
    'Alla pratar om dem. Bra. Då tittar ingen på vad vi gör de första tio minuterna.',
    'En final avgörs på detaljer. Vi har gått igenom deras. Frågan är om de gått igenom våra.',
    'De vann serien. Vi tog oss hit ändå. Fundera på vad det säger om vem som är trött.',
    'Vi vet exakt hur de spelar sista kvarten. Frågan är om de orkar dit.',
  ],
  jovial: [
    'Halva bandysverige på läktarna och is under skridskorna. Vad mer ska en gammal bandytok begära?',
    'Killarna är spända. Bra. Spänd betyder att man bryr sig. Jag hade oroat mig om de gäspade.',
    'Jag lovade far min att stå på Studenternas en gång till innan jag la av. Här är vi.',
    'Titta upp på läktaren, killar. Halva orten har åkt hit. Sånt glömmer man inte.',
  ],
  grumpy: [
    'Favoriter. Underdogs. Strunt i allt det. Två lag, en plan, nitti minuter. Resten är prat.',
    'Jag har sett finaler vinnas av sämre lag än det här. Och förloras av bättre. Spela bara.',
    'Finalnerver. Alla har dem. Den som låtsas annat ljuger. Spela ändå.',
    'Jag bryr mig inte om vad tidningarna skrev. Tidningar spelar inte bandy.',
  ],
  philosophical: [
    'En final minns man hela livet. Åt ena hållet eller det andra. Det är det som gör den värd något.',
    'Vi har rest hit på vårt sätt. De på sitt. Idag möts de två berättelserna. Bara den ena får slutet den ville ha.',
    'Man vinner inte en final. Man förtjänar den, eller så gör man det inte. Idag får vi veta vilket.',
    'Nittio minuter mot allt som lett hit. Det är en rättvis byteshandel.',
  ],
}

/**
 * Copper-poolen — kvarts/semi, bäst av fem. Samma personligheter, ingen final-
 * retorik, inget ödesspråk (serien fortsätter efter en förlust). 2 per personlighet
 * (lärdom #7-golv).
 */
const COPPER_KEYLINE_POOL: Record<CoachPersonality, string[]> = {
  calm: [
    'Vinn, så spelar vi igen på lördag. Det är hela planen.',
    'Slutspel är slutspel. Samma is, högre pris. Vi gör det vi brukar.',
    'Ta en match i taget. Bokstavligt. Det är det enda som finns nu.',
    'Vi har gjort det förr — vunnit när det gällde. Kroppen minns.',
  ],
  sharp: [
    'De har tittat på oss i två dagar. Vi har tittat på dem i tre.',
    'Serien är glömd nu. Det som räknas börjar vid avslaget.',
    'De sparade nog benen till final. Vi ska se till att det inte blir någon.',
    'Först till tre. Vinn de rätta kvällarna, inte alla.',
  ],
  jovial: [
    'Slutspelsbandy! Det är nu det luktar riktig vinter om det.',
    'Killarna sov dåligt i natt. Jag med. Det är så det ska kännas.',
    'Slutspel! Nu blir det trångt vid kaffet i pausen.',
    'Ingen frågar hur man kom till final. Bara att man kom dit.',
  ],
  grumpy: [
    'Slutspel. Folk gör det större än det är. Samma regler som i oktober.',
    'Fem matcher, först till tre. Resten är prat.',
    'Serien sa en sak. Slutspelet säger en annan. Lyssna på det senare.',
    'Vinn ikväll så slipper vi prata om det imorgon.',
  ],
  philosophical: [
    'Serier belönar tålamod. Slutspel belönar mod. Vi får se vilka vi är.',
    'Allt sedan oktober var för att få stå här. Nu står vi här.',
    'Fem matcher är en liten säsong. Den som håller ihop bäst går vidare.',
    'Det är nu det avgörs vilka som var på riktigt.',
  ],
}

// D-E (DOMLOGG 2026-08-31): hjälte + ingress var en enda hårdkodad ram per tier
// — den mest exponerade repetitionen i spelet, eftersom hela långloopen siktar
// hit. Nu pooler. Venue är kanon (Studenternas, tredje lördagen i mars) så den
// står kvar; det är RAMEN som varierar. seededPick på fixture.id ger stabil-per-
// match, varierad-mellan-finaler. CODE SVEPER SEDAN seededPick → rotateSubject
// (narrativeCoordinatorService, nyckel 'final-hero'/'final-ingress' per tier) så
// två raka finaler aldrig får samma ram förrän poolen rullat — samma garanti som
// journalistExclusive, inte bara en 1/N-chans.
const HERO_POOL_GOLD = [
  `Final.\n${VENUE}.`,
  `Sista lördagen.\n${VENUE}.`,
  `Hit ledde allt.\n${VENUE}.`,
  `En match kvar.\n${VENUE}.`,
]
const HERO_POOL_COPPER = [
  'Slutspel.\nFörst till tre.',
  'Bäst av fem.\nDet börjar nu.',
  'Inte serien längre.\nFörst till tre.',
]

const INGRESS_POOL_GOLD = [
  `Finaldag. {väder}\nDet här är matchen alla i {klubb}\nkommer att minnas — åt ena hållet\neller det andra.`,
  `{väder} Tredje lördagen i mars,\noch {klubb} står kvar när det räknas.\nEn match skiljer.`,
  `Finaldag på ${VENUE}. {väder}\n{klubb} har rest långt för det här.\nNu är det bara att spela.`,
  `{väder}\nAllt sedan oktober var för det här.\nNu står {klubb} här. En match.`,
]
const INGRESS_POOL_COPPER = [
  `{väder} Bäst av fem.\nDet räcker inte att vinna en kväll —\ndet ska göras om, och om igen.`,
  `{väder} Slutspel. Serien är glömd;\ndet som räknas börjar vid avslaget.`,
  `Slutspelskväll. {väder}\nVinn, så spelas det igen.\nFörlora tre, och vintern är slut.`,
]

function pickRotatingFrame(
  pool: readonly string[],
  semanticKeyPrefix: string,
  game: SaveGame,
  seed: number,
): { text: string; semanticKey: string } {
  const selected = rotateSubject(
    pool.map((text, index) => ({ id: String(index), text })),
    semanticKeyPrefix,
    game,
    Infinity,
    candidates => seededPick(candidates, seed),
  )
  if (!selected) throw new Error(`Tom finaltextpool: ${semanticKeyPrefix}`)
  return { text: selected.text, semanticKey: `${semanticKeyPrefix}${selected.id}` }
}

function buildHero(tier: FinalTier, game: SaveGame, seed: number): { text: string; semanticKey: string } {
  // Ej hårdkodad annandag (se kanon-not). Venue är kanon i gold-poolen; copper
  // spelas hos lagen (INTE Studenternas), bäst av fem, inget ödesspråk.
  return pickRotatingFrame(
    tier === 'gold' ? HERO_POOL_GOLD : HERO_POOL_COPPER,
    `final-hero_${tier}_`,
    game,
    seed,
  )
}

function buildIngress(
  tier: FinalTier,
  game: SaveGame,
  managedClubName: string,
  seed: number,
  weather?: MatchWeather,
): { text: string; semanticKey: string } {
  const cond = weather ? getConditionLabel(weather.weather.condition).toLowerCase() : null
  const väder = cond ? `${cond}.` : 'Vinterljus över planen.'
  const selected = pickRotatingFrame(
    tier === 'gold' ? INGRESS_POOL_GOLD : INGRESS_POOL_COPPER,
    `final-ingress_${tier}_`,
    game,
    seed + 1,
  )
  return {
    text: selected.text.replace(/\{väder\}/g, väder).replace(/\{klubb\}/g, managedClubName),
    semanticKey: selected.semanticKey,
  }
}

// E-FS1 (BACKLOG.md): SM-final-uppspelet renderas i två komponenter (Förbered/
// MatchLaddningScene, Spela/FinalIntroScreen) — statradens etiketter delades
// tidigare mellan en hårdkodad JSX-sträng i MatchLaddningScene och detta
// statLabels-fält, samma två ord från två separata källor. En konstant, båda
// läser den.
export const FINAL_STAT_LABELS = { serien: 'Serien', slutspel: 'Slutspelet' } as const

export function getFinalIntroScene(
  game: SaveGame,
  fixture: Fixture,
  tier: FinalTier = 'gold',
): FinalIntroScene {
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const managedClubName = managedClub?.name ?? 'klubben'
  const weather = game.matchWeathers?.find(w => w.fixtureId === fixture.id)
  const coach = game.assistantCoach
  const eyebrow = tier === 'gold' ? '⬩ SM-FINAL ⬩' : '⬩ SLUTSPEL ⬩'

  // MB-replik: pool nyckom personlighet OCH tier — gold-poolen är finalskriven,
  // copper (kvarts/semi, bäst av fem) har egen pool utan finalretorik.
  // Tie-break är stabil för tier+säsong+motstånd, medan rotateSubject läser
  // karriärloggen och tar bort redan visade ramar före själva seedvalet.
  const personality: CoachPersonality = coach?.personality ?? 'calm'
  const pool = (tier === 'gold' ? KEYLINE_POOL : COPPER_KEYLINE_POOL)[personality]
  const seedKey = `${tier}:${fixture.season}:${fixture.homeClubId}:${fixture.awayClubId}`
  const seed = seedKey.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const hero = buildHero(tier, game, seed)
  const ingress = buildIngress(tier, game, managedClubName, seed, weather)
  const keyline = pickRotatingFrame(pool, `final-keyline_${tier}_${personality}_`, game, seed)
  const speaker = coach ? `${coach.name} · Assisterande tränare` : 'Assisterande tränaren'

  return {
    eyebrow,
    hero: hero.text,
    ingress: ingress.text,
    statLabels: FINAL_STAT_LABELS,
    keyline: { quote: keyline.text, speaker },
    narrativeKeys: [hero.semanticKey, ingress.semanticKey, keyline.semanticKey],
    ctaToLineup: 'LAGEN →',
    ctaToKickoff: 'TILL AVSLAG →',
  }
}
