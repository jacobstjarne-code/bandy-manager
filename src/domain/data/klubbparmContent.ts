import type { SaveGame } from '../entities/SaveGame'
import { currentLeagueRound } from '../services/anslagService'

/**
 * Klubbpärmen — kapitel-registry med unlock-predikat mot riktig game-state.
 * Instruktion: docs/CODE_INSTRUKTION_TILLTRADET_KLUBBPARMEN_2026-06-26.md
 *
 * OPUS: alla sex kapitel skrivna i bruksortens protokoll-röst, grundade mot mekaniken
 * (se kommentarerna vid varje const-block). Code lägger ingen egen prosa här och ändrar
 * inte texten — Code äger registry + unlock-logik + rendering, inte orden.
 */

export interface KlubbparmChapterContent {
  /** Brödtext-stycken i protokoll-röst (Opus fyller). Tom array = väntar text. */
  paragraphs: string[]
  /** Valfri "Tumregel"-callout sist i kapitlet. */
  tumregel?: string
}

export interface KlubbparmChapter {
  id: string
  label: string
  /** Predikat mot game-state — kapitlet växer fram när systemet låses upp. */
  isUnlocked: (game: SaveGame) => boolean
  content: KlubbparmChapterContent
}

// ── Opus-skriven kapiteltext (bruksortens protokoll-röst, se WRITING_GUIDELINES) ──
// De tre öppna grundkapitlen. Grundade mot faktisk mekanik: Hörnor =
// cornerInteractionService (zoner/leverans/5s), Matchen = MatchLiveScreen-flödet,
// Orten = TAB_INTROS.orten (bygdens stöd → puls → hemmaplansfördel + sponsorer).

const HORNOR: KlubbparmChapterContent = {
  paragraphs: [
    'När laget får hörna stannar matchen och frågan blir din. Du väljer var bollen ska läggas — nära, mitt eller bortre — och hur den slås: hård, låg eller kort.',
    'Zonerna är inte lika. Vilken som lönar sig växlar med vilka du har på isen och vad motståndaren ställt på straffområdet — siffran vid varje zon säger oddset just då.',
    'Under match har du fem sekunder på dig. Hinner du inte bestämma slår laget som det alltid gjort. Assisterande tränaren säger oftast sitt innan dess — han har sett motståndaren värma upp.',
  ],
  tumregel: 'Ett halvbra val slaget i tid är bättre än det perfekta som aldrig kom iväg.',
}

const MATCHEN: KlubbparmChapterContent = {
  paragraphs: [
    'Matchen rullar av sig själv. Referatet i feeden berättar vad som händer minut för minut, och du ser på som alla andra på läktaren — ända tills något kräver dig.',
    'Vid hörnor, straffar, kontringar och frislag stannar det och valet blir ditt. Sent i en jämn match kan ett läge till dyka upp. Då, och bara då, bestämmer du — resten sköter laget.',
    'Du kan pausa när du vill, snabbsima genom lugnare partier och byta spelare under tiden. Taktiken får du justera tre gånger på en match: tempo, press, hur högt laget ligger. Spara dem till när de behövs.',
    'I halvtid får du säga ditt i omklädningsrummet. Lugna ner eller pressa på, det märks i andra halvlek.',
  ],
  tumregel: 'Tre taktikbyten räcker längre än man tror. Den som ändrar vid varje baklängesmål har inget kvar när det verkligen vänder.',
}

const ORTEN: KlubbparmChapterContent = {
  paragraphs: [
    'Bandy i en bruksort är aldrig bara laget. Det är frivilliga som spolar isen, kommunen som plogar parkeringen, mecenaten som skjuter till när det knakar — allt det runtomkring som håller en förening vid liv.',
    'Det samlas i pulsen: bygdens stöd, mätt. Hög puls fyller läktaren och gör hemmaisen till en fördel — motståndaren trivs sämre, och sponsorer syns hellre på en arena med liv.',
    'Pulsen sköter sig inte själv. Föreningsaktiviteter, hur det går på isen och hur du behandlar dem som ställer upp väger alla in. Tappar du bygden tar det lång tid att vinna tillbaka den.',
  ],
  tumregel: 'Sköt orten i medgång, så bär den dig i motgång.',
}

// De tre låsta kapitlen (renderas när sina system tänds). Grundade mot: Klacken =
// supporterService (namngiven klack, ledare, ritual, favoritspelare, mood-skala,
// växer/glesnar på hemmaresultat), Ekonomi = TAB_INTROS.ekonomi + facilityDescriptions
// (kassa/intäkter → styrelse/sponsorer; bygget sten för sten med avvägningar),
// Slutspel = playoffService (topp 8, #1v#8-seedning, kvarts/semi bäst av fem,
// SM-final en match på neutral plan).

