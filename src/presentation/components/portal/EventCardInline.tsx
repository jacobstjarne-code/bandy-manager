/**
 * EventCardInline — visar ett medium eller atmosfäriskt event inline i Portal.
 * Används av PortalEventSlot. Kritiska events hanteras av EventOverlay.
 *
 * Visuell anatomi per spec:
 * - Vänster border-stripe: high/normal = accent, low = muted
 * - Emoji + event-typ-label uppe (uppercase, letterSpacing 1.5px)
 * - Body-text: Georgia 13px italic
 * - Knapprad med actions från getActionsForEvent
 * - Räknarrad om remainingCount > 0
 */

import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore'
import { getActionsForEvent } from '../../../domain/services/eventActions'
import { getEventPriority } from '../../../domain/entities/GameEvent'
import type { GameEvent } from '../../../domain/entities/GameEvent'

interface Props {
  event: GameEvent
  remainingCount: number
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

export function EventCardInline({ event, remainingCount }: Props) {
  const resolveEvent = useGameStore(s => s.resolveEvent)
  const navigate = useNavigate()
  const actions = getActionsForEvent(event)
  const priority = event.priority ?? getEventPriority(event.type)

  // Vänster border-stripe per prio
  const stripeColor = priority === 'high' || priority === 'normal'
    ? 'var(--accent)'
    : 'var(--text-muted)'

  const typeLabel = getEventTypeLabel(event)

  function handleAction(choiceId: string) {
    resolveEvent(event.id, choiceId)
  }

  return (
    <div
      style={{
        margin: '0 0 8px 0',
        background: 'var(--bg-portal-surface, var(--bg-elevated))',
        borderLeft: `3px solid ${stripeColor}`,
        padding: '12px 14px 10px 12px',
      }}
    >
      {/* Typ-label */}
      <p style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: 8,
      }}>
        {typeLabel}
      </p>

      {/* Body-text */}
      <p style={{
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        fontStyle: 'italic',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        marginBottom: 12,
      }}>
        {event.body}
      </p>

      {/* Knapprad */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {actions.map(action => (
          <button
            key={action.choiceId}
            onClick={() => handleAction(action.choiceId)}
            style={{
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              background: action.isPrimary ? 'var(--accent)' : 'var(--bg-elevated)',
              color: action.isPrimary ? 'var(--bg-dark)' : 'var(--text-primary)',
              border: action.isPrimary ? 'none' : '1px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Räknarrad */}
      {remainingCount > 0 && (
        <p
          onClick={() => navigate('/game/inbox')}
          style={{
            marginTop: 10,
            fontSize: 12,
            color: 'var(--text-muted)',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {remainingCount} {remainingCount === 1 ? 'sak' : 'saker'} till att kolla
        </p>
      )}
    </div>
  )
}
