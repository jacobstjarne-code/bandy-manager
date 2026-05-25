import type { Player } from '../../domain/entities/Player'
import type { Tactic } from '../../domain/entities/Club'
import { evaluateSquad } from '../../domain/services/squadEvaluator'

export interface Lagstyrka {
  idag: number
  utvilat: number
  gap: number
}

// Styrkepoäng-gap (utvilat − idag) som triggar trött-trupp-varningen. Tunas mot playtest (C-FT1).
export const STYRKA_GAP_VARNING = 5

/**
 * Ärlig trötthetsmagnitud: lagstyrka med spelarnas faktiska fitness vs fitness pinnad till 100.
 * Härlett ur evaluateSquad — samma playerModifier (fitness×0.6) motorn använder — så talet är
 * sant per konstruktion. Pinnar BARA fitness, ej form/sharpness, så det isolerar tröttheten.
 * Composite = (offense + defense) / 2 för läsbarhet.
 */
export function computeLagstyrka(
  startingIds: string[],
  squadPlayers: Player[] | undefined,
  tactic: Tactic,
): Lagstyrka {
  if (!squadPlayers) return { idag: 0, utvilat: 0, gap: 0 }
  const starters = startingIds
    .map(id => squadPlayers.find(p => p.id === id))
    .filter((p): p is Player => p != null)
  if (starters.length === 0) return { idag: 0, utvilat: 0, gap: 0 }
  const compo = (e: { offenseScore: number; defenseScore: number }) =>
    Math.round((e.offenseScore + e.defenseScore) / 2)
  const idag = compo(evaluateSquad(starters, tactic))
  const utvilat = compo(evaluateSquad(starters.map(p => ({ ...p, fitness: 100 })), tactic))
  return { idag, utvilat, gap: Math.max(0, utvilat - idag) }
}
