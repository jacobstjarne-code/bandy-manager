import { generatePlayerPortrait } from './svgPortraitService'
import { stringHash } from '../utils/random'

export function getPortraitSvg(playerId: string, age: number, position: string): string {
  return generatePlayerPortrait(playerId, age, position)
}

export type PortraitTier = 'young' | 'mid' | 'exp' | 'vet'

/**
 * Curated portrait assets that are actually approved and present in the product.
 * Keep gaps explicit: veteran #3 was rejected and must never be selected merely
 * because its old placeholder file still exists on disk.
 */
export const CURATED_PORTRAIT_INDICES: Readonly<Record<PortraitTier, readonly number[]>> = {
  young: [1, 2, 3, 4, 5, 6],
  mid: [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  ],
  exp: [],
  vet: [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
}

/** Ålder → karriär-tier i illustrationsstilen. Gränser speglar bandy-karriärbågen. */
export function ageToPortraitTier(age: number): PortraitTier {
  if (age <= 21) return 'young'
  if (age <= 26) return 'mid'
  if (age <= 31) return 'exp'
  return 'vet'
}

/**
 * Illustrerat hjälteporträtt: spelarens ålder → tier → seedat val ur den
 * faktiska, godkända filuppsättningen. Tomma tierer returnerar null så UI:t kan
 * falla tillbaka till det deterministiska SVG-porträttet utan en trasig länk.
 */
export function getPortraitImagePath(playerId: string, age: number): string | null {
  const tier = ageToPortraitTier(age)
  const indices = CURATED_PORTRAIT_INDICES[tier]
  if (indices.length === 0) return null

  const idx = indices[Math.abs(stringHash(playerId)) % indices.length]
  return `/assets/portraits/portrait_${tier}_${idx}.png?v=7`
}
