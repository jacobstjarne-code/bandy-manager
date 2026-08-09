import { test, expect } from '@playwright/test'

/**
 * VISUELL AUDIT — regressionsbaseline (CODE_INSTRUKTION_VISUELL_AUDIT_YTA2_YTA3
 * punkt 1). scenes.visual.ts täcker redan 375px content-bredd (data-scene-
 * content var hårdkodad dit) för alla /dev/scenes-ytor vid config-default-
 * viewporten (390px).
 *
 * KORRIGERAT 2026-08-09: data-scene-content var maxWidth:375 hårdkodat —
 * en tidigare version av denna fil satte bara Playwright-viewporten till
 * 375/390 och trodde det gav olika innehållsbredd. Det gjorde det inte;
 * wrappern klippte alltid vid 375px oavsett viewport, så "390px"-snappen
 * hade varit pixel-identisk med den befintliga 375px-varianten (bara mer
 * grått runt om, utanför [data-scene-content]-selektorn). DevScenesScreen.tsx
 * har nu en ?width=-parameter (default 375, orört för alla befintliga
 * scenes.visual.ts-baselines) — den här filen driver bredden via URL:en,
 * inte via viewporten, och sätter viewporten till 430px (bredare än båda
 * testbredderna) så webbläsarfönstret aldrig är den begränsande faktorn.
 */
const WIDE_VIEWPORT = { width: 430, height: 900 }

const BASELINE_SCENES: [string, string?][] = [
  ['stillness'],
  ['tabell'],
]

for (const [id, clickText] of BASELINE_SCENES) {
  for (const width of [390, 375]) {
    test(`baseline ${width}px: ${id}`, async ({ page }) => {
      await page.setViewportSize(WIDE_VIEWPORT)
      await page.goto(`/dev/scenes?scene=${id}&width=${width}`, { waitUntil: 'networkidle' })
      await page.getByText('DEV GALLERY').waitFor({ timeout: 15000 })
      if (clickText) {
        await page.locator(clickText).first().click()
        await page.waitForTimeout(300)
      }
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(700)
      await expect(page.locator('[data-scene-content]')).toHaveScreenshot(`baseline-${width}-${id}.png`)
    })
  }
}
