// src/domain/data/managerKvittoText.ts
// C-SY1 #4 Efter-match-kvitto. Opus-text 2026-05-25.
//
// ManagerKvittoSection på MatchReportScreen: 2–4 rader som kopplar ett FAKTISKT
// managerval till ett observerbart utfall. Inte "spelet tycker du gjorde rätt" —
// bara "du valde X → Y hände". Tonen är torr och observationell, ingen värdering.
//
// Designval (Opus tog Designs föreslag 2026-05-25): bara rader med mätbart utfall
// (skippa val utan koppling); Opus-pool (ej LLM); max 4 rader.
//
// {spelare}/{n} interpoleras av Code. Code väljer good/bad/neutral utifrån faktiskt
// utfall och kan lägga datalinjen ("släppte in 1, gjorde 2") bredvid framingen.

export const HALFTIME_LABELS = {
  lugna: 'Lugna ner det.',
  pressa: 'Pressa hårdare.',
  prata: 'Prata individuellt.',
}

export type KvittoOutcomeDir = 'good' | 'bad' | 'neutral'

/** Halvtidsval → andra halvlek. */
export const HALFTIME_OUTCOMES: Record<'lugna' | 'pressa' | 'prata', Record<KvittoOutcomeDir, string[]>> = {
  lugna: {
    good: ['Tempot sjönk och ni kontrollerade resten.', 'Laget tog ner det och höll undan.'],
    bad: ['Det blev för passivt — de kröp tillbaka in i matchen.', 'Ni släppte initiativet och fick betala för det.'],
    neutral: ['Lugnare efter pausen, men ingen avgörande skillnad.'],
  },
  pressa: {
    good: ['Ni höjde tempot och de svarade inte.', 'Pressen gav utdelning direkt efter pausen.'],
    bad: ['Pressen öppnade bakåt och kontringarna straffade.', 'Ni gick på för hårt och tappade balansen.'],
    neutral: ['Högre tempo, men det jämnade ut sig.'],
  },
  prata: {
    good: ['Det individuella snacket landade — rätt spelare vaknade.', 'Någon behövde höra det enskilt. Det syntes.'],
    bad: ['Budskapet nådde inte fram. Andra halvlek blev seg.', 'Det rörde inte vid det som behövde röras.'],
    neutral: ['Svårt att säga om samtalet gjorde skillnad.'],
  },
}

/** Lineup-rotation (jämfört med förra matchen) → energi vs rytm. */
export const LINEUP_ROTATION_OUTCOMES: Record<KvittoOutcomeDir, string[]> = {
  good: ['Rotationen gav energi — {spelare} avgjorde.', 'De utvilade benen orkade hela vägen.'],
  bad: ['Rotationen störde rytmen och kemin uteblev.', 'De invalda kom aldrig in i matchen.'],
  neutral: ['Rotationen syntes varken på gott eller ont.'],
}

/** Startade en trött spelare (started_tired) → höll benen eller inte. Egen pool — detta är INTE rotering/vila, så LINEUP_ROTATION_OUTCOMES passar inte här. */
export const STARTED_TIRED_OUTCOMES: Record<KvittoOutcomeDir, string[]> = {
  good: ['{spelare} höll trots tunga ben.', 'Tröttheten syntes inte — {spelare} bar matchen ändå.'],
  bad: ['De tunga benen syntes. {spelare} räckte inte hela vägen.', '{spelare} var tom redan tidigt i andra halvlek.'],
  neutral: ['{spelare} gjorde sitt, varken mer eller mindre.'],
}

/** Leadership-action (senaste leadershipActions) → grepp om gruppen. */
export const LEADERSHIP_OUTCOMES: Record<KvittoOutcomeDir, string[]> = {
  good: ['Kaptenen tog tag i det och laget följde.', 'Ledarorden satte sig i omklädningsrummet.'],
  bad: ['Ingen tog kommandot när det krävdes.', 'Beskedet bet inte på den här gruppen.'],
  neutral: ['Det togs upp, men gruppen var redan där.'],
}
