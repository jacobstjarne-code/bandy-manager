import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeBaseGame } from '../../screens/dev/gameStateFactory'

const recoveryMocks = vi.hoisted(() => ({
  clear: vi.fn(),
  list: vi.fn(async () => [{ key: 'bandy_snapshot_pre_newgame_1_0', reason: 'pre_newgame', takenAt: 1 }]),
  restore: vi.fn(async () => ({
    success: true as const,
    game: { ...makeBaseGame(), id: 'restored-save', managerName: 'Återställd' },
    snapshot: { key: 'bandy_snapshot_pre_newgame_1_0', reason: 'pre_newgame', takenAt: 1 },
  })),
}))

vi.mock('idb-keyval', () => ({
  get: vi.fn(async () => undefined),
  set: vi.fn(async () => undefined),
  del: vi.fn(async () => undefined),
}))

vi.mock('../../../infrastructure/persistence/saveGameStorage', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../infrastructure/persistence/saveGameStorage')>()
  return {
    ...actual,
    isSaveRecoveryNeeded: () => true,
    listSaveSnapshots: recoveryMocks.list,
    restoreLatestSaveSnapshot: recoveryMocks.restore,
    clearSaveRecoveryNeeded: recoveryMocks.clear,
  }
})

import { SaveRecoveryBanner } from '../SaveRecoveryBanner'
import { useGameStore } from '../../store/gameStore'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

let container: HTMLDivElement
let root: Root
let originalRehydrate: typeof useGameStore.persist.rehydrate

beforeEach(() => {
  recoveryMocks.clear.mockClear()
  recoveryMocks.list.mockClear()
  recoveryMocks.restore.mockClear()
  useGameStore.setState({ game: null, lastSaveError: null, saveConflict: false })
  originalRehydrate = useGameStore.persist.rehydrate
  useGameStore.persist.rehydrate = vi.fn(async () => undefined)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  useGameStore.persist.rehydrate = originalRehydrate
  act(() => root.unmount())
  container.remove()
})

async function flushEffects() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

describe('SaveRecoveryBanner — U7', () => {
  it('lovar snapshot först efter listning och återställer den via den gemensamma kedjan', async () => {
    act(() => root.render(<MemoryRouter><SaveRecoveryBanner /></MemoryRouter>))
    await flushEffects()

    const alert = container.querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('En lokal återställningspunkt finns kvar.')
    const button = container.querySelector<HTMLButtonElement>('button')!

    await act(async () => { button.click() })
    await flushEffects()

    expect(recoveryMocks.restore).toHaveBeenCalledTimes(1)
    expect(recoveryMocks.clear).toHaveBeenCalledTimes(1)
    expect(useGameStore.getState().game?.id).toBe('restored-save')
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })
})
