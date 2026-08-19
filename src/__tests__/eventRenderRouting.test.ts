import { describe, it, expect } from 'vitest'
import { isAmbientEvent, getEventRenderTarget } from '../domain/services/eventQueueService'
import type { GameEvent } from '../domain/entities/GameEvent'

/**
 * D1 (DOM_D1_EVENTVIKTNING_2026-08-19.md) punkt 2 — Ambient-regeln.
 *
 * "Att ett event utan val inte får ett kort är en mekanisk regel, inte en
 * estetisk — den går inte att tolka fel och den kan testas." Testar den
 * regeln som ren logik, samma mönster som matchLive_integration.test.tsx:s
 * ARKITEKTONISKA NOTERING beskriver: @testing-library/react är inte
 * installerat, så komponentträd renderas aldrig i testsviten — den
 * mekaniska routing-BESLUTET (getEventRenderTarget) testas i stället för
 * DOM-utfallet, och GameShell/PortalEventSlot/EventPrimary läser alla
 * samma funktion, så ett grönt test här bevisar även deras beteende.
 */

function makeChoice(id = 'choice_a'): GameEvent['choices'][number] {
  return { id, label: 'Ett val', effect: { type: 'noOp' } }
}

function makeEvent(overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 'evt_1',
    type: 'communityEvent',
    title: 'Titel',
    body: 'Brödtext',
    choices: [],
    resolved: false,
    ...overrides,
  }
}

describe('isAmbientEvent', () => {
  it('event utan val (choices: []) är ambient', () => {
    const event = makeEvent({ choices: [] })
    expect(isAmbientEvent(event)).toBe(true)
  })

  it('event med ett val är INTE ambient', () => {
    const event = makeEvent({ choices: [makeChoice()] })
    expect(isAmbientEvent(event)).toBe(false)
  })

  it('event med flera val är INTE ambient', () => {
    const event = makeEvent({ choices: [makeChoice('a'), makeChoice('b')] })
    expect(isAmbientEvent(event)).toBe(false)
  })
})

describe('getEventRenderTarget — den mekaniska routing-regeln', () => {
  it('ambient event med explicit priority=critical rutas till ambient, ALDRIG overlay (regression: softlock-buggen)', () => {
    // Detta var den konkreta buggen (D1-utredningen 2026-08-19): EventOverlay
    // läste event.choices direkt utan getActionsForEvent-fallbacken som
    // EventCardInline redan hade — ett kritiskt event utan val blev en
    // fullskärmsmodal utan knappar, ingen väg att stänga den.
    const event = makeEvent({ choices: [], priority: 'critical' })
    expect(getEventRenderTarget(event)).toBe('ambient')
    expect(getEventRenderTarget(event)).not.toBe('overlay')
  })

  it('ambient event härlett kritiskt via type (mecenatEvent, ingen explicit priority) rutas ändå till ambient', () => {
    const event = makeEvent({ type: 'mecenatEvent', choices: [] })
    expect(getEventRenderTarget(event)).toBe('ambient')
  })

  it('ambient event med low priority rutas till ambient (inte inline)', () => {
    const event = makeEvent({ choices: [], priority: 'low' })
    expect(getEventRenderTarget(event)).toBe('ambient')
  })

  it('event med val och priority=critical rutas till overlay — DecisionCard/EventOverlay ska visas', () => {
    const event = makeEvent({ choices: [makeChoice()], priority: 'critical' })
    expect(getEventRenderTarget(event)).toBe('overlay')
  })

  it('event med val och priority=normal rutas till inline (EventCardInline)', () => {
    const event = makeEvent({ choices: [makeChoice()], priority: 'normal' })
    expect(getEventRenderTarget(event)).toBe('inline')
  })

  it('event med val, kritiskt via type (mecenatEvent) utan explicit priority rutas till overlay', () => {
    const event = makeEvent({ type: 'mecenatEvent', choices: [makeChoice()] })
    expect(getEventRenderTarget(event)).toBe('overlay')
  })
})
