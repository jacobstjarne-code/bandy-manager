import { describe, it, expect, vi } from 'vitest'
import { getBatchSiblings } from '../eventQueueService'
import type { GameEvent } from '../../entities/GameEvent'
import type { SaveGame } from '../../entities/SaveGame'

// D1 punkt 4 (2026-08-21): getEffectivePriority nedgraderar critical → normal
// om contentContract.ts saknar whyNow-data för typen — sant för mecenatEvent
// idag (se contentContract.ts). Mockad här bara för att kunna konstruera ett
// GENUINT pivotal syskon och testa FILTRERINGEN, inte klassificeringsstatusen
// (den testas separat i eventQueueEffectivePriority.test.ts).
//
// Medium 4 (Skutskär-auditen, 2026-08-22): mockar getEffectiveWhyNowLine
// direkt, inte getContentContractEntry — se eventRenderRouting.test.ts för
// samma rotorsak (internt samma-fil-anrop i contentContract.ts).
vi.mock('../../data/contentContract', async () => {
  const actual = await vi.importActual<typeof import('../../data/contentContract')>('../../data/contentContract')
  return {
    ...actual,
    getEffectiveWhyNowLine: (event: { type: string }) =>
      event.type === 'mecenatEvent' ? 'Svaret måste komma före omgång 14.' : null,
  }
})

function makeEvent(overrides: Partial<GameEvent>): GameEvent {
  return {
    id: 'e1', type: 'contractRequest', title: 't', body: 'b',
    choices: [{ id: 'c', label: 'l', effect: { type: 'noOp' } }],
    resolved: false,
    ...overrides,
  }
}

function makeGame(pendingEvents: GameEvent[]): SaveGame {
  return { pendingEvents } as unknown as SaveGame
}

/**
 * Batch-av-tre (D1 punkt 4, 2026-08-21) — "gränsen är delad orsak, inte
 * antal... alltid ≤3", "ett pivotal-event får aldrig hamna i en batch".
 */
describe('getBatchSiblings', () => {
  it('inget triggerGroupId på det aktiva eventet ger alltid []', () => {
    const active = makeEvent({ id: 'a' })
    const game = makeGame([active, makeEvent({ id: 'b', triggerGroupId: 'window-open' })])
    expect(getBatchSiblings(game, active)).toEqual([])
  })

  it('hittar syskon med samma triggerGroupId, exkluderar sig själv', () => {
    const active = makeEvent({ id: 'a', triggerGroupId: 'window-open' })
    const b = makeEvent({ id: 'b', triggerGroupId: 'window-open' })
    const c = makeEvent({ id: 'c', triggerGroupId: 'window-open' })
    const unrelated = makeEvent({ id: 'd', triggerGroupId: 'other-cause' })
    const game = makeGame([active, b, c, unrelated])
    const siblings = getBatchSiblings(game, active)
    expect(siblings.map(e => e.id).sort()).toEqual(['b', 'c'])
  })

  it('kapar vid 2 syskon (aktivt + 2 = totalt 3), även om fler delar orsak', () => {
    const active = makeEvent({ id: 'a', triggerGroupId: 'window-open' })
    const siblings4 = ['b', 'c', 'd', 'e'].map(id => makeEvent({ id, triggerGroupId: 'window-open' }))
    const game = makeGame([active, ...siblings4])
    expect(getBatchSiblings(game, active)).toHaveLength(2)
  })

  it('filtrerar bort ett pivotal (critical) syskon — det bryter stapeln, batchas aldrig', () => {
    const active = makeEvent({ id: 'a', triggerGroupId: 'window-open' })
    const normalSibling = makeEvent({ id: 'b', triggerGroupId: 'window-open' })
    const criticalSibling = makeEvent({ id: 'c', triggerGroupId: 'window-open', type: 'mecenatEvent', priority: 'critical' })
    const game = makeGame([active, normalSibling, criticalSibling])
    const siblings = getBatchSiblings(game, active)
    expect(siblings.map(e => e.id)).toEqual(['b'])
  })

  it('ignorerar redan besvarade syskon', () => {
    const active = makeEvent({ id: 'a', triggerGroupId: 'window-open' })
    const resolved = makeEvent({ id: 'b', triggerGroupId: 'window-open', resolved: true })
    const game = makeGame([active, resolved])
    expect(getBatchSiblings(game, active)).toEqual([])
  })
})
