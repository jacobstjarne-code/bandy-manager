// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ScrollMoreCue } from '../ScrollMoreCue'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

let host: HTMLDivElement | null = null
let scrollHost: HTMLDivElement | null = null
let root: Root | null = null

afterEach(() => {
  if (root) act(() => root!.unmount())
  host?.remove()
  scrollHost?.remove()
  root = null
  host = null
  scrollHost = null
  vi.restoreAllMocks()
})

async function renderCue(scrollHeight: number, clientHeight: number) {
  host = document.createElement('div')
  scrollHost = document.createElement('div')
  const scrollElement = scrollHost
  scrollElement.append(host)
  document.body.append(scrollElement)

  Object.defineProperties(scrollElement, {
    clientHeight: { configurable: true, value: clientHeight },
    scrollHeight: { configurable: true, value: scrollHeight },
    scrollTop: { configurable: true, writable: true, value: 0 },
  })
  const scrollBy = vi.fn()
  scrollElement.scrollBy = scrollBy

  root = createRoot(host)
  act(() => root!.render(<ScrollMoreCue scrollRef={{ current: scrollElement }} />))
  await act(async () => { await new Promise(resolve => requestAnimationFrame(resolve)) })

  return { scrollElement, scrollBy }
}

describe('ScrollMoreCue', () => {
  it('visas bara när verkligt innehåll återstår och scrollar ett tydligt stycke', async () => {
    const { scrollBy } = await renderCue(900, 400)
    const button = host!.querySelector<HTMLButtonElement>('button[aria-label="Visa mer"]')

    expect(button).not.toBeNull()
    act(() => button!.click())
    expect(scrollBy).toHaveBeenCalledWith({ top: 260, behavior: 'smooth' })
  })

  it('är helt frånvarande när innehållet redan ryms', async () => {
    await renderCue(400, 400)
    expect(host!.querySelector('[data-scroll-more-cue]')).toBeNull()
  })
})
