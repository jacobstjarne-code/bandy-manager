import type { Club } from '../../../domain/entities/Club'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { positionShort } from '../../utils/formatters'

interface OpponentInfoCardProps {
  opponent: Club
  game: SaveGame
}

export function OpponentInfoCard({ opponent, game }: OpponentInfoCardProps) {
  const scoutReports = game.scoutReports ?? {}
  const opponentPlayers = game.players
    .filter(p => opponent.squadPlayerIds.includes(p.id) && !p.isInjured && p.suspensionGamesRemaining <= 0)
  const scoutedPlayers = opponentPlayers
    .map(p => ({ player: p, report: scoutReports[p.id] ?? null }))
    .filter(({ report }) => !!report)
    .sort((a, b) => (b.report!.estimatedCA) - (a.report!.estimatedCA))
  const hasAnyScout = scoutedPlayers.length > 0
  const avgCA = hasAnyScout
    ? Math.round(scoutedPlayers.reduce((s, { report }) => s + report!.estimatedCA, 0) / scoutedPlayers.length)
    : 0
  const topPlayers = scoutedPlayers.slice(0, 3)
  const opponentStanding = game.standings.find(s => s.clubId === opponent.id)

  return (
    <div style={{
      margin: '0 16px 12px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '10px 12px',
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 8 }}>
        Motståndaren
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{opponent.name}</p>
          {hasAnyScout ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {topPlayers.map(({ player: p, report }) => (
                <span key={p.id} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {p.firstName} {p.lastName}
                  <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>{positionShort(p.position)}</span>
                  <span style={{ color: 'var(--accent)', marginLeft: 4, fontSize: 11 }}>~{report!.estimatedCA}</span>
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Ej scoutat — gå till Transfers för att scouta spelare
            </p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ textAlign: 'center' }}>
            {hasAnyScout ? (
              <>
                <p style={{ fontSize: 18, fontWeight: 800, color: avgCA >= 65 ? 'var(--danger)' : avgCA >= 50 ? 'var(--warning)' : 'var(--success)' }}>~{avgCA}</p>
                <p style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Styrka</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-muted)' }}>?</p>
                <p style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Styrka</p>
              </>
            )}
          </div>
          {opponentStanding && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 800 }}>#{opponentStanding.position}</p>
              <p style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tabell</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
