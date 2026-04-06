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
      marginBottom: 4,
    }}>
      <p className="section-heading" style={{
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '2.5px',
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
