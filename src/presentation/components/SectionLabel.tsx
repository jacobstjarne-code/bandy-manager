import type { ReactNode } from 'react'

interface SectionLabelProps {
  children: ReactNode
  right?: ReactNode
}

export function SectionLabel({ children, right }: SectionLabelProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    }}>
      <p className="section-heading" style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        margin: 0,
      }}>
        {children}
      </p>
      {right && <div>{right}</div>}
    </div>
  )
}
