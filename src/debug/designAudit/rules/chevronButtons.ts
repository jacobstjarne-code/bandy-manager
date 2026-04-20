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

export function runChevronButtons(root: HTMLElement): Finding[] {
  const findings: Finding[] = []
  const screenPath = window.location.pathname
  const buttons = root.querySelectorAll('button')

  for (const btn of buttons) {
    if (btn.textContent?.trim() !== '›') continue

    const s = getComputedStyle(btn)
    const w = parseFloat(s.width)
    const h = parseFloat(s.height)
    const br = parseFloat(s.borderRadius)
    const selector = cssPath(btn)
    const actual: string[] = []
    const expected: string[] = []

    if (!isNaN(w) && Math.round(w) !== 16) {
      actual.push(`width: ${w}px`)
      expected.push('width: 16px')
    }
    if (!isNaN(h) && Math.round(h) !== 16) {
      actual.push(`height: ${h}px`)
      expected.push('height: 16px')
    }
    if (!isNaN(br) && Math.round(br) !== 4) {
      actual.push(`border-radius: ${br}px`)
      expected.push('border-radius: 4px')
    }

    if (actual.length > 0) {
      findings.push({
        rule: 'chevronButtons',
        severity: 'error',
        message: `›-knapp avviker från spec (${actual.join(', ')})`,
        selector,
        actual: actual.join(', '),
        expected: expected.join(', '),
        screenPath,
      })
    }
  }

  return findings
}
