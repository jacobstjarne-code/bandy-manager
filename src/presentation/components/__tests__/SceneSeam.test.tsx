import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { SceneSeam } from '../SceneSeam'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('SceneSeam', () => {
  it('överlämnar gold-fyllningen innan navigationen släpps fram', () => {
    vi.useFakeTimers()
    let frame: FrameRequestCallback | undefined
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      frame = callback
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    const onComplete = vi.fn()
    const container = document.createElement('div')
    const root = createRoot(container)

    act(() => root.render(<SceneSeam tier="final" ctaLabel="Redo — spela SM-final" onComplete={onComplete} />))
    expect(container.querySelector('.scene-seam--gold')).not.toBeNull()
    expect(container.querySelector('.scene-seam')?.classList.contains('swept')).toBe(false)

    act(() => frame?.(0))
    expect(container.querySelector('.scene-seam')?.classList.contains('swept')).toBe(true)
    act(() => vi.advanceTimersByTime(259))
    expect(onComplete).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onComplete).toHaveBeenCalledOnce()

    act(() => root.unmount())
  })
})
