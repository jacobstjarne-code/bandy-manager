import { test, expect } from '@playwright/test'
import { SCENES } from './sceneRegistry'
import { findRawTokenViolations } from './rawTokenGate'

/**
 * Rå-token-grinden (LÅNGSPELSAUDIT 10 SÄSONGER, A2, 2026-08-17) — EGEN CI-port,
 * samma motiv som tap-target-grinden (tapTargetGate.visual.ts): en pixel-diff-
 * regression och en orenderad-mall-sträng-regression är olika felklasser och
 * ska synas som olika klasser i CI-statusen, inte begravas i samma jobbs
 * gröna/röda tillsammans med skärmdumparna.
 *
 * Sveper alla scener i SCENES (samma lista scenes.visual.ts kör) och kräver
 * att findRawTokenViolations (rawTokenGate.ts) inte hittar något — se den
 * filens rotorsak-kommentar för fyndet den skyddar mot (AnslagOverlay.tsx,
 * playoff-eliminations-anslag).
 */

test.describe('raw-token-gate — svep över alla scener', () => {
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

      const violations = await findRawTokenViolations(page)
      expect(violations.map(v => v.message), `orenderade mall-tokens i scen "${snapshotName}"`).toEqual([])
    })
  }
})
