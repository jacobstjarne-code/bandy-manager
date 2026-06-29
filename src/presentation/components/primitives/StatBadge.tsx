
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
      <span className="h-num-lg" style={{ lineHeight: 1, color: TONE_COLORS[tone] }}>
        {value}
      </span>
      <span className="h-label" style={{ margin: 0 }}>
        {label}
      </span>
    </div>
  )
}
