import type { MemoryEvent } from '../../../domain/services/clubMemoryService'
import type { ActiveAnniversary } from '../../../domain/services/clubMemoryService'
import { momentFamily } from '../../../domain/services/clubMemoryService'
import { pickAnniversaryMemoryRowLabel } from '../../../domain/data/anniversaryMemoryRowText'

/**
 * redesign-klubbminnet-omdesign (HANDOFF_CODE_KLUBBMINNET_2026-09-10.md):
 * severity→kind-mappningen Design pekar på återanvänds direkt här, oförändrad
 * — bara översatt till mockens k-*-klassnamn.
 */
export function getSeverityClass(event: MemoryEvent): string {
  const { type, outcome } = event

  if (type === 'cup_final' || type === 'sm_final') {
    if (outcome === 'won') return 'legendary'
    if (outcome === 'lost') return 'scar'
  }
  if (type === 'derby_result') return 'derby'
  if (type === 'retirement') return 'legendary'
  if (type === 'scandal') return 'scar'
  if (type === 'big_loss') return 'scar'

  return ''
}

const KIND_CLASS: Record<string, string> = {
  legendary: 'k-triumf',
  scar: 'k-arr',
  derby: 'k-laddat',
  '': 'k-noterat',
}

export function kindClassFor(event: MemoryEvent): string {
  return KIND_CLASS[getSeverityClass(event)] ?? 'k-noterat'
}

function buildEventId(event: MemoryEvent): string {
  return `${event.season}-${event.matchday}-${event.type}-${event.subjectPlayerId ?? event.subjectClubId ?? 'x'}`
}

interface Props {
  event: MemoryEvent
  dateLabel: { day: string; mon: string } | null
  activeAnniversaries?: ActiveAnniversary[]
}

export function ClubMemoryEventRow({ event, dateLabel, activeAnniversaries = [] }: Props) {
  const kindClass = kindClassFor(event)
  const family = momentFamily(event.type)

  const eventId = buildEventId(event)
  const matchingEcho = activeAnniversaries.find(a => a.eventId === eventId)
  const echoLabel = matchingEcho ? pickAnniversaryMemoryRowLabel(matchingEcho) : null

  return (
    <div className={`km-entry ${kindClass}`}>
      {kindClass === 'k-triumf' && <span className="km-entry-prick" />}
      <div className="km-entry-date">
        {dateLabel?.day && <div className="km-entry-day">{dateLabel.day}</div>}
        <div className="km-entry-mon">{dateLabel?.mon ?? ''}</div>
      </div>
      <div className="km-entry-body">
        <div className="km-entry-text">
          <span className="km-entry-fam">{family}</span>
          {event.text}
        </div>
        {echoLabel && (
          <div className="km-entry-echo-label">{echoLabel}</div>
        )}
      </div>
    </div>
  )
}
