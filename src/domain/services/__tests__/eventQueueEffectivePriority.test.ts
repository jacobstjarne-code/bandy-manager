import { describe, it, expect } from 'vitest'
import { getEffectivePriority } from '../eventQueueService'
import type { GameEvent } from '../../entities/GameEvent'

function makeEvent(overrides: Partial<GameEvent>): GameEvent {
  return {
    id: 'e1', type: 'mecenatEvent', title: 't', body: 'b', choices: [], resolved: false,
    ...overrides,
  }
}

/**
 * D1 punkt 4 — självkontrollen. INGEN KONSUMENT WIRAD ÄN (se kommentar i
 * eventQueueService.ts) — detta testet låser bara den rena funktionen,
 * inte routing/sortering, som fortfarande läser event.priority direkt.
 */
describe('getEffectivePriority', () => {
  it('critical utan whyNow-data nedgraderas till normal', () => {
    expect(getEffectivePriority(makeEvent({ priority: 'critical' }))).toBe('normal')
  })

  it('critical MED whyNow-data behåller critical', () => {
    expect(getEffectivePriority(makeEvent({ priority: 'critical', deadlineLabel: 'omgång 14' }))).toBe('critical')
  })

  it('icke-critical prioritet påverkas inte av whyNow-fält', () => {
    expect(getEffectivePriority(makeEvent({ priority: 'high' }))).toBe('high')
    expect(getEffectivePriority(makeEvent({ priority: 'low' }))).toBe('low')
  })

  it('ingen explicit priority faller tillbaka på getEventPriority(type) precis som idag', () => {
    // mecenatEvent är critical by default (GameEvent.ts getEventPriority) — utan whyNow-data nedgraderas den
    expect(getEffectivePriority(makeEvent({}))).toBe('normal')
  })
})
