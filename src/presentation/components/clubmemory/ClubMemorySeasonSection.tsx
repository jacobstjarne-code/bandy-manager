import type { SeasonMemory } from '../../../domain/services/clubMemoryService'
import type { ActiveAnniversary } from '../../../domain/services/clubMemoryService'
import { ClubMemoryEventRow } from './ClubMemoryEventRow'

interface Props {
  seasonMemory: SeasonMemory
  activeAnniversaries?: ActiveAnniversary[]
}

const ERA_LABELS: Record<string, string> = {
  survival: 'ÖVERLEVNADSÅRET',
  fotfaste: 'FOTFÄSTET',
  establishment: 'ETABLERINGSÅRET',
  legacy: 'ARVET',
}

export function ClubMemorySeasonSection({ seasonMemory, activeAnniversaries = [] }: Props) {
  const { season, isOngoing, finishPosition, events, eraName } = seasonMemory

  const positionText = finishPosition
    ? finishPosition === 1 ? 'Mästare'
    : finishPosition === 2 ? '2:a plats'
    : finishPosition === 3 ? '3:e plats'
    : `${finishPosition}:e plats`
    : null

  const metaParts: string[] = []
  if (positionText) metaParts.push(positionText)

  // Era band label — only when era is known
  const eraLabel = eraName && eraName !== 'unknown'
    ? (ERA_LABELS[eraName] ?? eraName.toUpperCase())
    : null

  return (
    <div className="club-memory-season">
      {/* Era-band — visas ovanför säsongsrubriken när era är känd */}
      {eraLabel && (
        <div className="club-memory-era-band">
          {eraLabel}
        </div>
      )}

      {/* Season header */}
      <div className="club-memory-season-header">
        <span className="club-memory-season-title">
          Säsong {season}
        </span>
        {isOngoing && (
          <span className="club-memory-season-ongoing-badge">
            Pågående
          </span>
        )}
      </div>

      {/* Season meta */}
      {metaParts.length > 0 && (
        <p className="club-memory-season-meta">
          {metaParts.join(' · ')}
        </p>
      )}

      {/* Events */}
      {events.length === 0 ? (
        <p className="club-memory-season-empty">
          Inga minnesvärda händelser ännu.
        </p>
      ) : (
        events.map((event, i) => (
          <ClubMemoryEventRow
            key={`${event.type}-${event.matchday}-${i}`}
            event={event}
            activeAnniversaries={activeAnniversaries}
          />
        ))
      )}
    </div>
  )
}
