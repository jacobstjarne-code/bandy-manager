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
  ],
  sharp: [
    'Alla pratar om dem. Bra. Då tittar ingen på vad vi gör de första tio minuterna.',
    'En final avgörs på detaljer. Vi har gått igenom deras. Frågan är om de gått igenom våra.',
  ],
  jovial: [
    'Halva bandysverige på läktarna och is under skridskorna. Vad mer ska en gammal bandytok begära?',
    'Killarna är spända. Bra. Spänd betyder att man bryr sig. Jag hade oroat mig om de gäspade.',
  ],
  grumpy: [
    'Favoriter. Underdogs. Strunt i allt det. Två lag, en plan, nitti minuter. Resten är prat.',
    'Jag har sett finaler vinnas av sämre lag än det här. Och förloras av bättre. Spela bara.',
  ],
  philosophical: [
    'En final minns man hela livet. Åt ena hållet eller det andra. Det är det som gör den värd något.',
    'Vi har rest hit på vårt sätt. De på sitt. Idag möts de två berättelserna. Bara den ena får slutet den ville ha.',
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
  ],
  sharp: [
    'De har tittat på oss i två dagar. Vi har tittat på dem i tre.',
    'Serien är glömd nu. Det som räknas börjar vid avslaget.',
  ],
  jovial: [
    'Slutspelsbandy! Det är nu det luktar riktig vinter om det.',
    'Killarna sov dåligt i natt. Jag med. Det är så det ska kännas.',
  ],
  grumpy: [
    'Slutspel. Folk gör det större än det är. Samma regler som i oktober.',
    'Fem matcher, först till tre. Resten är prat.',
  ],
  philosophical: [
    'Serier belönar tålamod. Slutspel belönar mod. Vi får se vilka vi är.',
    'Allt sedan oktober var för att få stå här. Nu står vi här.',
  ],
}

function buildHero(tier: FinalTier): string {
  // Ej hårdkodad annandag (se kanon-not). Gold bär finalarenan; copper är kvarts/semi —
  // spelas hos lagen (INTE Studenternas) och är bäst av fem, så ingen venue, inget ödesspråk.
  if (tier === 'gold') return `Final.\n${VENUE}.`
  return `Slutspel.\nFörst till tre.`
}

function buildIngress(
  tier: FinalTier,
  managedClubName: string,
  weather?: MatchWeather,
): string {
  const cond = weather ? getConditionLabel(weather.weather.condition).toLowerCase() : null
  const väder = cond ? `${cond}.` : 'Vinterljus över planen.'
  if (tier === 'gold') {
    return `Finaldag. ${väder}\nDet här är matchen alla i ${managedClubName}\nkommer att minnas — åt ena hållet\neller det andra.`
  }
  return `${väder} Bäst av fem.\nDet räcker inte att vinna en kväll —\ndet ska göras om, och om igen.`
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
  // seededPick på fixture.id så repliken är stabil för matchen men varierar mellan finaler.
  const personality: CoachPersonality = coach?.personality ?? 'calm'
  const pool = (tier === 'gold' ? KEYLINE_POOL : COPPER_KEYLINE_POOL)[personality]
  const seed = fixture.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const quote = seededPick(pool, seed)
  const speaker = coach ? `${coach.name} · Assisterande tränare` : 'Assisterande tränaren'

  return {
    eyebrow,
    hero: buildHero(tier),
    ingress: buildIngress(tier, managedClubName, weather),
    statLabels: FINAL_STAT_LABELS,
    keyline: { quote, speaker },
    ctaToLineup: 'LAGEN →',
    ctaToKickoff: 'TILL AVSLAG →',
  }
}
