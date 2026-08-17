import type { Page } from '@playwright/test'

/**
 * Tap-target-overlap-grinden (mobil speltest-audit, 2026-08-17).
 *
 * Rotorsak i metoden, inte bara buggen: Playwright klickar via element (CDP
 * hittar rätt nod direkt), en människa trycker på en KOORDINAT. Snapshot-
 * testerna verifierar att pixlar RITAS rätt. Ingen av de tre lagren någonsin
 * frågat: ligger något ÖVER det jag ska trycka på? Overlap är inte overflow.
 *
 * SÄTT LAGET-fyndet (MatchLaddningBand.tsx): en sticky CTA satt bara 2px fri
 * kant ovanför bottennavigationen på ett verkligt device — en tumträff
 * landade på Tabell-fliken istf CTA:n. Grinden här generaliserar kontrollen:
 * hämta bounding box för varje interaktivt element, kräv minst 44px fri yta
 * (WCAG/HIG-tumregeln för träffprecision) mot (a) bottennavigationen, om den
 * renders i scenen, och (b) andra interaktiva element i botten-bandet av
 * viewporten (sticky CTA:er som riskerar överlappa varandra).
 *
 * KÄND BEGRÄNSNING (rapporterad, inte dold): /dev/scenes-skalet (Dev-
 * ScenesScreen.tsx) renderar INTE BottomNav för något av sina 76 befintliga
 * scener — bara den nya navgate-laddning-band-scenen gör det (se dess
 * kommentar i DevScenesScreen.tsx). Check (a) nedan är därför bara verksam
 * där [data-bottom-nav] faktiskt finns i DOM:en — för de andra 75 scenerna
 * körs bara check (b). Detta är EN ÄKTA TÄCKNINGSLUCKA, inte ett kryphål
 * grinden gömmer: scener som i produktion skulle visa en persistent
 * bottennav (dashboard, trupp, match, tabell, transfers, klubb, taktik,
 * granska) kan i dagens skal inte nav-kollisions-testas alls. Att bredda
 * skalet till att rendera en äkta BottomNav för de scenerna är en separat,
 * större ändring (breder baseline-omritning för samtliga träffade scener)
 * och byggs inte i denna runda — flaggat i rapporten till Jacob.
 */

const MIN_CLEARANCE = 44
const OVERLAP_TOLERANCE = 4 // "mer än några pixlar" — brus från sub-pixel-rendering, inte en riktig kollision
const BOTTOM_BAND_FRACTION = 0.2 // nedersta 20% av viewporten — där sticky CTA:er och nav faktiskt bor

interface Rect { top: number; bottom: number; left: number; right: number }

interface InteractiveEl {
  rect: Rect
  label: string
  isNav: boolean
}

function overlaps(a: Rect, b: Rect): number {
  // Positivt tal = hur många px de överlappar VERTIKALT (0 om de inte gör det).
  const top = Math.max(a.top, b.top)
  const bottom = Math.min(a.bottom, b.bottom)
  return Math.max(0, bottom - top)
}

function horizontallyOverlaps(a: Rect, b: Rect): boolean {
  return a.left < b.right && b.left < a.right
}

function verticalGap(a: Rect, b: Rect): number {
  // Positivt = fri yta mellan dem (a ovanför b eller tvärtom). Negativt = overlap.
  if (a.bottom <= b.top) return b.top - a.bottom
  if (b.bottom <= a.top) return a.top - b.bottom
  return -overlaps(a, b)
}

export interface TapTargetViolation {
  message: string
}

