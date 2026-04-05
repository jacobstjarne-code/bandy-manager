import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Settings } from 'lucide-react'
import { useGameStore, useManagedClub, useUnreadInboxCount } from '../store/gameStore'
import { saveSaveGame } from '../../infrastructure/persistence/saveGameStorage'

export function GameHeader() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const club = useManagedClub()
  const unreadInbox = useUnreadInboxCount()
  const [showMenu, setShowMenu] = useState(false)
  const [saveToast, setSaveToast] = useState(false)
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
      position: 'relative',
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
          onClick={() => setShowMenu(!showMenu)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: 'rgba(245,241,235,0.5)',
          }}
        >
          <Settings size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Save toast */}
      {saveToast && (
        <div style={{
          position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--success)', color: 'var(--text-light)',
          padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, zIndex: 201,
        }}>
          ✓ Sparat
        </div>
      )}

      {/* Settings dropdown */}
      {showMenu && (
        <div style={{
          position: 'absolute', top: 48, right: 12,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '4px 0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          zIndex: 200, minWidth: 160,
        }}>
          {[
            { label: '💾 Spara spel', action: () => {
              const currentGame = useGameStore.getState().game
              if (currentGame) saveSaveGame(currentGame)
              setSaveToast(true); setTimeout(() => setSaveToast(false), 2000)
            } },
            { label: '📂 Ladda spel', action: () => navigate('/') },
            { label: '❓ Hjälp', action: () => navigate('/game/doctor') },
            { label: '🏟️ Klubb', action: () => navigate('/game/club') },
          ].map((item, i) => (
            <button key={i} onClick={() => { item.action(); setShowMenu(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 14px', background: 'none', border: 'none',
                fontSize: 13, color: 'var(--text-primary)',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
