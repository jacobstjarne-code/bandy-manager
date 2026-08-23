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
 * defined" från persist-middlewarens rehydrering). listSaveGames()-indexet
 * ligger i localStorage (saveGameStorage.ts) — testat och bekräftat att
 * denna miljös `localStorage`-global saknar getItem/setItem/removeItem
 * (bara Object.prototype), så saveSaveGame()s localStorage-skrivning
 * kastar och fångas tyst av dess egna try/catch. listSaveGames() går
 * därför INTE att verifiera här — testet begränsas till det som FAKTISKT
 * går att mäta i denna miljö: game-blobbens rundtur via idb-keyval
 * (get/set), som är den del av "byt tillbaka till A" som faktiskt kan
 * tappa eller blanda ihop data mellan två karriärer.
 *
 * "Exakt steg" har ingen enumererbar store-representation (onboarding-
 * flödets steg är UI-state i TilltradeScreen, inte persisterat game-state)
 * — testat här som "exakt IDENTITET" (managerName/clubId/id), den delen av
 * "tillbaka till A" som FAKTISKT kan bli fel tyst (fel karriärs data läses
 * in, eller data från B läcker in i A).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const idbStore = new Map<string, unknown>()
vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => idbStore.get(key)),
  set: vi.fn(async (key: string, value: unknown) => { idbStore.set(key, value) }),
  del: vi.fn(async (key: string) => { idbStore.delete(key) }),
}))

async function flush(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 10))
}

describe('gameStore — multi-slot: skapa A, skapa B, byt tillbaka till A', () => {
  beforeEach(() => {
    idbStore.clear()
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
