import { test, expect } from '@playwright/test'
import { findTapTargetViolations } from './tapTargetOverlap'
import { assertNoUnexpectedOverlay } from './occlusionGate'
import { assertNoDuplicateEntityIds } from './entityDedup'
import { findEnPrimaryViolations } from './enPrimaryGate'

/**
 * Meta-test-svit: "fångar grinden verkligen sin egen historiska bugg?"
 *
 * Jacobs order (2026-08-24), efter att pastaendeGrindNiva2.test.ts:s
 * motsvarande meta-test fångade en RIKTIG regex-bugg (sort-mönstret
 * `[^)]*` som aldrig kunde matcha en arrow-funktions egna paren) INNAN
 * grinden ens hann leva: "Bygg samma metatest för de fyra andra grindarna
 * (tapTarget, occlusion, entityDedup, enPrimary). Vi har antagit att de
 * fungerar för att de är gröna, och regex-felet visar vad det antagandet
 * är värt."
 *
 * Metoden här skiljer sig från pastaendeGrindNiva2.test.ts (som matchar
 * regex mot en TEXTSTRÄNG som återskapar buggen). De fyra visuella
 * grindarna körs mot en riktig DOM via Playwright (`page.evaluate`/
 * `page.locator`), inte källkod — den trogna motsvarigheten är att
 * återskapa den HISTORISKA DOM:en (minimal, syntetisk, `page.setContent`,
 * ingen dev-server-scen behövs) och verifiera att grindfunktionen
 * verkligen slår larm på den — plus ett "frisk"-fall som bevisar att
 * grinden inte bara alltid slår larm (annars vore den värdelös som
 * gate, bara brus).
 *
 * Varje test är alltså ett par: BUGG (ska kastas/hittas) + FRISK (ska
 * INTE kastas/hittas). Utan det friska fallet bevisar ett kastande test
 * ingenting om grindens precision.
 */

test.describe('meta: tapTargetOverlap fångar SÄTT LAGET-fyndet (2026-08-17)', () => {
  // Historiskt fynd (MatchLaddningBand.tsx): en sticky CTA hade bara 2px
  // fri kant ovanför bottennavigationen på ett verkligt device — under
  // grindens 44px-krav (WCAG/HIG-tumregeln), en tumträff landade fel.
  test('bugg: 2px fri kant mot bottennav flaggas', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.setContent(`
      <div data-scene-content style="position:relative;width:100%;height:844px;">
        <button style="position:fixed;left:20px;width:200px;height:48px;top:738px;">SÄTT LAGET</button>
        <div data-bottom-nav style="position:fixed;left:0;right:0;bottom:0;height:56px;background:#000;"></div>
      </div>
    `)
    const violations = await findTapTargetViolations(page)
    expect(violations.length, `grinden missade det historiska 2px-fyndet: ${JSON.stringify(violations)}`).toBeGreaterThan(0)
    expect(violations.some(v => /SÄTT LAGET/.test(v.message)), JSON.stringify(violations)).toBe(true)
  })

  // Frisk kontroll: samma layout, men clearance = 48px (det uppmätta
  // värdet EFTER fixen, se tapTargetGate.visual.ts:s kommentar "−44px →
  // +48px"). Grinden ska vara tyst här — annars är den bara brus.
  test('friskt: 48px fri kant mot bottennav flaggas inte', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.setContent(`
      <div data-scene-content style="position:relative;width:100%;height:844px;">
        <button style="position:fixed;left:20px;width:200px;height:48px;top:692px;">SÄTT LAGET</button>
        <div data-bottom-nav style="position:fixed;left:0;right:0;bottom:0;height:56px;background:#000;"></div>
      </div>
    `)
    const violations = await findTapTargetViolations(page)
    expect(violations.map(v => v.message), JSON.stringify(violations)).toEqual([])
  })
})

