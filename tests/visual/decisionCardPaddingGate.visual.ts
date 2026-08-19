import { test, expect } from '@playwright/test'
import { SCENES } from './sceneRegistry'
import { findDecisionCardPaddingViolations } from './decisionCardPaddingGate'

/**
 * DecisionCard-dubbelpadding-grinden (post 7/21) — egen CI-port, samma
 * motiv som de övriga: en dubbelpadding-regression är en egen felklass.
 *
 * Sveper hela SCENES — scener utan någon [data-decision-card] blir ett
 * no-op (inget att kontrollera), inte ett fel.
 */

test.describe('decisionCard-padding — inget kort i en redan padded förälder', () => {
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

      const violations = await findDecisionCardPaddingViolations(page)
      expect(violations.map(v => v.message), `dubbelpadding i scen "${snapshotName}"`).toEqual([])
    })
  }
})
