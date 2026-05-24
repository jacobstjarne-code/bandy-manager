/**
 * EventCardInline — visar ett medium eller atmosfäriskt event inline i Portal.
 * Används av PortalEventSlot. Kritiska events hanteras av EventOverlay.
 *
 * Visuell anatomi per spec:
 * - card-sharp-mönster (1 px border, 8 px radius), --bg-portal-surface bakgrund
 * - Prio-signal i typ-label-färg: high/normal = accent, low = muted
 * - Body-text: Georgia 13px italic
 * - Knapprad med actions från getActionsForEvent — använder .btn .btn-primary / .btn .btn-outline
 * - Räknarrad hanteras av PortalInboxCounter (i botten av PortalScreen)
 */

import { useGameStore } from '../../store/gameStore'
import { getActionsForEvent } from '../../../domain/services/eventActions'
import { getItemAge } from '../../../domain/services/decisionFatigueService'
import type { GameEvent } from '../../../domain/entities/GameEvent'

interface Props {
  event: GameEvent
  currentMatchday?: number
}

function getEventTypeLabel(event: GameEvent): string {
  switch (event.type) {
    case 'communityEvent':
      return '🏘️ ORTEN'
    case 'supporterEvent':
      return '📣 KLACKEN'
    case 'starPerformance':
      return '⭐ SPELAREN'
    case 'playerPraise':
      return '💬 SPELAREN'
    case 'playerMediaComment':
      return '📰 LOKALTIDNINGEN'
    case 'captainSpeech':
      return '🏒 KAPTENEN'
    case 'bandyLetter':
      return '✉️ INSÄNDARE'
    case 'academyEvent':
      return '🎓 AKADEMIN'
    case 'refereeMeeting':
      return '🟡 DOMAREN'
    case 'journalistExclusive':
      return '📰 LOKALTIDNINGEN'
    case 'politicianEvent':
      return '🏛️ KOMMUNEN'
    case 'hallDebate':
      return '🏛️ KOMMUNEN'
    case 'schoolAssignment':
      return '🎓 SKOLAN'
    case 'playoffEvent':
      return '🏆 SLUTSPELET'
    case 'retirementCeremony':
      return '🎖️ AVSKED'
    case 'economicStress':
      return '💰 EKONOMI'
    case 'sponsorOffer':
      return '💼 SPONSOR'
    default:
      return '📋 HÄNDELSE'
  }
}

export function EventCardInline({ event, currentMatchday }: Props) {
  const resolveEvent = useGameStore(s => s.resolveEvent)
  const actions = getActionsForEvent(event)
  const typeLabel = getEventTypeLabel(event)

  const age = currentMatchday != null ? getItemAge(event, currentMatchday) : 0
  const agedClass = age >= 5 ? 'aged-2' : age >= 3 ? 'aged-1' : ''

  function handleAction(choiceId: string) {
    resolveEvent(event.id, choiceId)
  }

  return (
    <div
      className={`event-card-inline${agedClass ? ` ${agedClass}` : ''}`}
      style={{
        position: 'relative',
        margin: '0 0 8px 0',
        background: 'var(--bg-portal-surface)',
        border: '1px solid rgba(196,122,58,0.15)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px 14px 18px',
      }}
    >
      {/* Vänster-stripe — action card, 3 px */}
      <div className="portal-card-stripe portal-card-stripe-copper-wide" />

      {/* Typ-label — eyebrow, klassbaserad */}
      <p className="portal-card-eyebrow" style={{ display: 'flex', alignItems: 'center' }}>
        <span>{typeLabel}</span>
        {agedClass && age > 0 && (
          <span className="event-card-age-tag">{age} omg gammal</span>
        )}
      </p>

      {/* Titel — visas för hallDebate-events */}
      {event.type === 'hallDebate' && event.title && (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, color: 'var(--text-light)', lineHeight: 1.35, marginBottom: 8 }}>
          {event.title}
        </div>
      )}

      {/* Body-text */}
      <p style={{
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        fontStyle: 'italic',
        color: 'var(--text-light)',
        lineHeight: 1.6,
        marginBottom: 12,
      }}>
        {event.body}
      </p>

      {/* Knapprad — första action primär, övriga outline */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {actions.map((action, idx) => (
          <button
            key={action.choiceId}
            onClick={() => handleAction(action.choiceId)}
            className={idx === 0 ? 'btn btn-primary' : 'btn btn-outline'}
          >
            {action.label}
          </button>
        ))}
      </div>

    </div>
  )
}
