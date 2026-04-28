import type { MemoryEvent } from '../../../domain/services/clubMemoryService'

interface Props {
  event: MemoryEvent
}

export function ClubMemoryEventRow({ event }: Props) {
  const isBig = event.significance >= 70

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '8px 0',
    lineHeight: 1.4,
    ...(isBig ? {
      background: 'rgba(184, 136, 76, 0.04)',
      borderLeft: '2px solid var(--accent)',
      paddingLeft: 10,
      paddingTop: 8,
      paddingBottom: 8,
      margin: '6px -10px 6px -2px',
      borderRadius: '0 4px 4px 0',
    } : {}),
  }

  return (
    <div style={rowStyle}>
      <span style={{
        fontSize: 14,
        width: 18,
        textAlign: 'center',
        marginTop: 1,
        flexShrink: 0,
      }}>
        {event.emoji}
      </span>
      <span style={{
        fontSize: 10,
        color: 'var(--text-muted)',
        minWidth: 60,
        marginTop: 2,
        flexShrink: 0,
      }}>
        Omg {event.matchday}
      </span>
      <span style={{
        flex: 1,
        fontFamily: 'Georgia, serif',
        fontSize: 12.5,
        color: 'var(--text-light)',
      }}>
        {event.text}
      </span>
    </div>
  )
}
