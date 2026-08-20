import { test, expect } from '@playwright/test'
import { assertNoDuplicateEntityIds } from './entityDedup'
import { assertNoUnexpectedOverlay } from './occlusionGate'
import { SCENES } from './sceneRegistry'

/**
 * Visuell regression för /dev/scenes. En baseline per yta (Linux-seedad).
 * Håll SCENES (sceneRegistry.ts) i synk med scripts/capture-scenes.mjs +
 * DevScenesScreen.tsx.
 *
 * Fångar hela sidan per scen (deterministisk fingerad state). Baselines genereras
 * i Linux-CI (npm run test:visual:update i visual-baselines.yml) — inte ur Mac.
 *
 * SCENES flyttad till sceneRegistry.ts (2026-08-17, Skutskär-auditen): den
 * filen har INGA test()-anrop, till skillnad från den här. tapTargetGate.
 * visual.ts/rawTokenGate.visual.ts importerade tidigare SCENES direkt
 * härifrån — men ett import av EN export drar in HELA modulen, så deras CI-
 * jobb råkade även registrera och köra DEN HÄR filens egna pixel-diff-
 * asserts, i fel jobb, utan rätt kontext. Se sceneRegistry.ts:s egen
 * kommentar.
 */

for (const [id, clickText, snapshotNameOverride, fixedOverlay, extraHeight] of SCENES) {
  const snapshotName = snapshotNameOverride ?? id
  test(`scene: ${snapshotName}`, async ({ page }) => {
    if (extraHeight) await page.setViewportSize({ width: 390, height: extraHeight })
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
    // ROTORSAK-NOT (2026-08-12): [data-dev-nav] är position:sticky i vanlig
    // dev-användning (bra UX vid manuell genombläddring av ett högt scen-
    // innehåll) men det bryter Playwrights scroll-och-stitch-mekanism för
    // element-screenshots högre än viewporten — sticky-elementet återfäster
    // sig i toppen av VARJE scroll-steg under stitchningen och läcker in i
    // capturen. Att höja viewporten (försökt, se historik) döljer symptomet
    // men gör att snapshotarna inte längre visar vad en telefon faktiskt
    // visar — och takregelns "klarar Primary vikningen vid 390px"-kriterium
    // går inte att bedöma mot en scen utan vikning. Rätt fix: DevScenesScreen
    // sätter navet till position:static när documentElement bär klassen
    // 'capture-mode' (satt här, innan screenshot) — inga andra ytor eller
    // viewporter behöver längre justeras för nav-artefaktens skull.
    await page.evaluate(() => document.documentElement.classList.add('capture-mode'))
    if (fixedOverlay) {
      // Se kommentaren vid SCENES-deklarationen: position:fixed-modaler
      // täcker hela viewporten, inte data-scene-content-elementets egen box.
      await expect(page).toHaveScreenshot(`scene-${snapshotName}.png`)
      return
    }
    // Snapa BARA scen-innehållet (data-scene-content), inte hela sidan: dev-navet
    // wrappar till ett stort block med knappar och ändras när scener läggs till —
    // en element-snapshot isolerar varje baseline från nav-churn.
    await expect(page.locator('[data-scene-content]')).toHaveScreenshot(`scene-${snapshotName}.png`)
    // Entitets-dedup-grinden (AUDIT DEL 2, 2026-08-12) — se entityDedup.ts.
    await assertNoDuplicateEntityIds(page)
    // Occlusion-grinden (2026-08-22, LESSONS.md #47) — se occlusionGate.ts.
    await assertNoUnexpectedOverlay(page)
  })
}
