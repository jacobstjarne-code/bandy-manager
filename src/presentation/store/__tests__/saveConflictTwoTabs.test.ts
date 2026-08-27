/**
 * M2 (oberoende speltest- och produktaudit, 5c9a7a8, 2026-08-24) — SÅG LIVE:
 * flik A valde Taktik; en stale flik B (öppnad tidigare, aldrig omladdad)
 * valde Hård; B:s skrivning landade EFTER A:s och skrev tyst över A:s val.
 * Ren last-write-wins, ingen av flikarna visste att den andra existerade.
 *
 * Två separata Zustand-modulinstanser (vi.resetModules() + dynamisk import
 * mellan varje "flik") delar samma mockade idb-butik/localStorage — det
 * simulerar exakt två riktiga flikar, som är oberoende JS-kontexter men
 * delar samma fysiska IndexedDB/localStorage. Samma teknik som
 * multiSlotSwitch.test.ts, men med två LEVANDE store-instanser samtidigt
 * istället för en instans som byter mellan saves.
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

describe('gameStore — M2: två flikar racear mot samma save', () => {
  beforeEach(() => {
    idbStore.clear()
    localStorageMock.clear()
    vi.resetModules()
  })

  it('flik B (stale) kan INTE skriva över flik A:s redan sparade ändring — avvisas, saveConflict sätts', async () => {
    // Flik A skapar karriären.
    vi.resetModules()
    const tabA = await import('../gameStore')
    const { CLUB_TEMPLATES } = await import('../../../domain/services/worldGenerator')
    tabA.useGameStore.getState().newGame('Manager A', CLUB_TEMPLATES[0].id)
    await flush()
    const id = tabA.useGameStore.getState().game!.id

    // Flik B öppnas separat och laddar SAMMA karriär (egen modulinstans,
    // egen store, men samma disk — precis som en verklig andra flik).
    vi.resetModules()
    const tabB = await import('../gameStore')
    const loadedInB = await tabB.useGameStore.getState().loadGame(id)
    expect(loadedInB).toBe(true)
    expect(tabB.useGameStore.getState().game!.revision).toBe(tabA.useGameStore.getState().game!.revision)

    // Flik A gör en ändring och sparar — disken går nu ett steg längre fram.
    tabA.useGameStore.getState().updateTactic({
      ...tabA.useGameStore.getState().game!.clubs[0].tactic,
    } as any)
    const saveResultA = await tabA.useGameStore.getState().saveGame()
    expect(saveResultA.success).toBe(true)

    // Flik B, fortfarande på sin gamla revision, försöker spara — SKA
    // avvisas. Detta är exakt B:s "Hård"-skrivning i reproduktionen: den
    // ska INTE tillåtas skriva över A:s redan sparade "Taktik"-val.
    const saveResultB = await tabB.useGameStore.getState().saveGame()
    expect(saveResultB.success).toBe(false)
    expect(tabB.useGameStore.getState().saveConflict).toBe(true)

    // Den avgörande assertionen: disken bär fortfarande A:s skrivning,
    // ingen dataförlust skedde.
    const onDisk = await import('../../../infrastructure/persistence/saveGameStorage').then(m => m.loadSaveGame(id))
    expect(onDisk).not.toBeNull()
    expect(onDisk!.revision).toBe(tabA.useGameStore.getState().game!.revision)
  })

  it('resolveSaveConflict hämtar den AUKTORITATIVA kopian, inte flikens egen stale in-memory-data', async () => {
    // Regressionsvakt: ett rakt window.location.reload() (ErrorBoundary-
    // mönstret) räcker INTE här — Zustands EGNA persist-middleware
    // (indexedDBStorage, nyckel "bandy-game-store") är en separat, o-CAS-
    // skyddad skrivväg som en stale flik fortsätter mata på (varje set()-
    // anrop, inklusive set({saveConflict:true}) självt). Ett reload som
    // bara läser den kanalen kan återuppliva exakt den race CAS ska
    // stoppa. resolveSaveConflict måste explicit läsa bandy_save_<id>
    // (loadSaveGame, CAS-skyddad) FÖRST. Verifierat live i browser (två
    // riktiga flikar, samma IndexedDB) 2026-08-26 innan denna
    // regressionstest skrevs — se M2-rapporten.
    vi.stubGlobal('location', { ...window.location, reload: vi.fn() })

    vi.resetModules()
    const tabA = await import('../gameStore')
    const { CLUB_TEMPLATES } = await import('../../../domain/services/worldGenerator')
    tabA.useGameStore.getState().newGame('Manager A', CLUB_TEMPLATES[0].id)
    await flush()
    const id = tabA.useGameStore.getState().game!.id

    vi.resetModules()
    const tabB = await import('../gameStore')
    await tabB.useGameStore.getState().loadGame(id)

    await tabA.useGameStore.getState().saveGame()
    const saveResultB = await tabB.useGameStore.getState().saveGame()
    expect(saveResultB.conflict).toBe(true)
    expect(tabB.useGameStore.getState().saveConflict).toBe(true)

    await tabB.useGameStore.getState().resolveSaveConflict()

    expect(tabB.useGameStore.getState().saveConflict).toBe(false)
    expect(tabB.useGameStore.getState().game!.revision).toBe(tabA.useGameStore.getState().game!.revision)
  })

  it('flik A kan fortsätta spara flera gånger i följd utan att någonsin falskt konfliktera med sig själv', async () => {
    vi.resetModules()
    const tabA = await import('../gameStore')
    const { CLUB_TEMPLATES } = await import('../../../domain/services/worldGenerator')
    tabA.useGameStore.getState().newGame('Manager A', CLUB_TEMPLATES[0].id)
    await flush()

    const r1 = await tabA.useGameStore.getState().saveGame()
    const r2 = await tabA.useGameStore.getState().saveGame()
    const r3 = await tabA.useGameStore.getState().saveGame()

    expect([r1.success, r2.success, r3.success]).toEqual([true, true, true])
    expect(tabA.useGameStore.getState().saveConflict).toBe(false)
  })

  it('en flik som laddar om (ny modulinstans, samma save) kan spara direkt utan falsk konflikt', async () => {
    // Regressionsvakt mot den ursprungliga designfelet: en flik-lokal cache
    // (istf game.revision) skulle här ge en falsk konflikt vid FÖRSTA
    // sparningen efter varje omladdning, eftersom modul-scopet återställs
    // men disken redan ligger steget före.
    vi.resetModules()
    const tabA = await import('../gameStore')
    const { CLUB_TEMPLATES } = await import('../../../domain/services/worldGenerator')
    tabA.useGameStore.getState().newGame('Manager A', CLUB_TEMPLATES[0].id)
    await flush()
    await tabA.useGameStore.getState().saveGame()
    await tabA.useGameStore.getState().saveGame()
    const id = tabA.useGameStore.getState().game!.id

    // Simulerar en hård omladdning (F5) av SAMMA flik: helt ny modulinstans.
    vi.resetModules()
    const reloaded = await import('../gameStore')
    const loaded = await reloaded.useGameStore.getState().loadGame(id)
    expect(loaded).toBe(true)

    const result = await reloaded.useGameStore.getState().saveGame()
    expect(result.success).toBe(true)
    expect(reloaded.useGameStore.getState().saveConflict).toBe(false)
  })
})
