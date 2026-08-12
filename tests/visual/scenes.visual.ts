import { test, expect } from '@playwright/test'
import { assertNoDuplicateEntityIds } from './entityDedup'

/**
 * Visuell regression för /dev/scenes. En baseline per yta (Linux-seedad).
 * Håll SCENES i synk med scripts/capture-scenes.mjs + DevScenesScreen.tsx.
 *
 * Fångar hela sidan per scen (deterministisk fingerad state). Baselines genereras
 * i Linux-CI (npm run test:visual:update i visual-baselines.yml) — inte ur Mac.
 */
// Tredje fältet (snapshotName) krävs bara när flera SCENES-rader delar samma
// scen-id (t.ex. Granskas fyra flikar) — annars kolliderar test-titel och
// snapshot-filnamn på id ensamt. Fjärde fältet (viewportHeight) krävs för
// ytor vars data-scene-content-höjd + dev-navets höjd tillsammans överskrider
// standard-viewporten (844px) — annars beskär Playwright toppen av capturen
// (se ROTORSAK-NOT nedan; samma mekanism som baseline.visual.ts:s TALL_VIEWPORT,
// men här räcker det med en enskild hög höjd istf full nav-döljning eftersom
// dessa ytor screenshottas en och en, inte i grupp med resten av svepet).
// Femte fältet (fixedOverlay) gäller EventOverlay/PressConferenceScene —
// position:fixed/inset:0-modaler positionerar sig mot HELA viewporten, inte
// mot data-scene-content-elementets egen (ofta nedskjutna) box. Ett TALL-
// viewport-försök gav en helsvart bild: elementets bounding box låg vid
// dev-navets slut (y≈1441) medan den faktiska modalen renderas vid y≈60 —
// helt utanför den beskurna regionen. fixedOverlay skippar data-scene-
// content-croppen och tar en vanlig sid-screenshot vid standard-viewport
// istället, vilket är rätt eftersom modalen FAKTISKT täcker hela skärmen i
// produktion.
const TALL = 4200
const SCENES: [string, string?, string?, number?, boolean?][] = [
  ['cup-victory'], ['sm-victory'], ['season-arc'], ['portal-cards'], ['efterklang'],
  ['squad'], ['portal'], ['tranare'], ['board-a'], ['board-b'], ['board-c'],
  ['stillness'], ['granska'], ['upptakt'], ['ekonomi'], ['playercard'],
  // AUDIT DEL 3 (2026-08-10): Granska matchtypsmatrisen — förberedelse för
  // Design-uppdraget (DESIGN_UPPDRAG_GRANSKA_DEL4_2026-08-10.md steg A).
  ['granska-cup'], ['granska-cup-final'], ['granska-slutspel'], ['granska-sm-final'], ['granska-avsked'],
  // AUDIT DEL 4 (2026-08-12) — baseline-täckning: Granskas tre övriga flikar
  // saknade helt egen snapshot (granska-* täckte alltid bara Översikt, default-
  // fliken) — TacticBoardCard/BÄNKEN/GranskaShotmap-fixarna denna dag var
  // därmed osynade oavsett hur mycket de ändrades.
  ['granska', 'text="Spelare"', 'granska-spelare', TALL],
  ['granska', 'text="Shotmap"', 'granska-shotmap', TALL],
  ['granska', 'text="Analys"', 'granska-analys', TALL],
  ['season-a'], ['season-b'], ['season-c'],
  ['miljoheader-karlsborg'], ['miljoheader-rogle'],
  ['tabell'], ['season-header'], ['season-noplayoffs'], ['season-fired'], ['finalhelg'], ['annandagen'],
  ['transfers-closed'], ['transfers-open-nobids'], ['transfers-onebid'], ['transfers-multibids'],
  ['arrival'], ['squad-trupp', 'button:has-text("Trupp")'],
  ['momentumbar'], ['tacticmodal'], ['submodal'], ['spakb'],
  // AUDIT DEL 3 (2026-08-11): baseline före ombyggnad, Club 'Klubben i korthet'.
  ['club-fresh'], ['club-established'],
  // AUDIT DEL 4 (2026-08-12) — baseline-täckning: Taktiktavlan, EventOverlay,
  // PressConferenceScene saknade tidigare varje dev-scen (se DevScenesScreen.tsx).
  ['taktik', undefined, undefined, TALL],
  ['event-overlay', undefined, undefined, undefined, true],
  ['press-conference', undefined, undefined, undefined, true],
]

for (const [id, clickText, snapshotNameOverride, viewportHeight, fixedOverlay] of SCENES) {
  const snapshotName = snapshotNameOverride ?? id
  test(`scene: ${snapshotName}`, async ({ page }) => {
    if (viewportHeight) await page.setViewportSize({ width: 390, height: viewportHeight })
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
    if (fixedOverlay) {
      // Se kommentaren vid SCENES-deklarationen: position:fixed-modaler
      // täcker hela viewporten, inte data-scene-content-elementets egen box.
      // [data-dev-nav] har ett hårdkodat zIndex:999 (ren dev-galleri-chrome),
      // modalen använder --z-modal:300 — navet vinner stapelordningen och
      // döljer hela kortet helt osynligt i just DEN HÄR körningsmiljön (finns
      // aldrig i produktion, ingen dev-nav existerar där). Dölj navet innan
      // capture.
      await page.addStyleTag({ content: '[data-dev-nav] { display: none !important; }' })
      await expect(page).toHaveScreenshot(`scene-${snapshotName}.png`)
      return
    }
    // Snapa BARA scen-innehållet (data-scene-content), inte hela sidan: dev-navet
    // wrappar till ett stort block med knappar och ändras när scener läggs till —
    // en element-snapshot isolerar varje baseline från nav-churn.
    //
    // ROTORSAK-NOT (2026-08-12): baseline.visual.ts hade ett sticky-nav-läckage
    // i tall-viewport-scenerna (se den filens kommentar). De ursprungliga 44
    // ytorna rymdes alla inom standard-viewporten (844px) så läckaget uppstod
    // aldrig där. AUDIT DEL 4:s sex nya ytor (taktik/event-overlay/press-
    // conference/granska-spelare/-shotmap/-analys) gör INTE det — samma
    // dev-nav + sticky-innehåll-problem visade sig direkt vid första körning
    // (beskuren topp, samma symptom som i baseline.visual.ts). Fjärde
    // SCENES-fältet (viewportHeight) höjer viewporten tillräckligt för just
    // DE ytorna, istf att döljningsansatsen (som gav 26 nya diffar på de
    // befintliga 44) återanvänds här.
    await expect(page.locator('[data-scene-content]')).toHaveScreenshot(`scene-${snapshotName}.png`)
    // Entitets-dedup-grinden (AUDIT DEL 2, 2026-08-12) — se entityDedup.ts.
    await assertNoDuplicateEntityIds(page)
  })
}
