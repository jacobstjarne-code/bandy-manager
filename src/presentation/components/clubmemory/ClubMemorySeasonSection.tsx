import type { SeasonMemory } from '../../../domain/services/clubMemoryService'
import { ClubMemoryEventRow } from './ClubMemoryEventRow'

interface Props {
  seasonMemory: SeasonMemory
}

const ERA_LABELS: Record<string, string> = {
  survival: 'Överlevnad',
  fotfaste: 'Fotfäste',
  establishment: 'Etablering',
  legacy: 'Arv',
}

export function ClubMemorySeasonSection({ seasonMemory }: Props) {
  const { season, isOngoing, finishPosition, events, eraName } = seasonMemory

  const positionText = finishPosition
    ? finishPosition === 1 ? 'Mästare'
    : finishPosition === 2 ? '2:a plats'
    : finishPosition === 3 ? '3:e plats'
    : `${finishPosition}:e plats`
    : null

  const eraLabel = eraName ? ERA_LABELS[eraName] ?? eraName : null

  const metaParts: string[] = []
  if (positionText) metaParts.push(positionText)
  if (eraLabel) metaParts.push(`Era: ${eraLabel.toUpperCase()}`)

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Season header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0 6px',
        borderBottom: '1px solid var(--border-dark)',
        marginBottom: 8,
      }}>
        <span style={{
          fontFamily: 'Georgia, serif',
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--text-light)',
        }}>
          Säsong {season}
        </span>
        {isOngoing && (
          <span style={{
            fontSize: 8,
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: '1.5px',
            color: 'var(--accent)',
            background: 'rgba(184, 136, 76, 0.12)',
            border: '1px solid rgba(184, 136, 76, 0.3)',
            padding: '2px 6px',
            borderRadius: 3,
          }}>
            Pågående
          </span>
        )}
      </div>

      {/* Season meta */}
      {metaParts.length > 0 && (
        <p style={{
          fontSize: 10,
          fontStyle: 'italic',
          color: 'var(--text-muted)',
          lineHeight: 1.4,
          marginBottom: 10,
          margin: '0 0 10px',
        }}>
          {metaParts.join(' · ')}
        </p>
      )}

      {/* Events */}
      {events.length === 0 ? (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Inga minnesvärda händelser ännu.
        </p>
      ) : (
        events.map((event, i) => (
          <ClubMemoryEventRow key={`${event.type}-${event.matchday}-${i}`} event={event} />
        ))
      )}
    </div>
  )
}
