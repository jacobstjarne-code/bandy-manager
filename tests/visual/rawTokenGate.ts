import type { Page } from '@playwright/test'

/**
 * Rå-token-grinden (LÅNGSPELSAUDIT 10 SÄSONGER, A2, 2026-08-17).
 *
 * Fyndet den fångar: {motståndare}/{resultat} renderades bokstavligt i
 * AnslagOverlay.tsx efter en slutspelselimination (semifinalförlust år 7,
 * SM-finalsilver år 8, live 10-säsongersspeltest). Rotorsak (se
 * PlayoffEliminationInfo i Playoff.ts för hela historien): dels läste
 * substitutionen mall-variabler ur ett bracket-state som kunde ha hunnit
 * ändras till render-tillfället, dels — den faktiska boven — skrevs det
 * substituerade resultatet till en `let`-variabel EFTER att den `const` som
 * faktiskt rendrades redan hade frusits, så bytet aldrig nådde skärmen.
 *
 * Samma failure-klass som entitets-dedup-grinden (entityDedup.ts) skyddar
 * mot: en bugg som bara syns genom att TITTA på skärmen, som gröna tester
 * missar eftersom ingen av dem frågar "står det här färdigt renderat?" Att
 * hitta nästa sådan bugg via en 10-säsongers live-speltest är dyrt. Denna
 * grind är billig: den kör vid varje /dev/scenes-svep.
 *
 * Kontrakt: skannar RENDERAD DOM-textinnehåll (synliga textnoder) inom en
 * scens data-scene-content-yta — samma gräns entityDedup.ts använder. Failar
 * om `/\{[^}]+\}/` matchar. Detta är MEDVETET en DOM-grind, inte en grep mot
 * källkoden: en källkods-grep på `{ord}` ger för många falska positiva (CSS-
 * in-JS-objekt, JSX-uttrycksblock, mall-litteraler som aldrig når rendern) —
 * bara det som faktiskt landar i en textnod på skärmen räknas.
 */

export interface RawTokenViolation {
  message: string
}

const RAW_TOKEN_PATTERN_SOURCE = '\\{[^}]+\\}'

export async function findRawTokenViolations(
  page: Page,
  scopeSelector = '[data-scene-content]',
): Promise<RawTokenViolation[]> {
  const matches = await page.evaluate(
    ({ scopeSelector, patternSource }) => {
      const scope = document.querySelector(scopeSelector) ?? document.body
      const pattern = new RegExp(patternSource)

      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const text = node.nodeValue
          if (!text || !text.trim()) return NodeFilter.FILTER_REJECT
          const parent = node.parentElement
          if (!parent) return NodeFilter.FILTER_REJECT
          // Skript/style-innehåll är aldrig "renderad text spelaren ser".
          if (parent.closest('script, style')) return NodeFilter.FILTER_REJECT
          const cs = getComputedStyle(parent)
          if (cs.display === 'none' || cs.visibility === 'hidden') return NodeFilter.FILTER_REJECT
          return NodeFilter.FILTER_ACCEPT
        },
      })

      const out: { text: string; context: string }[] = []
      let node: Node | null
      while ((node = walker.nextNode())) {
        const text = (node.nodeValue ?? '')
        if (!pattern.test(text)) continue
        const parent = node.parentElement
        const cls = parent?.getAttribute('class') ?? ''
        const contextLabel = parent
          ? `${parent.tagName.toLowerCase()}${cls ? '.' + cls.split(' ').slice(0, 2).join('.') : ''}`
          : 'okänd'
        out.push({ text: text.trim().slice(0, 140), context: contextLabel })
      }
      return out
    },
    { scopeSelector, patternSource: RAW_TOKEN_PATTERN_SOURCE },
  )

  return matches.map(m => ({
    message: `orenderad mall-token i <${m.context}>: "${m.text}"`,
  }))
}
