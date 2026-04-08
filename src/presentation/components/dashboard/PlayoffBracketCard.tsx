import { useNavigate } from 'react-router-dom'
import { PlayoffStatus } from '../../../domain/enums'
import type { PlayoffBracket, PlayoffSeries } from '../../../domain/entities/Playoff'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface PlayoffSeriesRowProps {
  series: PlayoffSeries
  game: SaveGame
  managedClubId: string
}

function PlayoffSeriesRow({ series, game, managedClubId }: PlayoffSeriesRowProps) {
  const homeClub = game.clubs.find(c => c.id === series.homeClubId)
  const awayClub = game.clubs.find(c => c.id === series.awayClubId)
  const isManagedHome = series.homeClubId === managedClubId
  const isManagedAway = series.awayClubId === managedClubId
  const isManaged = isManagedHome || isManagedAway
  const homeWins = series.homeWins
  const awayWins = series.awayWins
  const homeWon = homeWins > awayWins && series.winnerId !== null
  const awayWon = awayWins > homeWins && series.winnerId !== null

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: isManagedHome ? 'var(--accent-dark)' : homeWon ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isManagedHome ? 700 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
        {homeClub?.shortName ?? homeClub?.name ?? '?'}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: isManaged ? 'var(--accent-dark)' : 'var(--text-primary)', letterSpacing: '1px', margin: '0 8px', minWidth: 32, textAlign: 'center', fontFamily: 'var(--font-display)' }}>
        {homeWins}–{awayWins}
      </span>
      <span style={{ fontSize: 12, color: isManagedAway ? 'var(--accent-dark)' : awayWon ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isManagedAway ? 700 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right', fontFamily: 'var(--font-body)' }}>
        {awayClub?.shortName ?? awayClub?.name ?? '?'}
      </span>
    </div>
  )
}

interface PlayoffBracketCardProps {
  bracket: PlayoffBracket
  game: SaveGame
}

export function PlayoffBracketCard({ bracket, game }: PlayoffBracketCardProps) {
  const navigate = useNavigate()
  const managedClubId = game.managedClubId
  const statusLabel = bracket.status === PlayoffStatus.QuarterFinals ? 'KVARTSFINAL'
    : bracket.status === PlayoffStatus.SemiFinals ? 'SEMIFINAL'
    : bracket.status === PlayoffStatus.Final ? 'SM-FINAL'
    : bracket.status === PlayoffStatus.Completed ? 'AVSLUTAD'
    : 'TOPP 8'

  const activeSeries = bracket.status === PlayoffStatus.QuarterFinals ? bracket.quarterFinals
    : bracket.status === PlayoffStatus.SemiFinals ? bracket.semiFinals
    : bracket.status === PlayoffStatus.Final && bracket.final ? [bracket.final]
    : []

  const champion = bracket.champion ? game.clubs.find(c => c.id === bracket.champion) : null

  return (
    <div
      className="card-sharp card-stagger-3"
      style={{ margin: '0 0 8px', overflow: 'hidden', cursor: 'pointer' }}
      onClick={() => navigate('/game/tabell', { state: { tab: 'cupen' } })}
    >
      <div style={{ padding: '10px 14px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
            ⚔️ TOPP 8
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="tag tag-fill">{statusLabel}</span>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/game/tabell') }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--accent)', fontSize: 12, lineHeight: 1,
                cursor: 'pointer',
              }}
            >›</button>
          </div>
        </div>
      </div>
      <div style={{ padding: '0 14px 10px' }}>
        {bracket.status === PlayoffStatus.Completed && champion ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <span style={{ fontSize: 24 }}>🏆</span>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-dark)', marginTop: 4, fontFamily: 'var(--font-display)' }}>{champion.name}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Svenska Mästare {bracket.season}</p>
          </div>
        ) : (
          <div>
            {activeSeries.map(series => (
              <PlayoffSeriesRow key={series.id} series={series} game={game} managedClubId={managedClubId} />
            ))}
            {activeSeries.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Slutspelet startar snart</p>
            )}
          </div>
        )}
        {bracket.status !== PlayoffStatus.Completed && (
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, fontFamily: 'var(--font-body)' }}>
            {bracket.status === PlayoffStatus.Final ? 'En match avgör' : 'Bäst av 5 matcher per serie'}
          </p>
        )}
      </div>
    </div>
  )
}
