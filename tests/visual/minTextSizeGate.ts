import type { Page } from '@playwright/test'

/**
 * Minsta textstorlek-grinden (M5, mobil speltest-audit).
 *
 * Ingen befintlig grind mätte ABSOLUT textstorlek — contrastGate.ts mäter
 * text-mot-bakgrund-kontrast (kan vara stor OCH oläsbar av kontrastskäl),
 * tapTargetOverlap.ts mäter fri yta mellan kontroller (kan vara stor OCH ha
 * 6px text inuti). Auditens fynd (M5): flera sekundära etiketter/metadata-
 * rader renderas under 12px på en 375-390px-skärm, läsbart på en simulator
 * men inte på ett riktigt device i dagsljus. Samma "mät, gissa inte"-metod
 * som de två andra: gå igenom varje SYNLIG text-bärande leaf (samma
 * leaf-definition som contrastGate.ts — element med egna, direkta text-
 * noder, inte bara ärvd text via barn) inom scope, läs computed font-size,
 * jämför mot golvet.
 *
 * Golv: 12px. Auditens egen siffra (mindre än så är i praktiken oläsbart
 * utan att zooma, oavsett kontrast). Ingen skillnad "normal vs large text"
 * här som i WCAG-kontrastformeln — det här är ett absolut golv, inte en
 * kontrastkompensation.
 *
 * Escape-hatch: `[data-text-size-exempt="anledning"]`, samma mönster som
 * `[data-contrast-exempt]` — en granskningsbar, sökbar undantagslista på
 * det EXAKTA elementet, inte en tyst tröskel i grinden själv.
 */

const MIN_FONT_PX = 12

export interface TextSizeViolation {
  message: string
}

export interface TextSizeCheckResult {
  violations: TextSizeViolation[]
  exempted: string[]
}

export async function findTextSizeViolations(
  page: Page,
  scopeSelector = '[data-scene-content]',
): Promise<TextSizeCheckResult> {
  return page.evaluate(({ scopeSelector, MIN_FONT_PX }) => {
    const scope = document.querySelector(scopeSelector) ?? document.body

    function label(el: Element): string {
      const text = (el.textContent ?? '').trim().slice(0, 30)
      return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${text ? ` "${text}"` : ''}`
    }

    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT)
    let node: Node | null = scope
    const leaves: Element[] = []
    while (node) {
      const el = node as Element
      // SVG-text styrs av andra attribut (font-size kan sitta på <text>
      // direkt, men det är samma bortre-scope-motivering som contrastGate.ts
      // — ett annat verktyg än det här.
      if (el.namespaceURI === 'http://www.w3.org/2000/svg') { node = walker.nextNode(); continue }
      const hasDirectText = Array.from(el.childNodes).some(
        n => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0,
      )
      if (hasDirectText) {
        const cs = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        if (cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0) {
          leaves.push(el)
        }
      }
      node = walker.nextNode()
    }

    const violations: { message: string }[] = []
    const exempted: string[] = []

    for (const el of leaves) {
      const exemptEl = el.closest('[data-text-size-exempt]')
      if (exemptEl) {
        exempted.push(`${label(el)} — ${exemptEl.getAttribute('data-text-size-exempt')}`)
        continue
      }
      const cs = getComputedStyle(el)
      const px = parseFloat(cs.fontSize)
      if (Number.isNaN(px)) continue
      if (px < MIN_FONT_PX) {
        violations.push({
          message: `${label(el)} — ${px}px, kräver minst ${MIN_FONT_PX}px`,
        })
      }
    }

    return { violations, exempted }
  }, { scopeSelector, MIN_FONT_PX })
}
