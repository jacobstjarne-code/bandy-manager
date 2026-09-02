// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { act, type ReactNode } from 'react'
import { BandyPitch } from '../BandyPitch'

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

function renderPitch(node: ReactNode) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(node))
  return container
}

describe('BandyPitch', () => {
  it('bevarar lineup-planens koordinatsystem som standard', () => {
    const view = renderPitch(<BandyPitch />)
    const pitch = view.querySelector('[data-pitch-variant="lineup"]')

    expect(pitch?.getAttribute('viewBox')).toBe('0 0 220 170')
    expect(view.querySelector('[data-pitch-variant="tactical"]')).toBeNull()
  })

  it('äger taktikplanens markeringar och spelarprickarnas SVG-definitioner', () => {
    const view = renderPitch(
      <BandyPitch variant="tactical">
        <circle data-testid="player-layer" />
      </BandyPitch>,
    )
    const pitch = view.querySelector('[data-pitch-variant="tactical"]')

    expect(pitch?.getAttribute('viewBox')).toBe('0 0 280 400')
    expect(view.querySelector('#dot-ok')).not.toBeNull()
    expect(view.querySelector('#dot-warn')).not.toBeNull()
    expect(view.querySelector('#dot-shadow')).not.toBeNull()
    expect(view.querySelector('[data-pitch-marking="center-circle"]')).not.toBeNull()
    expect(view.querySelector('[data-testid="player-layer"]')).not.toBeNull()
  })
})
