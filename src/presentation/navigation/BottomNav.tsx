import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, Users, Swords, Table2, Building2, Hammer, ArrowLeftRight } from 'lucide-react'
import { useInjuredInLineup, useGameStore, useNavigationLock } from '../store/gameStore'
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
  // B1-nav 2026-06-19: Bygget ersätter Transfers permanent plats (Transfers blir villkorad, Fas 3)
  { to: '/game/bygget', label: 'Bygget', Icon: Hammer },
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
  const currentDate = useGameStore(s => s.game?.currentDate ?? '')
  const { locked, reason } = useNavigationLock()
  const location = useLocation()
  const [lastActive, setLastActive] = useState<string>(location.pathname)
  const [bounceKey, setBounceKey] = useState<Record<string, number>>({})

  const isOnMatchLive = location.pathname.startsWith('/game/match/live')
  const effectivelyLocked = locked || isOnMatchLive
  const lockReason = reason ?? (isOnMatchLive ? 'Match pågår — spela klart' : null)

  // NAV-PRINCIP (2026-06-15): GameShell äger DÖLJ/VISA (ceremonier), BottomNav äger
  // SPÄRR (match/live via effectivelyLocked). Tidigare hade BottomNav en EGEN
  // dölj-lista som överlappade GameShells — därav att navet "hoppade" från två håll.
  // Den är borttagen: GameShell renderar inte ens BottomNav på ceremoni-ytor, så
  // den koden nås aldrig där. En ansvarsfördelning, inte två sanningar.

  useEffect(() => {
    if (location.pathname !== lastActive) {
      setLastActive(location.pathname)
      setBounceKey(prev => ({ ...prev, [location.pathname]: (prev[location.pathname] ?? 0) + 1 }))
    }
  }, [location.pathname, lastActive])

  const matchBadge = 0  // Removed: showed 1 when lineup was SET (not needed), dashboard CTA handles match flow
  const windowStatus = currentDate ? getTransferWindowStatus(currentDate).status : 'closed'
  const transferWindowOpen = windowStatus !== 'closed'

  // B1-nav Fas 3: Värvning (marknaden) eleveras till nav-flik BARA när fönstret är öppet.
  // Tillfälligt sjunde mål under fönstret är ett medvetet undantag (Design) — ingen
  // utträngningslogik. När stängt nås marknaden via Trupp → Värvning.
  const navTabs = transferWindowOpen
    ? [...tabs, { to: '/game/transfers', label: 'Värvning', Icon: ArrowLeftRight }]
    : tabs

  // B1-nav: expiringContracts-badgen flyttar med kontrakt till Trupp/Värvning (Fas 2).
  const badges: Record<string, number> = {
    '/game/squad': injuredInLineup,
    '/game/match': matchBadge,
  }

  return (
    <>
      {lockReason && (
        <div className="h-label" style={{
          position: 'fixed',
          bottom: `calc(var(--bottom-nav-height) + var(--safe-bottom))`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '430px',
          padding: '5px 16px',
          textAlign: 'center',
          background: 'var(--bg-elevated)',
          borderTop: '1px solid var(--border)',
          zIndex: 99,
          margin: 0,
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
        {navTabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={{ flex: 1, display: 'flex', textDecoration: 'none' }}
          >
            {({ isActive }) => (
              /* ds-exempt: color/fontWeight/letterSpacing alla dynamiska ternary på isActive */
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
