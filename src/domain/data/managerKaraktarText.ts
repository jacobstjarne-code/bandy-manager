// src/domain/data/managerKaraktarText.ts
// C-MK1 Manager som karaktär. Opus-text 2026-05-25 (greenlight Jacob).
//
// Managern (Sture/Margareta) får en plats: profil, burnout, tränaravtal, coach-rivalry.
// Designval LÅSTA 2026-05-23: statisk bio (Fas 1), mjuk burnout utan GameOver, Opus-pool
// för rival-citat (ej LLM), minimal åldrande (ålder + år tickar).
// M43-beslut 2026-07-04 (Jacob): kvinnliga tränare JA, lågmält — bandyvärlden är
// konservativ. Alla pooler könsneutrala (omskrivning, aldrig hen), Margareta 1/12
// i namnpoolen. Nya rader håller samma linje: inga pronomen om managern.
//
// Princip: mjukt och synligt före hårt och dolt. Bandysvensk understatement.
// {manager}/{hemort}/{n}/{klubb}/{lon} interpoleras av Code ur ManagerProfile.

// ── Bio (statisk, Fas 1) ───────────────────────────────────────────────────────
// Code sätter ihop en öppnare + ev. familjerad ur ManagerProfile-data.

export const BIO_OPENERS: string[] = [
  'Från {hemort} ursprungligen. Spelade {n} år som aktiv innan knäna sa ifrån, blev tränare strax därpå.',
  '{hemort}-uppvuxen och lämnade aldrig riktigt bandyn. Tog tränarvägen när spelarbenen tog slut.',
  'Halva livet i {hemort}, andra halvan vid isar runt om i landet. Det här är inte första jobbet, men det låter så när det kommer på tal.',
  'Spelade aldrig högst, men läste spelet bättre än de flesta. Vägen till sargen var kort.',
  'Kommer från {hemort}. Bandyn fanns där före allt annat, och har följt med sedan dess.',
]

export const BIO_FAMILY_LINES: string[] = [
  'Familjen är kvar i {hemort} — pendling varje vecka.',
  'Familjen flyttade hit till slut. Pendlingen blev för mycket.',
  'Bor ensam nära vallen. Säger att det passar, och kanske gör det det.',
]

// ── Burnout (mjuk konsekvens, Portal-ritual) ───────────────────────────────────

/** Sparkline-zonens etikett (matchar mockens höger-label). */
export const BURNOUT_ZONE_LABELS = { frisk: 'Frisk', markbar: 'Märkbar', hog: 'Hög' }

/** BurnoutMark i Portal — danger-tonad. Eskaleringskurva: burnout fördjupas
 *  över säsongen → zonen stiger (Märkbar → Hög), och citaten med den.
 *  Code: välj ur quotesByZone[aktuell zon] + helpersByZone[zon] med no-repeat inom
 *  säsongen (samma mönster som övriga pooler). De platta `quotes`/`helpers` är
 *  fallback tills plockaren migrerats — ta bort dem då. Märkbar = trött men på
 *  benen; Hög = verkligt slut, sen säsong. */
export const BURNOUT_MARK = {
  eyebrow: '⬩ {manager} är trött ⬩',
  quotesByZone: {
    markbar: [
      'Lite tungt i kroppen den här veckan. Det går över.',
      'Sover sämre än jag borde. Inget att orda om.',
      'Många sena kvällar vid isen nu. Det tär lite.',
      'Det tar längre tid att komma igång på mornarna.',
      'Trött i veckan. Det hör säsongen till.',
    ],
    hog: [
      'Jag undrar hur länge jag orkar köra så här.',
      'Matcherna är det enkla — det är allt annat som tär.',
      'Det är inte bandyn längre. Det är allt runtomkring.',
      'Satt kvar i bilen utanför klubbstugan en bra stund i morse. Orkade inte gå in.',
      'Folk på Konsum har börjat fråga om jag mår bra. Det säger väl något.',
    ],
  },
  helpersByZone: {
    markbar: [
      'Det syns utanpå. En tystare vecka skulle göra gott.',
      'Inget akut än. Men en paus vore inte fel.',
    ],
    hog: [
      'Klacken märker. Spelarna märker. Det behövs vila — på riktigt.',
      'Det här går inte att köra hur länge som helst. Något måste lätta.',
    ],
  },
}

