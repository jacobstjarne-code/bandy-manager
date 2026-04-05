import { useEffect, useRef } from 'react'
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const location = useLocation()
  // Don't show on doctor screen itself
  if (location.pathname.includes('doctor')) return null
  return (
    <button
      onClick={() => navigate('/game/doctor')}
      style={{
        position: 'fixed',
        bottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom) + 12px)',
        right: 16,
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'var(--accent-dark)',
        color: 'var(--text-light)',
        boxShadow: '0 4px 16px rgba(162,88,40,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        zIndex: 99,
        border: 'none',
        cursor: 'pointer',
      }}
      aria-label="Bandydoktorn"
    >
      🩺
    </button>
  )
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
