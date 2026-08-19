import { test, expect } from '@playwright/test'
import { findMatchtypsmatrisViolations } from './matchtypsmatrisGate'
import type { Tavlingstyp, Skede } from '../../src/domain/services/matchTypeAxes'

/**
 * Matchtypsmatris-grinden (åtgärdslistans post 20) — egen CI-port. Sex
 * Granska-scener, en per (tavlingstyp, skede)-kombination DevScenesScreen.tsx
 * faktiskt riggar (verifierat mot fixturernas isCup/isKnockout/
 * farewellMatchForPlayerId/playoffBracket, samma derivering som
 * matchTypeAxes.ts:s deriveTavlingstyp/deriveSkede använder).
 *
 * Axlarna hårdkodas HÄR (inte härledda i testet) eftersom testet inte har
 * tillgång till dev-fixturens Fixture-objekt, bara den renderade DOM:en —
 * en liten, explicit tabell, inte en gissning. Om en scens fixture någonsin
 * ändras (ny isCup/isKnockout/roundNumber) utan att denna tabell uppdateras,
 * ger grinden falska larm/missar — samma riskklass som sceneRegistry.ts:s
 * övriga listor, ingen ny sorts skuld.
 */
const GRANSKA_SCENE_AXES: [string, Tavlingstyp, Skede | undefined][] = [
  ['granska', 'liga', undefined],
  ['granska-cup', 'cup', 'kvartsfinal'],
  ['granska-cup-final', 'cup', 'final'],
  ['granska-slutspel', 'slutspel', 'kvartsfinal'],
  ['granska-sm-final', 'slutspel', 'final'],
  ['granska-avsked', 'avsked', undefined],
]

test.describe('matchtypsmatris — frånvaro av irrelevant + ankaret (kapitelPunkt)', () => {
  for (const [id, tavlingstyp, skede] of GRANSKA_SCENE_AXES) {
    test(`scene: ${id}`, async ({ page }) => {
      await page.goto(`/dev/scenes?scene=${id}`, { waitUntil: 'networkidle' })
      await page.getByText('DEV GALLERY').waitFor({ timeout: 15000 })
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(700)

      const violations = await findMatchtypsmatrisViolations(page, tavlingstyp, skede)
      expect(violations.map(v => v.message), `matchtypsmatris-brott i scen "${id}"`).toEqual([])
    })
  }
})
