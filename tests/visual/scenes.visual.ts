import { test, expect } from '@playwright/test'

/**
 * Visuell regression för /dev/scenes. En baseline per yta (Linux-seedad).
 * Håll SCENES i synk med scripts/capture-scenes.mjs + DevScenesScreen.tsx.
 *
 * Fångar hela sidan per scen (deterministisk fingerad state). Baselines genereras
 * i Linux-CI (npm run test:visual:update i visual-baselines.yml) — inte ur Mac.
 */
const SCENES: [string, string?][] = [
  ['cup-victory'], ['sm-victory'], ['season-arc'], ['portal-cards'], ['efterklang'],
  ['squad'], ['portal'], ['tranare'], ['board-a'], ['board-b'], ['board-c'],
  ['stillness'], ['granska'], ['upptakt'], ['ekonomi'], ['playercard'],
  ['season-a'], ['season-b'], ['season-c'],
  ['miljoheader-karlsborg'], ['miljoheader-rogle'],
  ['roundsummary'], ['tabell'], ['season-header'], ['finalhelg'], ['annandagen'],
  ['arrival'], ['squad-trupp', 'button:has-text("Trupp")'],
  ['momentumbar'], ['tacticmodal'], ['submodal'], ['spakb'],
]

for (const [id, clickText] of SCENES) {
  test(`scene: ${id}`, async ({ page }) => {
    await page.goto(`/dev/scenes?scene=${id}`, { waitUntil: 'networkidle' })
    // Vänta förbi BURY FEN-splashen tills dev-galleriet faktiskt monterat.
    await page.getByText('DEV GALLERY').waitFor({ timeout: 15000 })
    if (clickText) {
      await page.locator(clickText).first().click()
      await page.waitForTimeout(300)
    }
    // Fonter + fade/animation-settle (matchar capture-scenes 700ms).
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(700)
    // Snapa BARA scen-innehållet (data-scene-content), inte hela sidan: dev-navet
    // wrappar till ett stort block med 32 knappar och ändras när scener läggs till —
    // en element-snapshot isolerar varje baseline från nav-churn.
    await expect(page.locator('[data-scene-content]')).toHaveScreenshot(`scene-${id}.png`)
  })
}
