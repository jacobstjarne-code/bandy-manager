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

function hasScrollAncestor(el: Element): boolean {
  let cur = el.parentElement
  while (cur && cur !== document.body) {
    const s = getComputedStyle(cur)
    if (s.overflowY === 'auto' || s.overflowY === 'scroll') return true
    cur = cur.parentElement
  }
  return false
}

function isInsideCardSharp(el: Element): boolean {
  let cur = el.parentElement
  while (cur && cur !== document.body) {
    if (cur.classList.contains('card-sharp')) return true
    cur = cur.parentElement
  }
  return false
}

export function runOverlaps(root: HTMLElement): Finding[] {
  const findings: Finding[] = []
  const screenPath = window.location.pathname
  const all = root.querySelectorAll('*')

  for (const el of all) {
    const s = getComputedStyle(el)
    if (s.position !== 'sticky') continue
    if (!hasScrollAncestor(el)) continue
    if (!isInsideCardSharp(el)) continue

    findings.push({
      rule: 'overlaps',
      severity: 'warn',
      message: 'position:sticky inuti overflow-y:auto och card-sharp — möjlig LESSONS #9',
      selector: cssPath(el),
      actual: 'position: sticky',
      expected: 'normal flow inuti scroll-container (LESSONS.md #9)',
      screenPath,
    })
  }

  return findings
}
