import type { Page } from '@playwright/test'

/**
 * Kontrastgrinden (åtgärdslistans post 17, 2026-08-18).
 *
 * Rotorsaken post 17 fångar (Å1, `52a1fc30`): `EventPrimary.tsx` använde
 * `--text-light`/`--text-light-secondary` — tokens avsedda för MÖRK
 * bakgrund — på ett LJUST `card-sharp`-skal. Kontrast ~1,06:1, i praktiken
 * osynlig text på portalens mest kritiska kort. Ingen befintlig grind mätte
 * text-mot-bakgrund-kontrast; snapshot-testerna verifierar bara att pixlar
 * RITAS rätt, inte att de går att LÄSA.
 *
 * Scope: `[data-primary-card]` — de nio Portal-Primary-varianterna
 * (`src/presentation/components/portal/primary/*.tsx`), samma familj som
 * Å1-bugen tillhörde. Attributet lades till på alla nio rot-wrappers i
 * samma commit som denna fil, uteslutande för att ge grinden en stabil,
 * avsiktlig hake — de nio komponenterna delade tidigare ingen gemensam
 * klass (card-sharp/card--portal/primary-card/inline-style, fyra olika
 * mönster), så ett generiskt CSS-selektor-baserat scope var inte möjligt
 * utan att antingen missa några eller träffa fel element.
 *
 * Metod: WCAG 2.1-formeln (relativ luminans, kontrastkvot). Varje synlig
 * text-bärande element inom ett `[data-primary-card]`-skal jämförs mot sin
 * EFFEKTIVA bakgrund (närmaste förfader — inklusive skalet självt — med en
 * icke-transparent `background-color`; en gradient/bild-bakgrund kan inte
 * mätas i pixlar via getComputedStyle, så sådana element hoppas över med en
 * anteckning i stället för att gissa — se `unmeasurable` nedan). Tröskel:
 * 4.5:1 för normal text, 3:1 för "large text" (WCAG-definitionen: ≥24px,
 * eller ≥18.66px vid font-weight ≥700).
 */

const NORMAL_THRESHOLD = 4.5
const LARGE_THRESHOLD = 3.0
const LARGE_TEXT_PX = 24
const LARGE_BOLD_TEXT_PX = 18.66
const LARGE_BOLD_WEIGHT = 700

export interface ContrastViolation {
  message: string
}

export interface ContrastCheckResult {
  violations: ContrastViolation[]
  unmeasurable: string[]
  exempted: string[]
}

