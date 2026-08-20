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
 *
 * GEMENSAM BESLUTSMODELL (2026-08-12): INTE migrerad till DecisionCard.
 * Wrappern delar redan knapp-lagret (DecisionChoices nedan) men chrome:et
 * hör till Portal-kortfamiljen, inte Granska/EventOverlay-familjen: vänster-
 * stripen (portal-card-stripe), eyebrow-typografin (portal-card-eyebrow,
 * inte SectionLabel/.h-label), och ålders-förfallsklasserna (aged-1/aged-2)
 * är alla delade med ANDRA Portal-kort, inte unika för händelsekort. Att
 * tvinga in dem i DecisionCard hade antingen svällt komponenten med Portal-
 * specifika props eller brutit den delningen med resten av Portal-familjen.
 */

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { getActionsForEvent } from '../../../domain/services/eventActions'
import { getItemAge } from '../../../domain/services/decisionFatigueService'
import { DecisionChoices } from '../DecisionChoices'
import type { GameEvent } from '../../../domain/entities/GameEvent'

interface Props {
  event: GameEvent
  currentMatchday?: number
  /** Batch-av-tre (D1 punkt 4, 2026-08-21): satt av BatchStack (aldrig av
   *  det ovillkorade PortalEventSlot-fallet) — "besvarat kort sjunker och
   *  tonar ut nedåt" innan resolveEvent faktiskt körs, så nästa kort i
   *  stapeln hinner resas med sin egen entré-animation istf att bara byta
   *  ut sig direkt. Utelämnad (default) = exakt dagens beteende, ingen
   *  fördröjning, inget nytt för icke-batchade kort. */
  exitDelayMs?: number
}

/**
 * Exporterad (D1, 2026-08-19) så AmbientEventRow.tsx kan återanvända samma
 * emoji+etikett-mappning — en källa, inte en dubblett (Port 4).
 */
export function getEventTypeLabel(event: GameEvent): string {
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
      return 'Ⓒ KAPTENEN'
    case 'bandyLetter':
      return '✉️ INSÄNDARE'
    case 'academyEvent':
      return '🎓 AKADEMIN'
    case 'refereeMeeting':
      return '⚖️ DOMAREN'
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
    case 'seasonGoalHalfway':
      return '🎯 SÄSONGSMÅLET'
    default:
      return '📋 HÄNDELSE'
  }
}

export function EventCardInline({ event, currentMatchday, exitDelayMs }: Props) {
  const resolveEvent = useGameStore(s => s.resolveEvent)
  const [isExiting, setIsExiting] = useState(false)
  const actions = getActionsForEvent(event)
  const typeLabel = getEventTypeLabel(event)
  // Entitets-dedup-grinden (2026-08-12): ett event OM ett bud ÄR budet, inte
  // en separat entitet — event.id och bid.id är olika strängar för samma
  // sak. relatedBidId är den kanoniska identiteten när den finns (matchar
  // OpenBidsSecondary/IncomingBidCard/TransfersOutgoingBid), annars faller
  // det tillbaka på event.id.
  const entityId = event.relatedBidId ? `bid:${event.relatedBidId}` : `event:${event.id}`

  const age = currentMatchday != null ? getItemAge(event, currentMatchday) : 0
  const agedClass = age >= 5 ? 'aged-2' : age >= 3 ? 'aged-1' : ''

  function handleAction(choiceId: string) {
    if (!exitDelayMs) {
      resolveEvent(event.id, choiceId)
      return
    }
    setIsExiting(true)
    setTimeout(() => resolveEvent(event.id, choiceId), exitDelayMs)
  }

  return (
    <div
      className={`event-card-inline${agedClass ? ` ${agedClass}` : ''}${isExiting ? ' batch-stack-active is-exiting' : ''}`}
      style={{
        position: 'relative',
        margin: '0 0 8px 0',
        background: 'var(--bg-portal-surface)',
        border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px 14px 18px',
        pointerEvents: isExiting ? 'none' : undefined,
      }}
      data-entity-id={entityId}
      data-entity-source="EventCardInline"
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
      <DecisionChoices
        choices={actions.map(a => ({ id: a.choiceId, label: a.label }))}
        onChoose={(id) => handleAction(id)}
        layout="inline"
        primaryChoiceId={actions[0]?.choiceId}
      />

    </div>
  )
}
