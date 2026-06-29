export interface SpineItem {
  label: string
  season?: number
  text: string
  dimmed?: boolean
}

interface Props {
  items: SpineItem[]
  title?: string
}

export function Spine({ items, title }: Props) {
  if (items.length === 0) return null
  return (
    <div style={{ marginTop: 4 }}>
      {title && (
        <div className="h-label" style={{ marginBottom: 10 }}>
          {title}
        </div>
      )}
      <div style={{ position: 'relative', paddingLeft: 20 }}>
        {/* vertical line */}
        <div style={{
          position: 'absolute', left: 5, top: 4, bottom: 4,
          width: 1, background: 'var(--border)',
        }} />
        {items.map((item, i) => (
          <div key={i} style={{ position: 'relative', marginBottom: i < items.length - 1 ? 14 : 0, opacity: item.dimmed ? 0.45 : 1 }}>
            {/* dot */}
            <div style={{
              position: 'absolute', left: -16, top: 4,
              width: 5, height: 5, borderRadius: '50%',
              background: item.dimmed ? 'var(--border)' : 'var(--accent)',
            }} />
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2 }}>
              {item.label}{item.season != null ? ` · Säsong ${item.season}` : ''}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {item.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
