import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, Users, Swords, ArrowLeftRight, Bell, Building2, Table2 } from 'lucide-react'
import { useInjuredInLineup, useExpiringContracts, useNextRoundNumber, useHasPendingLineup, useGameStore, useUnreadInboxCount } from '../store/gameStore'
import { getTransferWindowStatus } from '../../domain/services/transferWindowService'

const tabs = [
  { to: '/game/dashboard', label: 'Hem', Icon: Home },
  { to: '/game/squad', label: 'Trupp', Icon: Users },
  { to: '/game/match', label: 'Match', Icon: Swords },
  { to: '/game/tabell', label: 'Tabell', Icon: Table2 },
  { to: '/game/transfers', label: 'Transfers', Icon: ArrowLeftRight },
  { to: '/game/inbox', label: 'Inkorg', Icon: Bell },
  { to: '/game/club', label: 'Förening', Icon: Building2 },
]

function Badge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      minWidth: 16,
      height: 16,
      background: 'var(--danger)',
      color: '#fff',
      borderRadius: 99,
      fontSize: 10,
      fontWeight: 800,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1.5px solid var(--bg-dark)',
    }}>
      {count}
    </div>
  )
}

export function BottomNav() {
  const injuredInLineup = useInjuredInLineup()
  const expiringContracts = useExpiringContracts()
  const nextRoundNumber = useNextRoundNumber()
  const hasPendingLineup = useHasPendingLineup()
  const unreadInbox = useUnreadInboxCount()
  const currentDate = useGameStore(s => s.game?.currentDate ?? '')
  const location = useLocation()
  const [lastActive, setLastActive] = useState<string>(location.pathname)
  const [bounceKey, setBounceKey] = useState<Record<string, number>>({})

  useEffect(() => {
    if (location.pathname !== lastActive) {
      setLastActive(location.pathname)
      setBounceKey(prev => ({ ...prev, [location.pathname]: (prev[location.pathname] ?? 0) + 1 }))
    }
  }, [location.pathname, lastActive])

  const matchBadge = hasPendingLineup && nextRoundNumber !== null ? 1 : 0
  const windowStatus = currentDate ? getTransferWindowStatus(currentDate).status : 'closed'
  const transferWindowOpen = windowStatus !== 'closed'

  const badges: Record<string, number> = {
    '/game/squad': injuredInLineup,
    '/game/match': matchBadge,
    '/game/transfers': expiringContracts,
    '/game/inbox': unreadInbox,
  }

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '430px',
      height: `calc(var(--bottom-nav-height) + var(--safe-bottom))`,
      paddingBottom: 'var(--safe-bottom)',
      background: 'var(--bg-surface)',
      backgroundImage: 'repeating-linear-gradient(92deg, rgba(160,130,90,0.04) 0px, rgba(160,130,90,0.02) 2px, transparent 2px, transparent 8px)',
      borderTop: '1.5px solid var(--border)',
      display: 'flex',
      alignItems: 'stretch',
      zIndex: 100,
    }}>
      {tabs.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          style={{ flex: 1, display: 'flex', textDecoration: 'none' }}
        >
          {({ isActive }) => (
            <span style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 10,
              fontWeight: isActive ? 600 : 400,
              transition: 'color 0.15s',
              width: '100%',
              height: '100%',
              letterSpacing: isActive ? '0.3px' : undefined,
            }}>
              <div
                key={bounceKey[to] ?? 0}
                style={{
                  position: 'relative',
                  animation: isActive && (bounceKey[to] ?? 0) > 0 ? 'bounce 0.35s ease-out' : undefined,
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                <Badge count={badges[to] ?? 0} />
                {to === '/game/transfers' && transferWindowOpen && (badges[to] ?? 0) === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: windowStatus === 'winter' ? 'var(--ice)' : 'var(--success)',
                    border: '1.5px solid var(--bg-surface)',
                  }} />
                )}
              </div>
              <span>{label}</span>
              {isActive && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', marginTop: 1 }} />
              )}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
