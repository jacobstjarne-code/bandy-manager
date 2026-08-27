/**
 * M1 (oberoende speltest- och produktaudit, 5c9a7a8, 2026-08-24):
 * "Avbruten Arrival överlevde reload, men efter byte till annan save och
 * tillbaka landade karriären på /tilltrade, inte i exakt intern fas."
 *
 * Rotorsak: routern (AppRouter.tsx) kunde bara skicka en avbruten spelare
 * till /tilltrade — aldrig till /intro — eftersom inget fält bar VILKEN av
 * de två onboarding-skärmarna spelaren faktiskt var på. Ett avbrott mitt i
 * Ankomsten (ArrivalScene, /intro) hoppade alltså över hela scenen vid
 * nästa indirekta ruttinträde, istf att återuppta den. TilltradeScreen.tsx:s
 * F1-F4-steg hade samma problem en nivå djupare (lokal useState).
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

describe('gameStore — M1: onboarding-skärm/steg överlever byte till annan save och tillbaka', () => {
  beforeEach(() => {
    idbStore.clear()
    localStorageMock.clear()
    vi.resetModules()
  })

  it('en spelare avbruten MITT I Ankomsten (arrival) återupptas på /intro, inte /tilltrade, efter byte fram och tillbaka', async () => {
    const { useGameStore } = await import('../gameStore')
    const { CLUB_TEMPLATES } = await import('../../../domain/services/worldGenerator')

    useGameStore.getState().newGame('Manager A', CLUB_TEMPLATES[0].id)
    await flush()
    const idA = useGameStore.getState().game!.id
    expect(useGameStore.getState().game!.onboardingScreen).toBe('arrival')

    // Byt bort (skapar B) och tillbaka till A — utan att A någonsin lämnat Ankomsten.
    useGameStore.getState().newGame('Manager B', CLUB_TEMPLATES[1].id)
    await flush()
    const switched = await useGameStore.getState().switchToSave(idA)
    expect(switched).toBe(true)

    const restoredA = useGameStore.getState().game!
    expect(restoredA.id).toBe(idA)
    // Den avgörande assertionen: fortfarande 'arrival', inte tyst förlorad
    // (vilket routern skulle läsa som "redan förbi Ankomsten" → /tilltrade).
    expect(restoredA.onboardingScreen).toBe('arrival')
    expect(restoredA.onboardingComplete).toBe(false)
  })

  it('en spelare som avslutat Ankomsten men avbrutit på Tillträdets steg 3 återupptas på exakt steg 3, inte steg 1', async () => {
    const { useGameStore } = await import('../gameStore')
    const { CLUB_TEMPLATES } = await import('../../../domain/services/worldGenerator')

    useGameStore.getState().newGame('Manager A', CLUB_TEMPLATES[0].id)
    await flush()
    const idA = useGameStore.getState().game!.id

    await useGameStore.getState().advanceOnboardingToTilltrade()
    await useGameStore.getState().setTilltradeStep(3)
    expect(useGameStore.getState().game!.onboardingScreen).toBe('tilltrade')
    expect(useGameStore.getState().game!.tilltradeStep).toBe(3)

    useGameStore.getState().newGame('Manager B', CLUB_TEMPLATES[1].id)
    await flush()
    const switched = await useGameStore.getState().switchToSave(idA)
    expect(switched).toBe(true)

    const restoredA = useGameStore.getState().game!
    expect(restoredA.onboardingScreen).toBe('tilltrade')
    expect(restoredA.tilltradeStep).toBe(3)
  })

  it('en helt ny save (aldrig påbörjad onboarding) har onboardingScreen "arrival" direkt vid skapande', async () => {
    const { useGameStore } = await import('../gameStore')
    const { CLUB_TEMPLATES } = await import('../../../domain/services/worldGenerator')
    useGameStore.getState().newGame('Manager Ny', CLUB_TEMPLATES[0].id)
    await flush()
    expect(useGameStore.getState().game!.onboardingScreen).toBe('arrival')
    expect(useGameStore.getState().game!.tilltradeStep).toBeUndefined()
  })
})
