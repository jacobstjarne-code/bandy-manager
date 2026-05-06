/**
 * ArrivalScene-dialog — Sture-replikens varianter.
 *
 * Margareta (kassör) och Pelle (ordförande) har data-drivna repliker
 * (siffror från klubbvalet). Sture är ledamot — byns röst i styrelsen.
 * Hans replik är specifik per klubb för att ge orten en kulturell flagga.
 *
 * Ton: understatement, konkret bild, ingen förklaring. Sture säger en sak
 * och stoppar. Inga LLM-meningspar där rad 2 förklarar rad 1. Stures
 * referenspunkt skiftar inte mellan säsonger — samma klubb, samma replik.
 *
 * Per-klubb-replikerna lutar mot orten själv (geografi, klimat, bruk,
 * läge i bandysverige) snarare än mot tabell eller motståndare.
 */

// Per-klubb-replik. Varje klubb har en kulturell flagga — Sture säger
// det orten alltid säger om sig själv.
export const STURE_PER_CLUB: Record<string, string> = {
  // Forsbacka — bruksort i skogslandskap, klämd mellan storstadsklubbarnas skuggor
  'club_forsbacka': 'Storstadsklubbarna räknar inte med oss. Inte förrän isen ligger…',

  // Söderfors — ankarsmedjan på ö i Dalälven, vägen går alltid över bro
  'club_soderfors': 'Halva ön bor över bron. Dom kommer alltid ändå.',

  // Västanfors — landets äldsta konstfrusna landbana (1935), Bergslagen
  'club_vastanfors': 'Banan har varit konstfrusen sedan trettiofem. Dom flesta lag i serien fanns inte ens då.',

  // Karlsborg — längst norrut, pappersbruket, mörker och köld
  'club_karlsborg': 'Solen är inte uppe när vi öppnar grindarna. Det är inget problem för oss.',

  // Målilla — småländska höglandet, extrema temperaturer, termometern på torget
  'club_malilla': 'Termometern på torget visade minus arton i natt. Folk kommer ändå.',

  // Gagnef — Dalabygd där älvarna möts, skidor och skridskor delar bygden
  'club_gagnef': 'Skidföret är bra i år. Det märks på läktaren.',

  // Hälleforsnäs — sörmländsk bruksort, järnbruket borta
  'club_halleforsnas': 'Järnbruket är borta. Bandyn är kvar.',

  // Lesjöfors — Värmlands köldhål, fjäderfabriken, fostrat storspelare
  'club_lesjofors': 'Det blir tjugotvå minus i natt. Andra lag fryser fast då. Vi vaknar.',

  // Rögle — sydligast i bandysverige, hockeylandskap, salt havsluft
  'club_rogle': 'Hockeyfolket skrattar fortfarande. Det är okej.',

  // Slottsbron — vid Vänern, sen is, dimma och storm
  'club_slottsbron': 'Stormen från sjön ligger redan på. Det blir spritt på östra läktaren.',

  // Skutskär — Dalälvens mynning vid Bottenhavet, banan byggd med egna händer
  'club_skutskar': 'Banan byggde vi själva. Vi sopar den fortfarande själva.',

  // Heros — Smedjebacken, Norra Barkens strand, dimma från sjön
  'club_heros': 'Det dimper från sjön kvart i sju. Folk vänjer sig.',
}

// Generisk fallback om en klubb saknar specifik replik (defense-in-depth
// vid framtida nya klubbar). Behålls även som referens på tonen i de
// klubb-specifika.
export const STURE_VARIANTS: readonly string[] = [
  'För många här är det här säsongens enda samling. Glöm inte det.',
  'Halva byn veckopendlar. På lördag är dom här igen.',
  'P17 spelar förmatch. Sen förstärker dom hos oss.',
  'Stugorna stängs för vintern.',
] as const

/**
 * Plocka Stures replik för en specifik klubb. Specifik per-klubb-replik
 * om sådan finns; annars deterministisk fallback från generisk pool.
 */
export function getStureLine(clubId: string): string {
  const specific = STURE_PER_CLUB[clubId]
  if (specific) return specific

  // Fallback för okända klubb-id: hash över generic-poolen
  let hash = 0
  for (let i = 0; i < clubId.length; i++) {
    hash = ((hash << 5) - hash + clubId.charCodeAt(i)) | 0
  }
  const idx = Math.abs(hash) % STURE_VARIANTS.length
  return STURE_VARIANTS[idx]
}
