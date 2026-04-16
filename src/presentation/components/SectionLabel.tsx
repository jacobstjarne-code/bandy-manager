import type { ReactNode, CSSProperties } from 'react'

interface SectionLabelProps {
  children: ReactNode
  emoji?: string
  style?: CSSProperties
  right?: ReactNode
}

export function SectionLabel({ children, emoji, style, right }: SectionLabelProps) {
  if (right) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <p style={{
          fontSize: 8, fontWeight: 600, letterSpacing: '2px',
          textTransform: 'uppercase', color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)', margin: 0, ...style,
        }}>{emoji && `${emoji} `}{children}</p>
        <div>{right}</div>
      </div>
    )
  }
  return (
    <p style={{
      fontSize: 8, fontWeight: 600, letterSpacing: '2px',
      textTransform: 'uppercase', color: 'var(--text-muted)',
      fontFamily: 'var(--font-body)', margin: 0, ...style,
    }}>{emoji && `${emoji} `}{children}</p>
  )
}
