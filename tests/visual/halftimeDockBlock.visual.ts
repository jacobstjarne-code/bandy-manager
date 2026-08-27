import { test, expect, type Page } from '@playwright/test'

/**
 * A-C1 (SLUTTEST_KO.md, BANDY_MANAGER_AUDIT_6_SASONGER_2026-08-26.md §C1):
 * BottomDock (SiffrorDrawer peek → z-index 400/--z-overlay, InteraktionsDock
 * block → z-index 500/--z-interaction) låg alltid över halvtidsmodalens
 * --z-modal (300), och ingenting stängde eller avaktiverade dockslotens
 * pekyta när showHalftime blev sant. Resultatet: matchen kunde frysa i
 * halvtid på mobilbredd — tryck på "ANDRA HALVLEK →" registrerades visuellt
 * men nådde aldrig knappen.
 *
 * Detta test spelar en riktig match från avslag i 390×844, snabbspolar till
 * halvtid, väljer ett paussnack, och klickar sedan igenom halvtidsmodalen.
 * Playwrights click() gör en actionability-check som failar om ett annat
 * element ligger ovanpå och fångar pekhändelsen — exakt den bug-klass KO-
 * posten beskriver, så testet reproducerar felet mekaniskt istf att gissa
 * koordinater. Verifierar sedan att andra halvlek faktiskt fortsätter (minut
 * 46+, data-minute på .scoreboard-root — 7-segmentsklockan är SVG utan
 * textnod, se ScoreboardStalvallen.tsx) istf att fastna bakom modalen.
 */

/**
 * Håller Snabbsim aktiv tills halvtidsmodalen dyker upp. Matchmotorn
 * stänger av FF automatiskt för högvärda ögonblick (straff, sen press,
 * se MatchLiveScreen.tsx ~rad 520/592) — den seedade matchen kan alltså
 * pausa FF flera gånger innan halvtid. Öppna interaktionspaneler löser sig
 * själva via InteractionShells inbyggda timeout (~5s, se InteractionShell.tsx)
 * så loopen behöver bara återaktivera FF, inte välja åt spelaren.
 */
async function fastForwardToHalftime(page: Page) {
  const overlay = page.locator('.match-modal-overlay')
  const ffButton = page.getByTitle('Snabbsim')
  const deadline = Date.now() + 45000
  while (Date.now() < deadline) {
    if (await overlay.isVisible().catch(() => false)) return
    const isActive = await ffButton.evaluate(el => el.classList.contains('active')).catch(() => false)
    if (!isActive) await ffButton.click({ force: true }).catch(() => {})
    await page.waitForTimeout(400)
  }
  throw new Error('halvtidsmodalen dök aldrig upp inom tidsgränsen — matchen hann inte till steg 30')
}

test('halvtidsmodalen blockeras inte av BottomDock på 390×844 — matchen når minut 46', async ({ page }) => {
  test.setTimeout(90000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/dev/scenes?scene=match-live', { waitUntil: 'networkidle' })
  await page.getByText('DEV GALLERY').waitFor({ timeout: 15000 })
  await expect(page.locator('[data-scene-content]')).toBeVisible()

  // [data-dev-nav] är position:sticky i DevScenesScreen (bra UX vid manuell
  // genombläddring) men det återfäster sig ovanpå scen-innehållet och fångar
  // klick under interaktion, inte bara screenshot-stitchning (se CLAUDE.md
  // §DEV-SCENSKALET). Samma 'capture-mode'-klass som scenes.visual.ts sätter
  // före screenshots stänger av stickyn — vi sätter den tidigt här eftersom
  // testet klickar genom hela flödet, inte bara fotograferar slutläget.
  await page.evaluate(() => document.documentElement.classList.add('capture-mode'))

  await fastForwardToHalftime(page)

  const overlay = page.locator('.match-modal-overlay')
  await expect(overlay).toBeVisible()
  await expect(overlay.getByText('HALVTID', { exact: false })).toBeVisible()

  // Mekanism-check (deterministisk, oberoende av vilken dock som råkar vara
  // öppen i just detta spelförlopp): dock-sloten (MatchLiveScreen.tsx, dock-
  // proppen till LedgerFrame) ska vara pointer-events:none så länge
  // showHalftime är sant — annars kan SiffrorDrawers eller InteraktionsDocks
  // z400/z500-lager fånga tap ovanför modalens z300, oavsett om just DEN
  // instansen av matchen råkar ha en dock synligt öppen när halvtid nås.
  const dockSlotPointerEvents = await page
    .getByTestId('match-dock-slot')
    .evaluate(el => getComputedStyle(el).pointerEvents)
  expect(dockSlotPointerEvents).toBe('none')

  // Välj ett paussnack (Spak A).
  await page.locator('.pep-opt').first().click()

  // Det kritiska klicket: om en dock med högre z-index fångar pekytan ovanpå
  // modalen failar Playwright här (elementet är inte "actionable") istf att
  // tyst klicka igenom till fel mål — samma symptom som KO-postens repro.
  await page.getByRole('button', { name: 'ANDRA HALVLEK →' }).click()
  await overlay.waitFor({ state: 'detached', timeout: 10000 })

  // Andra halvlek startar direkt på steg 31 (minut ≈47, matchCore.ts:832) —
  // klockan ska ha hoppat förbi halvtid, inte stå kvar frusen på 45.
  await expect
    .poll(
      async () => {
        const attr = await page.locator('.scoreboard-root').getAttribute('data-minute')
        return attr ? Number(attr) : 0
      },
      { timeout: 15000, message: 'matchen nådde aldrig minut 46 efter halvtid — misstänkt dock-blockering' }
    )
    .toBeGreaterThanOrEqual(46)
})
