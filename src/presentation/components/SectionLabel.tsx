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
        {/* .h-label-roll (9/2.5); margin:0-override pga tät kontext (ratificerat 2026-06-05) */}
        <p className="h-label" style={{ margin: 0, ...style }}>{emoji && `${emoji} `}{children}</p>
        <div>{right}</div>
      </div>
    )
  }
  return (
    <p className="h-label" style={{ margin: 0, ...style }}>{emoji && `${emoji} `}{children}</p>
  )
}
