import type { SaveGame } from '../entities/SaveGame'
import type { BaseArc } from '../entities/Narrative'

/**
 * Samlar de tre arc-lagrens aktiva poster bakom ett gemensamt läskontrakt.
 *
 * Funktionen muterar eller normaliserar inte sparfilen. De frivilliga
 * BaseArc-fälten finns för bakåtkompatibilitet, så äldre arcs kan lämnas vidare
 * utan att vi skapar ett fjärde lagringssystem eller ändrar deras faslogik.
 */
export function getAllActiveArcs(game: SaveGame): BaseArc[] {
  const arcs: BaseArc[] = []

  if (game.trainerArc) arcs.push(game.trainerArc)
  if (game.activeArcs) arcs.push(...game.activeArcs)
  if (game.storylines) {
    arcs.push(...game.storylines.filter(storyline => !storyline.resolved))
  }

  return arcs
}

export function countActiveArcs(game: SaveGame): number {
  return getAllActiveArcs(game).length
}
