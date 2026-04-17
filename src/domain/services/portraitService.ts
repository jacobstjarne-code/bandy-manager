import { generatePlayerPortrait } from './svgPortraitService'

export function getPortraitSvg(playerId: string, age: number, position: string): string {
  return generatePlayerPortrait(playerId, age, position)
}

/** @deprecated PNG assets don't exist — use getPortraitSvg instead */
export function getPortraitPath(playerId: string, _age: number): string {
  // Kept for backward compatibility; callers should switch to getPortraitSvg
  return `/assets/portraits/portrait_placeholder_${playerId}.png`
}
