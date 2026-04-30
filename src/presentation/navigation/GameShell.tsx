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
      {shouldShowEventOverlay && <EventOverlay />}
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
  const sceneActive = attention.kind === 'scene'

  // EventOverlay visas INTE när en scen väntar — scenen har prioritet
  // EventOverlay visas INTE under live-match, match-setup, resultat eller granskning
  // EventOverlay visas BARA för kritiska events — medium/atmospheric visas av PortalEventSlot
  const isMatchRoute = location.pathname.includes('/match/live') ||
    location.pathname === '/game/match' ||
    location.pathname === '/game/match-result' ||
    location.pathname === '/game/review'
  const isReviewRoute = location.pathname === '/game/review'
  const isPressConferenceRoute = location.pathname.includes('/press-conference')
  const shouldShowEventOverlay =
    attention.kind === 'event' &&
    (attention.event.priority ?? getEventPriority(attention.event.type)) === 'critical' &&
    !isMatchRoute &&
    !isReviewRoute &&
    !isPressConferenceRoute

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <GameHeader />
      <PhaseIndicatorAuto />
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: sceneActive ? 0 : `calc(var(--bottom-nav-height) + var(--safe-bottom))` }}>
        <div key={location.pathname} className="screen-enter" style={{ minHeight: '100%' }}>
          <Outlet />
        </div>
      </div>
      {!sceneActive && <BottomNav />}
      <DoctorFAB />
      {shouldShowEventOverlay && <EventOverlay />}
    </div>
  )
}
