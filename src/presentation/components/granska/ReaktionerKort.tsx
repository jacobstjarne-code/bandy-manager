import { useEffect } from 'react'
import type { GameEvent } from '../../../domain/entities/GameEvent'
import { getReactionEventsForGranska } from '../../../domain/services/granskaEventClassifier'
import { SectionLabel } from '../SectionLabel'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getEventContextLabel } from '../../../domain/services/eventContextService'

interface ReaktionerKortProps {
  game: SaveGame
  pendingEvents: GameEvent[]
  onResolve: (ids: string[]) => void
}

export function ReaktionerKort({ game, pendingEvents, onResolve }: ReaktionerKortProps) {
  const reactions = getReactionEventsForGranska(pendingEvents)

  useEffect(() => {
    if (reactions.length > 0) {
      onResolve(reactions.map(e => e.id))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (reactions.length === 0) return null

  const MAX_VISIBLE = 5
  const visible = reactions.slice(0, MAX_VISIBLE)
  const hiddenCount = reactions.length - MAX_VISIBLE

  return (
    <div className="card-sharp" style={{ margin: '0 0 8px', padding: '10px 12px' }}>
      <SectionLabel style={{ marginBottom: 8 }}>💬 KRING MATCHEN</SectionLabel>
      {visible.map(event => (
        <div key={event.id} style={{ marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
          {event.sender ? (
            <p className="h-label" style={{ marginBottom: 2 }}>
              {event.sender.name} · {event.sender.role}
            </p>
          ) : event.title ? (
            <p className="h-label" style={{ marginBottom: 2 }}>{event.title}</p>
          ) : null}
          {getEventContextLabel(event, game) && (
            <p style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>
              {getEventContextLabel(event, game)}
            </p>
          )}
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{event.body}</p>
        </div>
      ))}
      {hiddenCount > 0 && (
        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>+ {hiddenCount} till</p>
      )}
    </div>
  )
}
