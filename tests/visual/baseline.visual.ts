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
// ROTORSAK (2026-08-12): [data-dev-nav] (dev-skalets scen-väljare, INTE
// produktkod) är position:sticky. När [data-scene-content] är högre än
// viewporten scrollar Playwright internt och stitchar capturen i flera steg
// — ett sticky-element återfäster sig i toppen av VARJE scroll-steg under den
// processen, vilket läcker nav-knapptext in i den sammansatta bilden. Att
// höja viewporten (försökt 2026-08-12, se historik) löser symptomet men inte
// källan: det gör att snapshotarna inte längre visar vad en telefon faktiskt
// visar, och takregelns "klarar Primary vikningen vid 390px"-kriterium går
// inte att bedöma mot en scen utan vikning. Rätt fix: DevScenesScreen.tsx
// sätter [data-dev-nav] till position:static (istf sticky) när
// documentElement bär klassen 'capture-mode' — testerna sätter klassen innan
// screenshot (se nedan). Nav:et tar fortfarande sin normala plats i flödet
// (ingen layoutförskjutning av det som faktiskt fotograferas), det slutar
// bara återfästa sig under stitchningen. Viewporten är därför tillbaka på
// samma höjder som 2026-08-09 — de behövdes för att Uppställningen/Portalen
// själva är högre än 900px, inte för att kompensera för nav-läckaget.
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
      await page.evaluate(() => document.documentElement.classList.add('capture-mode'))
      if (clickText) {
        await page.locator(clickText).first().click()
        await page.waitForTimeout(300)
      }
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(700)
      // Neutraliserar [data-dev-nav]s sticky-positionering (se ROTORSAK ovan).
      // Skalet fortsätter ta sin normala plats i dokumentflödet — bara den
      // egenskap som orsakar stitch-läckage stängs av.
      await expect(page.locator('[data-scene-content]')).toHaveScreenshot(`baseline-${width}-${id}.png`)
      // Entitets-dedup-grinden (AUDIT DEL 2, 2026-08-12) — se entityDedup.ts.
      await assertNoDuplicateEntityIds(page)
    })
  }
}
