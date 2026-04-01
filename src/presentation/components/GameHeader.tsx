import { useGameStore, useManagedClub } from '../store/gameStore'

export function GameHeader() {
  const game = useGameStore(s => s.game)
  const club = useManagedClub()
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
      padding: '12px 16px',
      background: 'var(--bg-dark)',
      borderBottom: '2px solid var(--accent)',
      flexShrink: 0,
      minHeight: 44,
    }}>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 12,
        letterSpacing: '2.5px',
        color: 'rgba(245,241,235,0.7)',
        textTransform: 'uppercase',
      }}>
        Bandy Manager
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 4,
          background: 'rgba(196,122,58,0.15)',
          border: '1px solid rgba(196,122,58,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: 'var(--accent)',
        }}>
          {(club.shortName ?? club.name).substring(0, 2).toUpperCase()}
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{
            fontSize: 13,
            color: 'rgba(245,241,235,0.85)',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            margin: 0,
            lineHeight: 1.2,
          }}>
            {club.shortName ?? club.name}
          </p>
          <p style={{
            fontSize: 10,
            color: 'rgba(245,241,235,0.65)',
            margin: 0,
            lineHeight: 1.2,
          }}>
            {game.managerName} · {game.currentSeason}/{game.currentSeason + 1}
            {currentRound > 0 ? ` · Omg ${currentRound}` : ''}
          </p>
        </div>
      </div>
    </div>
  )
}
