// src/domain/data/managerKaraktarText.ts
// C-MK1 Manager som karaktär. Opus-text 2026-05-25 (greenlight Jacob).
//
// Managern (Sture/Margareta) får en plats: profil, burnout, tränaravtal, coach-rivalry.
// Designval LÅSTA 2026-05-23: statisk bio (Fas 1), mjuk burnout utan GameOver, Opus-pool
// för rival-citat (ej LLM), minimal åldrande (ålder + år tickar).
//
// Princip: mjukt och synligt före hårt och dolt. Bandysvensk understatement.
// {manager}/{hemort}/{n}/{klubb}/{lon} interpoleras av Code ur ManagerProfile.

// ── Bio (statisk, Fas 1) ───────────────────────────────────────────────────────
// Code sätter ihop en öppnare + ev. familjerad ur ManagerProfile-data.

export const BIO_OPENERS: string[] = [
  'Från {hemort} ursprungligen. Spelade {n} år som aktiv innan knäna sa ifrån, blev tränare strax därpå.',
  '{hemort}-grabb som aldrig riktigt lämnade bandyn. Tog tränarvägen när spelarbenen tog slut.',
  'Halva livet i {hemort}, andra halvan i hallar runt om i landet. Det här är inte hans första jobb, men han pratar om det som om det vore.',
  'Spelade aldrig högst, men läste spelet bättre än de flesta. Det är därför han står vid sargen i dag.',
  'Kommer från {hemort}. Bandyn fanns där före allt annat, och har följt honom sedan.',
]

export const BIO_FAMILY_LINES: string[] = [
  'Familjen är kvar i {hemort} — pendling varje vecka.',
  'Familjen flyttade hit till slut. Pendlingen blev för mycket.',
  'Bor ensam nära vallen. Säger att det passar honom, och kanske gör det det.',
]

// ── Burnout (mjuk konsekvens, Portal-ritual) ───────────────────────────────────

/** Sparkline-zonens etikett (matchar mockens höger-label). */
export const BURNOUT_ZONE_LABELS = { frisk: 'Frisk', markbar: 'Märkbar', hog: 'Hög' }

/** BurnoutMark i Portal — danger-tonad, 1×/säsong vid trigger. */
export const BURNOUT_MARK = {
  eyebrow: '⬩ {manager} är trött ⬩',
  quotes: [
    'Jag måste tänka klart över helgen.',
    'Jag har inte sovit ordentligt på en vecka.',
    'Matcherna är det enkla. Det är allt runtomkring som tär.',
    'Jag undrar hur länge jag orkar köra så här.',
  ],
  helpers: [
    'Klacken märker. Spelarna märker. Du behöver en paus.',
    'Det syns på honom. En tystare vecka skulle göra gott.',
  ],
}

// ── Coach-rivalry-citat ────────────────────────────────────────────────────────
// Rival-tränarens citat OM {manager}. Code genererar rivalens namn + personlighet.

export type CoachPersonality = 'heders' | 'kall' | 'passiv_aggressiv' | 'odmjuk'

export const COACH_RIVALRY_QUOTES: Record<CoachPersonality, string[]> = {
  heders: [
    '{manager} är hederlig. Vi pratar alltid efter matchen — om vädret, inte om bandyn.',
    'Man vet var man har {manager}. Det är mer än man kan säga om de flesta.',
    'Vi har slagits om poäng i tjugo år. Jag unnar honom faktiskt det mesta.',
    '{manager} skickade ett kort när min far gick bort. Sånt glömmer man inte.',
  ],
  kall: [
    'Jag brukar inte förlora mot honom. Han ringer aldrig först.',
    'Jag har inget otalt med {manager}. Jag har inget tal med honom alls.',
    'Vi hälsar. Det räcker. Bandy är ingen kafferepskväll.',
    '{manager} sköter sitt, jag sköter mitt. Vi möts på isen. Det får räcka.',
  ],
  passiv_aggressiv: [
    'Han har slagit mig fler gånger än jag vill räkna. Det är inte personligt. Inte än.',
    '{manager} har haft tur mot mig. Tur tar slut.',
    'Bra lag {manager} har byggt. Med den budgeten borde det vara det.',
    'Vi var lagkamrater förr. Han glömmer inte att jag avgjorde när det gällde.',
  ],
  odmjuk: [
    '{manager} har lärt mig mer om den här ligan än någon annan. Jag säger det inte till honom.',
    'Jag har förlorat mot bättre, och {manager} är en av dem.',
    'När jag var ny tog han sig tid att prata. Det betydde något.',
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
  expiring: '{n} omgångar kvar på avtalet. Styrelsen har inte förlängt än.',
  offer: 'Anbud från {klubb} enligt rykten. Styrelsen tiger om det.',
}

export const CONTRACT_OUTCOME = {
  extended: 'Styrelsen förlängde. {manager} stannar — bygdens puls slår vidare.',
  not_extended: 'Styrelsen valde att inte förlänga. Säsongen blir {manager}s sista här.',
}
