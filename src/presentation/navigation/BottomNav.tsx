import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, Users, Swords, ArrowLeftRight, Table2, Building2 } from 'lucide-react'
import { useInjuredInLineup, useExpiringContracts, useGameStore, useNavigationLock } from '../store/gameStore'
import { getTransferWindowStatus } from '../../domain/services/transferWindowService'

const tabs = [
  // TODO(FAS 1): byt mot BottomNav-ikon "Hem" · se ICON-BRIEF.md
  { to: '/game/dashboard', label: 'Hem', Icon: Home },
  // TODO(FAS 1): byt mot BottomNav-ikon "Trupp" · se ICON-BRIEF.md
  { to: '/game/squad', label: 'Trupp', Icon: Users },
  // TODO(FAS 1): byt mot BottomNav-ikon "Match" · se ICON-BRIEF.md
  { to: '/game/match', label: 'Match', Icon: Swords },
  // TODO(FAS 1): byt mot BottomNav-ikon "Tabell" · se ICON-BRIEF.md
  { to: '/game/tabell', label: 'Tabell', Icon: Table2 },
  // TODO(FAS 1): byt mot BottomNav-ikon "Transfers" · se ICON-BRIEF.md
  { to: '/game/transfers', label: 'Transfers', Icon: ArrowLeftRight },
  // TODO(FAS 1): byt mot BottomNav-ikon "Klubb" · se ICON-BRIEF.md
  { to: '/game/club', label: 'Klubb', Icon: Building2 },
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
      color: 'var(--text-light)',
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
  const currentDate = useGameStore(s => s.game?.currentDate ?? '')
  const { locked, reason } = useNavigationLock()
  const location = useLocation()
  const [lastActive, setLastActive] = useState<string>(location.pathname)
  const [bounceKey, setBounceKey] = useState<Record<string, number>>({})

  const isOnMatchLive = location.pathname.startsWith('/game/match/live')
  const effectivelyLocked = locked || isOnMatchLive
  const lockReason = reason ?? (isOnMatchLive ? 'Match pågår — spela klart' : null)

  // Hide nav entirely on ceremonial transition screens — full-screen flows
  // där nav inte har någon funktion och bara skapar förvirring.
  const HIDDEN_PATHS = [
    '/game/season-summary',
    '/game/playoff-intro',
    '/game/qf-summary',
    '/game/champion',
    '/game/game-over',
  ]
  const isHiddenScreen = HIDDEN_PATHS.some(p => location.pathname.startsWith(p))

  useEffect(() => {
    if (location.pathname !== lastActive) {
      setLastActive(location.pathname)
      setBounceKey(prev => ({ ...prev, [location.pathname]: (prev[location.pathname] ?? 0) + 1 }))
    }
  }, [location.pathname, lastActive])

  if (isHiddenScreen) return null

  const matchBadge = 0  // Removed: showed 1 when lineup was SET (not needed), dashboard CTA handles match flow
  const windowStatus = currentDate ? getTransferWindowStatus(currentDate).status : 'closed'
  const transferWindowOpen = windowStatus !== 'closed'

  const badges: Record<string, number> = {
    '/game/squad': injuredInLineup,
    '/game/match': matchBadge,
    '/game/transfers': expiringContracts,
  }

  return (
    <>
      {lockReason && (
        <div style={{
          position: 'fixed',
          bottom: `calc(var(--bottom-nav-height) + var(--safe-bottom))`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '430px',
          padding: '5px 16px',
          textAlign: 'center',
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          background: 'var(--bg-elevated)',
          borderTop: '1px solid var(--border)',
          fontFamily: 'var(--font-body)',
          zIndex: 99,
        }}>
          {lockReason}
        </div>
      )}
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
        opacity: effectivelyLocked ? 0.4 : 1,
        pointerEvents: effectivelyLocked ? 'none' : 'auto',
        transition: 'opacity 0.2s',
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
                gap: 2,
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 9,
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
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  <Badge count={badges[to] ?? 0} />
                  {to === '/game/transfers' && transferWindowOpen && (badges[to] ?? 0) === 0 && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: windowStatus === 'winter' ? 'var(--ice)' : 'var(--success)',
                      border: '1.5px solid var(--bg-surface)',
                    }} />
                  )}
                </div>
                <span>{label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
