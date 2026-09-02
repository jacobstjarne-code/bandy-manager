import { describe, it, expect } from 'vitest'
import { hasCriticalEvent } from '../eventTriggers'
import type { SaveGame } from '../../../../entities/SaveGame'
import type { GameEvent } from '../../../../entities/GameEvent'

function makeEvent(type: GameEvent['type'], overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: `test_${type}`, type, title: 't', body: 'b',
    choices: [{ id: 'yes', label: 'Ja', effect: { type: 'noOp' } }],
    resolved: false,
    ...overrides,
  }
}

function makeGame(pendingEvents: GameEvent[]): SaveGame {
  return { pendingEvents } as unknown as SaveGame
}

/**
 * MASTER_OPPET.md d-evt1-eventprimary-overlay (2026-09-02): hasCriticalEvent
 * läste tidigare rå `(e.priority ?? getEventPriority(e.type)) === 'critical'`
 * — missade D1 punkt 4:s självkontroll (getEffectivePriority nedgraderar
 * critical→normal utan en "därför nu"-rad). Läser nu getEffectivePriority,
 * samma delade funktion som GameShell/PortalEventSlot/EventPrimary.
 */
describe('hasCriticalEvent — d-evt1-eventprimary-overlay (getEffectivePriority-konsolidering)', () => {
  it('ett default-kritiskt event UTAN whyNow-rad nedgraderas — ingen kritisk händelse hittas', () => {
    // mecenatEvent är default 'critical' i getEventPriority, men bär ingen
    // instans-whyNow här — D1 punkt 4 nedgraderar den till 'normal'.
    const game = makeGame([makeEvent('mecenatEvent')])
    expect(hasCriticalEvent(game)).toBe(false)
  })

  it('samma eventtyp MED en instans-whyNow-rad räknas som kritisk', () => {
    const game = makeGame([makeEvent('mecenatEvent', { whyNow: { whyNowPerson: 'Test Testsson' } })])
    expect(hasCriticalEvent(game)).toBe(true)
  })

  it('pressConference ignoreras alltid, oavsett prioritet', () => {
    const game = makeGame([makeEvent('pressConference', { priority: 'critical', whyNow: { whyNowPerson: 'X' } })])
    expect(hasCriticalEvent(game)).toBe(false)
  })

  it('redan löst event räknas inte', () => {
    const game = makeGame([makeEvent('mecenatEvent', { resolved: true, whyNow: { whyNowPerson: 'X' } })])
    expect(hasCriticalEvent(game)).toBe(false)
  })

  it('tom kö: ingen kritisk händelse', () => {
    expect(hasCriticalEvent(makeGame([]))).toBe(false)
  })
})
