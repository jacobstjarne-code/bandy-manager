import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore'
import { ClubSelectionScreen } from '../ClubSelectionScreen'

/**
 * O10 seed-i-länk (GO 2026-09-08, BACKLOG.md:55): en delad länks ?seed=
 * query-param ska (1) styra vilka tre klubberbjudanden som visas
 * (selectThreeOffers(seed), deterministiskt) och (2) vidarebefordras till
 * newGame() så mottagarens VÄRLD blir samma som avsändarens — inte bara
 * samma tre erbjudanden. Se newGameRandomSeed.test.ts för det senare ledet
 * verifierat på store-nivå; detta testet verifierar att skärmen faktiskt
 * plockar och skickar rätt seed.
 */

vi.mock('idb-keyval', () => ({
  get: vi.fn(async () => undefined),
  set: vi.fn(async () => undefined),
  del: vi.fn(async () => undefined),
}))

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

let container: HTMLDivElement | null = null
let root: Root | null = null

afterEach(() => {
  if (root) {
    act(() => { root!.unmount() })
    root = null
  }
  if (container) {
    container.remove()
    container = null
  }
  vi.restoreAllMocks()
})

// handleSelect kör newGame() i en setTimeout(50) — vänta in den, wrapat i
// act() så Reacts navigate()-följdstate (till /intro, ingen matchande route
// i detta test) inte loggar en act()-varning.
async function flushSelectTimeout(): Promise<void> {
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 80)) })
}

function renderAt(path: string) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/club-selection"
            element={<ClubSelectionScreen managerNameOverride="Testare" />}
          />
          <Route path="/intro" element={<div data-testid="intro-stub" />} />
        </Routes>
      </MemoryRouter>
    )
  })
}

describe('ClubSelectionScreen — O10 seed-i-länk', () => {
  it('läser ?seed= ur URL:en och skickar det seedet vidare till newGame() vid klubbval', async () => {
    const newGameSpy = vi.spyOn(useGameStore.getState(), 'newGame').mockImplementation(() => {})

    renderAt('/club-selection?seed=987654')
    const firstCard = container!.querySelector('.card-tap') as HTMLElement | null
    expect(firstCard).not.toBeNull()
    act(() => { firstCard!.click() })
    await flushSelectTimeout()

    expect(newGameSpy).toHaveBeenCalledTimes(1)
    expect(newGameSpy.mock.calls[0][2]).toBe(987654)
  })

  it('utan ?seed= i URL:en förblir tredje argumentet undefined (oförändrat slumpat beteende)', async () => {
    const newGameSpy = vi.spyOn(useGameStore.getState(), 'newGame').mockImplementation(() => {})

    renderAt('/club-selection')
    const firstCard = container!.querySelector('.card-tap') as HTMLElement | null
    expect(firstCard).not.toBeNull()
    act(() => { firstCard!.click() })
    await flushSelectTimeout()

    expect(newGameSpy).toHaveBeenCalledTimes(1)
    expect(newGameSpy.mock.calls[0][2]).toBeUndefined()
  })

  it('en icke-numerisk ?seed= (trasig/manipulerad länk) ignoreras — samma undefined-fallback', async () => {
    const newGameSpy = vi.spyOn(useGameStore.getState(), 'newGame').mockImplementation(() => {})

    renderAt('/club-selection?seed=inte-ett-tal')
    const firstCard = container!.querySelector('.card-tap') as HTMLElement | null
    expect(firstCard).not.toBeNull()
    act(() => { firstCard!.click() })
    await flushSelectTimeout()

    expect(newGameSpy).toHaveBeenCalledTimes(1)
    expect(newGameSpy.mock.calls[0][2]).toBeUndefined()
  })
})
