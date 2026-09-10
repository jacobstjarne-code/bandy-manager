/**
 * decisionBudgetService — KF3's actionable interruption budget.
 *
 * The budget limits decisions, never narrative/informational bands. Prior
 * deferred events are considered before newly generated events, deadlines are
 * protected, and no queued decision is dropped.
 */

import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent, DecisionTier } from '../entities/GameEvent'
import { classifyInterrupt, isPendingSceneActionable } from './interruptClassifier'

export const MAX_DECISIONS_PER_ROUND = 3
/** Kept as an API alias for older callers. */
export const MAX_ACTIVE_DECISIONS = MAX_DECISIONS_PER_ROUND

/**
 * SPEC_DECISIONBUDGET_ALDERSVIKTNING_2026-09-10 §1: rundor ett deadline-löst
 * event får vänta i flexible-kön innan det eskalerar till fronten. Under
 * detta är det bara deadline som styr ordningen (befintligt beteende).
 */
const STARVATION_ROUNDS = 3

function isActionableEvent(event: GameEvent): boolean {
  return !event.resolved && classifyInterrupt({
    category: 'event',
    hasChoices: Array.isArray(event.choices) && event.choices.length > 0,
  }) === 'actionable'
}

/**
 * GameEvent's canonical field is deadlineRound. The fallback keeps legacy
 * expiresRound saves safe without adding a second deadline concept.
 */
function getDeadlineRound(event: GameEvent): number | undefined {
  return event.deadlineRound
    ?? (event as GameEvent & { expiresRound?: number }).expiresRound
}

function getSingularDecisionCount(game: SaveGame): number {
  return (game.pendingWeeklyDecision ? 1 : 0)
    + (isPendingSceneActionable(game) ? 1 : 0)
}

/**
 * Returns active event cards plus the weekly decision. Scene reservation is
 * deliberately resolved only inside the budget/waiting selectors: coffee-room
 * construction itself reads this active count for its fatigue copy.
 */
export function getActiveDecisionCount(game: SaveGame): number {
  const pendingEventsCount = (game.pendingEvents ?? []).filter(isActionableEvent).length
  return pendingEventsCount + (game.pendingWeeklyDecision ? 1 : 0)
}

/** Compatibility selector: KF3 now has one definition of actionable. */
export function getThrottledActiveDecisionCount(game: SaveGame): number {
  return getActiveDecisionCount(game)
}

/**
 * Returns the number of decisions waiting in the deferred queue.
 */
export function getDeferredDecisionCount(game: SaveGame): number {
  return (game.deferredDecisions ?? []).filter(isActionableEvent).length
}

/**
 * Decisions not currently surfaced as ordinary event cards. Normally this is
 * exactly the deferred FIFO. If protected deadlines consume the whole budget,
 * a retained weekly decision/actionable scene is also waiting.
 */
export function getWaitingDecisionCount(game: SaveGame): number {
  const deferred = getDeferredDecisionCount(game)
  const singular = getSingularDecisionCount(game)
  if (singular === 0) return deferred

  const currentMatchday = game.currentMatchday ?? 0
  const imminent = (game.pendingEvents ?? [])
    .filter(isActionableEvent)
    .filter(event => {
      const deadline = getDeadlineRound(event)
      return deadline != null && deadline <= currentMatchday + 1
    })
    .length
  const singularOverflow = Math.min(
    singular,
    Math.max(0, imminent + singular - MAX_DECISIONS_PER_ROUND),
  )
  return deferred + singularOverflow
}

/** Compatibility gate for isolated callers; production uses the final partition. */
export function canAddDecision(game: SaveGame, nextRound: number, tier: DecisionTier = 'month'): boolean {
  void nextRound
  void tier
  return getActiveDecisionCount(game) < MAX_DECISIONS_PER_ROUND
}

/** Adds an event and applies the same canonical partition immediately. */
export function tryQueueDecision(game: SaveGame, event: GameEvent): SaveGame {
  return applyDecisionBudget({
    ...game,
    pendingEvents: [...(game.pendingEvents ?? []), event],
  }, game.currentMatchday ?? 0)
}

