import { describe, expect, it } from 'vitest'
import type { GameEvent } from '../domain/entities/GameEvent'
import { countUnresolvedGranskaDecisions, mergePendingEventsSnapshot } from '../presentation/screens/granska/helpers'

function event(id: string, type: GameEvent['type']): GameEvent {
  return {
    id,
    type,
    title: 't',
    body: 'b',
    choices: [{ id: 'answer', label: 'Svar', effect: { type: 'noOp' } }],
    resolved: false,
  }
}

describe('countUnresolvedGranskaDecisions', () => {
  it('counts pendingCSPress together with the other standalone decisions', () => {
    const press = event('press', 'pressConference')
    const csPress = event('cs', 'csPress')
    const referee = event('referee', 'refereeMeeting')

    expect(countUnresolvedGranskaDecisions([], new Set(), press, csPress, referee)).toBe(3)
    expect(countUnresolvedGranskaDecisions([], new Set(['cs']), press, csPress, referee)).toBe(2)
  })

  it('counts player decisions because they block continue in the Spelare tab', () => {
    const playerDecision = event('job', 'dayJobConflict')
    expect(countUnresolvedGranskaDecisions([playerDecision], new Set())).toBe(1)
    expect(countUnresolvedGranskaDecisions([playerDecision], new Set(['job']))).toBe(0)
  })

  it('keeps resolved receipts and appends a decision promoted while Granska is open', () => {
    const first = event('first', 'criticalEconomy')
    const promoted = event('promoted', 'dayJobConflict')
    const snapshot = [first]
    const merged = mergePendingEventsSnapshot(snapshot, [promoted])
    expect(merged.map(item => item.id)).toEqual(['first', 'promoted'])
    expect(mergePendingEventsSnapshot(merged, [promoted])).toBe(merged)
  })
})
