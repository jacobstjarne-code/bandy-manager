import { generatePlayerPortrait } from './svgPortraitService'
import { stringHash } from '../utils/random'

export function getPortraitSvg(playerId: string, age: number, position: string): string {
  return generatePlayerPortrait(playerId, age, position)
}

export type PortraitTier = 'young' | 'mid' | 'exp' | 'vet'

/** Ålder → karriär-tier i illustrationsstilen. Gränser speglar bandy-karriärbågen. */
export function ageToPortraitTier(age: number): PortraitTier {
  if (age <= 21) return 'young'
  if (age <= 26) return 'mid'
  if (age <= 31) return 'exp'
  return 'vet'
}

/**
 * Illustrerat hjälteporträtt (genomgång II A): spelarens ålder → tier → seedat val (1..8)
 * inom tiern. 32 assets i public/assets/portraits/portrait_{tier}_{1..8}.png.
 * Deterministiskt per spelare — samma spelare ger alltid samma porträtt.
 */
export function getPortraitImagePath(playerId: string, age: number): string {
  const tier = ageToPortraitTier(age)
  const idx = (Math.abs(stringHash(playerId)) % 8) + 1
  return `/assets/portraits/portrait_${tier}_${idx}.png`
}
