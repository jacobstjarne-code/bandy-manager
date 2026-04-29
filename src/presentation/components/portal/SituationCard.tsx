import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getSituation } from '../../../domain/services/situationService'

interface Props {
  game: SaveGame
}

export function SituationCard({ game }: Props) {
  const { label, body } = getSituation(game)

  return (
    <div style={{
      marginBottom: 10,
      padding: '10px 14px 12px',
      background: 'var(--bg-portal-elevated)',
      borderLeft: '2px solid var(--accent)',
      borderRadius: '0 6px 6px 0',
    }}>
      <div style={{
        fontSize: 8,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: 'var(--accent)',
        fontWeight: 700,
        marginBottom: 5,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 13,
        color: 'var(--text-light-secondary)',
        fontStyle: 'italic',
        lineHeight: 1.65,
        fontFamily: 'var(--font-display)',
      }}>
        {body}
      </div>
    </div>
  )
}
