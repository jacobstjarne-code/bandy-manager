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
      padding: '8px 16px',
      background: 'var(--bg-dark)',
      borderBottom: '2px solid var(--accent)',
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        letterSpacing: '3px',
        color: 'rgba(245,241,235,0.5)',
        textTransform: 'uppercase',
      }}>
        Bandy Manager
      </span>
      <span style={{
        fontSize: 11,
        color: 'rgba(245,241,235,0.7)',
        fontWeight: 600,
      }}>
        {club.shortName ?? club.name}{currentRound > 0 ? ` · Omg ${currentRound}` : ''}
      </span>
    </div>
  )
}
