import { describe, expect, it } from 'vitest'
import type { GameEvent } from '../domain/entities/GameEvent'
import { countUnresolvedGranskaDecisions } from '../presentation/screens/granska/helpers'

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
})
