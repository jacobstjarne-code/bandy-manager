import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { PlayoffBracket } from '../../../domain/entities/Playoff'

interface PlayoffBannerProps {
  game: SaveGame
  playoffInfo: PlayoffBracket
}

export function PlayoffBanner({ game, playoffInfo }: PlayoffBannerProps) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))',
      border: '2px solid rgba(201,168,76,0.4)',
      borderRadius: 12,
      padding: '20px 16px',
      marginBottom: 16,
      textAlign: 'center',
    }}>
      <p style={{ fontSize: 24 }}>🏆</p>
      <p style={{ fontSize: 16, fontWeight: 800, color: '#C9A84C', marginTop: 8 }}>
        Dags för slutspel!
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
        Grundserien är avslutad. Matcherna har lottats:
      </p>
      <div style={{ marginTop: 12 }}>
        {playoffInfo.quarterFinals.map(series => {
          const home = game.clubs.find(c => c.id === series.homeClubId)
          const away = game.clubs.find(c => c.id === series.awayClubId)
          const isManaged = series.homeClubId === game.managedClubId ||
                            series.awayClubId === game.managedClubId
          return (
            <div key={series.id} style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              padding: '6px 0',
              fontWeight: isManaged ? 700 : 400,
              color: isManaged ? '#C9A84C' : 'var(--text-secondary)',
              fontSize: 13,
            }}>
              <span>{home?.shortName ?? home?.name}</span>
              <span style={{ color: 'var(--text-muted)' }}>vs</span>
              <span>{away?.shortName ?? away?.name}</span>
            </div>
          )
        })}
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
        Bäst av 5 matcher per serie
      </p>
    </div>
  )
}
