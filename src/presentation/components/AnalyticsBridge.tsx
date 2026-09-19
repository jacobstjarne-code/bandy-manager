import { useEffect, useRef } from 'react'
import { endAnalyticsSession, initializeAnalyticsBaseline, startAnalyticsSession, syncGameAnalytics, trackFeatureOpened } from '../../infrastructure/attention/analyticsLifecycle'
import { useGameStore, useHasHydrated } from '../store/gameStore'
import { useLocation } from 'react-router-dom'

/** En enda app-omfattande observatör; speldomänen känner inte till HTTP eller statistik. */
export function AnalyticsBridge() {
  const { pathname } = useLocation()
  const excluded = pathname.startsWith('/admin') || pathname.startsWith('/dev')
  useEffect(() => { if (excluded) endAnalyticsSession() }, [excluded])
  if (excluded) return null
  return <GameplayAnalyticsBridge />
}

function GameplayAnalyticsBridge() {
  const game = useGameStore(state => state.game)
  const hydrated = useHasHydrated()
  const baselineReady = useRef(false)
  const location = useLocation()

  useEffect(() => {
    const endSession = startAnalyticsSession()
    window.addEventListener('pagehide', endSession, { once: true })
    // StrictMode's effect rehearsal must not end/start a second gameplay pass.
    return () => window.removeEventListener('pagehide', endSession)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!baselineReady.current) {
      initializeAnalyticsBaseline(game)
      baselineReady.current = true
    }
    if (game) syncGameAnalytics(game)
  }, [
    hydrated,
    game?.id,
    game?.onboardingComplete,
    game?.lastCompletedFixtureId,
    game?.currentMatchday,
    game?.seasonSummaries?.length,
    game?.managerFired,
    game?.firedReason,
  ])

  useEffect(() => {
    if (!hydrated || !game || game.onboardingComplete !== true) return
    if (location.pathname === '/game/taktik') trackFeatureOpened(game.id, 'tactics')
  }, [hydrated, game?.id, game?.onboardingComplete, location.pathname])

  return null
}
