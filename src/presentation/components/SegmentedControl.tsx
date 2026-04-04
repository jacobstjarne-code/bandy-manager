interface SegmentedControlProps {
  options: { label: string; value: string }[]
  value: string
  onChange: (v: string) => void
  explanation?: string
}

export function SegmentedControl({ options, value, onChange, explanation }: SegmentedControlProps) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 4 }}>
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              padding: '6px 4px',
              borderRadius: 20,
              background: value === opt.value ? 'var(--accent)' : 'var(--bg-elevated)',
              border: '1px solid ' + (value === opt.value ? 'var(--accent)' : 'var(--border)'),
              color: value === opt.value ? 'var(--text-light)' : 'var(--text-secondary)',
              fontSize: 11,
              fontWeight: value === opt.value ? 600 : 400,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {explanation && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic', lineHeight: 1.4 }}>
          {explanation}
        </p>
      )}
    </div>
  )
}
