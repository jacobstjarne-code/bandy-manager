import type { CSSProperties, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  stagger?: number  // 1-6
  gold?: boolean
  danger?: boolean
  style?: CSSProperties
  onClick?: () => void
}

export function Card({ children, stagger, gold, danger, style, onClick }: CardProps) {
  return (
    <div
      className={stagger ? `card-stagger-${stagger}` : undefined}
      onClick={onClick}
      style={{
        background: 'var(--bg-surface)',
        border: gold
          ? '1px solid rgba(196,122,58,0.35)'
          : danger
          ? '1px solid rgba(239,68,68,0.35)'
          : '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '10px 14px',
        marginBottom: 8,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
