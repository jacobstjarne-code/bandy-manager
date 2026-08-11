import type { Tavlingstyp, Skede } from './matchTypeAxes'

export type GranskaSection =
  | 'resultatHero' | 'tabell' | 'form' | 'statistik' | 'nyckelmoment'
  | 'dinaVal' | 'omgangssammanfattning' | 'andraMatcher' | 'scouting'
  | 'pressMedia' | 'nastaMatchPekare'

/**
 * GRANSKA DEL 4 (2026-08-11), steg 2 — sektionsregistret.
 * Matrisen i docs/incoming/DESIGN_UPPDRAG_GRANSKA_DEL4-2026-08-11.md, i kod.
 * ✕ = renderas inte (DS-regel 12, ingen tom platshållare, inget gråtonat
 * kort). ✓/⚠ = renderas — tonal branching (trophy-hero, tribute-gren,
 * bracket istf tabell) hör till senare steg (3-5), inte till detta registret.
 * Det här svarar bara på "syns sektionen".
 *
 * Turneringsläge (ny sektion, matrisens sista rad) är INTE med här — den
 * har ingen komponent än (byggs i steg 5). Ett registerinlägg utan yta att
 * gate:a är inte en gate, det är en förhoppning.
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
  }
}
