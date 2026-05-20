import type { MemoryEvent } from '../../../domain/services/clubMemoryService'
import type { ActiveAnniversary } from '../../../domain/services/clubMemoryService'
import { pickAnniversaryMemoryRowLabel } from '../../../domain/data/anniversaryMemoryRowText'

interface Props {
  event: MemoryEvent
  activeAnniversaries?: ActiveAnniversary[]
}

function getSeverityClass(event: MemoryEvent): string {
  const { type, outcome } = event

  // Cup/SM-final
  if (type === 'cup_final' || type === 'sm_final') {
    if (outcome === 'won') return 'legendary'
    if (outcome === 'lost') return 'scar'
  }

  // Derby
  if (type === 'derby_result') return 'derby'

  // Retirement is always legendary
  if (type === 'retirement') return 'legendary'

  // Scandal is always scar
  if (type === 'scandal') return 'scar'

  // Big loss treated as scar
  if (type === 'big_loss') return 'scar'

  return ''
}

function buildEventId(event: MemoryEvent): string {
  return `${event.season}-${event.matchday}-${event.type}-${event.subjectPlayerId ?? event.subjectClubId ?? 'x'}`
}

export function ClubMemoryEventRow({ event, activeAnniversaries = [] }: Props) {
  const severityClass = getSeverityClass(event)
  const isFeatured = event.significance >= 90

  const eventId = buildEventId(event)
  const matchingEcho = activeAnniversaries.find(a => a.eventId === eventId)
  const isEchoing = !!matchingEcho

  const rowClasses = [
    'memory-row',
    severityClass,
    isFeatured ? 'memory-row-featured' : '',
    isEchoing ? 'memory-row-echoing' : '',
  ].filter(Boolean).join(' ')

  const echoLabel = isEchoing
    ? pickAnniversaryMemoryRowLabel(matchingEcho)
    : null

  return (
    <div className={rowClasses}>
      <span className="memory-row-emoji">
        {event.emoji}
      </span>
      <span className="memory-row-matchday">
        Omg {event.matchday}
      </span>
      <div className="memory-row-body">
        <span className="memory-row-text">
          {event.text}
        </span>
        {echoLabel && (
          <div className="memory-row-echo-label">{echoLabel}</div>
        )}
      </div>
    </div>
  )
}
