import { act } from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { FatigueFloorConfirm } from '../FatigueFloorConfirm'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

let appRoot: HTMLDivElement
let container: HTMLDivElement
let root: Root

beforeEach(() => {
  appRoot = document.createElement('div')
  appRoot.id = 'root'
  container = document.createElement('div')
  appRoot.appendChild(container)
  document.body.appendChild(appRoot)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  appRoot.remove()
})

describe('FatigueFloorConfirm — mobil blockerare', () => {
  it('portaleras över appskalet och låter bekräftelseknappen starta matchen', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const player = game.players.find(candidate => candidate.clubId === game.managedClubId)!
    const onConfirm = vi.fn()

    act(() => {
      root.render(
        <FatigueFloorConfirm
          game={game}
          belowFloorStarters={[{ ...player, fitness: 20 }]}
          shortfall={1}
          onConfirm={onConfirm}
          onCancel={() => {}}
        />,
      )
    })

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLDivElement
    expect(dialog).not.toBeNull()
    expect(appRoot.contains(dialog)).toBe(false)
    expect(dialog.style.zIndex).toBe('400')

    const confirm = [...dialog.querySelectorAll('button')]
      .find(button => button.textContent?.includes('Gå in med dem ändå')) as HTMLButtonElement
    expect(confirm).toBeDefined()
    act(() => confirm.click())
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
