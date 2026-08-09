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
 *
 * trupp-blandat/trupp-kris/lineup-empty/lineup-filled/portal-tom (m.fl.)
 * byggda av den seedade spelläges-fabriken (gameStateFactory.ts, 2026-08-09)
 * — se DevScenesScreen.tsx för hur varje tillstånd komponeras. lineup- och
 * portal-scenerna körs vid extra hög viewport (900px räcker inte för hela
 * Uppställningen/Portalen inkl. CTA:n).
 *
 * PORTAL-TAKREGEL (2026-08-09) §5: fyra tillstånd. portal-full når beat+eko+
 * upptakt+situation (4 av 5 atmosfärsmarks) — Upptakt och Spectator är
 * strukturellt ömsesidigt uteslutande (se gameStateFactory.ts), så "fem
 * marks" i ordern kan inte betyda alla fem atmosfärslager-marks bokstavligt.
 * Detta ÄR taket, rapporterat i commit-meddelandet.
 */
const WIDE_VIEWPORT = { width: 430, height: 900 }
const TALL_VIEWPORT = { width: 430, height: 1400 }
const PORTAL_VIEWPORT = { width: 430, height: 1500 }

const BASELINE_SCENES: [string, string?, { width: number; height: number }?][] = [
  ['stillness'],
  ['tabell'],
  ['trupp-blandat'],
  ['trupp-kris'],
  ['lineup-empty', undefined, TALL_VIEWPORT],
  ['lineup-filled', undefined, TALL_VIEWPORT],
  ['portal-tom', undefined, PORTAL_VIEWPORT],
  ['portal-normal', undefined, PORTAL_VIEWPORT],
  ['portal-full', undefined, PORTAL_VIEWPORT],
  ['portal-grind', undefined, PORTAL_VIEWPORT],
]

for (const [id, clickText, viewport] of BASELINE_SCENES) {
  for (const width of [390, 375]) {
    test(`baseline ${width}px: ${id}`, async ({ page }) => {
      await page.setViewportSize(viewport ?? WIDE_VIEWPORT)
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
