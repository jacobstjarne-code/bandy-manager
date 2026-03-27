import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { useGameStore } from '../store/gameStore'

// Lightweight guard for full-screen routes that don't use BottomNav
export function GameGuard() {
  const game = useGameStore(s => s.game)
  if (!game) return <Navigate to="/" replace />
  return <Outlet />
}

export function GameShell() {
  const game = useGameStore(s => s.game)
  const location = useLocation()
  if (!game) return <Navigate to="/" replace />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: `calc(var(--bottom-nav-height) + var(--safe-bottom))` }}>
        <div key={location.pathname} className="screen-enter" style={{ minHeight: '100%' }}>
          <Outlet />
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
