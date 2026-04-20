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

const EMOJI_RE = /^\p{Extended_Pictographic}/u

export function runSectionLabels(root: HTMLElement): Finding[] {
  const findings: Finding[] = []
  const screenPath = window.location.pathname
  const all = root.querySelectorAll('*')

  for (const el of all) {
    if (el.tagName === 'BUTTON') continue
    const s = getComputedStyle(el)
    if (s.textTransform !== 'uppercase') continue
    const ls = parseFloat(s.letterSpacing)
    if (isNaN(ls) || ls < 1.5) continue

    // This looks like a section label — check compliance
    const fs = parseFloat(s.fontSize)
    // Skip screen headings (fontSize > 10px are headings, not section labels)
    if (!isNaN(fs) && fs > 10) continue
    const fw = parseFloat(s.fontWeight)
    const selector = cssPath(el)
    const text = el.textContent?.trim() ?? ''

    if (!isNaN(fs) && fs !== 8) {
      findings.push({
        rule: 'sectionLabels',
        severity: 'error',
        message: `Sektions-label fontSize ${fs}px (förväntat 8px)`,
        selector,
        actual: `fontSize: ${fs}px`,
        expected: 'fontSize: 8px',
        screenPath,
      })
    }

    if (!isNaN(ls) && ls !== 2) {
      findings.push({
        rule: 'sectionLabels',
        severity: 'error',
        message: `Sektions-label letterSpacing ${ls}px (förväntat 2px)`,
        selector,
        actual: `letterSpacing: ${ls}px`,
        expected: 'letterSpacing: 2px',
        screenPath,
      })
    }

    if (!isNaN(fw) && fw < 600) {
      findings.push({
        rule: 'sectionLabels',
        severity: 'error',
        message: `Sektions-label fontWeight ${fw} (förväntat >= 600)`,
        selector,
        actual: `fontWeight: ${fw}`,
        expected: 'fontWeight >= 600',
        screenPath,
      })
    }

    if (text && !EMOJI_RE.test(text)) {
      findings.push({
        rule: 'sectionLabels',
        severity: 'warn',
        message: `Sektions-label utan emoji i början: "${text.slice(0, 30)}"`,
        selector,
        actual: text.slice(0, 50),
        expected: 'börja med emoji (t.ex. 💰 EKONOMI)',
        screenPath,
      })
    }
  }

  return findings
}
