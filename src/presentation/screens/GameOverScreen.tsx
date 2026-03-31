import { useGameStore } from '../store/gameStore'
import { useNavigate } from 'react-router-dom'

export function GameOverScreen() {
  const game = useGameStore(s => s.game)
  const navigate = useNavigate()

  if (!game) {
    navigate('/', { replace: true })
    return null
  }

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const lastSummary = (game.seasonSummaries ?? []).slice(-1)[0]
  const finalPosition = lastSummary?.finalPosition ?? 0
  const totalSeasons = (game.seasonSummaries ?? []).length
  const bestPosition = game.seasonSummaries && game.seasonSummaries.length > 0
    ? Math.min(...game.seasonSummaries.map(s => s.finalPosition))
    : finalPosition
  const totalWins = game.seasonSummaries
    ? game.seasonSummaries.reduce((sum, s) => sum + s.wins, 0)
    : 0

  function getBoardStatement(): string {
    const patience = game!.boardPatience ?? 70
    const failures = game!.consecutiveFailures ?? 0

    if (failures >= 3) {
      return `Efter tre säsonger på rad utan förbättring ser styrelsen sig tvingad att göra en förändring. ${managedClub?.name ?? 'Klubben'} tackar för insatsen men önskar dig lycka till i framtiden.`
    }
    if (patience <= 15) {
      return `Styrelsen har förlorat förtroendet för dig som tränare efter de ihållande besvikelserna. Beslutet är fattat — du lämnar ${managedClub?.name ?? 'klubben'} med omedelbar verkan.`
    }
    return `Styrelsen har beslutat att göra en förändring i tränarrollen. Tack för din tid i ${managedClub?.name ?? 'klubben'}.`
  }

  function handleNewGame() {
    navigate('/', { replace: true })
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      zIndex: 1000,
      maxWidth: 430,
      margin: '0 auto',
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid rgba(176,80,64,0.3)',
        borderRadius: 16,
        padding: '32px 24px',
        width: '100%',
        maxWidth: 390,
        textAlign: 'center',
      }}>
        {/* Red warning icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(176,80,64,0.15)',
          border: '2px solid rgba(176,80,64,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: 28,
        }}>
          ❌
        </div>

        <p style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: 'var(--danger)',
          marginBottom: 12,
        }}>
          Spelets slut
        </p>

        <h1 style={{
          fontSize: 26,
          fontWeight: 900,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-display)',
          marginBottom: 8,
          letterSpacing: '1px',
        }}>
          DU HAR SPARKATS
        </h1>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
          {managedClub?.name ?? 'Klubben'}
        </p>

        {/* Board statement */}
        <div style={{
          background: 'rgba(176,80,64,0.08)',
          border: '1px solid rgba(176,80,64,0.2)',
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 24,
          textAlign: 'left',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', marginBottom: 8, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Styrelsens uttalande
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {getBoardStatement()}
          </p>
        </div>

        {/* Final stats */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 24,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Din karriär
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div>
              <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>{totalSeasons}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Säsonger</p>
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent)' }}>{bestPosition}.</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Bästa plats</p>
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--success)' }}>{totalWins}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Totala vinster</p>
            </div>
          </div>
        </div>

        {/* New game button */}
        <button
          onClick={handleNewGame}
          style={{
            width: '100%',
            padding: '17px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(196,122,58,0.3)',
          }}
        >
          STARTA NYTT SPEL
        </button>
      </div>
    </div>
  )
}
