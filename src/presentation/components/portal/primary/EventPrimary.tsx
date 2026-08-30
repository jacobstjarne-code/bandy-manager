import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import { getEventRenderTarget } from '../../../../domain/services/eventQueueService'
import { getEventDecisionTier } from '../../../../domain/services/decisionTierService'

/**
 * Primary-kort för kritiska events som kräver svar.
 * Ingen mock-referens — card-sharp med danger-border.
 * Visar BARA events med priority='critical' — medium/low visas av PortalEventSlot.
 *
 * D1 (DOM_D1_EVENTVIKTNING_2026-08-19.md) punkt 2: ett event utan val har
 * inget att "kräva svar" på — getEventRenderTarget klassar det som 'ambient'
 * oavsett priority, aldrig 'overlay', så det utesluts här. Utan detta hade
 * ett kritiskt-men-ambient event visat "HÄNDELSE KRÄVER SVAR" och en
 * "Hantera händelse →"-knapp som ledde till inboxen utan något beslut att
 * fatta där — samma mekaniska glapp som PortalEventSlot/EventOverlay hade.
 */
export function EventPrimary({ game }: CardRenderProps) {
  const navigate = useNavigate()

  // HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md): bakgrundsnivån får
  // aldrig ett dashboardkort. Samma filter som hasCriticalEvent-triggern —
  // trigger och komponent måste läsa samma villkor, annars kan bag:en välja
  // kortet och komponenten rendera null (tom primärplats).
  const criticalEvent = (game.pendingEvents ?? []).find(
    e => !e.resolved &&
         e.type !== 'pressConference' &&
         getEventDecisionTier(e) !== 'background' &&
         getEventRenderTarget(e) === 'overlay'
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
      data-primary-card="true"
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
        className="btn btn-outline"
        style={{ width: '100%' }}
      >
        Hantera händelse →
      </button>
    </div>
  )
}
