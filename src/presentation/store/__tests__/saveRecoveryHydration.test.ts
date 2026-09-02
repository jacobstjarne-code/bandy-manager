import { beforeEach, describe, expect, it, vi } from 'vitest'

const idbStore = new Map<string, unknown>()
vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => idbStore.get(key)),
  set: vi.fn(async (key: string, value: unknown) => { idbStore.set(key, value) }),
  del: vi.fn(async (key: string) => { idbStore.delete(key) }),
}))

function createLocalStorageMock() {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
}

const localStorageMock = createLocalStorageMock()
vi.stubGlobal('localStorage', localStorageMock)

async function waitFor(predicate: () => boolean): Promise<void> {
  for (let i = 0; i < 50; i++) {
    if (predicate()) return
    await new Promise(resolve => setTimeout(resolve, 5))
  }
  throw new Error('Villkoret uppfylldes inte')
}

describe('U7 — Zustand persist-rehydrering', () => {
  beforeEach(() => {
    idbStore.clear()
    localStorageMock.clear()
    vi.resetModules()
  })

  it('tar snapshot och kör samma domänmigrering vid appstart', async () => {
    const { createNewGame } = await import('../../../application/useCases/createNewGame')
    const current = createNewGame({ managerName: 'Boot', clubId: 'club_forsbacka', seed: 7 })
    const old = { ...current, version: '0.1.0' }
    idbStore.set('bandy-game-store', JSON.stringify({ state: { game: old }, version: 0 }))

    const { useGameStore, PERSIST_SCHEMA_VERSION } = await import('../gameStore')
    const { CURRENT_SAVE_VERSION } = await import('../../../infrastructure/persistence/saveGameMigration')
    await waitFor(() => useGameStore.persist.hasHydrated())

    expect(useGameStore.getState().game?.version).toBe(CURRENT_SAVE_VERSION)
    const snapshotKeys = idbStore.get('bandy_snapshot_index') as string[]
    expect(snapshotKeys).toHaveLength(1)
    expect(snapshotKeys[0]).toContain('pre_migration')
    const persisted = JSON.parse(idbStore.get('bandy-game-store') as string)
    expect(persisted.version).toBe(PERSIST_SCHEMA_VERSION)
    expect(persisted.state.game.version).toBe(CURRENT_SAVE_VERSION)
  })

  it('larmar utan att skriva över rådatan och kan falla tillbaka till en äldre snapshot', async () => {
    const { createNewGame } = await import('../../../application/useCases/createNewGame')
    const valid = createNewGame({ managerName: 'Återställd', clubId: 'club_forsbacka', seed: 9 })
    const storage = await import('../../../infrastructure/persistence/saveGameStorage')
    await storage.snapshotSave('pre_newgame', valid)
    const failedRaw = JSON.stringify({ state: { game: 42 }, version: 0 })
    idbStore.set('bandy-game-store', failedRaw)

    const { useGameStore } = await import('../gameStore')
    await waitFor(() => storage.isSaveRecoveryNeeded())

    expect(useGameStore.persist.hasHydrated()).toBe(false)
    expect(idbStore.get('bandy-game-store')).toBe(failedRaw)

    const restored = await storage.restoreLatestSaveSnapshot()
    expect(restored.success).toBe(true)
    if (!restored.success) return
    expect(restored.game.managerName).toBe('Återställd')

    await useGameStore.setState({ game: restored.game })
    storage.clearSaveRecoveryNeeded()
    await useGameStore.persist.rehydrate()
    await waitFor(() => useGameStore.persist.hasHydrated())

    expect(useGameStore.getState().game?.id).toBe(valid.id)
    expect(storage.isSaveRecoveryNeeded()).toBe(false)
  })
})
