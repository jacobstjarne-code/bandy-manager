import { useEffect, useRef } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { RouteBoundary } from '../components/RouteBoundary'
import { GameHeader } from '../components/GameHeader'
import { EventOverlay } from '../components/EventOverlay'
import { PhaseIndicatorAuto } from '../components/PhaseIndicator'
import { useGameStore, useHasHydrated } from '../store/gameStore'
import { getCurrentAttention } from '../../domain/services/attentionRouter'
import { getEventRenderTarget } from '../../domain/services/eventQueueService'

// Lightweight guard for full-screen routes that don't use BottomNav
export function GameGuard() {
  const game = useGameStore(s => s.game)
  const hasHydrated = useHasHydrated()
  // Medium 7 (Skutskär-auditen, 2026-08-22): vänta på persist-rehydrering
  // innan "ingen sparning"-domen fälls — game är alltid null under det
  // första ögonblicket, oavsett om en giltig sparning finns i IndexedDB.
  // Rendera ingenting under väntan (inte en redirect) — den begärda routen
  // ligger redan kvar när hydreringen blir klar.
  if (!hasHydrated) return null
  if (!game) return <Navigate to="/" replace />
  const attention = getCurrentAttention(game)
  // Bara overlay för kritiska icke-ambienta events — medium/atmospheric visas
  // av PortalEventSlot, ambienta (D1 punkt 2) visas ALDRIG som overlay.
  const shouldShowEventOverlay =
    attention.kind === 'event' &&
    getEventRenderTarget(attention.event) === 'overlay'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <GameHeader />
      <PhaseIndicatorAuto />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Outlet />
      </div>
      {shouldShowEventOverlay && <EventOverlay event={attention.event} />}
    </div>
  )
}

function DoctorFAB() {
  // Removed: redundant with Bandydoktorn card on dashboard + settings menu
  return null
}

export function GameShell() {
  const game = useGameStore(s => s.game)
  const location = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0)
  }, [location.pathname])

  if (!game) return <Navigate to="/" replace />
  // 3.1 (SLUTTEST_KO.md, 2026-08-17): GameShell täckte bara "inget game"-fallet.
  // En sparkad manager kunde nå tillbaka till dashboard/squad/etc via bakåtknapp
  // eller en stale route-återinträde (t.ex. app-reload mellan avsked och
  // SeasonSummaryScreen.handleNextSeason:s engångsredirect till game-over) —
  // vyerna antar aktiv-manager-tillstånd och kraschar, eller visar en dashboard
  // som inte längre borde vara nåbar. game-over-rutten går via GameGuard, inte
  // GameShell, så ingen omdirigeringsloop uppstår.
  if (game.managerFired) return <Navigate to="/game/game-over" replace />

  const attention = getCurrentAttention(game)
  // coffee_room is a modal over dashboard — BottomNav stays visible (FIX-41)
  // cup_final_victory keeps the nav visible (M10): header is visible, nav should match (FIX-M10)
  const sceneActive = attention.kind === 'scene' &&
    game.pendingScene?.sceneId !== 'coffee_room' &&
    game.pendingScene?.sceneId !== 'cup_final_victory'

  // NAV-PRINCIP (2026-06-15): navet är spelarens fasta referenspunkt (topp+botten).
  // Det ska INTE hoppa in/ut på vanliga vyer — det SPÄRRAS (useNavigationLock:
  // syns men går ej att trampa, med skäl) under match/live. Det DÖLJS bara på de
  // genuint filmiska helskärms-ceremonierna nedan, där ett gråtonat nav vore en
  // främmande list på guldögonblicket. Taktik/facility togs medvetet UR listan —
  // de är vanliga push-vyer, inte ceremonier; navet stannar (tillbaka-pil får
  // samexistera). Single source of truth — BottomNav speglar samma lista.
  const CEREMONY_PATHS = new Set([
    '/game/playoff-intro',
    '/game/qf-summary',
    '/game/sim-summary',
    '/game/half-time-summary',
    '/game/champion',
    '/game/season-summary',
    '/game/season-transition',
    '/game/game-over',
  ])
  const hideBottomNav = sceneActive ||
    CEREMONY_PATHS.has(location.pathname) ||
    location.pathname.startsWith('/game/season-summary/')

  // EventOverlay visas INTE när en scen väntar — scenen har prioritet
  // EventOverlay visas INTE under live-match, match-setup, resultat eller granskning
  // EventOverlay visas BARA för kritiska events — medium/atmospheric visas av PortalEventSlot
  const isMatchRoute = location.pathname.includes('/match/live') ||
    location.pathname === '/game/match' ||
    location.pathname === '/game/review'
  const isReviewRoute = location.pathname === '/game/review'
  const isPressConferenceRoute = location.pathname.includes('/press-conference')
  // match/live owns its own chrome via LedgerFrame — suppress GameHeader + PhaseStrip on that route only
  const isLedgerOwnedChrome = location.pathname.includes('/match/live')
  const shouldShowEventOverlay =
    attention.kind === 'event' &&
    getEventRenderTarget(attention.event) === 'overlay' &&
    !isMatchRoute &&
    !isReviewRoute &&
    !isPressConferenceRoute

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!isLedgerOwnedChrome && <GameHeader />}
      {!isLedgerOwnedChrome && <PhaseIndicatorAuto />}
      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: hideBottomNav ? 0 : `calc(var(--bottom-nav-height) + var(--safe-bottom))` }}>
        {/* B1/B2-fix (dockaudit p1, källgrundad diagnos 2026-07-02): height (inte
            min-height) — en golv-höjd tillåter obegränsad tillväxt uppåt, vilket
            gjorde att .lf-root (match/live, height:100% + overflow:hidden) aldrig
            fick en definit förälderhöjd att klippa mot. Resultat: hela dockflödet
            (inkl. interaktionspaneler + 5s-timer) renderades hundratals px under
            vikningen, onåbart även vid maxscroll. Med en definit höjd här löser
            .lf-root:s height:100% korrekt mot en verklig viewport-bunden ram, och
            .commentary-feed:s egna overflow-y:auto (redan korrekt) scrollar
            matchflödet internt istället för att hela sidan bara växer. */}
        <div key={location.pathname} className="screen-enter" style={{ height: '100%' }}>
          <RouteBoundary>
            <Outlet />
          </RouteBoundary>
        </div>
      </div>
      {!hideBottomNav && <BottomNav />}
      <DoctorFAB />
      {shouldShowEventOverlay && <EventOverlay event={attention.event} />}
    </div>
  )
}
