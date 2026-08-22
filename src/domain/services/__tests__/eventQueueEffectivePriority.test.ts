import { describe, it, expect, vi } from 'vitest'
import type { GameEvent } from '../../entities/GameEvent'

function makeEvent(overrides: Partial<GameEvent>): GameEvent {
  return {
    id: 'e1', type: 'mecenatEvent', title: 't', body: 'b', choices: [], resolved: false,
    ...overrides,
  }
}

/**
 * D1 punkt 4 — självkontrollen, kopplad mot contentContract.ts (Jacobs dom,
 * 2026-08-21), inte mot event-instansens egna fält.
 */
describe('getEffectivePriority — verklig registerstatus (ingen mock)', () => {
  it('mecenatEvent (critical by default) nedgraderas idag till normal — contentContract.ts har ingen whyNow-rad för den ännu', async () => {
    const { getEffectivePriority } = await import('../eventQueueService')
    expect(getEffectivePriority(makeEvent({ type: 'mecenatEvent' }))).toBe('normal')
  })

  it('icke-critical prioritet påverkas inte av registret', async () => {
    const { getEffectivePriority } = await import('../eventQueueService')
    expect(getEffectivePriority(makeEvent({ priority: 'high' }))).toBe('high')
    expect(getEffectivePriority(makeEvent({ priority: 'low' }))).toBe('low')
  })
})

describe('getEffectivePriority — wiring mot contentContract (mockad rad)', () => {
  it('critical MED en ifylld whyNow-rad i registret behåller critical', async () => {
    // Medium 4 (Skutskär-auditen, 2026-08-22): eventQueueService.ts anropar
    // sedan getEffectiveWhyNowLine (instans-medveten wrapper), inte längre
    // getContentContractEntry/getWhyNowLine direkt — den mockas här i
    // stället. Att mocka getContentContractEntry hade inte längre fungerat:
    // getEffectiveWhyNowLine anropar den LOKALT inom samma modul, ett
    // internt samma-fil-anrop som Vitests modul-mock inte fångar.
    vi.resetModules()
    vi.doMock('../../data/contentContract', async () => {
      const actual = await vi.importActual<typeof import('../../data/contentContract')>('../../data/contentContract')
      return {
        ...actual,
        getEffectiveWhyNowLine: (event: { type: string }) =>
          event.type === 'mecenatEvent' ? 'Svaret måste komma före omgång 14.' : null,
      }
    })
    const { getEffectivePriority } = await import('../eventQueueService')
    expect(getEffectivePriority(makeEvent({ type: 'mecenatEvent' }))).toBe('critical')
    vi.doUnmock('../../data/contentContract')
    vi.resetModules()
  })
})
