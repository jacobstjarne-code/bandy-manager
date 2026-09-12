import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import type { GameEvent } from '../../entities/GameEvent'
import {
  getKnownDecisionIdentities,
  recordDecisionLifecycle,
} from '../decisionLifecycleService'
import { CLUB_TEMPLATES } from '../worldGenerator'

function makeEvent(id: string): GameEvent {
  return {
    id,
    type: 'communityEvent',
    title: 'Testhändelse',
    body: 'Test',
    choices: [{ id: 'ok', label: 'OK', effect: { type: 'none' } }],
    resolved: false,
  }
}

describe('decisionLifecycleService — durabel identitet', () => {
  it('skriver även ett vanligt konkret event-id till den append-only liggaren', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const event = makeEvent('stable_event_id')

    const resolved = recordDecisionLifecycle(game, event, 'resolved')

    expect(resolved.eventLedger).toContainEqual(expect.objectContaining({
      type: 'decision_lifecycle',
      semanticKey: event.id,
      sourceEventId: event.id,
      resolution: 'resolved',
    }))
  })

  it('känner igen ett gammalt event efter att resolvedEventIds-cap har rullat förbi det', () => {
    let game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 2 })
    const oldEvent = makeEvent('old_stable_event')
    game = recordDecisionLifecycle(game, oldEvent, 'resolved')
    game = {
      ...game,
      resolvedEventIds: Array.from({ length: 200 }, (_, index) => `newer_${index}`),
    }

    expect(getKnownDecisionIdentities(game)).toContain(oldEvent.id)
  })
})
