import type { Tavlingstyp, Skede } from './matchTypeAxes'

export type GranskaSection =
  | 'resultatHero' | 'tabell' | 'form' | 'statistik' | 'nyckelmoment'
  | 'dinaVal' | 'omgangssammanfattning' | 'andraMatcher' | 'scouting'
  | 'pressMedia' | 'nastaMatchPekare'
  // GRANSKA DEL 4 (2026-08-12) — sex sektioner som renderade i GranskaOversikt.tsx
  // men aldrig fanns i matrisens tolv rader (Jacobs fynd: "Matrisen beskriver
  // alltså inte skärmen, den beskriver de sektioner Design råkade titta på").
  // Alla sex är event-drivna beslutsprompter eller informationsalerter,
  // oberoende av matchtyp — en väntande presskonferens eller en ny skada
  // försvinner inte för att matchen var en final. Se visasFor nedan för
  // motiveringen till att alla sex är ✓ i varje tävlingstyp/skede.
  | 'criticalEvents' | 'pressConference' | 'csPress' | 'refereeMeeting'
  | 'reaktioner' | 'nySkada'
  // GRANSKA CRESCENDO (2026-08-17) — KapitelPunkt: en rad, ingen egen gren.
  // Avsked är ETT av kapitelpunktens fem innehåll, inte en separat sektion
  // eller en fysisk avgrening (se kommentaren i GranskaOversikt.tsx om varför
  // det första avgreningsförsöket reverterades). Exakt VILKET av de fem
  // innehållen (sm_guld/cup_vunnen/sm_final_forlorad/cupfinal_forlorad/avsked)
  // avgörs av kapitelPunktService.ts:s deriveKapitelPunktKind (won/lost +
  // farewell, som visasFor inte har tillgång till) — den här raden avgör bara
  // om SLOTEN är relevant för tävlingstyp/skede-kombinationen.
  | 'kapitelPunkt'
  // O16 — GRANSKA SOM LÄRANDEYTA (2026-08-17/19, DOM_GRANSKA_LARANDEYTA).
  // "DITT VAL" — skild från 'dinaVal' (managerChoiceLog-kvittot ovan). Kopplar
  // EN förematch-taktikinställning (cornerStrategy) till ETT MÄTT utfall
  // (hörnmål i den avslutade matchen), inte en logg av in-match-beslut.
  // Samma synlighet som 'dinaVal': ✕ bara på avsked (ingen taktik-obduktion
  // på en hyllningsmatch). Renderas ändå ⭕ om matchmotorn inte kan peka på
  // ett samband (0 hörnor tagna) — det avgörs i GranskaOversikt.tsx, inte här.
  | 'dittVal'

/**
 * GRANSKA DEL 4 (2026-08-11), steg 2 — sektionsregistret.
 * Matrisen i docs/incoming/DESIGN_UPPDRAG_GRANSKA_DEL4-2026-08-11.md, i kod.
 * ✕ = renderas inte (DS-regel 12, ingen tom platshållare, inget gråtonat
 * kort). ✓/⚠ = renderas — tonal branching (trophy-hero, tribute-gren,
 * bracket istf tabell) hör till senare steg (3-5), inte till detta registret.
 * Det här svarar bara på "syns sektionen".
 *
 * Turneringsläge (ny sektion, matrisens sista rad) är INTE med här — den
 * gates:as av turneringslageService.ts:s deriveTurneringslageMode (egen
 * härledning ur cup-/playoffBracket, inte en enkel tävlingstyp/skede-tabell),
 * inte av visasFor.
 *
 * "SM-final"-kolumnen i matrisen är enligt ordern (steg 1-notisen) ingen
 * egen axel — den identifieras av skede:'final', oavsett om tävlingstypen
 * är cup eller slutspel. Två olika skäl döljer sektioner på en final, och de
 * täcker olika mängder matcher:
 *
 * - Fyra sektioner (tabell, form, omgångssammanfattning, andraMatcher)
 *   döljs för att MATCHEN är ceremoniell just nu — det gäller lika mycket
 *   en cupfinal som en SM-final ("det ÄR matchen", "inte '+2 tkr/omg' under
 *   guldet"). isAnyFinal (skede==='final', oavsett tävlingstyp) styr dessa.
 * - Två sektioner (scouting, nastaMatchPekare) döljs för att SÄSONGEN är
 *   slut. En cupfinal spelas i augusti (cupService.ts: matchday 1-4, "before
 *   liga starts at matchday 5") och säsongen fortsätter direkt efteråt — så
 *   de blir bara ✕ på den verkliga säsongsavslutande finalen
 *   (tävlingstyp:'slutspel' + skede:'final'), inte på en cupfinal.
 */
export function visasFor(section: GranskaSection, tavlingstyp: Tavlingstyp, skede: Skede | undefined): boolean {
  const isAnyFinal = skede === 'final'
  const isSeasonEndingFinal = tavlingstyp === 'slutspel' && skede === 'final'

  switch (section) {
    case 'tabell':
      return tavlingstyp === 'liga'
    case 'form':
      return tavlingstyp !== 'cup' && tavlingstyp !== 'avsked' && !isAnyFinal
    case 'statistik':
      return tavlingstyp !== 'avsked'
    case 'dinaVal':
      return tavlingstyp !== 'avsked'
    case 'dittVal':
      return tavlingstyp !== 'avsked'
    case 'omgangssammanfattning':
      return tavlingstyp !== 'avsked' && !isAnyFinal
    case 'andraMatcher':
      return tavlingstyp !== 'avsked' && !isAnyFinal
    case 'scouting':
      return tavlingstyp !== 'avsked' && !isSeasonEndingFinal
    case 'nastaMatchPekare':
      return !isSeasonEndingFinal
    case 'resultatHero':
    case 'nyckelmoment':
    case 'pressMedia':
      return true
    case 'kapitelPunkt':
      return isAnyFinal || tavlingstyp === 'avsked'
    // De sex event-drivna sektionerna: ✓ i varje tävlingstyp/skede, med flit.
    // Att tysta en väntande presskonferens eller en skadeanmälan för att
    // matchen råkade vara en final eller en avskedsmatch vore en regression
    // (samma insikt som fällde det första tribute-gren-försöket, 2026-08-11) —
    // inte en förbättring. De läggs in explicit här, inte bara lämnas ogated,
    // så registret är den fullständiga kartan över skärmen, inte bara de
    // rader Design råkade titta på.
    case 'criticalEvents':
    case 'pressConference':
    case 'csPress':
    case 'refereeMeeting':
    case 'reaktioner':
    case 'nySkada':
      return true
  }
}
