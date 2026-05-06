/**
 * ArrivalScene-dialog — Sture-replikens varianter.
 *
 * Margareta (kassör) och Pelle (ordförande) har data-drivna repliker
 * (siffror från klubbvalet). Sture är ledamot — byns röst i styrelsen.
 * Hans replik varieras per klubb för att ge orten en kulturell flagga.
 *
 * Ton: understatement, konkret bild, ingen förklaring. Sture säger en sak
 * och stoppar. Inga LLM-meningspar där rad 2 förklarar rad 1.
 */

export const STURE_VARIANTS: readonly string[] = [
  'För många här är det här säsongens enda samling. Glöm inte det.',
  'Halva byn veckopendlar. På lördag är dom här igen.',
  'P17 spelar förmatch. Sen förstärker dom hos oss.',
  'Stugorna stängs för vintern.',
] as const

/**
 * Plocka en Sture-variant deterministiskt baserat på klubb-id.
 * Samma klubb får alltid samma variant — Sture är samma man, hans
 * referenspunkt skiftar inte mellan säsonger.
 */
export function getStureLine(clubId: string): string {
  let hash = 0
  for (let i = 0; i < clubId.length; i++) {
    hash = ((hash << 5) - hash + clubId.charCodeAt(i)) | 0
  }
  const idx = Math.abs(hash) % STURE_VARIANTS.length
  return STURE_VARIANTS[idx]
}
