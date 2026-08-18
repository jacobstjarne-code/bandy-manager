import { describe, it, expect, vi } from 'vitest'
import { resolveDisplayedGame } from '../HistoryScreen'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'

// gameStore.ts:s persist-middleware skriver till IndexedDB via idb-keyval på
// varje setState — jsdom saknar indexedDB. Ingen annan testfil rör store:t
// direkt (grep bekräftat), så mocken behövs bara här.
vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}))

const { useGameStore } = await import('../../store/gameStore')

/**
 * 3.3 (SLUTTEST_KO.md, 2026-08-17) Kontrakt A.
 *
 * Projektet saknar @testing-library/react (bekräftat: inte i node_modules,
 * andra .test.tsx-filer testar bara typer/exports, aldrig faktisk rendering)
 * — så HistoryScreen.tsx:s snapshot-vs-live-logik är utbruten till
 * `resolveDisplayedGame` (ren funktion) för att gå att testa direkt.
 *
 * Rotorsak till varför det här behövdes: `newGame()` raderar redan idag
 * alla saves ovillkorat, och GameShell redirectar bort en `managerFired`-
 * karriär från alla `/game/*`-rutter inklusive `history`. Utan
 * snapshot-fallbacken skulle "SE KARRIÄREN" antingen krascha (GameShell-
 * redirect) eller visa tomt (`if (!game) return null`) om store:t hunnit
 * nollställas av `clearFiredGame()` innan navigeringen hann rendera.
 */
function makeGame() {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Testmanager', clubId: template.id, seed: 1 })
}

describe('clearFiredGame (store)', () => {
  it('nollställer game utan att kasta', () => {
    useGameStore.setState({ game: { ...makeGame(), managerFired: true } })
    expect(useGameStore.getState().game).not.toBeNull()
    useGameStore.getState().clearFiredGame()
    expect(useGameStore.getState().game).toBeNull()
  })
})

describe('resolveDisplayedGame (HistoryScreen snapshot-vs-live)', () => {
  it('snapshot vinner över live store när båda finns', () => {
    const snapshot = { ...makeGame(), managerName: 'Snapshot' }
    const live = { ...makeGame(), managerName: 'Live' }
    expect(resolveDisplayedGame(snapshot, live).managerName).toBe('Snapshot')
  })

  it('faller tillbaka på live store när ingen snapshot ges', () => {
    const live = { ...makeGame(), managerName: 'Live' }
    expect(resolveDisplayedGame(undefined, live)?.managerName).toBe('Live')
  })

  it('snapshot renderar den avslutade karriären även om store.game redan är null', () => {
    // Exakt scenariot Kontrakt A löser: clearFiredGame() har redan kört.
    const snapshot = { ...makeGame(), managerFired: true }
    expect(resolveDisplayedGame(snapshot, null)).toBe(snapshot)
  })

  it('utan snapshot OCH utan live game: null (oförändrat edge-case, samma som förut)', () => {
    expect(resolveDisplayedGame(undefined, null)).toBeNull()
  })
})
