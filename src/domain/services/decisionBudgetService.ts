/**
 * decisionBudgetService — throttling gate for pending decisions.
 *
 * Prevents decision-overload by capping the number of active decisions
 * the player faces simultaneously. Max 2 active (season 1 round 1: max 1).
 *
 * "Active decisions" = unresolved pendingEvents + any pendingWeeklyDecision.
 *
 * When budget is full, tryQueueDecision defers to deferredDecisions (max 10).
 * When an active decision resolves, promoteFromQueue lifts the next deferred one.
 */

import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'

export const MAX_ACTIVE_DECISIONS = 2
export const MAX_ACTIVE_SEASON_1_ROUND_1 = 1
export const MAX_DEFERRED_DECISIONS = 10

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
  const limit = ((game.seasonSummaries?.length ?? 0) === 0 && nextRound === 1)
    ? MAX_ACTIVE_SEASON_1_ROUND_1
    : MAX_ACTIVE_DECISIONS
  return getActiveDecisionCount(game) < limit
}

/**
 * Tries to add a GameEvent as an active decision. If the budget is full,
 * the event is deferred to deferredDecisions (capped at MAX_DEFERRED_DECISIONS,
 * oldest dropped if overflow).
 */
export function tryQueueDecision(game: SaveGame, event: GameEvent): SaveGame {
  if (canAddDecision(game, game.currentMatchday ?? 1)) {
    return { ...game, pendingEvents: [...(game.pendingEvents ?? []), event] }
  }
  const newDeferred = [...(game.deferredDecisions ?? []), { ...event, deferredAt: game.currentMatchday ?? 1 }]
  const capped = newDeferred.length > MAX_DEFERRED_DECISIONS
    ? newDeferred.slice(newDeferred.length - MAX_DEFERRED_DECISIONS)
    : newDeferred
  return { ...game, deferredDecisions: capped }
}

/**
 * Promotes the oldest deferred decision to pendingEvents after a decision resolves.
 * No-op if deferredDecisions is empty.
 */
export function promoteFromQueue(game: SaveGame): SaveGame {
  const [next, ...rest] = game.deferredDecisions ?? []
  if (!next) return game
  return { ...game, pendingEvents: [...(game.pendingEvents ?? []), next], deferredDecisions: rest }
}