/**
 * Återfalls-mallen (2026-09-02, Opus dom, MIGRATIONSPLAN_HANDELSELIGGAREN
 * Fas 4+) — BurnoutMark.tsx väljer denna i stället för BURNOUT_MARK ovan när
 * managerProfileService.isBurnoutRelapse() är sant (en burnout-topp har
 * fyrat en TIDIGARE säsong). Samma form (quotesByZone/helpersByZone, ingen
 * interpolation), men tonen ska kännas som "andra gången", inte "första
 * gången" — refererar att managern känner igen mönstret. Opus levererar.
 * Tomma pooler = BurnoutMark.tsx degraderar säkert till intro-mallen (samma
 * "tom pool"-golv som BURNOUT_CAUSE_LINES nedan redan följer) tills detta
 * fyllts.
 */
export const BURNOUT_MARK_RELAPSE = {
  quotesByZone: {
    markbar: [
      'Jag känner igen det här nu. Det börjar som förra gången.',
      'Samma tyngd som i fjol, samma tid på säsongen. Jag vet vart det bär.',
      'De sena kvällarna igen. Jag har sett vad de leder till.',
      'Det är inte nytt längre. Det är det som oroar mig.',
      'Kroppen minns förra året innan huvudet hinner med.',
    ],
    hog: [
      'Här är jag igen. Samma vägg som förra säsongen.',
      'Jag lovade mig själv att inte hamna här en gång till. Ändå.',
      'Förra gången höll jag ut. Jag vet inte om det gör det lättare eller inte.',
      'Det är andra gången nu. Man tror man ska lära sig. Man gör inte det.',
      'Folk på Konsum frågar igen. De frågade förra vintern också.',
    ],
  },
  helpersByZone: {
    markbar: [
      'Det här kände du förra året. Ta paus tidigare den här gången.',
      'Du vet vart det leder. Bryt mönstret medan det går.',
    ],
    hog: [
      'Samma punkt som i fjol. Förra gången höll det — men inte gratis.',
      'Det gick en gång. Att lita på att det går igen är ingen vila.',
    ],
  },
}

/** Opus levererar. En rad per orsak — Code härleder orsaken (deriveBurnoutCause,
 *  managerProfileService.ts), visar BURNOUT_CAUSE_LINES[orsak] om poolen inte är
 *  tom. Tomma pooler = ingen orsaksrad visas (ingen krasch, bara utelämnad). */
export const BURNOUT_CAUSE_LINES: Record<'losses' | 'losses_eased' | 'inbox' | 'fatigue', string[]> = {
  losses: [
    'Förlusterna radar upp sig. Det sätter sig.',
    'Svårt att sova efter en förlust. Ännu svårare efter flera.',
    'Varje måndag känns tyngre än den förra just nu.',
    'Det är resultaten som tär. Man bär dem med sig hem.',
  ],
  losses_eased: [
    'Segern gav andrum. Men det som tärde finns kvar under.',
    'En vinst äntligen. Den räcker inte för att sudda de andra.',
    'Tre poäng lugnar magen för stunden. Inte huvudet.',
    'Det lättade lite ikväll. Men veckorna innan sitter kvar.',
  ],
  inbox: [
    'Det ligger för mycket olöst på bordet.',
    'Högen växer fortare än den krymper.',
    'Det är inte matcherna. Det är allt runtomkring som samlas på hög.',
    'För många beslut väntar på svar samtidigt.',
  ],
  fatigue: [
    'De sena kvällarna vid isen tar ut sin rätt.',
    'Det tar längre tid att ladda om mellan omgångarna nu.',
    'Kroppen hänger inte riktigt med i takten längre.',
    'Allt går, det tar bara mer ur en än förut.',
  ],
}

/** Opus levererar. Visas när burnout-zonen sjunker men inte når 'frisk' än
 *  (shouldShowBurnoutRelief, managerProfileService.ts). */
