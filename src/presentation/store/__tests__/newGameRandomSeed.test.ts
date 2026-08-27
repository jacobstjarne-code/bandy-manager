/**
 * O10-uppföljning (2026-08-26, Jacobs fynd): newGame() skickade ALDRIG ett
 * seed till createNewGame(), så worldSeed föll tillbaka till konstanten 42
 * för VARJE karriär startad via appen sedan K4 (19 augusti) — alla
 * live-careers delade oavsiktligt exakt samma värld. Regressionstest: två
 * på varandra följande newGame()-anrop ska ge olika worldSeed.
 *
 * Samma idb-keyval/localStorage-mockmönster som multiSlotSwitch.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

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

async function flush(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 10))
}

describe('gameStore.newGame — riktigt slumpat worldSeed, inte alltid 42', () => {
  beforeEach(() => {
    idbStore.clear()
    localStorageMock.clear()
    vi.resetModules()
  })

  it('två på varandra följande fristående careers får OLIKA worldSeed', async () => {
    const { useGameStore } = await import('../gameStore')
    const { CLUB_TEMPLATES } = await import('../../../domain/services/worldGenerator')

    useGameStore.getState().newGame('Manager A', CLUB_TEMPLATES[0].id)
    await flush()
    const seedA = useGameStore.getState().game!.worldSeed

    useGameStore.getState().newGame('Manager B', CLUB_TEMPLATES[1].id)
    await flush()
    const seedB = useGameStore.getState().game!.worldSeed

    expect(seedA).toBeDefined()
    expect(seedB).toBeDefined()
    expect(seedA).not.toBe(42) // den gamla, oavsiktliga fasta världen
    expect(seedB).not.toBe(42)
    expect(seedA).not.toBe(seedB)
  })
})
