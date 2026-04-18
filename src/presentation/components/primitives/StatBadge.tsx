
interface StatBadgeProps {
  value: string | number
  label: string
  tone?: 'neutral' | 'accent' | 'success' | 'danger'
}

const TONE_COLORS: Record<NonNullable<StatBadgeProps['tone']>, string> = {
  neutral: 'var(--text-primary)',
  accent: 'var(--accent)',
  success: 'var(--success)',
  danger: 'var(--danger)',
}

export function StatBadge({ value, label, tone = 'neutral' }: StatBadgeProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 28,
        lineHeight: 1,
        color: TONE_COLORS[tone],
      }}>
        {value}
      </span>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}>
        {label}
      </span>
    </div>
  )
}
