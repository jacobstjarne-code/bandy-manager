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

export function runFontSizes(root: HTMLElement): Finding[] {
  const findings: Finding[] = []
  const screenPath = window.location.pathname
  const all = root.querySelectorAll('*')

  for (const el of all) {
    // Skip elements with no text content of their own
    if (!el.childNodes.length) continue
    const hasDirectText = Array.from(el.childNodes).some(
      n => n.nodeType === Node.TEXT_NODE && (n.textContent?.trim() ?? '').length > 0
    )
    if (!hasDirectText) continue

    const s = getComputedStyle(el)
    const fs = parseFloat(s.fontSize)
    if (isNaN(fs)) continue

    // 4.7a font-size < 8px → error
    if (fs < 8) {
      findings.push({
        rule: 'fontSizes',
        severity: 'error',
        message: `Font-size ${fs}px är under minimum 8px`,
        selector: cssPath(el),
        actual: `fontSize: ${fs}px`,
        expected: 'fontSize >= 8px',
        screenPath,
      })
      continue
    }

    // 4.7b font-size 9-10px + uppercase + letterSpacing > 1px → trolig fel sektions-label
    if (fs >= 9 && fs <= 10 && s.textTransform === 'uppercase') {
      const ls = parseFloat(s.letterSpacing)
      if (!isNaN(ls) && ls > 1) {
        findings.push({
          rule: 'fontSizes',
          severity: 'warn',
          message: `Sektions-label med fontSize ${fs}px (troligen ska vara 8px)`,
          selector: cssPath(el),
          actual: `fontSize: ${fs}px, textTransform: uppercase, letterSpacing: ${ls}px`,
          expected: 'fontSize: 8px för sektions-labels',
          screenPath,
        })
      }
    }
  }

  return findings
}
