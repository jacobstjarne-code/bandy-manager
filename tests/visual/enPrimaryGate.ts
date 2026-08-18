import type { Page } from '@playwright/test'

/**
 * En-primär-grinden (åtgärdslistans post 18, 2026-08-19).
 *
 * Regeln är redan husets egen (`design-system/README.md`, CLAUDE.md: "En
 * .btn-primary per skärm, max") — den var bara aldrig mätt automatiskt. Å3
 * (Portal: `SMFinalPrimary.tsx` OCH `PortalScreen.tsx` hade var sin egen
 * `.btn-primary`) och Å4 (Marknad: `primaryChoiceId="accept"` ovillkorligt
 * satt gjorde att TRE `IncomingBidCard` blev primära samtidigt) är samma
 * felklass, hittade manuellt. Grinden här generaliserar kontrollen så nästa
 * instans fångas i CI, inte i playtest.
 *
 * Metod: räkna SYNLIGA `.btn-primary`-element inom scope. `> 1` är en
 * kränkning — noll är helt legitimt (många skärmar har ingen primär-CTA
 * alls). "Synlig" = inte `display:none`/`visibility:hidden`/noll storlek —
 * SAMMA definition som `tapTargetOverlap.ts` redan använder, ingen ny
 * synlighetslogik uppfunnen.
 */

export interface EnPrimaryViolation {
  message: string
}

export async function findEnPrimaryViolations(
  page: Page,
  scopeSelector = '[data-scene-content]',
): Promise<EnPrimaryViolation[]> {
  const labels = await page.evaluate(({ scopeSelector }) => {
    const scope = document.querySelector(scopeSelector) ?? document.body
    const candidates = Array.from(scope.querySelectorAll('.btn-primary'))

    function isVisible(el: Element): boolean {
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') return false
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    }

    function label(el: Element): string {
      const text = (el.textContent ?? '').trim().slice(0, 40)
      return `${el.tagName.toLowerCase()}${text ? ` "${text}"` : ''}`
    }

    return candidates.filter(isVisible).map(label)
  }, { scopeSelector })

  if (labels.length <= 1) return []
  return [{
    message: `${labels.length} synliga .btn-primary samtidigt (max 1): ${labels.join(' | ')}`,
  }]
}
