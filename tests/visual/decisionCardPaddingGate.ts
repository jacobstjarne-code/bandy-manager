import type { Page } from '@playwright/test'

/**
 * DecisionCard-dubbelpadding-grinden (åtgärdslistans post 7/21, 2026-08-19).
 *
 * Å7 (`97d26cfd`) fixade EN instans: det skarpa DecisionCard-skalet lade
 * 10px 12px inuti en redan padded `card-sharp`. Post 21 namnger "sex
 * DecisionCard-lägen" — de sex faktiska anropsställena (grep-bekräftat,
 * 2026-08-19): fyra i GranskaOversikt.tsx (criticalEvents/pressConference/
 * csPress/refereeMeeting), ett i GranskaSpelare.tsx (KRING SPELARNA,
 * shape="none"), ett i EventOverlay.tsx (shape="round"). Alla sex verifierat
 * fria från dubbelpadding VID BYGGTILLFÄLLET (2026-08-19) — grinden här
 * finns för att den håller sig så, inte för att fixa ett aktuellt fel.
 *
 * Metod: DecisionCard.tsx:s rot (shape!=='none') bär `data-decision-card`.
 * För varje sådant element — om FÖRÄLDERN också har icke-noll padding PÅ
 * ALLA FYRA SIDOR (samma mönster Å7 diagnosticerade: en padded card-sharp
 * inuti en padded card-sharp) OCH DecisionCard-elementet är förälderns ENDA
 * betydande barn (annars är förälderns padding motiverad av ANNAT innehåll,
 * inte en omslutning specifikt kring detta kort) — flagga.
 *
 * `shape="none"` (GranskaSpelare) har ingen egen padding och saknar
 * `data-decision-card` helt — den FÖRUTSÄTTER en padded förälder (det är
 * hela poängen med `shape="none"`, se DecisionCard.tsx:s docstring), så den
 * ingår inte i denna grind (inget dubbelpaddings-scenario är möjligt där).
 */

export interface DecisionCardPaddingViolation {
  message: string
}

export async function findDecisionCardPaddingViolations(
  page: Page,
  scopeSelector = '[data-scene-content]',
): Promise<DecisionCardPaddingViolation[]> {
  return page.evaluate(scopeSelector => {
    const scope = document.querySelector(scopeSelector) ?? document.body
    const cards = Array.from(scope.querySelectorAll('[data-decision-card]'))
    const out: { message: string }[] = []

    function hasPaddingAllSides(el: Element): boolean {
      const cs = getComputedStyle(el)
      return parseFloat(cs.paddingTop) > 0 && parseFloat(cs.paddingBottom) > 0
        && parseFloat(cs.paddingLeft) > 0 && parseFloat(cs.paddingRight) > 0
    }

    function isOnlySignificantChild(parent: Element, child: Element): boolean {
      const siblings = Array.from(parent.children).filter(el => el !== child)
      // "Betydande" = tar synlig plats. Whitespace-only textnoder räknas inte
      // (children är redan bara Element, inga textnoder) — en tom decorativ
      // <span> (t.ex. en ikon-bullet) ska inte diskvalificera checken.
      const significant = siblings.filter(el => {
        const r = el.getBoundingClientRect()
        return r.width > 4 && r.height > 4
      })
      return significant.length === 0
    }

    for (const card of cards) {
      const parent = card.parentElement
      if (!parent || parent === scope) continue
      if (!hasPaddingAllSides(parent)) continue
      if (!isOnlySignificantChild(parent, card)) continue
      const label = (card.textContent ?? '').trim().slice(0, 30)
      out.push({
        message: `DecisionCard "${label}" sitter i en padded förälder (${parent.tagName.toLowerCase()}.${parent.className.toString().split(' ')[0]}) — dubbelpadding`,
      })
    }
    return out
  }, scopeSelector)
}