export interface InterruptBudgetPartition {
  /** Event utan val — "banden passerar oräknade", aldrig throttlade. */
  nonActionable: GameEvent[]
  /** Det som ska ligga i pendingEvents efter throttlen. */
  surface: GameEvent[]
  /** Det som trängs undan till deferredDecisions. */
  deferred: GameEvent[]
}

/**
 * Pure KF3 partition. `reservedSlots` represents the singular weekly decision
 * and actionable scene. Imminent deadlines always surface; flexible events use
 * the remaining slots in deadline order, with stable FIFO for equal deadlines.
 */
export function partitionInterruptBudget(
  allPending: GameEvent[],
  currentMatchday: number,
  reservedSlots = 0,
): InterruptBudgetPartition {
  const actionable = allPending.filter(isActionableEvent)
  const nonActionable = allPending.filter(event => !isActionableEvent(event))

  // Deadline-skydd: event vars deadline infaller senast nästa omgång surfar alltid.
  const imminentSet = new Set(
    actionable
      .filter(e => getDeadlineRound(e) != null && getDeadlineRound(e)! <= currentMatchday + 1)
      .map(e => e.id)
  )
  const imminent = actionable.filter(e => imminentSet.has(e.id))
  // SPEC_DECISIONBUDGET_ALDERSVIKTNING_2026-09-10 §1 — rotorsak: sorteringen
  // läste bara deadline, aldrig deferredAt. Ett deadline-löst event fick
  // Infinity och hamnade permanent sist — kunde svälta i botten av kön (grind:
  // 44) medan deadline-bärande event surfade om och om. deferredAt sattes
  // redan (applyDecisionBudget), bara aldrig lästes i prioriteringen. Ett nytt
  // pendingEvent saknar deferredAt → ålder 0 (rättvist, "just nu" räknas inte
  // som svält). Imminent-skyddet ovan är orört och körs alltid före.
  const age = (e: GameEvent) => currentMatchday - (e.deferredAt ?? currentMatchday)
  const flexible = actionable
    .filter(e => !imminentSet.has(e.id))
    .sort((a, b) => {
      const aStarved = age(a) >= STARVATION_ROUNDS
      const bStarved = age(b) >= STARVATION_ROUNDS
      if (aStarved !== bStarved) return aStarved ? -1 : 1
      return (getDeadlineRound(a) ?? Infinity) - (getDeadlineRound(b) ?? Infinity)
    })

  const budget = Math.max(0, MAX_DECISIONS_PER_ROUND - reservedSlots - imminent.length)
  return {
    nonActionable,
    surface: [...imminent, ...flexible.slice(0, budget)],
    deferred: flexible.slice(budget),
  }
}

/** Applies the pure partition to all three decision-bearing SaveGame fields. */
export function applyDecisionBudget(game: SaveGame, currentMatchday: number): SaveGame {
  const priorDeferred = game.deferredDecisions ?? []
  // Older saves can contain the same event in both queues. Resolution removes
  // the surfaced copy; its durable id must also retire any queued copy before
  // promotion. Preserve FIFO and distinct ids, not one event per type.
  const seenIds = new Set(game.resolvedEventIds ?? [])
  const combined = [...priorDeferred, ...(game.pendingEvents ?? [])].filter(event => {
    if (seenIds.has(event.id)) return false
    seenIds.add(event.id)
    return true
  })
  const { nonActionable, surface, deferred } = partitionInterruptBudget(
    combined,
    currentMatchday,
    getSingularDecisionCount(game),
  )

  return {
    ...game,
    pendingEvents: [...surface, ...nonActionable],
    deferredDecisions: deferred.map(event => ({
      ...event,
      deferredAt: event.deferredAt ?? currentMatchday,
    })),
  }
}

/**
 * Promotes the oldest deferred decision to pendingEvents after a decision resolves.
 * No-op if deferredDecisions is empty.
 */
export function promoteFromQueue(game: SaveGame): SaveGame {
  if ((game.deferredDecisions ?? []).length === 0) return game
  return applyDecisionBudget(game, game.currentMatchday ?? 0)
}
