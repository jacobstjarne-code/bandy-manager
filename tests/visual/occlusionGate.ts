import type { Page } from '@playwright/test'

/**
 * Occlusion-grinden (2026-08-22, LESSONS.md #47 — fjärde "skalet stör
 * fotot"-incidenten, men den enda av de fyra där boven var en LEGITIM
 * app-modal (AnslagOverlay) som täckte allt pga ett omöjligt fejkat
 * fixturtillstånd, inte skalets egen chrome).
 *
 * De tre tidigare incidenterna (sticky dev-nav vid stitchning, zIndex:999
 * över --z-modal, saknat eget scroll-sammanhang — se CLAUDE.md:s
 * DEV-SCENSKALET-sektion) fixades var för sig, punktvis. Den här grinden
 * är den generella versionen: istf att räkna upp kända fel-scener eller
 * kända skal-selektorer frågar den direkt "vad täcker skärmen just nu?"
 * via document.elementFromPoint() och failar om svaret är ett fullskärms
 * position:fixed-element som scenen inte deklarerat att den visar.
 *
 * "Deklarerat" = SCENES fixedOverlay-flaggan (sceneRegistry.ts) — appens
 * egen, redan underhållna vokabulär för "den här scenen SKA visa en
 * fullskärmsmodal" (EventOverlay/PressConferenceScene). Ingen ny
 * blocklista att glömma uppdatera: scenes.visual.ts hoppar redan över
 * denna grind för de scenerna (de returnerar innan de når hit).
 *
 * Fångar BÅDE skal-läckage (ett dev-only element med fixed positionering
 * och hög z-index) OCH legitima-men-fel-tillstånd (AnslagOverlay via en
 * fejkad fixtur som glömde seenAnslag) — samma symptom sett från skärmen,
 * gemensam mekanism, grinden bryr sig inte om vilket.
 */
export async function assertNoUnexpectedOverlay(
  page: Page,
  scopeSelector = '[data-scene-content]',
): Promise<void> {
  const locator = page.locator(scopeSelector)
  // DevScenesScreen scrollar sitt eget inre scroll-sammanhang (inte window) —
  // boundingBox() scrollar INTE dit själv (till skillnad från t.ex. click()),
  // så utan detta ligger scope-elementet ofta långt utanför {y:0..innerHeight}
  // och skärningen mot viewporten blir tom → grinden no-opar tyst istf att
  // faktiskt sampla. Verifierat: utan raden missade grinden det återskapade
  // AnslagOverlay-fallet (LESSONS.md #47) helt; med den fångade den det.
  await locator.scrollIntoViewIfNeeded()

  const viewport = page.viewportSize()
  if (!viewport) return

  const box = await locator.boundingBox()
  if (!box) return

  // Sampla en 3×3-grid över SKÄRNINGEN mellan scope-boxen och den faktiskt
  // synliga viewporten. Scener högre än viewporten (extraHeight) har
  // innehåll elementFromPoint inte kan träffa förrän man scrollat dit —
  // den delen är redan toHaveScreenshot:s stitchnings problem, inte den
  // här grindens.
  const x0 = Math.max(box.x, 0)
  const y0 = Math.max(box.y, 0)
  const x1 = Math.min(box.x + box.width, viewport.width)
  const y1 = Math.min(box.y + box.height, viewport.height)
  if (x1 <= x0 || y1 <= y0) return

  const points: [number, number][] = []
  for (const fx of [0.15, 0.5, 0.85]) {
    for (const fy of [0.15, 0.5, 0.85]) {
      points.push([x0 + (x1 - x0) * fx, y0 + (y1 - y0) * fy])
    }
  }

  const hits = await page.evaluate((pts) => {
    return pts.map(([x, y]) => {
      const el = document.elementFromPoint(x, y)
      if (!el) return null
      const style = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      const coversViewport =
        style.position === 'fixed' &&
        rect.width >= window.innerWidth * 0.9 &&
        rect.height >= window.innerHeight * 0.9
      return coversViewport
        ? { tag: el.tagName, cls: (el as HTMLElement).className || '', id: el.id || '' }
        : null
    })
  }, points)

  const occluders = hits.filter((h): h is { tag: string; cls: string; id: string } => h !== null)
  if (occluders.length === 0) return

  const unique = [...new Map(occluders.map(o => [`${o.tag}.${o.cls}#${o.id}`, o])).values()]
  throw new Error(
    `Occlusion-grinden (LESSONS.md #47): scenen täcks av ett fullskärms ` +
    `position:fixed-element som scenen inte deklarerat (SCENES fixedOverlay):\n` +
    unique.map(o => `  - <${o.tag.toLowerCase()}${o.id ? ` id="${o.id}"` : ''}${o.cls ? ` class="${o.cls}"` : ''}>`).join('\n'),
  )
}
