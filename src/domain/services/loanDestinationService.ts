/**
 * DOM_LANEKLUBB_IDENTITET_2026-09-08: externa utvecklingsklubbar är inte
 * Club-entiteter. De får ett deterministiskt id från sitt frysta namn, utan
 * trupp-, tabell- eller registersanning vid sidan av game.clubs.
 */
export function externalLoanDestinationId(name: string): string {
  const stem = name
    .trim()
    .replace(/\s+(?:GoIF|GIF|IF|IK|BK|SK)$/i, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('sv-SE')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `ext:${stem || 'okand'}`
}

/** Enda legacy-aliaset som motsvarar en verklig klubb i den modellerade ligan. */
export function migrateLoanDestinationId(name: string): string {
  return /^skutskär(?:s IF)?$/i.test(name.trim())
    ? 'club_skutskar'
    : externalLoanDestinationId(name)
}
