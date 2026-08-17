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
// snapshot-filnamn på id ensamt.
//
// Fjärde fältet (fixedOverlay) gäller EventOverlay/PressConferenceScene —
// position:fixed/inset:0-modaler positionerar sig mot HELA viewporten, inte
// mot data-scene-content-elementets egen (ofta nedskjutna) box, så en
// element-screenshot av data-scene-content fångar fel yta helt. fixedOverlay
// skippar den croppen och tar en vanlig sid-screenshot istället — rätt
// eftersom modalen FAKTISKT täcker hela skärmen i produktion.
//
// Femte fältet (extraHeight) gäller UTESLUTANDE taktik/granska-spelare/
// -shotmap/-analys — INTE en ny variant av samma nav-artefakt (den är
// åtgärdad, se ROTORSAK-NOT nedan). Separat, kvarstående orsak: dev-navet
// (statiskt, ~1500px vid 390px bredd) + dessa fyra ytors egen höjd överskrider
// vad Playwrights scroll-och-stitch klarar pålitligt genom DevScenesScreens
// egen overflow:auto-container (verifierat: samma artefakt kvarstod även
// efter att skalet fick sitt eget scroll-sammanhang). Ingen av dessa fyra
// används för vikningsbedömning — extraHeight påverkar alltså aldrig ett
// mått ordern faktiskt behöver (det gör bara PORTAL_VIEWPORT i
// baseline.visual.ts, som är oförändrad sedan 2026-08-09).
const EXTRA_HEIGHT = 3600
export const SCENES: [string, string?, string?, boolean?, number?][] = [
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
  ['granska', 'text="Spelare"', 'granska-spelare', undefined, EXTRA_HEIGHT],
  ['granska', 'text="Shotmap"', 'granska-shotmap', undefined, EXTRA_HEIGHT],
  ['granska', 'text="Analys"', 'granska-analys', undefined, EXTRA_HEIGHT],
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
  ['taktik', undefined, undefined, undefined, EXTRA_HEIGHT],
  ['event-overlay', undefined, undefined, true],
  ['press-conference', undefined, undefined, true],
  // AUDIT DEL 4 (2026-08-12) — täckningslucka: Primary-rangordningen
  // (initCardBag.ts) hade aldrig fotograferats i konkurrens. De fyra
  // takregel-scenerna (baseline.visual.ts) varierar bara atmosfärslagret —
  // deadline (90) vann Primary-platsen i tre av fyra bara för att inget
  // högre viktat villkor råkade vara sant samtidigt. Samma lucka-klass som
  // lät FÖRESLÅS-badgen vara osynlig en månad.
  ['primary-smfinal-vs-deadline', undefined, undefined, undefined, EXTRA_HEIGHT],
  ['primary-event-vs-farewell', undefined, undefined, undefined, EXTRA_HEIGHT],
]

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
  })
}