test.describe('meta: occlusionGate fångar AnslagOverlay-fyndet (LESSONS.md #47)', () => {
  // Historiskt fynd: ett legitimt men felaktigt tillstånd (fejkad fixtur
  // som glömde seenAnslag) fick AnslagOverlay att täcka HELA scenen som
  // ett odeklarerat position:fixed-element.
  test('bugg: odeklarerad fullskärms-overlay flaggas', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.setContent(`
      <div data-scene-content style="position:relative;width:100%;height:844px;">
        <div>Riktigt sceninnehåll</div>
        <div class="fake-anslag-overlay" style="position:fixed;inset:0;width:100%;height:100%;background:#111;z-index:9999;">Anslag</div>
      </div>
    `)
    await expect(assertNoUnexpectedOverlay(page)).rejects.toThrow(/Occlusion-grinden/)
  })

  // Frisk kontroll: samma scen utan overlayen ska passera tyst.
  test('friskt: scen utan overlay flaggas inte', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.setContent(`
      <div data-scene-content style="position:relative;width:100%;height:844px;">
        <div>Riktigt sceninnehåll</div>
      </div>
    `)
    await expect(assertNoUnexpectedOverlay(page)).resolves.toBeUndefined()
  })
})

test.describe('meta: entityDedup fångar Portal-dubbleringen (AUDIT DEL 2)', () => {
  // Historiskt fynd: samma spelobjekt (bud/event/storyline) renderat via
  // två olika, okoordinerade komponenter samtidigt.
  test('bugg: samma entity-id via två okända källor flaggas', async ({ page }) => {
    await page.setContent(`
      <div data-scene-content>
        <div data-entity-id="storyline:42" data-entity-source="StorylineCardA">A</div>
        <div data-entity-id="storyline:42" data-entity-source="StorylineCardB">B</div>
      </div>
    `)
    await expect(assertNoDuplicateEntityIds(page)).rejects.toThrow(/storyline:42/)
  })

  // D-EVT1: det tidigare undantaget är pensionerat. Samma event bakom
  // overlayn är nu ett vanligt grindfel och får aldrig komma tillbaka.
  test('bugg: EventPrimary/EventOverlay för samma event flaggas', async ({ page }) => {
    await page.setContent(`
      <div data-scene-content>
        <div data-entity-id="event:7" data-entity-source="EventPrimary">A</div>
        <div data-entity-id="event:7" data-entity-source="EventOverlay">B</div>
      </div>
    `)
    await expect(assertNoDuplicateEntityIds(page)).rejects.toThrow(/event:7/)
  })

  // Frisk kontroll 2: en ensam instans ska förstås inte flaggas.
  test('friskt: en ensam entity-instans flaggas inte', async ({ page }) => {
    await page.setContent(`
      <div data-scene-content>
        <div data-entity-id="bid:1" data-entity-source="IncomingBidCard">A</div>
      </div>
    `)
    await expect(assertNoDuplicateEntityIds(page)).resolves.toBeUndefined()
  })
})

test.describe('meta: enPrimaryGate fångar Å3/Å4-fyndet (åtgärdslistans post 18)', () => {
  // Historiskt fynd: SMFinalPrimary OCH PortalScreen hade var sin egen
  // .btn-primary samtidigt synlig (Å3); tre IncomingBidCard blev primära
  // samtidigt via ett ovillkorligt satt primaryChoiceId (Å4).
  test('bugg: två synliga .btn-primary samtidigt flaggas', async ({ page }) => {
    await page.setContent(`
      <div data-scene-content>
        <button class="btn-primary">SM-final</button>
        <button class="btn-primary">Portal-primary</button>
      </div>
    `)
    const violations = await findEnPrimaryViolations(page)
    expect(violations.length, 'grinden missade det historiska Å3/Å4-fyndet').toBeGreaterThan(0)
    expect(violations[0].message).toMatch(/2 synliga \.btn-primary/)
  })

  // Frisk kontroll: en synlig .btn-primary (plus en dold, som inte ska
  // räknas) är helt legitimt — se enPrimaryGate.ts:s "noll är helt
  // legitimt, > 1 är kränkningen".
  test('friskt: en synlig .btn-primary flaggas inte (en dold räknas inte)', async ({ page }) => {
    await page.setContent(`
      <div data-scene-content>
        <button class="btn-primary">Enda primära</button>
        <button class="btn-primary" style="display:none;">Dold, ska inte räknas</button>
      </div>
    `)
    const violations = await findEnPrimaryViolations(page)
    expect(violations).toEqual([])
  })
})
