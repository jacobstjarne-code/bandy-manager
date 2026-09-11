import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'
import { logEvent } from './eventLedgerService'

export type DecisionLifecycleResolution = 'resolved' | 'expired'

/**
 * One semantic identity for every phase of the decision queue. Most producers
 * already use a canonical concrete id, so that id is the safe fallback.
 * Named recurring decisions can opt into a broader identity explicitly.
 */
export function getDecisionSemanticId(
  event: Pick<GameEvent, 'id' | 'semanticId'>,
): string {
  return event.semanticId ?? event.id
}

/**
 * O12 uses the presented choice set as the default template identity. This
 * keeps concrete season/player ids out of the metric while separating broad
 * families such as patronEvent into the actual decisions the player faced.
 * An explicit producer id is the escape hatch for semantically different
 * templates that intentionally reuse the same choice ids.
 */
export function getDecisionTemplateKey(
  event: Pick<GameEvent, 'type' | 'choices' | 'decisionTemplateId'>,
): string {
  if (event.decisionTemplateId) return `${event.type}:${event.decisionTemplateId}`
  const choiceSet = event.choices.map(choice => choice.id).sort().join('|')
  return `${event.type}:${choiceSet}`
}

function addEventIdentities(target: Set<string>, event: Pick<GameEvent, 'id' | 'semanticId'>): void {
  target.add(event.id)
  target.add(getDecisionSemanticId(event))
}

/**
 * Canonical read side used by generators and queue partitioning. It spans
 * active/deferred cards, durable choice receipts and resolved/expired ledger
 * entries, so moving a card never makes it look new again.
 */
export function getKnownDecisionIdentities(game: SaveGame): Set<string> {
  const known = new Set(game.resolvedEventIds ?? [])
  for (const event of game.pendingEvents ?? []) addEventIdentities(known, event)
  for (const event of game.deferredDecisions ?? []) addEventIdentities(known, event)
  for (const receipt of game.resolvedChoices ?? []) {
    known.add(receipt.eventId)
    if (receipt.eventSemanticId) known.add(receipt.eventSemanticId)
  }
  for (const entry of game.eventLedger ?? []) {
    if (entry.type !== 'decision_lifecycle') continue
    known.add(entry.semanticKey)
    if (entry.sourceEventId) known.add(entry.sourceEventId)
  }
  return known
}

/** Writes the terminal state once and preserves the exact event id as proof. */
export function recordDecisionLifecycle(
  game: SaveGame,
  event: GameEvent,
  resolution: DecisionLifecycleResolution,
): SaveGame {
  const semanticKey = getDecisionSemanticId(event)
  const exists = (game.eventLedger ?? []).some(entry =>
    entry.type === 'decision_lifecycle'
    && entry.sourceEventId === event.id
    && entry.resolution === resolution
  )
  const resolvedEventIds = (game.resolvedEventIds ?? []).includes(event.id)
    ? (game.resolvedEventIds ?? [])
    : [...(game.resolvedEventIds ?? []), event.id].slice(-200)
  // Concrete ids already have durable resolvedEventIds/resolvedChoices
  // receipts. The extra ledger row exists for semantic identities and for
  // explicit expiry, where no choice receipt can be written.
  if (resolution === 'resolved' && !event.semanticId) {
    return { ...game, resolvedEventIds }
  }
  if (exists) return { ...game, resolvedEventIds }

  return {
    ...game,
    resolvedEventIds,
    eventLedger: logEvent(game, {
      type: 'decision_lifecycle',
      semanticKey,
      sourceEventId: event.id,
      resolution,
      season: event.occurredAt?.season ?? game.currentSeason,
      matchday: event.occurredAt?.matchday ?? game.currentMatchday,
      ...(event.relatedPlayerId ? { subject: { kind: 'player' as const, id: event.relatedPlayerId } } : {}),
      significance: 0,
    }),
  }
}
