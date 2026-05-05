/**
 * EventCardInline — visar ett medium eller atmosfäriskt event inline i Portal.
 * Används av PortalEventSlot. Kritiska events hanteras av EventOverlay.
 *
 * Visuell anatomi per spec:
 * - card-sharp-mönster (1 px border, 8 px radius), --bg-portal-surface bakgrund
 * - Prio-signal i typ-label-färg: high/normal = accent, low = muted
 * - Body-text: Georgia 13px italic
 * - Knapprad med actions från getActionsForEvent — använder .btn .btn-primary / .btn .btn-outline
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

  // Prio-signal i typ-label-färg (severity-systemet är reserverat för journalist + säsongssignaturer)
  const labelColor = priority === 'high' || priority === 'normal'
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
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 12px',
      }}
    >
      {/* Typ-label — bär prio-signalen i färgen */}
      <p style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: labelColor,
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

      {/* Knapprad — använder designsystemets .btn-klasser, inga inline-overrides */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {actions.map(action => (
          <button
            key={action.choiceId}
            onClick={() => handleAction(action.choiceId)}
            className={action.isPrimary ? 'btn btn-primary' : 'btn btn-outline'}
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
          {remainingCount} notiser i inboxen
        </p>
      )}
    </div>
  )
}
