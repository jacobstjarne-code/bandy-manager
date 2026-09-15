// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { OrtenMap } from '../OrtenMap'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

let root: Root | null = null
let container: HTMLDivElement | null = null

afterEach(() => {
  if (root) act(() => root!.unmount())
  container?.remove()
  root = null
  container = null
})

describe('OrtenMap — karta utan dold muskontroll', () => {
  it('ger varje nod namn, fokus och tangentbordsaktivering utan dubbel rubrik', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const club = game.clubs.find(candidate => candidate.id === game.managedClubId)!
    const onNodeClick = vi.fn()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    act(() => root!.render(<OrtenMap club={club} game={game} onNodeClick={onNodeClick} />))

    const arena = container.querySelector<SVGGElement>('[role="button"][aria-label^="Arena:"]')!
    expect(arena.tabIndex).toBe(0)
    expect(container.textContent).not.toContain('ORTSKARTAN')

    act(() => arena.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })))
    expect(onNodeClick).toHaveBeenCalledWith('arena')
  })
})
