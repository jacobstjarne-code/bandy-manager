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
  const typeLabel = getEventTypeLabel(event)

  function handleAction(choiceId: string) {
    resolveEvent(event.id, choiceId)
  }

  return (
    <div
      className="event-card-inline"
      style={{
        position: 'relative',
        margin: '0 0 8px 0',
        background: 'var(--bg-portal-surface)',
        border: '1px solid rgba(196,122,58,0.15)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px 14px 18px',
      }}
    >
      {/* Vänster-stripe — Stålvallen-anatomi */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 2,
        background: 'var(--copper)',
        borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
      }} />

      {/* Typ-label — monospace eyebrow, konsekvent copper */}
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: 'var(--copper)',
        opacity: 0.85,
        marginBottom: 10,
      }}>
        {typeLabel}
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
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        marginBottom: 12,
      }}>
        {event.body}
      </p>

      {/* Knapprad — likvärdiga val = btn-outline, ensam CTA = btn-primary */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {actions.map(action => (
          <button
            key={action.choiceId}
            onClick={() => handleAction(action.choiceId)}
            className={actions.length > 1 ? 'btn btn-outline' : 'btn btn-primary'}
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
          {remainingCount} notis{remainingCount === 1 ? '' : 'er'} i inboxen
        </p>
      )}
    </div>
  )
}
