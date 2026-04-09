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
      <p style={{
        fontSize: 8,
        fontWeight: 600,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-body)',
        margin: 0,
      }}>
        {children}
      </p>
      {right && <div>{right}</div>}
    </div>
  )
}
