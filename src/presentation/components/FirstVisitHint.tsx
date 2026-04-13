interface Props {
  screenId: string
  text: string
  onDismiss: () => void
}

export function FirstVisitHint({ text, onDismiss }: Props) {
  return (
    <div className="card-round" style={{
      margin: '0 12px 8px', padding: '8px 12px',
      display: 'flex', alignItems: 'flex-start', gap: 8,
    }}>
      <span style={{ fontSize: 12, flexShrink: 0 }}>💡</span>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1, margin: 0 }}>
        {text}
      </p>
      <button
        onClick={onDismiss}
        style={{
          fontSize: 10, color: 'var(--text-muted)', background: 'none',
          border: 'none', cursor: 'pointer', flexShrink: 0, padding: '0 2px',
        }}
      >
        ✕
      </button>
    </div>
  )
}
