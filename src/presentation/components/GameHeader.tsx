import { useGameStore, useManagedClub } from '../store/gameStore'

export function GameHeader() {
  const game = useGameStore(s => s.game)
  const club = useManagedClub()
  if (!game || !club) return null

  const currentRound = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 16px',
      background: 'var(--bg-dark)',
      borderBottom: '2px solid var(--accent)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          letterSpacing: '2.5px',
          color: 'rgba(245,241,235,0.45)',
          textTransform: 'uppercase',
        }}>
          Bandy Manager
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 12,
          color: 'rgba(245,241,235,0.8)',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
        }}>
          {club.shortName ?? club.name}
        </span>
        <span style={{
          fontSize: 10,
          color: 'rgba(245,241,235,0.45)',
        }}>
          {game.managerName} · Säsong {game.currentSeason}/{game.currentSeason + 1}
          {currentRound > 0 ? ` · Omg ${currentRound}` : ''}
        </span>
      </div>
    </div>
  )
}
