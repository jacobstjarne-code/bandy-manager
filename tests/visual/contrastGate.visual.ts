import { test, expect } from '@playwright/test'
import { SCENES } from './sceneRegistry'
import { findContrastViolations } from './contrastGate'

/**
 * Kontrastgrinden (åtgärdslistans post 17) — egen CI-port, samma motiv som
 * tapTargetGate.visual.ts: en kontrastregression är en annan felklass än en
 * pixel-diff-regression och en träffyteregression, och ska synas som en
 * egen grön/röd i CI, inte begravas i scenes.visual.ts.
 *
 * Sveper HELA SCENES (ingen handhållen "vilka scener har en Primary"-lista
 * — sådana listor har redan drivit stale två gånger denna session, se
 * sceneRegistry.ts:s EXTRA_HEIGHT-rättelse-kommentar och tapTargetGate.
 * visual.ts:s NAV_BEARING_SCENES). Scener utan något `[data-primary-card]`
 * i DOM:en producerar noll leaves, alltså noll violations — testet blir ett
 * no-op för dem, inte ett fel.
 */

test.describe('kontrastgrind — [data-primary-card] mot faktisk bakgrund', () => {
  for (const [id, clickText, snapshotNameOverride, , extraHeight] of SCENES) {
    const snapshotName = snapshotNameOverride ?? id
    test(`scene: ${snapshotName}`, async ({ page }) => {
      if (extraHeight) await page.setViewportSize({ width: 390, height: extraHeight })
      await page.goto(`/dev/scenes?scene=${id}`, { waitUntil: 'networkidle' })
      await page.getByText('DEV GALLERY').waitFor({ timeout: 15000 })
      await page.evaluate(() => document.documentElement.classList.add('capture-mode'))
      if (clickText) {
        await page.locator(clickText).first().click()
        await page.waitForTimeout(300)
      }
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(700)

      const { violations } = await findContrastViolations(page)
      expect(violations.map(v => v.message), `kontrastbrott i scen "${snapshotName}"`).toEqual([])
    })
  }
})
