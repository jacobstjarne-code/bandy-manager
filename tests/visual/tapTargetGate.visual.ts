import { test, expect } from '@playwright/test'
import { SCENES } from './sceneRegistry'
import { findTapTargetViolations } from './tapTargetOverlap'

/**
 * Tap-target-grinden (mobil speltest-audit, 2026-08-17) — EGEN CI-port, inte
 * en assertion inklämd i scenes.visual.ts. Motiv (Jacobs ord): en pixel-diff-
 * regression och en träffyta-regression är olika klasser av fel och ska synas
 * som olika klasser i CI-statusen, inte begravas i samma jobbs gröna/röda.
 *
 * Två delar:
 * 1. Sveper alla scener i SCENES (samma lista scenes.visual.ts kör) och
 *    kräver att findTapTargetViolations (tapTargetOverlap.ts) inte hittar
 *    något — se den filens KÄND BEGRÄNSNING-kommentar för vad detta faktiskt
 *    täcker (bottennav-kollision bara där [data-bottom-nav] renderas).
 * 2. Regressionsvakt för det konkreta fyndet (MatchLaddningBand — SÄTT
 *    LAGET): ett RIKTIGT koordinattryck (page.mouse.click, inte
 *    locator.click()) vid fyra bredder, som verifierar att trycket ger rätt
 *    effekt (lineup-steget öppnas).
 *
 *    NYANS FRÅN UNDERSÖKNINGEN (rapporterad separat till Jacob, inte gömd):
 *    document.elementFromPoint gav INKONSEKVENTA svar på "är nav-fliken
 *    under CTA:n verkligen träffbar" beroende på renderingsväg (dev-scenes-
 *    skalet vs den riktiga ruttade appen) inom den tid som fanns för att
 *    reda ut varför. Den mätningen som ÄR entydig och upprepat verifierad
 *    (getBoundingClientRect, samma metod på båda sidor): geometrisk
 *    clearance mellan CTA:n och navigationen gick från −44px (verklig
 *    overlap) till +48px efter fixen. findTapTargetViolations ovan är den
 *    grind som bär den garantin. Det här testet bär bara den svagare, men
 *    fortfarande äkta koordinatbaserade garantin: knappen fungerar med ett
 *    RIKTIGT tryck, inte bara ett elementriktat.
 */

test.describe('tap-target-overlap — svep över alla scener', () => {
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

      const violations = await findTapTargetViolations(page)
      expect(violations.map(v => v.message), `tap-target-överlapp i scen "${snapshotName}"`).toEqual([])
    })
  }
})

// "Bredda grinden, inte snapshotarna" (2026-08-17): DevScenesScreen renderar
// nu en äkta BottomNav när ?navGate=1 skickas — ENBART för geometrimätning
// här, aldrig i scenes.visual.ts (som aldrig skickar parametern, så alla
// befintliga Linux-baselines är pixel-oförändrade). Se DevScenesScreens
// egen kommentar vid navGate-deklarationen.
//
// Listan = alla scener vars produktionsrutt faktiskt renderar BottomNav
// (GameShell.tsx:s hideBottomNav — CEREMONY_PATHS, season-summary/:season
// och aktiv pendingScene är AVSTÄNGDA, resten har nav), MINUS scener som
// kräver EXTRA_HEIGHT (3600px-viewport gör en nav-position vid botten
// meningslös — den mäter inget nära det verkliga 844px-vikningsläget).
//
// EXTRA_HEIGHT-rättelse: den ursprungliga uppskattningen (Jacobs "de fyra")
// byggde på scenes.visual.ts:s egen kommentar, som hävdar EXTRA_HEIGHT
// gäller "uteslutande" granska-spelare/-shotmap/-analys + taktik. Stämmer
// inte längre — verifierat genom att grep:a `EXTRA_HEIGHT]` i scenes.visual.ts
// direkt: primary-smfinal-vs-deadline och primary-event-vs-farewell fick
// samma flagga när de lades till (AUDIT DEL 4), kommentaren blev stale.
// Faktiskt tal: SEX scener exkluderade nedan, inte fyra. De hör hemma
// konceptuellt under Dashboard men utelämnas helt ur listan, samma skäl
// som de andra fyra: en nav-position vid botten av en 3600px-sida mäter
// inget nära det verkliga 844px-vikningsläget.
//
// event-overlay/press-conference: strukturellt identiska med
// MatchLaddningScene (position:fixed, inset:0, zIndex:300) — verifierat i
// GameShell.tsx att EventOverlay monteras EFTER <BottomNav/> i samma
// return-block, på exakt de rutter (dashboard/squad/transfers/club/tabell/
// taktik/bygget) där nav visas. Ingår därför i sveppet.
const NAV_BEARING_SCENES = [
  // Dashboard (portal)
  'portal', 'portal-cards', 'efterklang', 'upptakt', 'finalhelg', 'annandagen',
  // Trupp
  'squad', 'squad-trupp', 'stillness', 'playercard',
  // Klubb
  'tranare', 'ekonomi', 'club-fresh', 'club-established',
  // Tabell
  'tabell',
  // Marknad
  'transfers-closed', 'transfers-open-nobids', 'transfers-onebid', 'transfers-multibids',
  // Granska (Översikt-fliken bara — spelare/shotmap/analys är EXTRA_HEIGHT)
  'granska', 'granska-avsked', 'granska-cup', 'granska-cup-final', 'granska-slutspel', 'granska-sm-final',
  // Match/live (nav synlig men opacity 0.4/pointer-events:none — se rapport)
  'momentumbar', 'tacticmodal', 'submodal', 'spakb',
  // Event-overlays — dashboard-monterade, se motivering ovan
  'event-overlay', 'press-conference',
]

test.describe('tap-target-overlap — bottennav-kollision, nav-bärande scener (navGate)', () => {
  for (const id of NAV_BEARING_SCENES) {
    test(`nav-collision: ${id}`, async ({ page }) => {
      await page.goto(`/dev/scenes?scene=${id}&navGate=1`, { waitUntil: 'networkidle' })
      await page.getByText('DEV GALLERY').waitFor({ timeout: 15000 })
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(700)

      const violations = await findTapTargetViolations(page)
      expect(violations.map(v => v.message), `bottennav-kollision i scen "${id}"`).toEqual([])
    })
  }
})

test.describe('tap-target-regression — MatchLaddningBand (SÄTT LAGET)', () => {
  for (const width of [320, 375, 390, 430]) {
    test(`riktigt koordinattryck på CTA:n ger rätt effekt @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.goto('/dev/scenes?scene=navgate-laddning-band', { waitUntil: 'networkidle' })
      await page.getByText('DEV GALLERY').waitFor({ timeout: 15000 })
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(700)

      // Ett riktigt koordinattryck (page.mouse.click, inte locator.click())
      // mitt på CTA:n ska faktiskt avancera flödet till lineup-steget.
      const btn = page.locator('button', { hasText: 'SÄTT LAGET' }).first()
      await expect(btn).toBeVisible()
      const box = await btn.boundingBox()
      if (!box) throw new Error('SÄTT LAGET-knappen saknar bounding box')
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
      await page.waitForTimeout(400)
      await expect(page.locator('button', { hasText: 'SÄTT LAGET' })).toHaveCount(0)
    })
  }
})
