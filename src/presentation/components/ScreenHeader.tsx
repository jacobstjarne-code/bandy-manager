interface ScreenHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
}

export function ScreenHeader({ title, subtitle, onBack }: ScreenHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          ←
        </button>
      )}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{title}</h1>
        {subtitle && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{subtitle}</p>
        )}
      </div>
    </div>
  )
}