export const BURNOUT_RELIEF_LINES: string[] = [
  'Det släpper något. Inte allt, men något.',
  'Lite lättare den här veckan. Det räckte tydligen.',
  'Axlarna sitter inte lika högt längre.',
  'Det går att se fram emot en match igen.',
]

/** Opus levererar. Visas EN gång när zonen återgår till 'frisk' efter att ha
 *  varit markbar/hög (shouldShowBurnoutClose, managerProfileService.ts). */
export const BURNOUT_CLOSE_LINES: string[] = [
  'Det gick att andas igen. Man glömmer att det ska kännas så.',
  'Formen är tillbaka, både lagets och den egna.',
  'Ingen frågar längre om allt står rätt till. Det är ett gott tecken.',
  'Tillbaka på benen. Bandyn hann vänta.',
]

// ── Coach-rivalry-citat ────────────────────────────────────────────────────────
// Rival-tränarens citat OM {manager}. Code genererar rivalens namn + personlighet.

export type CoachPersonality = 'heders' | 'kall' | 'passiv_aggressiv' | 'odmjuk'

export const COACH_RIVALRY_QUOTES: Record<CoachPersonality, string[]> = {
  heders: [
    '{manager} är hederlig. Vi pratar alltid efter matchen — om vädret, inte om bandyn.',
    'Man vet var man har {manager}. Det är mer än man kan säga om de flesta.',
    'Vi har slagits om poäng i alla år. Jag unnar {manager} det mesta, faktiskt.',
    '{manager} skickade ett kort när min far gick bort. Sånt glömmer man inte.',
  ],
  kall: [
    'Vi räknar inte ihop åren, {manager} och jag. Ingen av oss ringer först.',
    'Jag har inget otalt med {manager}. Jag har inget tal alls, för den delen.',
    'Vi hälsar. Det räcker. Bandy är ingen kafferepskväll.',
    '{manager} sköter sitt, jag sköter mitt. Vi möts på isen. Det får räcka.',
  ],
  passiv_aggressiv: [
    'Jag minns varje match oss emellan. Det är inte personligt. Inte än.',
    '{manager} har haft tur genom åren. Tur tar slut.',
    'Bra lag {manager} har byggt. Med den budgeten borde det vara det.',
    'Vi känner varandra sen spelaråren. Jag avgjorde när det gällde. Det glöms inte.',
  ],
  odmjuk: [
    '{manager} har lärt mig mer om den här serien än någon annan. Det säger jag inte högt.',
    'Jag har förlorat mot bättre, och {manager} är en av dem.',
    'När jag var ny fick jag alltid en pratstund. Det betydde något.',
    'Man blir inte sämre av att möta {manager}. Bara påmind om hur långt man har kvar.',
  ],
}

/** Namnpool för genererad rival-tränare (en per AI-klubb). Äldre garde, blandat. */
export const COACH_FIRST_NAMES: string[] = [
  'Lars', 'Mikael', 'Per-Erik', 'Lasse', 'Bengt', 'Roland', 'Kjell', 'Tommy', 'Hans', 'Stefan', 'Leif', 'Margareta',
]
export const COACH_LAST_NAMES: string[] = [
  'Holmgren', 'Bergström', 'Lindqvist', 'Engström', 'Eriksson', 'Sundin', 'Nyström', 'Forsberg', 'Wikström', 'Dahlén', 'Sjöberg', 'Hedlund',
]

// ── Tränaravtal (Fas 2) ────────────────────────────────────────────────────────

export const CONTRACT_STATUS = {
  secure: 'Tränaravtal: {n} år kvar. {lon} tkr/månad.',
  expiring: 'Sista avtalsåret. Styrelsen har inte förlängt än.',
  offer: 'Anbud från {klubb} enligt rykten. Styrelsen tiger om det.',
}

export const CONTRACT_OUTCOME = {
  extended: 'Styrelsen förlängde. {manager} stannar — bygdens puls slår vidare.',
  not_extended: 'Styrelsen valde att inte förlänga. Säsongen blir {manager}s sista här.',
}
