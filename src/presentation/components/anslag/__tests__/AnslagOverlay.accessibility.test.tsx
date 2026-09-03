import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeBaseGame } from '../../../screens/dev/gameStateFactory'
import { AnslagOverlay } from '../AnslagOverlay'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

let appRoot: HTMLDivElement
let container: HTMLDivElement
let root: Root

beforeEach(() => {
  appRoot = document.createElement('div')
  appRoot.id = 'root'
  document.body.appendChild(appRoot)
  container = document.createElement('div')
  appRoot.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  appRoot.remove()
})

describe('AnslagOverlay — fortsättningskontroll', () => {
  it('är en riktig fokuserbar knapp och stänger anslaget', () => {
    const onDismiss = vi.fn()
    act(() => {
      root.render(<AnslagOverlay game={makeBaseGame()} anslagKey="league_start" onDismiss={onDismiss} />)
    })

    const cta = document.body.querySelector<HTMLButtonElement>('button.anslag-cta')
    expect(cta).not.toBeNull()
    expect(document.activeElement).toBe(cta)
    act(() => cta!.click())
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
