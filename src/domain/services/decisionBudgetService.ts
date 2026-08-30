/**
 * decisionBudgetService — throttling gate for pending decisions.
 *
 * Prevents decision-overload by capping the number of active decisions
 * the player faces simultaneously. Max 3 active (season 1 round 1: max 1).
 *
 * "Active decisions" = unresolved pendingEvents WITH choices + pendingWeeklyDecision.
 * Atmospheric/informational events (no choices) bypass the budget — "banden passerar oräknade".
 *
 * When budget is full, tryQueueDecision defers to deferredDecisions (max 10, sorted oldest-first).
 * When an active decision resolves, promoteFromQueue lifts the oldest deferred one.
 */

import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent, DecisionTier } from '../entities/GameEvent'
import { isMustDecision } from './decisionTierService'

export const MAX_ACTIVE_DECISIONS = 3
export const MAX_ACTIVE_SEASON_1_ROUND_1 = 1
export const MAX_DEFERRED_DECISIONS = 10

/**
 * Returns the number of active (unresolved) actionable decisions the player currently has.
 * Only events with choices count — informational/atmospheric events bypass the budget.
 */
export function getActiveDecisionCount(game: SaveGame): number {
  const pendingEventsCount = (game.pendingEvents ?? []).filter(e => !e.resolved && (e.choices?.length ?? 0) > 0).length
  const weeklyDecisionCount = game.pendingWeeklyDecision ? 1 : 0
  return pendingEventsCount + weeklyDecisionCount
}

/**
 * HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md): antalet aktiva beslut
 * SOM THROTTLEN RÄKNAR. Måste-nivån (kontraktsdeadline, licenskrav) är
 * undantagen — "En deadline kan inte vänta på budget."
 *
 * Varför en EGEN funktion i stället för att ändra getActiveDecisionCount:
 * den funktionen svarar på en annan fråga ("hur många beslut har spelaren
 * framför sig") och läses av två UI-räknare (PortalActiveBudget,
 * PortalInboxCounter) samt decisionFatigueService. Ett måste-event ÄR ett
 * beslut spelaren har framför sig — det ska synas i räknaren; det ska bara
 * inte kunna tränga undan andra beslut ur budgeten.
 */
export function getThrottledActiveDecisionCount(game: SaveGame): number {
  const pendingEventsCount = (game.pendingEvents ?? [])
    .filter(e => !e.resolved && (e.choices?.length ?? 0) > 0 && !isMustDecision(e))
    .length
  const weeklyDecisionCount = game.pendingWeeklyDecision ? 1 : 0
  return pendingEventsCount + weeklyDecisionCount
}

/**
 * Returns the number of decisions waiting in the deferred queue.
 */
export function getDeferredDecisionCount(game: SaveGame): number {
  return (game.deferredDecisions ?? []).length
}

/**
 * Returns true if a new decision can be added to the queue.
 * Season 1 Round 1 has a stricter limit of 1 active decision.
 *
 * HIGH 11: `tier` är valfri och defaultar till 'month' — samtliga fyra
 * befintliga anropsställen (roundProcessor.ts:s veckobeslut,
 * mediaProcessor.ts:s transferrykte, eventProcessor.ts:s community-event,
 * mecenatmiddag och burnout-lättnad) grindar icke-måste-beslut, så
 * defaulten bevarar deras beteende exakt. Ett 'must' passerar alltid:
 * domen, ordagrant — "Måste-nivån är UNDANTAGEN throttlen ... defereras
 * aldrig."
 */
export function canAddDecision(game: SaveGame, nextRound: number, tier: DecisionTier = 'month'): boolean {
  if (tier === 'must') return true
  const limit = ((game.seasonSummaries?.length ?? 0) === 0 && nextRound === 1)
    ? MAX_ACTIVE_SEASON_1_ROUND_1
    : MAX_ACTIVE_DECISIONS
  return getThrottledActiveDecisionCount(game) < limit
}

/**
 * Tries to add a GameEvent as an active decision. If the budget is full,
 * the event is deferred to deferredDecisions (capped at MAX_DEFERRED_DECISIONS,
 * oldest dropped if overflow).
 */
export function tryQueueDecision(game: SaveGame, event: GameEvent): SaveGame {
  if (canAddDecision(game, game.currentMatchday ?? 1, isMustDecision(event) ? 'must' : 'month')) {
    return { ...game, pendingEvents: [...(game.pendingEvents ?? []), event] }
  }
  const withTimestamp = { ...event, deferredAt: game.currentMatchday ?? 1 }
  const newDeferred = [...(game.deferredDecisions ?? []), withTimestamp]
    .sort((a, b) => (a.deferredAt ?? 0) - (b.deferredAt ?? 0))
  const capped = newDeferred.length > MAX_DEFERRED_DECISIONS
    ? newDeferred.slice(newDeferred.length - MAX_DEFERRED_DECISIONS)
    : newDeferred
  return { ...game, deferredDecisions: capped }
}

export interface InterruptBudgetPartition {
  /** Event utan val — "banden passerar oräknade", aldrig throttlade. */
  nonActionable: GameEvent[]
  /** Det som ska ligga i pendingEvents efter throttlen. */
  surface: GameEvent[]
  /** Det som trängs undan till deferredDecisions (ännu ocappat). */
  deferred: GameEvent[]
}

/**
 * KF3-avbrottsbudgeten som REN funktion (extraherad ur roundProcessor.ts
 * 2026-08-31 för HIGH 11). Det här — inte tryQueueDecision, som saknar
 * produktionsanropsställe — är kodbasens faktiska deferrings-mekanism, och
 * därför det enda ställe där måste-undantaget kan vara verkligt.
 *
 * Ordningen i `surface` är avsiktlig: måste först (domen: "surfar alltid som
 * det primära kortet"), sedan imminenta (expiresRound ≤ nästa omgång + 1),
 * sedan så mycket av den flexibla kön som budgeten rymmer. Måste räknas
 * ALDRIG mot MAX_ACTIVE_DECISIONS och hamnar aldrig i `deferred`.
 */
export function partitionInterruptBudget(
  allPending: GameEvent[],
  nextMatchday: number,
): InterruptBudgetPartition {
  const allActionable = allPending.filter(e => (e.choices?.length ?? 0) > 0)
  const nonActionable = allPending.filter(e => (e.choices?.length ?? 0) === 0)

  const must = allActionable.filter(e => isMustDecision(e))
  const actionable = allActionable.filter(e => !isMustDecision(e))

  // Imminent-skydd: event med expiresRound ≤ nextMatchday+1 surfar alltid.
  // (expiresRound finns ej på GameEvent ännu — imminentSet är alltid tom tills tillagt.)
  const expiresRoundOf = (e: GameEvent): number | undefined =>
    (e as unknown as { expiresRound?: number }).expiresRound
  const imminentSet = new Set(
    actionable
      .filter(e => expiresRoundOf(e) != null && expiresRoundOf(e)! <= nextMatchday + 1)
      .map(e => e.id)
  )
  const imminent = actionable.filter(e => imminentSet.has(e.id))
  const flexible = actionable
    .filter(e => !imminentSet.has(e.id))
    .sort((a, b) => (expiresRoundOf(a) ?? Infinity) - (expiresRoundOf(b) ?? Infinity))

  const budget = Math.max(0, MAX_ACTIVE_DECISIONS - imminent.length)
  return {
    nonActionable,
    surface: [...must, ...imminent, ...flexible.slice(0, budget)],
    deferred: flexible.slice(budget),
  }
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
