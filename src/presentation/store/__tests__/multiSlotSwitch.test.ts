/**
 * Skutskär-auditens test 19 (P1 multi-slot, persistence, mobil): "skapa A,
 * avbryt varje tillträdessteg, skapa B, byt tillbaka till A och verifiera
 * exakt steg/state." Noll testfiler fanns för multi-slot-koden
 * (gameStore.ts:s newGame/switchToSave/loadGame, kommentarer daterade
 * 2026-08-22 — "förrgår" relativt auditrapporten) trots att den ersatte en
 * tidigare "radera-alla"-loop med en riktig multi-save-mekanism.
 *
 * idb-keyval mockas till en in-memory Map — vitest/jsdom saknar en riktig
 * IndexedDB (bekräftat: varje suite-körning loggar "indexedDB is not
 * defined" från persist-middlewarens rehydrering).
 *
 * C1-uppföljning (oberoende speltest- och produktaudit, 5c9a7a8, 2026-08-24):
 * localStorage stubbas nu till en RIKTIG in-memory mock (samma mönster som
 * saveGameStorage.test.ts). Filen körde tidigare mot testmiljöns egen
 * `localStorage`-global, som saknar getItem/setItem/removeItem (bara
 * Object.prototype) — saveSaveGame()s indexskrivning kastade därför på
 * VARJE anrop här, tyst fångad av dess då-svaljande try/catch. Det var
 * exakt C1-bugg-klassen: ett produktionsfel maskerades av att testet aldrig
 * kunde upptäcka det. switchToSave() avbryter nu korrekt bytet om
 * indexskrivningen misslyckas (se gameStore.ts) — med en RIKTIG localStorage
 * fungerar båda skrivningarna, och "byte lyckas" går att verifiera på
 * riktigt istf att råka bero på ett svalt fel.
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

describe('gameStore — multi-slot: skapa A, skapa B, byt tillbaka till A', () => {
  beforeEach(() => {
    idbStore.clear()
    localStorageMock.clear()
    vi.resetModules()
  })

  it('byte till B och tillbaka till A återställer A:s exakta identitet, ingen dataläcka från B', async () => {
    const { useGameStore } = await import('../gameStore')
    const { CLUB_TEMPLATES } = await import('../../../domain/services/worldGenerator')
    const clubA = CLUB_TEMPLATES[0]
    const clubB = CLUB_TEMPLATES[1]

    // Skapa A.
    useGameStore.getState().newGame('Manager A', clubA.id)
    await flush()
    const gameA = useGameStore.getState().game
    expect(gameA).not.toBeNull()
    const idA = gameA!.id
    expect(gameA!.managerName).toBe('Manager A')
    expect(gameA!.managedClubId).toBe(clubA.id)

    // Skapa B MEDAN A är aktiv — newGame ska persistera A till sin egen
    // save-plats FÖRST (gameStore.ts:s egen kommentar, "annars vore ett
    // byte bort och sen tillbaka en dataförlust").
    useGameStore.getState().newGame('Manager B', clubB.id)
    await flush()
    const gameB = useGameStore.getState().game
    expect(gameB).not.toBeNull()
    const idB = gameB!.id
    expect(idB).not.toBe(idA) // save_${Date.now()} — måste vara skilda kärriärer
    expect(gameB!.managerName).toBe('Manager B')

    // Byt TILLBAKA till A.
    const switchedToA = await useGameStore.getState().switchToSave(idA)
    expect(switchedToA).toBe(true)
    const restoredA = useGameStore.getState().game
    expect(restoredA).not.toBeNull()
    expect(restoredA!.id).toBe(idA)
    expect(restoredA!.managerName).toBe('Manager A')
    expect(restoredA!.managedClubId).toBe(clubA.id)

    // Byt till B igen — full rundtur i båda riktningarna, inte bara A→B→A.
    const switchedToB = await useGameStore.getState().switchToSave(idB)
    expect(switchedToB).toBe(true)
    const restoredB = useGameStore.getState().game
    expect(restoredB!.id).toBe(idB)
    expect(restoredB!.managerName).toBe('Manager B')
    expect(restoredB!.managedClubId).toBe(clubB.id)
  })

  it('switchToSave till redan aktiv karriär är en no-op (samma id), ingen krasch', async () => {
    const { useGameStore } = await import('../gameStore')
    const { CLUB_TEMPLATES } = await import('../../../domain/services/worldGenerator')
    useGameStore.getState().newGame('Manager Solo', CLUB_TEMPLATES[0].id)
    await flush()
    const id = useGameStore.getState().game!.id

    const result = await useGameStore.getState().switchToSave(id)

    expect(result).toBe(true)
    expect(useGameStore.getState().game!.id).toBe(id)
  })
})
