import type { GameEvent, GameEventType } from '../entities/GameEvent'

export type EventNature = 'critical' | 'player' | 'reactions' | 'inbox-only'

/**
 * Event types that require a decision — shown inline in Översikt (max 3).
 * pressConference is handled separately via game.pendingPressConference.
 */
export const CRITICAL_GRANSKA_TYPES = new Set<GameEventType>([
  'transferBidReceived',
  'contractRequest',
  'playerUnhappy',
  'criticalEconomy',
  'patronEvent',
  'economicStress',
  'mecenatEvent',
  'mecenatWithdrawal',
  'varsel',
  'detOmojligaValet',
  'riskySponsorOffer',
  'bidWar',
])

/**
 * Event types related to individual players — shown in Spelare-fliken.
 */
export const PLAYER_TYPES = new Set<GameEventType>([
  'starPerformance',
  'playerPraise',
  'playerMediaComment',
  'dayJobConflict',
  'hesitantPlayer',
  'captainSpeech',
  'playerArc',
  'retirementCeremony',
  'academyEvent',
  'schoolAssignment',
])

/**
 * Post-match reaction event types. Routing depends on choices.length:
 * - choices.length === 0 → ReaktionerKort (auto-resolved at render)
 * - choices.length > 0   → Översikt as critical (player decision required)
 *
 * Auto-resolve via the 'auto' choiceId is not safe for events with choices.
 * eventResolver silently returns the game unchanged when choiceId is unknown,
 * so side-effects (e.g. tifoDone for supporter_tifo_*, saveBandyLetter for
 * bandyLetter) never fire and the event re-appears next session. The classify
 * function below routes choice-bearing reactions to 'critical' instead.
 */
export const REACTION_TYPES = new Set<GameEventType>([
  'mediaReaction',
  'fanLetter',
  'opponentQuote',
  'supporterEvent',
  'refereeMeeting',
  'bandyLetter',
])

/**
 * Pure function: classify a pending event by its nature for Granska routing.
 *
 * Routing rules:
 * - CRITICAL_GRANSKA_TYPES → 'critical' (decision required in Översikt)
 * - PLAYER_TYPES → 'player' (Spelare-fliken)
 * - REACTION_TYPES with choices.length === 0 → 'reactions' (auto-resolved)
 * - REACTION_TYPES with choices.length > 0 → 'critical' (decision required —
 *   side-effects in eventResolver only fire on a real choiceId)
 * - Any other type with priority='critical' escalates to 'critical'
 * - Otherwise → 'inbox-only'
 */
export function classifyEventNature(event: GameEvent): EventNature {
  if (CRITICAL_GRANSKA_TYPES.has(event.type)) return 'critical'
  if (PLAYER_TYPES.has(event.type)) return 'player'
  if (REACTION_TYPES.has(event.type)) {
    return event.choices.length === 0 ? 'reactions' : 'critical'
  }
  if (event.priority === 'critical') return 'critical'
  return 'inbox-only'
}

/**
 * Returns all critical (decision-required) events from pending queue.
 */
export function getCriticalEventsForGranska(pendingEvents: GameEvent[]): GameEvent[] {
  return pendingEvents.filter(e => !e.resolved && classifyEventNature(e) === 'critical')
}

/**
 * Returns all player-related events from pending queue.
 */
export function getPlayerEventsForGranska(pendingEvents: GameEvent[]): GameEvent[] {
  return pendingEvents.filter(e => !e.resolved && classifyEventNature(e) === 'player')
}

/**
 * Returns all reaction events from pending queue.
 */
export function getReactionEventsForGranska(pendingEvents: GameEvent[]): GameEvent[] {
  return pendingEvents.filter(e => !e.resolved && classifyEventNature(e) === 'reactions')
}
