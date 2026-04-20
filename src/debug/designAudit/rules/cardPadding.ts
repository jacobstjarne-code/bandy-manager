import type { Finding } from '../types'

function cssPath(el: Element): string {
  const parts: string[] = []
  let cur: Element | null = el
  while (cur && cur.tagName !== 'BODY') {
    let seg = cur.tagName.toLowerCase()
    if (cur.id) {
      seg += '#' + cur.id
      parts.unshift(seg)
      break
    }
    const cls = Array.from(cur.classList).slice(0, 2)
    if (cls.length) seg += '.' + cls.join('.')
    const parent = cur.parentElement
    if (parent) {
      const idx = Array.from(parent.children).indexOf(cur)
      seg += `:nth-child(${idx + 1})`
    }
    parts.unshift(seg)
    cur = cur.parentElement
  }
  return parts.slice(-3).join(' > ')
}

function getPadding(el: Element): string {
  const s = getComputedStyle(el)
  return `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`
}

// Normalise "10px 12px 10px 12px" → "10px 12px", "8px 8px 8px 8px" → "8px" etc.
function normalisePadding(raw: string): string {
  const [t, r, b, l] = raw.split(' ')
  if (t === b && r === l) {
    if (t === r) return t
    return `${t} ${r}`
  }
  if (r === l) return `${t} ${r} ${b}`
  return raw
}

// Keys that appear in className and signal a legitimate non-card border-radius use
const ALLOWED_CLASSES = ['btn', 'tab', 'pill', 'nudge', 'bar', 'cta', 'phase', 'pitch', 'tag', 'badge']

function hasAllowedClass(el: Element): boolean {
  const cls = el.className ?? ''
  return ALLOWED_CLASSES.some(k => cls.includes(k))
}

function isInsideSvg(el: Element): boolean {
  let cur: Element | null = el
  while (cur) {
    if (cur.tagName === 'svg' || cur.tagName === 'SVG') return true
    cur = cur.parentElement
  }
  return false
}

export function runCardPadding(root: HTMLElement): Finding[] {
  const findings: Finding[] = []
  const screenPath = window.location.pathname

  // 4.1a card-sharp padding
  const sharps = root.querySelectorAll('.card-sharp')
  for (const el of sharps) {
    const norm = normalisePadding(getPadding(el))
    if (norm !== '10px 12px' && norm !== '7px 10px') {
      findings.push({
        rule: 'cardPadding',
        severity: 'error',
        message: `card-sharp med padding ${norm} (förväntat 10px 12px eller 7px 10px)`,
        selector: cssPath(el),
        actual: norm,
        expected: '10px 12px eller 7px 10px',
        screenPath,
      })
    }
  }

  // 4.1b card-round padding
  const rounds = root.querySelectorAll('.card-round')
  for (const el of rounds) {
    const norm = normalisePadding(getPadding(el))
    if (norm !== '8px 12px') {
      findings.push({
        rule: 'cardPadding',
        severity: 'error',
        message: `card-round med padding ${norm} (förväntat 8px 12px)`,
        selector: cssPath(el),
        actual: norm,
        expected: '8px 12px',
        screenPath,
      })
    }
  }

  // 4.1c inline borderRadius on non-card elements
  const all = root.querySelectorAll('[style]')
  for (const el of all) {
    const styleAttr = el.getAttribute('style') ?? ''
    if (!styleAttr.includes('borderRadius') && !styleAttr.includes('border-radius')) continue
    if (isInsideSvg(el)) continue
    if (el.getAttribute('data-allow-hex') === 'true') continue
    if (el.classList.contains('card-sharp') || el.classList.contains('card-round')) continue
    if (hasAllowedClass(el)) continue
    // Extract the borderRadius value for the message
    const match = styleAttr.match(/border-?[Rr]adius:\s*([^;]+)/)
    const val = match ? match[1].trim() : 'unknown'
    // Skip circular elements (borderRadius: 50%) and pill-radius patterns (9999)
    if (val === '50%' || val.includes('9999')) continue
    findings.push({
      rule: 'cardPadding',
      severity: 'warn',
      message: `Inline borderRadius på okänd komponent`,
      selector: cssPath(el),
      actual: `borderRadius: ${val}`,
      expected: 'använd card-sharp eller card-round',
      screenPath,
    })
  }

  return findings
}