export async function findContrastViolations(
  page: Page,
  scopeSelector = '[data-scene-content]',
): Promise<ContrastCheckResult> {
  return page.evaluate(({ scopeSelector, NORMAL_THRESHOLD, LARGE_THRESHOLD, LARGE_TEXT_PX, LARGE_BOLD_TEXT_PX, LARGE_BOLD_WEIGHT }) => {
    const scope = document.querySelector(scopeSelector) ?? document.body
    const cards = Array.from(scope.querySelectorAll('[data-primary-card]'))

    function parseColor(raw: string): { r: number; g: number; b: number; a: number } | null {
      const m = raw.match(/rgba?\(([^)]+)\)/)
      if (!m) return null
      const parts = m[1].split(',').map(s => parseFloat(s.trim()))
      const [r, g, b, a = 1] = parts
      if ([r, g, b].some(n => Number.isNaN(n))) return null
      return { r, g, b, a }
    }

    function relLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
      const chan = (c: number) => {
        const s = c / 255
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
      }
      return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)
    }

    function contrastRatio(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): number {
      const l1 = relLuminance(a)
      const l2 = relLuminance(b)
      const lighter = Math.max(l1, l2)
      const darker = Math.min(l1, l2)
      return (lighter + 0.05) / (darker + 0.05)
    }

    // Går uppåt från el (inklusive) till card (inklusive) och returnerar
    // första OPAKA bakgrundsfärgen. null om ingen hittas (t.ex. gradient/
    // bild) — den kallaren hanterar som "omätbar", inte som en godkänd 0-
    // träff.
    function effectiveBackground(el: Element, card: Element): { r: number; g: number; b: number } | null {
      let node: Element | null = el
      while (node) {
        const cs = getComputedStyle(node)
        // En background-image (gradient/bild) täcker vad backgroundColor
        // rapporterar — .btn-primary har t.ex. transparent backgroundColor
        // och en copper-gradient som faktiska pixlar. Utan denna koll
        // klev funktionen förbi knappens EGEN bakgrund och läste kortets
        // istället: vit knapptext mot en ljus card-sharp-bakgrund gav en
        // falsk 1.06:1-träff (knappen renderar i verkligheten vit-mot-
        // koppar, gott om marginal). Gradient/bild kan inte mätas i pixlar
        // via getComputedStyle — omätbar, inte en gissning åt något håll.
        if (cs.backgroundImage !== 'none') return null
        const bg = parseColor(cs.backgroundColor)
        if (bg && bg.a > 0.99) return bg
        if (bg && bg.a > 0) return null // halvtransparent — kan inte mätas utan att komponera flera lager, se filkommentar
        if (node === card) break
        node = node.parentElement
      }
      return null
    }

    function isLargeText(cs: CSSStyleDeclaration): boolean {
      const px = parseFloat(cs.fontSize)
      const weight = parseInt(cs.fontWeight, 10) || 400
      return px >= LARGE_TEXT_PX || (px >= LARGE_BOLD_TEXT_PX && weight >= LARGE_BOLD_WEIGHT)
    }

    function label(el: Element, card: Element): string {
      const text = (el.textContent ?? '').trim().slice(0, 30)
      const cardName = card.getAttribute('data-testid') ?? card.className.split(' ')[0] ?? 'primary-card'
      return `${cardName} → ${el.tagName.toLowerCase()}${text ? ` "${text}"` : ''}`
    }

    const violations: { message: string }[] = []
    const unmeasurable: string[] = []
    const exempted: string[] = []

    for (const card of cards) {
      // Textbärande leaf: har direkta icke-tomma textnoder (inte bara barn-
      // elements text) — undviker att räkna samma text två gånger via en
      // förälder OCH dess barn.
      const walker = document.createTreeWalker(card, NodeFilter.SHOW_ELEMENT)
      let node: Node | null = card
      const leaves: Element[] = []
      while (node) {
        const el = node as Element
        // SVG-text (ClubBadge.tsx m.fl.) styrs av `fill`, inte CSS `color`
        // — getComputedStyle(el).color på en <text> returnerar en ärvd
        // omgivningsfärg som aldrig är den faktiskt synliga. Utanför scope:
        // ClubBadge.tsx är en dokumenterad evig undantag från token-systemet
        // (12 klubbars egen heraldik, CLAUDE.md), och en riktig SVG-fill-
        // kontrastkoll är ett annat verktyg än det här.
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

      for (const el of leaves) {
        // Explicit, granskningsbar undantagslista — INTE en tröskel (t.ex.
        // "hoppa allt under 10px") som tyst skulle dölja framtida regres-
        // sioner i andra element. Varje undantag är ett attribut satt på
        // det EXAKTA elementet, med en anledning i värdet, sökbart via grep.
        const exemptEl = el.closest('[data-contrast-exempt]')
        if (exemptEl) {
          exempted.push(`${label(el, card)} — ${exemptEl.getAttribute('data-contrast-exempt')}`)
          continue
        }
        const cs = getComputedStyle(el)
        const fg = parseColor(cs.color)
        if (!fg) continue
        const bg = effectiveBackground(el, card)
        if (!bg) {
          unmeasurable.push(label(el, card))
          continue
        }
        const ratio = contrastRatio(fg, bg)
        const threshold = isLargeText(cs) ? LARGE_THRESHOLD : NORMAL_THRESHOLD
        if (ratio < threshold) {
          violations.push({
            message: `${label(el, card)} — kontrast ${ratio.toFixed(2)}:1, kräver ${threshold}:1`,
          })
        }
      }
    }

    return { violations, unmeasurable, exempted }
  }, { scopeSelector, NORMAL_THRESHOLD, LARGE_THRESHOLD, LARGE_TEXT_PX, LARGE_BOLD_TEXT_PX, LARGE_BOLD_WEIGHT })
}
