import type { Fixture } from '../../../domain/entities/Fixture'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface LastMatchCardProps {
  fixture: Fixture
  game: SaveGame
  managedClubId: string
}

export function LastMatchCard({ fixture, game, managedClubId }: LastMatchCardProps) {
  const homeClub = game.clubs.find(c => c.id === fixture.homeClubId)
  const awayClub = game.clubs.find(c => c.id === fixture.awayClubId)
  const isHome = fixture.homeClubId === managedClubId
  const myScore = isHome ? fixture.homeScore : fixture.awayScore
  const theirScore = isHome ? fixture.awayScore : fixture.homeScore
  const resultColor = myScore > theirScore ? 'var(--success)' : myScore < theirScore ? 'var(--danger)' : 'var(--warning)'
  const resultLabel = myScore > theirScore ? 'V' : myScore < theirScore ? 'F' : 'O'

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 'var(--radius-sm)',
        background: resultColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 12,
        fontWeight: 800,
        color: '#000',
      }}>
        {resultLabel}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600 }}>
          {homeClub?.shortName ?? homeClub?.name} {fixture.homeScore}–{fixture.awayScore} {awayClub?.shortName ?? awayClub?.name}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Omgång {fixture.roundNumber}</p>
      </div>
    </div>
  )
}
