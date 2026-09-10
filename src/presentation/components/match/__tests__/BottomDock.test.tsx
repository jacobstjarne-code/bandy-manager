import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { BottomDock } from '../BottomDock'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('BottomDock — blockerande matchinteraktion', () => {
  it('monteras före entry-klassen och ligger kvar genom exit-tiden', () => {
    vi.useFakeTimers()
    let enterFrame: FrameRequestCallback | undefined
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      enterFrame = callback
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    act(() => {
      root.render(<BottomDock open variant="block"><div>Hörna</div></BottomDock>)
    })
    expect(container.querySelector('.mf-dock--block')).not.toBeNull()
    expect(container.querySelector('.mf-dock--block')?.classList.contains('open')).toBe(false)

    act(() => enterFrame?.(0))
    expect(container.querySelector('.mf-dock--block')?.classList.contains('open')).toBe(true)
    expect(container.querySelector('.mf-dock-scrim')?.classList.contains('open')).toBe(true)

    act(() => {
      root.render(<BottomDock open={false} variant="block"><div /></BottomDock>)
    })
    expect(container.querySelector('.mf-dock--block')).not.toBeNull()
    expect(container.querySelector('.mf-dock--block')?.classList.contains('open')).toBe(false)

    act(() => vi.advanceTimersByTime(220))
    expect(container.querySelector('.mf-dock--block')).toBeNull()

    act(() => root.unmount())
    container.remove()
  })
})