const KLACKEN: KlubbparmChapterContent = {
  paragraphs: [
    'Klacken är inte publik — det är dom som står kvar när det regnar och laget ligger under. Dom har ett namn, en ledare och en ramsa dom tar när det vänder. Och en favorit i laget, oftast den som avgör flest matcher.',
    'Humöret rör sig med resultaten. Hemmasegrar lyfter det, förluster tär. Står det högt fylls läktaren och hemmaisen blir en fördel — motståndaren trivs sämre i en full kurva. Faller det för länge glesnar leden, och en tom kurva tar tid att fylla.',
    'Favoriten utser dom själva, och dom märker när han försvinner. Säljer du den klacken samlats kring får du höra det, på läktaren och i kassan. Sånt väger tyngre i en bruksort än en övergångssumma.',
  ],
  tumregel: 'En klack vinner inga matcher åt dig. Men en tom läktare har aldrig hjälpt någon vinna heller.',
}

const EKONOMI: KlubbparmChapterContent = {
  paragraphs: [
    'Kassan håller klubben igång. Intäkterna kommer från läktaren, kiosken och sponsorerna, och röda siffror tär på styrelsens tålamod och skrämmer dom som annars satt sitt namn på arenan.',
    'Med tiden bygger du klubben sten för sten — värmestuga, läktare, belysning, en hall. Varje bygge flyttar tre saker på en gång: publik, själ och ekonomi. Det som är låst kräver att du rest något annat först.',
    'Allt kostar mer än pengar. Tak över isen ger bandy året runt och tv-avtal, men klacken glesnar — de trognaste ser tak som ett svek mot utebandyn. Vad du bygger säger lika mycket om klubben som vad du köper till laget.',
  ],
  tumregel: 'Bygg det orten vill ha, inte bara det tabellen vill ha.',
}

const SLUTSPEL: KlubbparmChapterContent = {
  paragraphs: [
    'De åtta bästa i serien går till slutspel. Ettan möter åttan, tvåan sjuan, och så ner. Har du spelat hem en hög placering möter du ett svagare lag först; har du knappt tagit dig in får du toppen direkt.',
    'Kvartsfinal och semifinal avgörs i serie — först till tre segrar går vidare, som mest fem möten. Här räcker det inte att vara bra en kväll. Den som håller ihop över fem matcher står kvar.',
    'SM-finalen är en enda match, på neutral plan. En afton, ingen retur. Allt laget byggt under säsongen vägs på nittio minuter på främmande is.',
  ],
  tumregel: 'Ingen vinner i mars som inte gjort jobbet i november.',
}

export const KLUBBPARM_CHAPTERS: KlubbparmChapter[] = [
  // Hörnor + Matchen + Orten: alltid öppna (grunden, lärs i Tillträdet).
  { id: 'hornor',  label: 'Hörnor',  isUnlocked: () => true, content: HORNOR },
  { id: 'matchen', label: 'Matchen', isUnlocked: () => true, content: MATCHEN },
  { id: 'orten',   label: 'Orten',   isUnlocked: () => true, content: ORTEN },
  // Klacken: när klack-systemet är aktivt (supporterGroup finns).
  { id: 'klacken', label: 'Klacken', isUnlocked: g => g.supporterGroup != null, content: KLACKEN },
  // Ekonomi: när B1 Klubbutveckling är upplåst (facilityState-markören).
  { id: 'ekonomi', label: 'Ekonomi', isUnlocked: g => g.facilityState != null, content: EKONOMI },
  // Slutspel: bracket finns ELLER grundserien är slut (omgång ≥ 22).
  { id: 'slutspel', label: 'Slutspel', isUnlocked: g => g.playoffBracket != null || currentLeagueRound(g) >= 22, content: SLUTSPEL },
]

/**
 * True tills Opus fyllt kapitlet — driver `[Opus]`-stubben i UI:t
 * (KlubbparmOverlay.tsx). SÄKERHETSNÄT, inte förväntad väg: verifierat
 * 2026-07-21 (release-svepet) att alla sex nuvarande kapitel (Hörnor/
 * Matchen/Orten/Klacken/Ekonomi/Slutspel) har `paragraphs.length > 0` —
 * stubben är i praktiken oåtkomlig idag. Lägg ALLTID text i KLUBBPARM_
 * CHAPTERS samma commit som ett sjunde kapitel läggs till ovan, annars
 * renderar overlayn en synlig '[Opus]'-platshållare för det kapitlet.
 */
export function chapterAwaitsText(ch: KlubbparmChapter): boolean {
  return ch.content.paragraphs.length === 0
}
