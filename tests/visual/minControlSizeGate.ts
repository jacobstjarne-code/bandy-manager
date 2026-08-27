import type { Page } from '@playwright/test'

/**
 * Minsta träffyta-grinden (M5, mobil speltest-audit).
 *
 * Skiljer sig från tapTargetOverlap.ts: den grinden mäter fri yta MELLAN
 * kontroller (kan vara god marginal runt en 20x20px-knapp — inget klipp,
 * ändå för liten att träffa säkert med tumme). Den här grinden mäter
 * kontrollens EGEN bounding box mot WCAG 2.5.5/HIG-tumregeln: minst 44x44
 * CSS-px. Två olika felklasser, två olika grindar — samma motiv som redan
 * etablerat (tapTargetGate.visual.ts:s filkommentar).
 *
 * Samma interaktiva selector som tapTargetOverlap.ts, för att hålla de två
 * grindarnas begrepp om "vad är en kontroll" identiskt (annars kan de två
 * grindarna tyst börja mäta olika elementmängder över tid).
 *
 * Undantag, medvetet, inte gissade:
 * - Inline-länkar i löptext (`display: inline`, ingen egen padding) —
 *   WCAG 2.5.5 undantar uttryckligen länkar som sitter i ett meningsflöde
 *   (target-storleken är då läsarens hela textrad, inte länkens egen box).
 *   En textlänk i en paragraf är inte samma riskklass som en fristående
 *   knapp.
 * - `[data-control-size-exempt="anledning"]`, samma sökbara mönster som de
 *   andra två grindarnas escape-hatch.
 */

const MIN_SIZE = 44

export interface ControlSizeViolation {
  message: string
}

export interface ControlSizeCheckResult {
  violations: ControlSizeViolation[]
  exempted: string[]
}

export async function findControlSizeViolations(
  page: Page,
  scopeSelector = '[data-scene-content]',
): Promise<ControlSizeCheckResult> {
  return page.evaluate(({ scopeSelector, MIN_SIZE }) => {
    const scope = document.querySelector(scopeSelector) ?? document.body
    const selector = 'button, a[href], [role="button"], input, select, textarea'
    const candidates = Array.from(scope.querySelectorAll(selector))

    function label(el: Element): string {
      const text = (el.textContent ?? '').trim().slice(0, 40)
      return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${text ? ` "${text}"` : ''}`
    }

    function isVisible(el: Element): boolean {
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none') return false
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    }

    // En <a> som flyter i löptext (inline, ingen egen padding) är en
    // textlänk, inte en fristående knapp — WCAG 2.5.5:s eget undantag.
    function isInlineTextLink(el: Element): boolean {
      if (el.tagName !== 'A') return false
      const cs = getComputedStyle(el)
      if (cs.display !== 'inline') return false
      const pad = ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight']
        .every(k => parseFloat((cs as unknown as Record<string, string>)[k]) === 0)
      return pad
    }

    const violations: { message: string }[] = []
    const exempted: string[] = []

    for (const el of candidates) {
      if (!isVisible(el)) continue
      const exemptEl = el.closest('[data-control-size-exempt]')
      if (exemptEl) {
        exempted.push(`${label(el)} — ${exemptEl.getAttribute('data-control-size-exempt')}`)
        continue
      }
      if (isInlineTextLink(el)) continue

      const r = el.getBoundingClientRect()
      if (r.width < MIN_SIZE || r.height < MIN_SIZE) {
        violations.push({
          message: `${label(el)} — ${Math.round(r.width)}x${Math.round(r.height)}px, kräver minst ${MIN_SIZE}x${MIN_SIZE}px`,
        })
      }
    }

    return { violations, exempted }
  }, { scopeSelector, MIN_SIZE })
}
