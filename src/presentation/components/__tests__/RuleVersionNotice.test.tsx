import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { CURRENT_RULE_VERSION } from '../../../domain/data/ruleVersion'
import { makeBaseGame } from '../../screens/dev/gameStateFactory'
import { useGameStore } from '../../store/gameStore'
import { RuleVersionNotice } from '../RuleVersionNotice'

vi.mock('idb-keyval', () => ({
  get: vi.fn(async () => undefined),
  set: vi.fn(async () => undefined),
  del: vi.fn(async () => undefined),
}))

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  useGameStore.setState({ game: null })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function renderNotice() {
  act(() => root.render(<RuleVersionNotice />))
}

describe('RuleVersionNotice', () => {

  it('är tyst när karriären använder aktuell regelversion', () => {
    useGameStore.setState({ game: { ...makeBaseGame(), ruleVersion: CURRENT_RULE_VERSION } })
    renderNotice()
    expect(container.querySelector('[role="status"]')).toBeNull()
  })

  it('visar en stängbar mjuk notis vid mismatch', () => {
    useGameStore.setState({ game: { ...makeBaseGame(), ruleVersion: '2026-01-01' } })
    renderNotice()
    expect(container.querySelector('[role="status"]')?.textContent).toContain('äldre spelregler')
    const close = container.querySelector<HTMLButtonElement>('button[aria-label="Stäng regelversionsnotis"]')!
    act(() => close.click())
    expect(container.querySelector('[role="status"]')).toBeNull()
  })

  it('visar inget för äldre saves som saknar version', () => {
    useGameStore.setState({ game: { ...makeBaseGame(), ruleVersion: undefined } })
    renderNotice()
    expect(container.querySelector('[role="status"]')).toBeNull()
  })
})
