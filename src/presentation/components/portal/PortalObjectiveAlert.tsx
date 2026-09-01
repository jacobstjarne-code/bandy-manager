import { useNavigate } from 'react-router-dom'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface Props {
  game: SaveGame
}

export function PortalObjectiveAlert({ game }: Props) {
  const navigate = useNavigate()
  const atRisk = (game.boardObjectives ?? []).filter(o => o.status === 'at_risk')
  if (atRisk.length === 0) return null

  return (
    <button
      onClick={() => navigate('/game/club', { state: { tab: 'orten' } })}
      style={{
        display: 'block',
        width: '100%',
        padding: '8px 12px',
        marginBottom: 8,
        background: 'color-mix(in srgb, var(--warning) 10%, transparent)',
        border: '1px solid color-mix(in srgb, var(--warning) 35%, transparent)',
        borderRadius: 'var(--radius-md)',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--warning)', marginBottom: 2 }}>
        ⚠️ STYRELSEUPPDRAG I FARA
      </p>
      {atRisk.map(obj => (
        <p
          key={obj.id}
          data-entity-id={`boardObjective:${obj.id}`}
          data-entity-source="PortalObjectiveAlert"
          style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}
        >
          {obj.label}
        </p>
      ))}
    </button>
  )
}
