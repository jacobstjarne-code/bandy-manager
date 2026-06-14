import { useEffect, useRef } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { GameHeader } from '../components/GameHeader'
import { EventOverlay } from '../components/EventOverlay'
import { PhaseIndicatorAuto } from '../components/PhaseIndicator'
import { useGameStore } from '../store/gameStore'
import { getCurrentAttention } from '../../domain/services/attentionRouter'
import { getEventPriority } from '../../domain/entities/GameEvent'

// Lightweight guard for full-screen routes that don't use BottomNav
export function GameGuard() {
  const game = useGameStore(s => s.game)
  if (!game) return <Navigate to="/" replace />
  const attention = getCurrentAttention(game)
  // Bara overlay för kritiska events — medium/atmospheric visas av PortalEventSlot
  const shouldShowEventOverlay =
    attention.kind === 'event' &&
    (attention.event.priority ?? getEventPriority(attention.event.type)) === 'critical'
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

  const attention = getCurrentAttention(game)
  // coffee_room is a modal over dashboard — BottomNav stays visible (FIX-41)
  const sceneActive = attention.kind === 'scene' && game.pendingScene?.sceneId !== 'coffee_room'

  // Routes that own their own CTA chrome — BottomNav would overlap it
  const HIDDEN_PATHS = new Set([
    '/game/match',
    '/game/match/live',
    '/game/review',
    '/game/playoff-intro',
    '/game/qf-summary',
    '/game/sim-summary',
    '/game/half-time-summary',
    '/game/champion',
    '/game/season-summary',
  ])
  const hideBottomNav = sceneActive ||
    HIDDEN_PATHS.has(location.pathname) ||
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
    (attention.event.priority ?? getEventPriority(attention.event.type)) === 'critical' &&
    !isMatchRoute &&
    !isReviewRoute &&
    !isPressConferenceRoute

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!isLedgerOwnedChrome && <GameHeader />}
      {!isLedgerOwnedChrome && <PhaseIndicatorAuto />}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: hideBottomNav ? 0 : `calc(var(--bottom-nav-height) + var(--safe-bottom))` }}>
        <div key={location.pathname} className="screen-enter" style={{ minHeight: '100%' }}>
          <Outlet />
        </div>
      </div>
      {!hideBottomNav && <BottomNav />}
      <DoctorFAB />
      {shouldShowEventOverlay && <EventOverlay event={attention.event} />}
    </div>
  )
}
