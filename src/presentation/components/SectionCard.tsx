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
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{
            color: 'var(--text-muted)',
            fontSize: 9,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
          }}>
            {title}
          </span>
          {action && <div>{action}</div>}
        </div>
        {children}
      </div>
    </div>
  )
}
