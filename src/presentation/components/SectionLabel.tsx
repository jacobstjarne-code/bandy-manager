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
//
// Tillgänglighet (2026-09-11): en ledande emoji i en sträng-child läses
// annars upp av skärmläsare ("money bag EKONOMI"). Den bryts ut till ett
// aria-hidden-span; textContent är oförändrat så designauditens
// sectionLabels-regel (som kräver emoji först) och visuella tester ser
// exakt samma text. Icke-sträng-children berörs inte.
const LEADING_EMOJI_RE = /^(\p{Extended_Pictographic}(?:[\uFE0F\u200D]|\p{Extended_Pictographic})*)(\s+)(.*)$/su

function renderLabelChildren(children: ReactNode): ReactNode {
  if (typeof children !== 'string') return children
  const m = LEADING_EMOJI_RE.exec(children)
  if (!m) return children
  const [, emoji, space, rest] = m
  return (
    <>
      <span aria-hidden="true">{emoji}{space}</span>
      {rest}
    </>
  )
}

export function SectionLabel({ children, style, right }: SectionLabelProps) {
  const content = renderLabelChildren(children)
  if (right) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        {/* .h-label-roll (9/2.5); margin:0-override pga tät kontext (ratificerat 2026-06-05) */}
        <p className="h-label" style={{ margin: 0, ...style }}>{content}</p>
        <div>{right}</div>
      </div>
    )
  }
  return (
    <p className="h-label" style={{ margin: 0, ...style }}>{content}</p>
  )
}
