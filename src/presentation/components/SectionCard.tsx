import { useState } from 'react'
import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  children: ReactNode
  variant?: 'sharp' | 'round'
  stagger?: number
  action?: ReactNode
  style?: React.CSSProperties
  id?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export function SectionCard({ title, children, variant = 'sharp', stagger, action, style, id, collapsible, defaultCollapsed }: SectionCardProps) {
  const [collapsed, setCollapsed] = useState(collapsible ? (defaultCollapsed ?? false) : false)

  const cardClass = [
    variant === 'sharp' ? 'card-sharp' : 'card-round',
    stagger ? `card-stagger-${stagger}` : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      id={id}
      className={cardClass}
      style={{ margin: '0 0 8px', overflow: 'hidden', ...style }}
    >
      <div style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: collapsed ? 4 : 6 }}>
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
          {collapsible ? (
            <button
              onClick={() => setCollapsed(c => !c)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-body)',
                padding: '0 0 0 8px', lineHeight: 1,
              }}
            >
              {collapsed ? 'Visa allt →' : 'Dölj ↑'}
            </button>
          ) : (
            action && <div>{action}</div>
          )}
        </div>
        {/* Peek-kollaps: kollapsad sektion visar en glimt (~en rad) med fade-ut nedåt
            så spelaren ser ATT innehåll finns — en helt dold sektion läses som tomt kort. */}
        {collapsible && collapsed ? (
          <div style={{ position: 'relative', maxHeight: 'var(--peek-height, 32px)', overflow: 'hidden' }}>
            {children}
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, height: 24,
              background: 'linear-gradient(to bottom, transparent, var(--bg-surface))',
              pointerEvents: 'none',
            }} />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
