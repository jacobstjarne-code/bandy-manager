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

function isInsideSvg(el: Element): boolean {
  let cur: Element | null = el
  while (cur) {
    if (cur.tagName === 'svg' || cur.tagName === 'SVG') return true
    cur = cur.parentElement
  }
  return false
}

const HEX_RE = /#[0-9a-fA-F]{3,8}/g

export function runHexColors(root: HTMLElement): Finding[] {
  const findings: Finding[] = []
  const screenPath = window.location.pathname
  const all = root.querySelectorAll('[style]')

  for (const el of all) {
    if (isInsideSvg(el)) continue
    if (el.getAttribute('data-allow-hex') === 'true') continue

    const styleAttr = el.getAttribute('style') ?? ''
    const matches = styleAttr.match(HEX_RE)
    if (!matches) continue

    findings.push({
      rule: 'hexColors',
      severity: 'error',
      message: `Hårdkodad hex-färg: ${matches.join(', ')}`,
      selector: cssPath(el),
      actual: matches.join(', '),
      expected: 'CSS-variabel (t.ex. var(--accent))',
      screenPath,
    })
  }

  return findings
}
