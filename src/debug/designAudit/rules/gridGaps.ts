import type { Finding } from '../types'

function cssPath(el: Element): string {
  const parts: string[] = []
  let cur: Element | null = el
  while (cur && cur.tagName !== 'BODY') {
    let seg = cur.tagName.toLowerCase()
    if (cur.id) { seg += '#' + cur.id; parts.unshift(seg); break }
    const cls = Array.from(cur.classList).slice(0, 2)
    if (cls.length) seg += '.' + cls.join('.')
    const parent = cur.parentElement
    if (parent) seg += `:nth-child(${Array.from(parent.children).indexOf(cur) + 1})`
    parts.unshift(seg)
    cur = cur.parentElement
  }
  return parts.slice(-3).join(' > ')
}

export function runGridGaps(root: HTMLElement): Finding[] {
  const findings: Finding[] = []
  const screenPath = window.location.pathname
  const all = root.querySelectorAll('*')

  for (const el of all) {
    const s = getComputedStyle(el)

    // Grid with exactly two 1fr columns
    if (s.display === 'grid') {
      // Two 1fr columns: computed gridTemplateColumns resolves to px, not "1fr".
      // Detect via the style attribute instead.
      const styleAttr = el.getAttribute('style') ?? ''
      if (styleAttr.includes('1fr 1fr') || styleAttr.includes("'1fr 1fr'")) {
        const gap = parseFloat(s.columnGap || s.gap || '0')
        if (!isNaN(gap) && gap !== 6) {
          findings.push({
            rule: 'gridGaps',
            severity: 'warn',
            message: `2×1fr grid med gap ${gap}px (förväntat 6px)`,
            selector: cssPath(el),
            actual: `gap: ${gap}px`,
            expected: 'gap: 6px',
            screenPath,
          })
        }
      }
    }

    // Flex column with gap > 6px
    if (s.display === 'flex' && s.flexDirection === 'column') {
      const gap = parseFloat(s.gap || s.rowGap || '0')
      if (!isNaN(gap) && gap > 6) {
        findings.push({
          rule: 'gridGaps',
          severity: 'warn',
          message: `Flex-column med gap ${gap}px (förväntat 4-6px)`,
          selector: cssPath(el),
          actual: `gap: ${gap}px`,
          expected: 'gap: 4-6px',
          screenPath,
        })
      }
    }
  }

  return findings
}
