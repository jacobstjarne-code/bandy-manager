import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore'
import { createNewGame } from '../../../application/useCases/createNewGame'

// EventOverlay → soundEffects.ts läser localStorage vid MODULLADDNING (inte
// inuti en funktion) — jsdom-miljön här kraschar på det, oavsett vad testet
// faktiskt utövar. Overlayen är inte vad detta test verifierar (routing-
// gaten), så den mockas bort istf att dras in transitivt via GameShell.
vi.mock('../../components/EventOverlay', () => ({ EventOverlay: () => null }))
// jsdom saknar indexedDB — persist-middlewarens riktiga get/set/del (idb-
// keyval) kastar annars på varje useGameStore.setState() detta test gör.
// Testet verifierar routing-gaten mot hydreringsstatus, inte den riktiga
// IndexedDB-vägen (den har sin egen täckning i saveGameStorage-testerna).
vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }))

const { GameShell, routeOwnsLedgerChrome } = await import('../GameShell')

/**
 * Skutskär-auditens test 20 (52009671, 2026-08-20): "Deep-link rehydration:
 * reload på /game/history, /game/match och /game/club ska återställa samma
 * route efter save-load."
 *
 * Medium 7 (samma audit) dokumenterade och "fixade" detta — men fixen
 * (useHasHydrated(), se gameStore.ts:949 och useHasHydrated.test.tsx) landade
 * bara i GameGuard (bara /game/game-over*) och DashboardOrPortal (bara
 * /game/dashboard). GameShell — den faktiska föräldern till /game/history,
 * /game/match, /game/club och alla andra huvudrutter (AppRouter.tsx:136) —
 * kollar fortfarande bara `if (!game) return <Navigate to="/" replace/>`
 * UTAN att vänta på hasHydrated. `game` är `null` under persist-middlewarens
 * asynkrona rehydrering (samma ögonblick oavsett om en giltig sparning
 * finns) — GameShell redirectar bort INNAN hydreringen hunnit klart, exakt
 * det Medium 7 beskrev, för exakt de rutter Medium 7 namngav. Fixen läkte
 * fel gren.
 */

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

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
  useGameStore.setState({ game: null })
})

function renderAtHistory() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(
      <MemoryRouter initialEntries={['/game/history']}>
        <Routes>
          <Route path="/" element={<div data-testid="titlescreen">TITEL</div>} />
          <Route path="/game/game-over" element={<div data-testid="game-over">AVSKED</div>} />
          <Route path="/game" element={<GameShell />}>
            <Route path="history" element={<div data-testid="history">HISTORIK</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
  })
}

describe('GameShell — deep-link rehydration (Skutskär-audit test 20)', () => {
  it('släpper inte tillbaka en sparkad manager till interna spelvyer', () => {
    const originalHasHydrated = useGameStore.persist.hasHydrated
    useGameStore.persist.hasHydrated = () => true
    const game = createNewGame({ managerName: 'Sparkad', clubId: 'club_skutskar', season: 2025, seed: 42 })
    useGameStore.setState({ game: { ...game, managerFired: true } })

    try {
      renderAtHistory()
      expect(container!.querySelector('[data-testid="history"]')).toBeNull()
      expect(container!.querySelector('[data-testid="game-over"]')).not.toBeNull()
    } finally {
      useGameStore.persist.hasHydrated = originalHasHydrated
    }
  })

  it('redirectar INTE till "/" medan persist-rehydreringen fortfarande pågår, även om en giltig sparning finns', () => {
    const originalHasHydrated = useGameStore.persist.hasHydrated
    const originalOnFinish = useGameStore.persist.onFinishHydration
    useGameStore.persist.hasHydrated = () => false
    useGameStore.persist.onFinishHydration = () => () => {}
    // game är null vid mount — precis som varje hård omladdning, oavsett
    // om IndexedDB faktiskt har en giltig sparning på väg in.
    useGameStore.setState({ game: null })

    try {
      renderAtHistory()
      expect(container!.querySelector('[data-testid="titlescreen"]')).toBeNull()
      expect(container!.querySelector('[data-testid="history"]')).toBeNull()
    } finally {
      useGameStore.persist.hasHydrated = originalHasHydrated
      useGameStore.persist.onFinishHydration = originalOnFinish
    }
  })

  it('bevarar /game/history-routen efter att rehydreringen blivit klar med en giltig sparning', () => {
    const originalHasHydrated = useGameStore.persist.hasHydrated
    const originalOnFinish = useGameStore.persist.onFinishHydration
    let registeredCb: (() => void) | undefined
    useGameStore.persist.hasHydrated = () => false
    useGameStore.persist.onFinishHydration = (cb: () => void) => {
      registeredCb = cb
      return () => { registeredCb = undefined }
    }
    useGameStore.setState({ game: null })

    try {
      renderAtHistory()
      expect(container!.querySelector('[data-testid="history"]')).toBeNull()

      const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
      act(() => {
        useGameStore.setState({ game })
        useGameStore.persist.hasHydrated = () => true
        registeredCb?.()
      })

      expect(container!.querySelector('[data-testid="titlescreen"]')).toBeNull()
      expect(container!.querySelector('[data-testid="history"]')).not.toBeNull()
    } finally {
      useGameStore.persist.hasHydrated = originalHasHydrated
      useGameStore.persist.onFinishHydration = originalOnFinish
    }
  })

  it('redirectar till "/" om rehydreringen är klar och verkligen ingen sparning finns', () => {
    const originalHasHydrated = useGameStore.persist.hasHydrated
    useGameStore.persist.hasHydrated = () => true
    useGameStore.setState({ game: null })

    try {
      renderAtHistory()
      expect(container!.querySelector('[data-testid="titlescreen"]')).not.toBeNull()
      expect(container!.querySelector('[data-testid="history"]')).toBeNull()
    } finally {
      useGameStore.persist.hasHydrated = originalHasHydrated
    }
  })
})

describe('GameShell — LedgerFrame äger rondflödets chrome', () => {
  it('låter både Förbered och Spela äga sin chrome', () => {
    expect(routeOwnsLedgerChrome('/game/match', null)).toBe(true)
    expect(routeOwnsLedgerChrome('/game/match/live', null)).toBe(true)
  })

  it('behåller GameShell-chrome för den äldre historiska rapportöppningen', () => {
    expect(routeOwnsLedgerChrome('/game/match', { showReport: true })).toBe(false)
    expect(routeOwnsLedgerChrome('/game/review', null)).toBe(false)
  })
})
