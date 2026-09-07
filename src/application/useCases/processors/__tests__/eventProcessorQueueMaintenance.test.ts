import { describe, expect, it } from 'vitest'
import type { GameEvent } from '../../../../domain/entities/GameEvent'
import { createNewGame } from '../../createNewGame'
import { maintainEventQueues } from '../eventProcessor'

function event(
  id: string,
  options: Partial<GameEvent> = {},
): GameEvent {
  return {
    id,
    type: 'opponentQuote',
    title: id,
    body: id,
    choices: [],
    resolved: false,
    priority: 'low',
    ...options,
  }
}

describe('eventProcessor — ordered queue maintenance', () => {
  it('spiller lågprioritetsöverskott, rensar lösta kort och omprövar skadebeslut', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 17 })
    const lowEvents = Array.from({ length: 6 }, (_, index) => event(`low_${index}`))
    const resolved = event('resolved', { resolved: true, priority: 'high' })
    const staleInjuryChoice = event('stale_injury', {
      type: 'playThroughInjury',
      priority: 'high',
      relatedPlayerId: 'missing_player',
      choices: [{ id: 'play', label: 'Spela', effect: { type: 'noOp' } }],
    })

    const result = maintainEventQueues({
      ...game,
      pendingEvents: [...lowEvents, resolved, staleInjuryChoice],
      deferredDecisions: [],
    }, 7)

    expect(result.pendingEvents?.map(item => item.id)).toEqual(lowEvents.slice(0, 5).map(item => item.id))
    expect(result.inbox).toContainEqual(expect.objectContaining({ id: 'inbox_spill_low_5' }))
    expect(result.pendingEvents).not.toContainEqual(expect.objectContaining({ id: 'resolved' }))
    expect(result.pendingEvents).not.toContainEqual(expect.objectContaining({ id: 'stale_injury' }))
  })

  it('promoterar äldre deferrade beslut före nya och håller tre månadsbeslut synliga', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 17 })
    const choices = [{ id: 'accept', label: 'Acceptera', effect: { type: 'noOp' as const } }]
    const deferred = event('deferred_oldest', { type: 'sponsorOffer', priority: 'normal', choices })
    const pending = [1, 2, 3].map(index =>
      event(`pending_${index}`, { type: 'sponsorOffer', priority: 'normal', choices }),
    )

    const result = maintainEventQueues({
      ...game,
      pendingEvents: pending,
      deferredDecisions: [deferred],
    }, 7)

    expect(result.pendingEvents?.map(item => item.id)).toEqual([
      'deferred_oldest',
      'pending_1',
      'pending_2',
    ])
    expect(result.deferredDecisions?.map(item => item.id)).toEqual(['pending_3'])
  })
})
