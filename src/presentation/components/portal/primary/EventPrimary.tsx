import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'

/**
 * Primary-kort för kritiska events som kräver svar.
 * Ingen mock-referens — card-sharp med danger-border.
 */
export function EventPrimary({ game }: CardRenderProps) {
  const navigate = useNavigate()

  const criticalEvent = (game.pendingEvents ?? []).find(
    e => !e.resolved && e.type !== 'pressConference'
  )

  if (!criticalEvent) return null

  const title = criticalEvent.title ?? 'Händelse kräver svar'
  const body = criticalEvent.body ?? 'Det har inträffat något som kräver ditt beslut.'

  const eventEmoji: Record<string, string> = {
    player_crisis: '🚨',
    injury_crisis: '🩹',
    financial: '💰',
    board: '📋',
    community: '🏘',
    scandal: '📰',
    default: '⚠️',
  }
  const emoji = eventEmoji[criticalEvent.type] ?? eventEmoji.default

  return (
    <div className="card-sharp" style={{
      padding: 16,
      marginBottom: 14,
      borderLeft: '3px solid var(--danger)',
    }}>
      <div style={{
        fontSize: 9,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        fontWeight: 700,
        marginBottom: 8,
        color: 'var(--danger)',
      }}>
        {emoji} HÄNDELSE KRÄVER SVAR
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 20,
        fontWeight: 700,
        lineHeight: 1.2,
        color: 'var(--text-light)',
        marginBottom: 8,
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 12,
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
        marginBottom: 10,
      }}>
        {body}
      </div>
      <button
        onClick={() => navigate('/game/inbox')}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, var(--accent-dark) 0%, var(--accent-deep) 100%)',
          color: 'var(--text-light)',
          border: 'none',
          padding: '12px 14px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.5px',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        Hantera händelse →
      </button>
    </div>
  )
}
