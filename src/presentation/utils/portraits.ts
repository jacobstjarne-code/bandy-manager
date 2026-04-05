import type { Player } from '../../domain/entities/Player'

/**
 * Deterministic portrait path based on player age + id hash.
 * 32 portraits: 8 per category (young, mid, exp, vet).
 */
export function getPortraitPath(player: Player): string {
  const category = player.age <= 21 ? 'young'
    : player.age <= 27 ? 'mid'
    : player.age <= 32 ? 'exp'
    : 'vet'

  // Simple hash from player id — same player always gets same portrait
  let hash = 0
  for (let i = 0; i < player.id.length; i++) {
    hash = ((hash << 5) - hash + player.id.charCodeAt(i)) | 0
  }
  const index = (Math.abs(hash) % 8) + 1

  return `/assets/portraits/portrait_${category}_${index}.png`
}
