/**
 * decisionBudgetService — throttling gate for pending decisions.
 *
 * Prevents decision-overload by capping the number of active decisions
 * the player faces simultaneously. Max 2 active (season 1 round 1: max 1).
 *
 * "Active decisions" = unresolved pendingEvents + any pendingWeeklyDecision.
 */

import type { SaveGame } from '../entities/SaveGame'

export const MAX_ACTIVE_DECISIONS = 2
export const MAX_ACTIVE_SEASON_1_ROUND_1 = 1

/**
 * Returns the number of active (unresolved) decisions the player currently has.
 * Counts both pendingEvents and the pending weekly decision.
 */
export function getActiveDecisionCount(game: SaveGame): number {
  const pendingEventsCount = (game.pendingEvents ?? []).filter(e => !e.resolved).length
  const weeklyDecisionCount = game.pendingWeeklyDecision ? 1 : 0
  return pendingEventsCount + weeklyDecisionCount
}

/**
 * Returns true if a new decision can be added to the queue.
 * Season 1 Round 1 has a stricter limit of 1 active decision.
 */
export function canAddDecision(game: SaveGame, nextRound: number): boolean {
  const limit = (game.currentSeason === 1 && nextRound === 1)
    ? MAX_ACTIVE_SEASON_1_ROUND_1
    : MAX_ACTIVE_DECISIONS
  return getActiveDecisionCount(game) < limit
}
