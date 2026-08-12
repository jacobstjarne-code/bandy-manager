import { test, expect } from '@playwright/test'
import { assertNoDuplicateEntityIds } from './entityDedup'

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
// ROTORSAK (2026-08-12): 1400/1500 räckte 2026-08-09 men dev-navet (data-dev-nav,
// [data-scene-content]s föregående syskon i DOM) har växt sedan dess — fler
// dev-scener → högre nav → elementets top-offset flyttar sig neråt. När
// nav+innehåll tillsammans överskrider viewporten måste Playwright scrolla
// för att fånga hela [data-scene-content], och då stitchas capturen i flera
// steg. [data-dev-nav] är position:sticky och återfäster sig i toppen av
// VARJE scroll-steg under stitchningen — det producerar läckande nav-text i
// den sammansatta bilden, inte en renderingsskillnad i scenen. Samma mönster
// upptäcktes i produktskärmarnas EGNA sticky headers (t.ex. Uppställningens
// steg-navigering) — nav-döljningen ovan (addStyleTag) löser bara dev-navet,
// inte det. Enda robusta fixen: gör viewporten tillräckligt hög att INGEN
// scroll någonsin krävs, oavsett hur högt nav:et blir. 4000px täcker dagens
// ~1400px nav + ~2000px innehåll med marginal för framtida scentillägg.
const TALL_VIEWPORT = { width: 430, height: 4000 }
const PORTAL_VIEWPORT = { width: 430, height: 4000 }

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
  // AUDIT DEL 2 (2026-08-11): kontrollfall, Berg-budets dubbelrendering (dc3d771f)
  ['portal-bid-single', undefined, PORTAL_VIEWPORT],
  ['portal-bid-multi', undefined, PORTAL_VIEWPORT],
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
      // ROTORSAK (2026-08-12): se scenes.visual.ts — [data-dev-nav] är sticky och
      // läcker in i toppen av stitchade element-screenshots när innehållet är
      // högre än viewporten. TALL_VIEWPORT/PORTAL_VIEWPORT (900-1500px) räckte
      // 2026-08-09 men nav:et har växt sedan dess (fler dev-scener) — dölj
      // navet så capture aldrig behöver scrolla förbi ett sticky-syskon,
      // oavsett hur högt nav:et blir framöver.
      await page.addStyleTag({ content: '[data-dev-nav] { display: none !important; }' })
      await expect(page.locator('[data-scene-content]')).toHaveScreenshot(`baseline-${width}-${id}.png`)
      // Entitets-dedup-grinden (AUDIT DEL 2, 2026-08-12) — se entityDedup.ts.
      await assertNoDuplicateEntityIds(page)
    })
  }
}
