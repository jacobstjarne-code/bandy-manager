import { useEffect, useRef } from 'react'
import { initializeAnalyticsBaseline, startAnalyticsSession, syncGameAnalytics } from '../../infrastructure/attention/analyticsLifecycle'
import { useGameStore, useHasHydrated } from '../store/gameStore'

/** En enda app-omfattande observatör; speldomänen känner inte till HTTP eller statistik. */
export function AnalyticsBridge() {
  const game = useGameStore(state => state.game)
  const hydrated = useHasHydrated()
  const baselineReady = useRef(false)

  useEffect(() => {
    const endSession = startAnalyticsSession()
    window.addEventListener('pagehide', endSession, { once: true })
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
    game?.seasonSummaries?.length,
    game?.managerFired,
    game?.firedReason,
  ])

  return null
}
