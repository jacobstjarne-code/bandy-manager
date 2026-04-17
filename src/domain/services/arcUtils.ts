import type { SaveGame } from '../entities/SaveGame'
import type { BaseArc } from '../entities/Narrative'

/**
 * Samla alla aktiva arcs i spelet, oavsett typ.
 * Användbart för dashboard-rendering och priority-system.
 */
export function getAllActiveArcs(game: SaveGame): BaseArc[] {
  const arcs: BaseArc[] = []
  if (game.trainerArc) arcs.push(game.trainerArc)
  if (game.activeArcs) arcs.push(...game.activeArcs)
  if (game.storylines) arcs.push(...game.storylines.filter(s => !s.resolved))
  return arcs
}

/**
 * Räkna aktiva arcs. Användbart för att begränsa totalt antal.
 */
export function countActiveArcs(game: SaveGame): number {
  return getAllActiveArcs(game).length
}
