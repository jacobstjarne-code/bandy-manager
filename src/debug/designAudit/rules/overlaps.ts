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

function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return false
  const s = getComputedStyle(el)
  // Explicit utestängning bara — en OSATT opacity ger jsdom tom sträng
  // (Number('') är 0), inte webbläsarens implicita 1. Number(s.opacity)>0
  // hade därför osynliggjort varje element utan explicit inline-opacity.
  if (s.visibility === 'hidden' || s.display === 'none') return false
  if (s.opacity === '0') return false
  return true
}

function rectsOverlap(a: DOMRect, b: DOMRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

function hasOwnText(el: Element): boolean {
  return Array.from(el.childNodes).some(n => n.nodeType === 3 && !!n.textContent?.trim())
}

/**
 * design-b4-simulera-bar-fotkrock (2026-09-04): en fast bottenrad (t.ex.
 * Portalens sticky CTA-container, `position:fixed` med `bottom` ankrad)
 * kan visuellt täcka det sista innehållet i det vanliga scroll-flödet
 * OVANFÖR den, om `paddingBottom` inte täcker barens faktiska höjd. Se
 * PortalScreen.tsx:s `ctaRef`+`ResizeObserver`-mönster för hur det löses.
 *
 * Opt-in via `data-fixed-bottom-bar` — en blank geometrisk svep över VARJE
 * `position:fixed`-element i hela appen hade gett falska larm på BottomNav,
 * modaler och overlays som SKA ligga ovanpå innehåll (de är avsiktligt
 * inte "innehåll som blockeras", de är chrome). Bara element som
 * uttryckligen markerar sig som en bottenrad som INTE ska täcka innehåll
 * granskas här.
 */
function runBottomBarOverlap(root: HTMLElement): Finding[] {
  const findings: Finding[] = []
  const screenPath = window.location.pathname
  const bars = root.querySelectorAll('[data-fixed-bottom-bar]')

  for (const bar of bars) {
    const barRect = bar.getBoundingClientRect()
    const candidates = root.querySelectorAll('*')
    for (const el of candidates) {
      if (bar === el || bar.contains(el) || el.contains(bar)) continue
      if (el.closest('[data-fixed-bottom-bar]')) continue
      if (el.closest('[data-dev-nav]')) continue // dev-scenskalet, se CLAUDE.md
      if (!hasOwnText(el)) continue
      if (!isVisible(el)) continue
      if (rectsOverlap(barRect, el.getBoundingClientRect())) {
        findings.push({
          rule: 'overlaps',
          severity: 'error',
          message: 'Fast bottenrad (data-fixed-bottom-bar) täcker synligt innehåll — design-b4-klassen',
          selector: cssPath(el),
          actual: `bartop=${Math.round(barRect.top)}`,
          expected: 'paddingBottom på scroll-behållaren ska täcka barens uppmätta höjd (PortalScreen.tsx ctaHeight-mönstret)',
          screenPath,
        })
        break // en träff per bar räcker, undvik brus från syskon i samma rad
      }
    }
  }

  return findings
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

  findings.push(...runBottomBarOverlap(root))
  return findings
}
