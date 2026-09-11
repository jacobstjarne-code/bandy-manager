import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { makeBaseGame } from '../dev/gameStateFactory'
import { useGameStore } from '../../store/gameStore'
import { GameOverScreen } from '../GameOverScreen'

const exportSaveAsJsonMock = vi.hoisted(() => vi.fn())

vi.mock('idb-keyval', () => ({
  get: vi.fn(async () => undefined),
  set: vi.fn(async () => undefined),
  del: vi.fn(async () => undefined),
}))

vi.mock('../../../infrastructure/persistence/saveGameStorage', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../infrastructure/persistence/saveGameStorage')>()
  return { ...actual, exportSaveAsJson: exportSaveAsJsonMock }
})

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

let container: HTMLDivElement | null = null
let root: Root | null = null

afterEach(() => {
  if (root) act(() => root!.unmount())
  container?.remove()
  container = null
  root = null
  exportSaveAsJsonMock.mockReset()
  useGameStore.setState({ game: null })
})

describe('GameOverScreen — avslutad save kan exporteras', () => {
  it('skickar exakt den avslutade karriären till den kanoniska JSON-exportören', () => {
    const finishedGame = {
      ...makeBaseGame(),
      id: 'finished-career',
      managerFired: true,
      firedReason: 'boardPatience' as const,
    }
    useGameStore.setState({ game: finishedGame })

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => {
      root!.render(
        <MemoryRouter initialEntries={['/game/game-over']}>
          <Routes>
            <Route path="/game/game-over" element={<GameOverScreen />} />
          </Routes>
        </MemoryRouter>,
      )
    })

    const exportButton = [...container.querySelectorAll('button')]
      .find(button => button.textContent?.includes('EXPORTERA SÄKERHETSKOPIA'))
    expect(exportButton).toBeDefined()

    act(() => exportButton!.click())

    expect(exportSaveAsJsonMock).toHaveBeenCalledTimes(1)
    expect(exportSaveAsJsonMock).toHaveBeenCalledWith(finishedGame)
  })
})
