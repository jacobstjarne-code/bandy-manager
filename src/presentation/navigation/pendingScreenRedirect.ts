import { PendingScreen } from '../../domain/enums'

const PENDING_SCREEN_ROUTES: Partial<Record<PendingScreen, string>> = {
  [PendingScreen.HalfTimeSummary]: '/game/half-time-summary',
  [PendingScreen.PlayoffIntro]: '/game/playoff-intro',
  [PendingScreen.QFSummary]: '/game/qf-summary',
  [PendingScreen.SeasonSummary]: '/game/season-summary',
  [PendingScreen.ContractDemands]: '/game/contract-demands',
}

/**
 * Returns a route only when the pending screen is a new redirect target.
 * Screen identity matters: two mandatory screens may follow each other
 * without attention becoming idle between them.
 */
export function getPendingScreenRedirect(
  lastRedirectedScreen: PendingScreen | null,
  pendingScreen: PendingScreen | null,
): string | null {
  if (!pendingScreen || pendingScreen === lastRedirectedScreen) return null
  return PENDING_SCREEN_ROUTES[pendingScreen] ?? null
}
