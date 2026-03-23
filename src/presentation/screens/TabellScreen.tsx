import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { ClubBadge } from '../components/ClubBadge'
import { isRivalryMatch } from '../../domain/data/rivalries'

export function TabellScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)

  if (!game) return null

  const standings = [...game.standings].sort((a, b) => a.position - b.position)
  const managedClubId = game.managedClubId

  function clubName(clubId: string): string {
    return game!.clubs.find(c => c.id === clubId)?.shortName
      ?? game!.clubs.find(c => c.id === clubId)?.name
      ?? clubId
  }

  return (
    <div style={{ padding: '20px 16px', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 22,
            cursor: 'pointer',
            padding: 0,
            lineHeight: 1,
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Tabell</h1>
      </div>

      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '24px 32px 1fr 28px 28px 28px 28px 36px 32px',
        gap: 4,
        padding: '6px 10px',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        color: 'var(--text-muted)',
        marginBottom: 4,
        background: 'linear-gradient(90deg, #0D1B2A, #122235, #0D1B2A)',
        borderRadius: 6,
      }}>
        <span>#</span>
        <span></span>
        <span>Lag</span>
        <span style={{ textAlign: 'center' }}>S</span>
        <span style={{ textAlign: 'center' }}>V</span>
        <span style={{ textAlign: 'center' }}>O</span>
        <span style={{ textAlign: 'center' }}>F</span>
        <span style={{ textAlign: 'center' }}>MS</span>
        <span style={{ textAlign: 'right' }}>P</span>
      </div>

      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}>
        {standings.map((row, i) => {
          const isManaged = row.clubId === managedClubId
          const isTop3 = row.position <= 3
          const goalDiff = row.goalDifference >= 0
            ? `+${row.goalDifference}`
            : String(row.goalDifference)

          return (
            <div
              key={row.clubId}
              style={{
                display: 'grid',
                gridTemplateColumns: '24px 32px 1fr 28px 28px 28px 28px 36px 32px',
                gap: 4,
                padding: '10px 10px',
                alignItems: 'center',
                borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                background: isManaged
                  ? 'linear-gradient(90deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 100%)'
                  : isTop3
                  ? 'rgba(201,168,76,0.05)'
                  : row.position >= 11
                  ? 'rgba(239,68,68,0.04)'
                  : 'transparent',
              }}
            >
              {/* Position */}
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: isTop3 ? '#C9A84C' : 'var(--text-muted)',
              }}>
                {row.position}
              </span>

              {/* Club badge */}
              <ClubBadge clubId={row.clubId} name={clubName(row.clubId)} size={24} />

              {/* Club name */}
              <span style={{
                fontSize: 13,
                fontWeight: isManaged ? 700 : 500,
                color: isManaged ? '#C9A84C' : 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {isManaged ? '★ ' : ''}{clubName(row.clubId)}{isRivalryMatch(row.clubId, managedClubId) ? ' 🔥' : ''}
              </span>

              {/* Played */}
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
                {row.played}
              </span>

              {/* Wins */}
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
                {row.wins}
              </span>

              {/* Draws */}
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
                {row.draws}
              </span>

              {/* Losses */}
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
                {row.losses}
              </span>

              {/* Goal diff */}
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                textAlign: 'center',
                color: row.goalDifference > 0
                  ? 'var(--success)'
                  : row.goalDifference < 0
                  ? 'var(--danger)'
                  : 'var(--text-secondary)',
              }}>
                {goalDiff}
              </span>

              {/* Points */}
              <span style={{
                fontSize: 14,
                fontWeight: 800,
                textAlign: 'right',
                color: isManaged ? '#C9A84C' : 'var(--text-primary)',
              }}>
                {row.points}
              </span>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
        S = Spelade · V = Vinster · O = Oavgjort · F = Förluster · MS = Målskillnad · P = Poäng
      </p>
    </div>
  )
}
