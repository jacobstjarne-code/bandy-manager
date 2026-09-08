import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { IntroSequence } from '../IntroSequence'
import { NameInputScreen } from '../NameInputScreen'

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }))

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

function renderScreen(screen: ReactNode): HTMLDivElement {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(<MemoryRouter>{screen}</MemoryRouter>)
  })
  return container
}

describe('B6 — Bury Fen-studiomärkets två tillåtna placeringar', () => {
  it('visar logotypen en gång i introvinjetten', () => {
    const view = renderScreen(<IntroSequence />)
    expect(view.querySelectorAll('img[alt="Bury Fen"]')).toHaveLength(1)
  })

  it('visar logotypen i namn-sidans footer', () => {
    const view = renderScreen(<NameInputScreen />)
    const logo = view.querySelector('footer img[alt="Bury Fen"]')
    expect(logo).not.toBeNull()
    expect(logo?.getAttribute('src')).toBe('/buryfen-logo.png')
  })
})
