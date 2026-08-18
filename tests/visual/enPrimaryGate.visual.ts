import { test, expect } from '@playwright/test'
import { SCENES } from './sceneRegistry'
import { findEnPrimaryViolations } from './enPrimaryGate'

/**
 * En-primär-grinden (åtgärdslistans post 18) — egen CI-port, samma motiv
 * som kontrastgrinden/tap-target-gate: en hierarkiregression (två primärer
 * konkurrerar om blicken) är en annan felklass än en pixel-diff eller en
 * kontrastbrist, ska synas som egen grön/röd.
 *
 * Sveper hela SCENES — ingen handhållen "det här är Portal/Marknad"-lista.
 * Skärmar utan .btn-primary alls (de flesta) blir ett no-op, inte ett fel.
 */

test.describe('en-primär-grind — max 1 synlig .btn-primary per skärm', () => {
  for (const [id, clickText, snapshotNameOverride, , extraHeight] of SCENES) {
    const snapshotName = snapshotNameOverride ?? id
    test(`scene: ${snapshotName}`, async ({ page }) => {
      if (extraHeight) await page.setViewportSize({ width: 390, height: extraHeight })
      await page.goto(`/dev/scenes?scene=${id}`, { waitUntil: 'networkidle' })
      await page.getByText('DEV GALLERY').waitFor({ timeout: 15000 })
      if (clickText) {
        await page.locator(clickText).first().click()
        await page.waitForTimeout(300)
      }
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(700)

      const violations = await findEnPrimaryViolations(page)
      expect(violations.map(v => v.message), `flera primärer i scen "${snapshotName}"`).toEqual([])
    })
  }
})
