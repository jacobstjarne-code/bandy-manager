import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  children: ReactNode
  variant?: 'sharp' | 'round'
  stagger?: number
  action?: ReactNode
  style?: React.CSSProperties
}

export function SectionCard({ title, children, variant = 'sharp', stagger, action, style }: SectionCardProps) {
  const cardClass = [
    variant === 'sharp' ? 'card-sharp' : 'card-round',
    stagger ? `card-stagger-${stagger}` : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={cardClass}
      style={{ margin: '0 12px 10px', overflow: 'hidden', ...style }}
    >
      <div
        className="leather-bar texture-leather"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span style={{
          color: 'var(--text-light-secondary)',
          fontSize: 9,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
        }}>
          {title}
        </span>
        {action && <div>{action}</div>}
      </div>
      <div style={{ padding: '12px 14px' }}>
        {children}
      </div>
    </div>
  )
}
