import { useEffect, useRef } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { GameHeader } from '../components/GameHeader'
import { EventOverlay } from '../components/EventOverlay'
import { useGameStore } from '../store/gameStore'

// Lightweight guard for full-screen routes that don't use BottomNav
export function GameGuard() {
  const game = useGameStore(s => s.game)
  if (!game) return <Navigate to="/" replace />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <GameHeader />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </div>
      <EventOverlay />
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <GameHeader />
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: `calc(var(--bottom-nav-height) + var(--safe-bottom))` }}>
        <div key={location.pathname} className="screen-enter" style={{ minHeight: '100%' }}>
          <Outlet />
        </div>
      </div>
      <BottomNav />
      <DoctorFAB />
      <EventOverlay />
    </div>
  )
}
