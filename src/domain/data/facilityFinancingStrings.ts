import { seededPick } from '../utils/random'

// B1 §6 — förhandlingstext för anläggningsfinansiering.
// Renderas i FacilityScreen-sheet:en under respektive finansieringsval.
// Tre röster: kommunen (lokalpolitikerns ton), mecenaten, samt utebliven kommun.
// Egen kassa har ingen röst — det är bara klubbens egna pengar.
//
// Skrivregler (WRITING_GUIDELINES_BANDY_MANAGER.md):
//  · Testet per rad är inte meningstyp utan: bär den en konkret bild (handslaget,
//    Konsum, potten) eller en verklig hållning — eller är den bara referat? Referat
//    bort, oavsett hur det är skiljetecknat. (Lärdom #7: regeln blir ritual annars.)
//  · Lärdom #9 — en rad får bara hävda det triggern garanterar. "offer" = källan ÄR
//    med (relation/standing/villig passerar). Uppdiktad vardag (kaffet på Konsum) är
//    tillåten; påhittad spelfakta är det inte.
//  · Mecenat-raderna hålls pronomenneutrala — Mecenat.gender kan vara female.
//  · Token: {politician} (LocalPolitician.name), {mecenat} (Mecenat.name).

/** Kommunen är med — relation (+ ev. standing) räcker, kommunen tar sin andel. */
export const KOMMUN_OFFER_LINES = [
  '{politician} vill ha klubben kvar i bygden. Pengarna med.',
  'Kommunen tar sin del — {politician} drev det.',
  '{politician} tog det över kaffet på Konsum.',
  'Pengar i potten i år, och {politician} öppnar den.',
  '{politician} säger ja utan att blinka.',
  'Pratat med {politician} — det är ordnat.',
]

/** Kommunen avvaktar — relation eller lokalt stöd räcker inte än. */
export const KOMMUN_HOLD_LINES = [
  'Inte nu. {politician} har annat för sig.',
  '{politician} lyssnar artigt, mer blir det inte än.',
  '{politician} vill se mer innan kommunen går in.',
  '{politician} skakar sakta på huvudet.',
  '{politician} pekar på budgeten och rycker på axlarna.',
  '{politician} säger som det är. Kommunen avvaktar.',
]

/** Mecenaten är villig — står för sin andel. */
export const MECENAT_OFFER_LINES = [
  '{mecenat} tar resten — "vad ska jag annars ha pengarna till."',
  'Ett samtal, ett handslag, {mecenat} står för resten.',
  '{mecenat} vill vara med. Det är bygdens klubb.',
  'Ring {mecenat} bara. Står för sitt.',
  '{mecenat} lägger pengar på bordet. "Bygg det."',
  '{mecenat} tar sin del utan att göra en grej av det.',
]

export interface FinancingFlavorNames {
  politician?: string
  mecenat?: string
}

/**
 * Förhandlingsrad för ett finansieringsval. Returnerar null när ingen röst passar
 * (egen kassa, eller källa otillgänglig utan namngiven aktör att lägga orden i munnen på).
 * seed = stabil sträng (t.ex. `${nodeId}:${mode}:${builtCount}`) → ingen flicker i öppen sheet,
 * ny rad när klubben växt.
 */
export function financingFlavor(
  mode: 'club' | 'kommun' | 'mecenat',
  available: boolean,
  names: FinancingFlavorNames,
  seed: string,
): string | null {
  if (mode === 'kommun' && names.politician) {
    const pool = available ? KOMMUN_OFFER_LINES : KOMMUN_HOLD_LINES
    return seededPick(pool, seed).replace('{politician}', names.politician)
  }
  if (mode === 'mecenat' && available && names.mecenat) {
    return seededPick(MECENAT_OFFER_LINES, seed).replace('{mecenat}', names.mecenat)
  }
  return null
}
