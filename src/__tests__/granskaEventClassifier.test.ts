import { describe, it, expect } from 'vitest'
import {
  classifyEventNature,
  getCriticalEventsForGranska,
  getPlayerEventsForGranska,
  getReactionEventsForGranska,
  CRITICAL_GRANSKA_TYPES,
  PLAYER_TYPES,
  REACTION_TYPES,
} from '../domain/services/granskaEventClassifier'
import type { GameEvent } from '../../domain/entities/GameEvent'

function makeEvent(type: GameEvent['type'], overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: `test_${type}`,
    type,
    title: 'Test event',
    body: 'Test body',
    choices: [],
    resolved: false,
    ...overrides,
  }
}

describe('classifyEventNature', () => {
  it('classifies critical types correctly', () => {
    for (const type of CRITICAL_GRANSKA_TYPES) {
      expect(classifyEventNature(makeEvent(type))).toBe('critical')
    }
  })

  it('classifies player types correctly', () => {
    for (const type of PLAYER_TYPES) {
      expect(classifyEventNature(makeEvent(type))).toBe('player')
    }
  })

  it('classifies reaction types correctly', () => {
    for (const type of REACTION_TYPES) {
      expect(classifyEventNature(makeEvent(type))).toBe('reactions')
    }
  })

  it('classifies unknown types as inbox-only', () => {
    expect(classifyEventNature(makeEvent('communityEvent'))).toBe('inbox-only')
    expect(classifyEventNature(makeEvent('sponsorOffer'))).toBe('inbox-only')
    expect(classifyEventNature(makeEvent('bandyLetter'))).toBe('inbox-only')
  })
})

describe('getCriticalEventsForGranska cap', () => {
  it('returns only unresolved critical events', () => {
    const events: GameEvent[] = [
      makeEvent('patronEvent', { id: 'p1' }),
      makeEvent('patronEvent', { id: 'p2', resolved: true }),
      makeEvent('criticalEconomy', { id: 'ce1' }),
      makeEvent('communityEvent', { id: 'c1' }),
    ]
    const result = getCriticalEventsForGranska(events)
    expect(result.length).toBe(2)
    expect(result.map(e => e.id)).toContain('p1')
    expect(result.map(e => e.id)).toContain('ce1')
    expect(result.map(e => e.id)).not.toContain('p2')
  })

  it('slice(0, 3) caps at 3 critical events', () => {
    const events: GameEvent[] = [
      makeEvent('patronEvent', { id: 'p1' }),
      makeEvent('criticalEconomy', { id: 'ce1' }),
      makeEvent('transferBidReceived', { id: 'tb1' }),
      makeEvent('patronEvent', { id: 'p2' }),
    ]
    const result = getCriticalEventsForGranska(events).slice(0, 3)
    expect(result.length).toBe(3)
  })
})

describe('getReactionEventsForGranska', () => {
  it('returns only unresolved reaction events', () => {
    const events: GameEvent[] = [
      makeEvent('fanLetter', { id: 'fl1' }),
      makeEvent('opponentQuote', { id: 'oq1' }),
      makeEvent('fanLetter', { id: 'fl2', resolved: true }),
      makeEvent('patronEvent', { id: 'pe1' }),
    ]
    const result = getReactionEventsForGranska(events)
    expect(result.length).toBe(2)
    expect(result.map(e => e.id)).toContain('fl1')
    expect(result.map(e => e.id)).toContain('oq1')
  })
})

describe('getPlayerEventsForGranska', () => {
  it('returns only unresolved player events', () => {
    const events: GameEvent[] = [
      makeEvent('starPerformance', { id: 'sp1' }),
      makeEvent('dayJobConflict', { id: 'djc1' }),
      makeEvent('starPerformance', { id: 'sp2', resolved: true }),
      makeEvent('patronEvent', { id: 'pe1' }),
    ]
    const result = getPlayerEventsForGranska(events)
    expect(result.length).toBe(2)
    expect(result.map(e => e.id)).toContain('sp1')
    expect(result.map(e => e.id)).toContain('djc1')
  })
})
