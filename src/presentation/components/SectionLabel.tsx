import type { ReactNode, CSSProperties } from 'react'

interface SectionLabelProps {
  children: ReactNode
  style?: CSSProperties
  right?: ReactNode
}

// AUGUSTIREGELN (2026-08-12): emoji som sektionsmarkör hör till children,
// inte en egen prop — den forna emoji-propen konkatenerade in i samma
// textnod och var alltså aldrig ett sibling-element, bara en låtsad
// separation. Skriv <SectionLabel>🏒 EKONOMI</SectionLabel> direkt.
export function SectionLabel({ children, style, right }: SectionLabelProps) {
  if (right) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        {/* .h-label-roll (9/2.5); margin:0-override pga tät kontext (ratificerat 2026-06-05) */}
        <p className="h-label" style={{ margin: 0, ...style }}>{children}</p>
        <div>{right}</div>
      </div>
    )
  }
  return (
    <p className="h-label" style={{ margin: 0, ...style }}>{children}</p>
  )
}
