// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { FacilityState } from '../../../../domain/entities/SaveGame'
import { FacilityTree } from '../FacilityTree'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

let container: HTMLDivElement | null = null
let root: Root | null = null

afterEach(() => {
  if (root) act(() => root!.unmount())
  container?.remove()
  root = null
  container = null
})

function renderTree(mode: 'betrakta' | 'valj', onSelect = vi.fn()) {
  const facilityState: FacilityState = { builtNodeIds: [] }
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(
      <FacilityTree
        facilityState={facilityState}
        currentMatchday={1}
        currentSeason={1}
        mode={mode}
        onSelect={onSelect}
      />,
    )
  })
  return { view: container, onSelect }
}

function findCard(view: HTMLElement, label: string): HTMLDivElement {
  const labelNode = Array.from(view.querySelectorAll('span')).find(node => node.textContent === label)
  const card = labelNode?.closest<HTMLDivElement>('[data-facility-node-id]')
  if (!card) throw new Error(`Hittade inte nodkortet ${label}`)
  return card
}

describe('FacilityTree — E-M4 klickbara nodkort', () => {
  it('gör valbara noder fokuserbara och aktiverbara med Enter och blanksteg', () => {
    const { view, onSelect } = renderTree('valj')
    const card = findCard(view, 'Värmestuga')

    expect(card.getAttribute('role')).toBe('button')
    expect(card.tabIndex).toBe(0)

    act(() => card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })))
    act(() => card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })))
    expect(onSelect).toHaveBeenNthCalledWith(1, 'varmestuga')
    expect(onSelect).toHaveBeenNthCalledWith(2, 'varmestuga')
  })

  it('lämnar låsta noder utanför tabbordningen', () => {
    const { view } = renderTree('valj')
    const lockedCard = findCard(view, 'Läktare — östra')
    expect(lockedCard.getAttribute('role')).toBeNull()
    expect(lockedCard.getAttribute('tabindex')).toBeNull()
  })

  it('gör inga nodkort interaktiva i betrakta-läget', () => {
    const { view } = renderTree('betrakta')
    expect(view.querySelector('[role="button"]')).toBeNull()
  })
})
