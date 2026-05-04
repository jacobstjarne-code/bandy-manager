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
 * Atmospheric post-match reactions — auto-resolved in ReaktionerKort.
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
 * General priority-override: any inbox-default type with priority='critical'
 * escalates to CRITICAL. Only 'critical', not 'high'.
 */
export function classifyEventNature(event: GameEvent): EventNature {
  if (CRITICAL_GRANSKA_TYPES.has(event.type)) return 'critical'
  if (PLAYER_TYPES.has(event.type)) return 'player'
  if (REACTION_TYPES.has(event.type)) return 'reactions'
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
