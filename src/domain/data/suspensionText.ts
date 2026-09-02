// src/domain/data/suspensionText.ts
// C-U1 Utvisning→avstängning, orsakskrok. Opus-text 2026-05-25.
//
// Problemet: en avstängning visas i dag som en grå, oförklarad spärr. Spelaren
// frågar "var och hur blev han avstängd?". Orsaken FINNS (Suspension-eventet på
// fixturen + motståndare + omgång) men fångas aldrig i spelarvänd form.
//
// Den här texten ger avstängningen sin orsak på två ytor: inkorgen när den utlöses,
// och availability-etiketten i trupp/lineup. {spelare}/{motståndare}/{omgfras}/{kvar}
// interpoleras av Code. Bandysvensk understatement — domaren och matchstraffet är
// fakta, inte drama.
//
// {omgfras} (SKALA-BUGGEN steg B, 2026-09-02): hela omgångsfrasen som EN
// enhet ("omgång 5"/"matchdag 2" för cup/slutspel utan serieomgång), inte
// bara talet — matchstraffet kan ha skett i en cupmatch, och "omgång {tal}"
// hårdkodat i mallen hade då visat ett påhittat rond-nummer.

/** Inkorgsrad när matchstraffet utlöser avstängning. Namnger orsaken rakt. */
export const SUSPENSION_INCIDENT_LINES: string[] = [
  'Matchstraff mot {motståndare} i {omgfras}. {spelare} är avstängd nästa match.',
  '{spelare} åkte på fullt matchstraff mot {motståndare}. Det betyder avstängning nästa omgång.',
  'Domaren tog inga genvägar mot {motståndare} — {spelare} fick matchstraff och är borta nästa match.',
  '{spelare} fick lämna isen mot {motståndare} i {omgfras}. Matchstraff, och en match på läktaren som följd.',
]

/** Som ovan men flera matchers avstängning (grov förseelse). {kvar} = antal matcher. */
export const SUSPENSION_INCIDENT_MULTI_LINES: string[] = [
  'Grovt matchstraff mot {motståndare}. {spelare} stängs av {kvar} matcher.',
  '{spelare} gick över gränsen mot {motståndare} i {omgfras}. Disciplinnämnden ger {kvar} matchers avstängning.',
]

/**
 * Availability-etikett i trupp/lineup — visar VARFÖR spelaren inte är valbar,
 * inte bara att han är grå. Kort, faktisk. {kvar} = matcher kvar.
 */
export const SUSPENSION_AVAILABILITY_LABELS = {
  single: 'Avstängd · matchstraff mot {motståndare} ({omgfras})',
  multi: 'Avstängd {kvar} matcher · matchstraff mot {motståndare}',
}

/** När avstängningen är avtjänad och spelaren är valbar igen. Lätt, ingen pompa. */
export const SUSPENSION_RETURN_LINES: string[] = [
  '{spelare} har avtjänat avstängningen och är spelklar igen.',
  'Avstängningen är klar. {spelare} kan väljas mot {motståndare} igen.',
  '{spelare} är tillbaka i truppen efter sin match på läktaren.',
]
