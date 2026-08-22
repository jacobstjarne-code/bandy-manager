import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useGameStore, useHasHydrated } from '../gameStore'

// @testing-library/react är inte installerat i detta repo (se t.ex.
// eventRenderRouting.test.ts) — den flaggan sätts annars av RTL:s setup.
// Utan den varnar React att act() körs i en "okonfigurerad" miljö, trots
// att det fungerar korrekt (samma mönster som RTL själv använder internt).
beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

/**
 * Medium 7 (Skutskär-auditen, docs/incoming/bandy-manager-skutskaer-audit-52009671-2026-08-20.md):
 * en hård omladdning av /game/history visade titelskärmen trots giltig
 * sparning. Rot: GameGuard läste `game` och redirectade INNAN persist-
 * middlewarens asynkrona rehydrering hunnit klart — `game` är alltid
 * `null` under det första ögonblicket. useHasHydrated() ger konsumenter
 * ett sätt att vänta ut den rehydreringen innan de fäller "ingen
 * sparning"-domen.
 */

let container: HTMLDivElement | null = null
let root: Root | null = null

afterEach(() => {
  if (root) {
    act(() => { root!.unmount() })
    root = null
  }
  if (container) {
    container.remove()
    container = null
  }
})

function renderHook() {
  container = document.createElement('div')
  document.body.appendChild(container)
  const results: boolean[] = []
  function Probe() {
    const hydrated = useHasHydrated()
    results.push(hydrated)
    return null
  }
  root = createRoot(container)
  act(() => { root!.render(<Probe />) })
  return results
}

describe('useHasHydrated', () => {
  it('Zustand persist-API:t hooken vilar på existerar och har rätt form', () => {
    expect(typeof useGameStore.persist.hasHydrated).toBe('function')
    expect(typeof useGameStore.persist.onFinishHydration).toBe('function')
  })

  it('är true direkt om storen redan hunnit hydrera vid mount', () => {
    const original = useGameStore.persist.hasHydrated
    useGameStore.persist.hasHydrated = () => true
    try {
      const results = renderHook()
      expect(results[results.length - 1]).toBe(true)
    } finally {
      useGameStore.persist.hasHydrated = original
    }
  })

  it('går från false till true när onFinishHydration-callbacken triggas (rehydrering klar EFTER mount)', () => {
    const originalHasHydrated = useGameStore.persist.hasHydrated
    const originalOnFinish = useGameStore.persist.onFinishHydration
    let registeredCb: (() => void) | undefined
    useGameStore.persist.hasHydrated = () => false
    useGameStore.persist.onFinishHydration = (cb: () => void) => {
      registeredCb = cb
      return () => { registeredCb = undefined }
    }
    try {
      const results = renderHook()
      expect(results[results.length - 1]).toBe(false)

      expect(registeredCb).toBeDefined()
      act(() => { registeredCb!() })

      expect(results[results.length - 1]).toBe(true)
    } finally {
      useGameStore.persist.hasHydrated = originalHasHydrated
      useGameStore.persist.onFinishHydration = originalOnFinish
    }
  })
})
