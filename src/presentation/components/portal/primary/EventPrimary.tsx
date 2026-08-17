import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import { getEventPriority } from '../../../../domain/entities/GameEvent'

/**
 * Primary-kort för kritiska events som kräver svar.
 * Ingen mock-referens — card-sharp med danger-border.
 * Visar BARA events med priority='critical' — medium/low visas av PortalEventSlot.
 */
export function EventPrimary({ game }: CardRenderProps) {
  const navigate = useNavigate()

  const criticalEvent = (game.pendingEvents ?? []).find(
    e => !e.resolved &&
         e.type !== 'pressConference' &&
         (e.priority ?? getEventPriority(e.type)) === 'critical'
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
  // Entitets-dedup-grinden (2026-08-12): se EventCardInline.tsx för samma resonemang.
  const entityId = criticalEvent.relatedBidId ? `bid:${criticalEvent.relatedBidId}` : `event:${criticalEvent.id}`

  return (
    <div
      className="card-sharp"
      style={{ padding: 16, marginBottom: 14 }}
      data-entity-id={entityId}
      data-entity-source="EventPrimary"
    >
      <div className="h-label" style={{ marginBottom: 8, color: 'var(--danger)' }}>
        {emoji} HÄNDELSE KRÄVER SVAR
      </div>
      <div className="h-display-sm" style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
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
        className="btn btn-primary"
        style={{ width: '100%' }}
      >
        Hantera händelse →
      </button>
    </div>
  )
}
