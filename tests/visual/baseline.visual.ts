import { test, expect } from '@playwright/test'

/**
 * VISUELL AUDIT — regressionsbaseline (CODE_INSTRUKTION_VISUELL_AUDIT_YTA2_YTA3
 * punkt 1). scenes.visual.ts täcker redan 390px (config-defaulten) för alla
 * /dev/scenes-ytor, inklusive 'stillness' (Trupp/Nu, helt lugnt) och 'tabell'
 * (12-lag + zonstreck). Detta är den 375px-baseline som saknades — samma två
 * scener, samma [data-scene-content]-snap, men på den smalaste
 * telefonbredden appen stödjer.
 *
 * Trupp blandat/kris och Uppställningen (tomma/fyllda slots) väntar på den
 * seedade spelläges-fabriken (rapport 2026-08-09) — läggs till här när den
 * finns, inte som egna hårdkodade scener.
 */
const NARROW = { width: 375, height: 844 }

const BASELINE_SCENES: [string, string?][] = [
  ['stillness'],
  ['tabell'],
]

for (const [id, clickText] of BASELINE_SCENES) {
  test(`baseline 375px: ${id}`, async ({ page }) => {
    await page.setViewportSize(NARROW)
    await page.goto(`/dev/scenes?scene=${id}`, { waitUntil: 'networkidle' })
    await page.getByText('DEV GALLERY').waitFor({ timeout: 15000 })
    if (clickText) {
      await page.locator(clickText).first().click()
      await page.waitForTimeout(300)
    }
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(700)
    await expect(page.locator('[data-scene-content]')).toHaveScreenshot(`baseline-375-${id}.png`)
  })
}