export async function findTapTargetViolations(
  page: Page,
  scopeSelector = '[data-scene-content]',
): Promise<TapTargetViolation[]> {
  const viewport = page.viewportSize()
  if (!viewport) return []
  const bottomBandTop = viewport.height * (1 - BOTTOM_BAND_FRACTION)

  const raw = await page.evaluate(({ scopeSelector }) => {
    const scope = document.querySelector(scopeSelector) ?? document.body
    const nav = document.querySelector('[data-bottom-nav]')
    const selector = 'button, a[href], [role="button"], input, select, textarea'
    const candidates = new Set<Element>(scope.querySelectorAll(selector))
    if (nav) candidates.add(nav)

    function isVisible(el: Element): boolean {
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none') return false
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    }

    function label(el: Element): string {
      const text = (el.textContent ?? '').trim().slice(0, 40)
      return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${text ? ` "${text}"` : ''}`
    }

    // "Sticky CTA" = elementet SJÄLVT eller någon förälder (upp till scope)
    // har computed position fixed/sticky. Det här är den semantiska
    // definitionen — INTE "råkar rendera nära botten av en lång, scrollbar
    // sida" (chip-rutnät, träningsknappar), som tidigare gav falska larm.
    function isFixedOrSticky(el: Element): boolean {
      let node: Element | null = el
      while (node && node !== scope.parentElement) {
        const pos = getComputedStyle(node).position
        if (pos === 'fixed' || pos === 'sticky') return true
        node = node.parentElement
      }
      return false
    }

    const out: { rect: DOMRect; label: string; isNav: boolean; isDescendantOfNav: boolean; isStickyCta: boolean }[] = []
    for (const el of candidates) {
      if (!isVisible(el)) continue
      out.push({
        rect: el.getBoundingClientRect(),
        label: label(el),
        isNav: el === nav,
        isDescendantOfNav: !!nav && nav !== el && nav.contains(el),
        isStickyCta: el !== nav && isFixedOrSticky(el),
      })
    }
    return out
  }, { scopeSelector })

  const elements: (InteractiveEl & { isDescendantOfNav: boolean; isStickyCta: boolean })[] = raw.map(r => ({
    rect: { top: r.rect.top, bottom: r.rect.bottom, left: r.rect.left, right: r.rect.right },
    label: r.label,
    isNav: r.isNav,
    isDescendantOfNav: r.isDescendantOfNav,
    isStickyCta: r.isStickyCta,
  }))

  const violations: TapTargetViolation[] = []
  const navEl = elements.find(e => e.isNav)

  // Check A — bottennavigationen vs varje annat interaktivt element.
  if (navEl) {
    for (const el of elements) {
      if (el.isNav || el.isDescendantOfNav) continue
      if (!horizontallyOverlaps(el.rect, navEl.rect)) continue
      const gap = verticalGap(el.rect, navEl.rect)
      if (gap < 0 && -gap > OVERLAP_TOLERANCE) {
        violations.push({ message: `${el.label} överlappas av bottennavigationen med ${Math.round(-gap)}px` })
      } else if (gap >= 0 && gap < MIN_CLEARANCE) {
        violations.push({ message: `${el.label} har bara ${Math.round(gap)}px fri kant mot bottennavigationen (kräver ${MIN_CLEARANCE}px)` })
      }
    }
  }

  // Check B — en äkta sticky/fixed CTA (computed position, inte "råkar
  // rendera i botten-bandet") mot VILKET ANNAT interaktivt element som helst
  // den delar horisontellt utrymme med. Kräver att MINST ETT av paret är
  // isStickyCta — annars flödar två ordinära, tätt packade knappar i en
  // rullbar lista (chip-rutnät, träningsknappar) in som falska larm, vilket
  // hände i den första versionen av den här grinden (21/52 scener, mest
  // brus). En vanlig lista av tappbara rader med normal radhöjd är etablerad,
  // accepterad mobil-UX — inte samma riskklass som en CTA som konkurrerar
  // med osläkt, beständig navigation.
  const bottomBand = elements.filter(e => e.rect.bottom > bottomBandTop && !e.isDescendantOfNav && !e.isNav)
  const reportedPairs = new Set<string>()
  for (let i = 0; i < bottomBand.length; i++) {
    for (let j = i + 1; j < bottomBand.length; j++) {
      const a = bottomBand[i]
      const b = bottomBand[j]
      if (!a.isStickyCta && !b.isStickyCta) continue
      if (!horizontallyOverlaps(a.rect, b.rect)) continue
      const key = `${a.label}|${b.label}`
      if (reportedPairs.has(key)) continue
      reportedPairs.add(key)
      const gap = verticalGap(a.rect, b.rect)
      if (gap < 0 && -gap > OVERLAP_TOLERANCE) {
        violations.push({ message: `${a.label} överlappar ${b.label} med ${Math.round(-gap)}px` })
      } else if (gap >= 0 && gap < MIN_CLEARANCE) {
        violations.push({ message: `${a.label} har bara ${Math.round(gap)}px fri kant mot ${b.label} (kräver ${MIN_CLEARANCE}px)` })
      }
    }
  }

  return violations
}
