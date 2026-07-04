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
  'Halva livet i {hemort}, andra halvan vid isar runt om i landet. Det här är inte hans första jobb, men han pratar om det som om det vore.',
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
      'Trött i veckan. Det hör bandyhösten till.',
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
      'Det syns på honom. En tystare vecka skulle göra gott.',
      'Inget akut än. Men en paus vore inte fel.',
    ],
    hog: [
      'Klacken märker. Spelarna märker. Han behöver vila — på riktigt.',
      'Det här går inte att köra hur länge som helst. Något måste lätta.',
    ],
  },
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
    'Vi räknar inte ihop åren, han och jag. Han ringer aldrig först.',
    'Jag har inget otalt med {manager}. Jag har inget tal med honom alls.',
    'Vi hälsar. Det räcker. Bandy är ingen kafferepskväll.',
    '{manager} sköter sitt, jag sköter mitt. Vi möts på isen. Det får räcka.',
  ],
  passiv_aggressiv: [
    'Jag minns varje match mot honom. Det är inte personligt. Inte än.',
    '{manager} har haft tur genom åren. Tur tar slut.',
    'Bra lag {manager} har byggt. Med den budgeten borde det vara det.',
    'Vi var lagkamrater förr. Han glömmer inte att jag avgjorde när det gällde.',
  ],
  odmjuk: [
    '{manager} har lärt mig mer om den här serien än någon annan. Jag säger det inte till honom.',
    'Jag har förlorat mot bättre, och {manager} är en av dem.',
    'När jag var ny tog han sig tid att prata. Det betydde något.',
    'Man blir inte sämre av att möta {manager}. Bara påmind om hur långt man har kvar.',
  ],
}

/** Namnpool för genererad rival-tränare (en per AI-klubb). Äldre garde, blandat. */
export const COACH_FIRST_NAMES: string[] = [
  'Lars', 'Mikael', 'Per-Erik', 'Lasse', 'Bengt', 'Roland', 'Kjell', 'Tommy', 'Hans', 'Stefan', 'Leif', 'Sune',
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
