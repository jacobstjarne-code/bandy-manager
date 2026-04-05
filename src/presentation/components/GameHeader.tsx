import { useNavigate } from 'react-router-dom'
import { Bell, Settings } from 'lucide-react'
import { useGameStore, useManagedClub, useUnreadInboxCount } from '../store/gameStore'

export function GameHeader() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const club = useManagedClub()
  const unreadInbox = useUnreadInboxCount()
  if (!game || !club) return null

  const lastPlayedRound = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)
  const nextLeagueFixture = game.fixtures
    .filter(f => f.status === 'scheduled' && !f.isCup)
    .sort((a, b) => a.roundNumber - b.roundNumber)[0]
  const currentRound = nextLeagueFixture ? nextLeagueFixture.roundNumber : lastPlayedRound

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 12px',
      background: 'var(--bg-dark)',
      borderBottom: '2px solid var(--accent)',
      flexShrink: 0,
      minHeight: 44,
    }}>
      {/* Left: logo */}
      <img
        src="/bandymanager-logo.png"
        alt="Bandy Manager"
        style={{ height: 26, width: 'auto', opacity: 0.85 }}
      />

      {/* Center: club + season */}
      <div style={{ textAlign: 'center', flex: 1, padding: '0 8px' }}>
        <p style={{
          fontSize: 12,
          color: 'rgba(245,241,235,0.85)',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          margin: 0,
          lineHeight: 1.2,
        }}>
          {club.shortName ?? club.name}
        </p>
        <p style={{
          fontSize: 9,
          color: 'rgba(245,241,235,0.55)',
          margin: 0,
          lineHeight: 1.2,
        }}>
          {game.managerName} · {game.currentSeason}/{game.currentSeason + 1}
          {currentRound > 0 ? ` · Omg ${currentRound}` : ''}
        </p>
      </div>

      {/* Right: inbox + menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={() => navigate('/game/inbox')}
          style={{
            position: 'relative',
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: unreadInbox > 0 ? 'var(--accent)' : 'rgba(245,241,235,0.5)',
          }}
        >
          <Bell size={18} strokeWidth={2} />
          {unreadInbox > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -4,
              minWidth: 14, height: 14, borderRadius: 99,
              background: 'var(--danger)', color: 'var(--text-light)',
              fontSize: 9, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid var(--bg-dark)',
            }}>
              {unreadInbox > 9 ? '9+' : unreadInbox}
            </span>
          )}
        </button>
        <button
          onClick={() => navigate('/game/club')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: 'rgba(245,241,235,0.5)',
          }}
        >
          <Settings size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
