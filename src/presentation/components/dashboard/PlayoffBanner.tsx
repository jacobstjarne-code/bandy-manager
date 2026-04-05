import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { PlayoffBracket, PlayoffSeries } from '../../../domain/entities/Playoff'
import { PlayoffStatus } from '../../../domain/enums'

interface PlayoffBannerProps {
  game: SaveGame
  playoffInfo: PlayoffBracket
}

function SeriesRow({ series, game, compact }: { series: PlayoffSeries; game: SaveGame; compact?: boolean }) {
  const home = game.clubs.find(c => c.id === series.homeClubId)
  const away = game.clubs.find(c => c.id === series.awayClubId)
  const isManaged = series.homeClubId === game.managedClubId || series.awayClubId === game.managedClubId
  const isDone = series.winnerId !== null
  const homeName = home?.shortName ?? '?'
  const awayName = away?.shortName ?? '?'
  const homeWon = series.winnerId === series.homeClubId
  const awayWon = series.winnerId === series.awayClubId

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: compact ? '4px 8px' : '6px 10px',
      background: isManaged ? 'rgba(196,122,58,0.06)' : 'transparent',
      borderRadius: 6,
      border: isManaged ? '1px solid rgba(196,122,58,0.2)' : '1px solid var(--border)',
      marginBottom: 4,
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: compact ? 11 : 12,
            fontWeight: homeWon ? 700 : isDone ? 400 : 600,
            color: homeWon ? 'var(--success)' : isDone && awayWon ? 'var(--text-muted)' : 'var(--text-primary)',
            fontFamily: isManaged && series.homeClubId === game.managedClubId ? 'var(--font-display)' : 'var(--font-body)',
          }}>
            {homeName}
          </span>
          <span style={{ fontSize: compact ? 12 : 14, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', minWidth: 16, textAlign: 'center' }}>
            {series.homeWins}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: compact ? 11 : 12,
            fontWeight: awayWon ? 700 : isDone ? 400 : 600,
            color: awayWon ? 'var(--success)' : isDone && homeWon ? 'var(--text-muted)' : 'var(--text-primary)',
            fontFamily: isManaged && series.awayClubId === game.managedClubId ? 'var(--font-display)' : 'var(--font-body)',
          }}>
            {awayName}
          </span>
          <span style={{ fontSize: compact ? 12 : 14, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', minWidth: 16, textAlign: 'center' }}>
            {series.awayWins}
          </span>
        </div>
      </div>
    </div>
  )
}

export function PlayoffBanner({ game, playoffInfo }: PlayoffBannerProps) {
  const status = playoffInfo.status
  const hasQF = playoffInfo.quarterFinals.length > 0
  const hasSF = playoffInfo.semiFinals.length > 0
  const hasFinal = playoffInfo.final !== null

  const statusLabel = status === PlayoffStatus.QuarterFinals ? 'Kvartsfinal'
    : status === PlayoffStatus.SemiFinals ? 'Semifinal'
    : status === PlayoffStatus.Final ? 'Final'
    : status === PlayoffStatus.Completed ? 'Avslutad'
    : 'Slutspel'

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(196,122,58,0.12), rgba(196,122,58,0.04))',
      border: '2px solid rgba(196,122,58,0.35)',
      borderRadius: 12,
      padding: '16px 14px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>🏆</span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
            Slutspel {playoffInfo.season + 1}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {statusLabel} · Bäst av 5
          </p>
        </div>
      </div>

      {/* Bracket visualization */}
      <div style={{ display: 'flex', gap: 8 }}>
        {/* QF column */}
        {hasQF && (
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>
              KF
            </p>
            {playoffInfo.quarterFinals.map(s => (
              <SeriesRow key={s.id} series={s} game={game} compact />
            ))}
          </div>
        )}

        {/* SF column */}
        {hasSF && (
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>
              SF
            </p>
            {playoffInfo.semiFinals.map(s => (
              <SeriesRow key={s.id} series={s} game={game} compact />
            ))}
          </div>
        )}

        {/* Final column */}
        {hasFinal && playoffInfo.final && (
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>
              Final
            </p>
            <SeriesRow series={playoffInfo.final} game={game} />
          </div>
        )}
      </div>

      {playoffInfo.champion && (() => {
        const champ = game.clubs.find(c => c.id === playoffInfo.champion)
        return champ ? (
          <div style={{ textAlign: 'center', marginTop: 10, padding: '8px', background: 'rgba(196,168,76,0.1)', borderRadius: 8, border: '1px solid rgba(196,168,76,0.3)' }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
              🥇 {champ.name} — Svenska Mästare!
            </p>
          </div>
        ) : null
      })()}
    </div>
  )
}
