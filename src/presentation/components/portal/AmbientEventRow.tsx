import { useGameStore } from '../../store/gameStore'
import { getEventTypeLabel } from './EventCardInline'
import type { GameEvent } from '../../../domain/entities/GameEvent'

interface Props {
  event: GameEvent
}

/**
 * AmbientEventRow — D1 (DOM_D1_EVENTVIKTNING_2026-08-19.md) punkt 2.
 *
 * Visar ett event UTAN val (choices.length === 0, se eventQueueService.ts:s
 * isAmbientEvent) som en ambient rad — samma visuella register som
 * PortalBeat.tsx:s severity-0-läge (emoji + text, ingen kortram, ingen
 * blockering, går att stänga). Värdena nedan (padding, gap, fontSize,
 * dismiss-knappen) är kopierade bokstavligt ur PortalBeat.tsx:s sev===0-gren
 * — inte en ny stil, samma register.
 *
 * Skiljer sig från PortalBeat genom källan: PortalBeat konsumerar
 * portalBeatService.ts:s egen Beat-typ (statisk PORTAL_BEATS-array + trigger-
 * funktioner), helt orelaterat till GameEvent/pendingEvents (bekräftat vid
 * D1-utredningen 2026-08-19 — PortalBeat är INTE generisk nog att ta emot
 * ett GameEvent direkt). AmbientEventRow är den GameEvent-specifika
 * motsvarigheten.
 *
 * Stängning kör resolveEvent(event.id, ...) — eventResolver.ts:33 tar redan
 * bort choice-lösa events ur kön oavsett vilket choiceId som skickas in, så
 * ingen ny gren behövs i resolvern.
 */
export function AmbientEventRow({ event }: Props) {
  const resolveEvent = useGameStore(s => s.resolveEvent)
  const typeLabel = getEventTypeLabel(event)
  const emoji = typeLabel.split(' ')[0]

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    resolveEvent(event.id, 'ambient_dismiss')
  }

  return (
    <div
      data-ambient-event="true"
      style={{
        marginBottom: 10,
        overflow: 'hidden',
        borderRadius: 'var(--radius-md)',
        border: 'none',
      }}
    >
      <div style={{
        padding: '8px 12px',
        background: 'var(--bg-portal-surface)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}>
        <span style={{ fontSize: 18, lineHeight: 1.3, flexShrink: 0 }}>
          {emoji}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="h-quote" style={{ color: 'var(--text-light-secondary)', lineHeight: 1.55 }}>
            {event.body}
          </div>
        </div>
        <button
          onClick={dismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 14,
            cursor: 'pointer',
            padding: '0 0 0 4px',
            lineHeight: 1,
            flexShrink: 0,
            alignSelf: 'center',
          }}
          aria-label="Stäng"
        >
          ×
        </button>
      </div>
    </div>
  )
}
