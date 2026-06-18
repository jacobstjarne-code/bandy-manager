import { generatePlayerPortrait } from './svgPortraitService'

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

function hashId(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

/**
 * Illustrerat hjälteporträtt (genomgång II A): spelarens ålder → tier → seedat val (1..8)
 * inom tiern. 32 assets i public/assets/portraits/portrait_{tier}_{1..8}.png.
 * Deterministiskt per spelare — samma spelare ger alltid samma porträtt.
 */
export function getPortraitImagePath(playerId: string, age: number): string {
  const tier = ageToPortraitTier(age)
  const idx = (hashId(playerId) % 8) + 1
  return `/assets/portraits/portrait_${tier}_${idx}.png`
}
