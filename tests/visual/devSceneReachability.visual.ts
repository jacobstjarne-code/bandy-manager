import { test, expect } from '@playwright/test'

/**
 * En pixelsnapshot kan fortsätta vara "grön" när en dev-scen i själva verket
 * har redirectat till en annan, visuellt giltig skärm. Dessa kontroller låser
 * därför scenens IDENTITET: produktkomponenten och dess unika innehåll måste
 * finnas kvar efter mount.
 */
test('Arrival-devscenen renderar Ankomsten och redirectar inte till dashboard', async ({ page }) => {
  await page.goto('/dev/scenes?scene=arrival&width=390', { waitUntil: 'networkidle' })

  await expect(page.getByText('DEV GALLERY')).toBeVisible()
  await expect(page.locator('[data-scene-content] .arrival-scene')).toBeVisible()
  await expect(page.getByText(/Ankomsten/).last()).toBeVisible()
  await expect(page.getByText(/Bengt Ek/).first()).toBeVisible()
  await expect(page).toHaveURL(/\/dev\/scenes\?scene=arrival/)
})

test('Klubbvalets dev-scen visar alla tre svårighetsnivåerna deterministiskt', async ({ page }) => {
  await page.goto('/dev/scenes?scene=club-selection&width=390', { waitUntil: 'networkidle' })

  await expect(page.getByRole('heading', { name: 'Tre klubbar har ringt' })).toBeVisible()
  for (const label of ['LÄTT', 'MEDEL', 'SVÅR']) {
    await expect(page.getByText(label, { exact: true })).toHaveCount(1)
  }
  await expect(page).toHaveURL(/\/dev\/scenes\?scene=club-selection/)
})

test('Säsongsdelningsscenen bär ett verkligt SÄSONGENS MATCH-kort', async ({ page }) => {
  await page.goto('/dev/scenes?scene=season-share&width=390', { waitUntil: 'networkidle' })

  await expect(page.getByText(/SÄSONGENS MATCH/).last()).toBeVisible()
  await expect(page.getByText('5–4', { exact: true })).toBeVisible()
  await expect(page.getByText('Karl Lindström avgjorde på tilläggstid efter vinterns stora vändning.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Dela säsongen', exact: true })).toBeVisible()
})

test('CallupModal-devscenen visar två uttagna spelare och bonusen', async ({ page }) => {
  await page.goto('/dev/scenes?scene=callup-modal&width=390', { waitUntil: 'networkidle' })

  const dialog = page.getByRole('dialog', { name: 'Landslagsuttagning' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('2 spelare uttagna till VM-truppen.')).toBeVisible()
  await expect(dialog.getByText('Erik Johansson', { exact: true })).toBeVisible()
  await expect(dialog.getByText('Karl Lindström', { exact: true })).toBeVisible()
  await expect(dialog.getByText('+10 tkr')).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Stäng' })).toBeVisible()
})

test('Slutspelsintroduktionen visar placering, topp 8 och nästa steg', async ({ page }) => {
  await page.goto('/dev/scenes?scene=playoff-intro&width=390', { waitUntil: 'networkidle' })
  const scene = page.locator('[data-scene-content]')

  await expect(scene.getByText('Grundserien avklarad', { exact: true })).toBeVisible()
  await expect(scene.getByText('TOPP 8 — SLUTSPELSKLARA')).toBeVisible()
  await expect(scene.getByRole('button', { name: /STARTA SLUTSPELET/ })).toBeVisible()
})

test('Kvartsfinalsammanfattningen visar avancemang och semifinalpar', async ({ page }) => {
  await page.goto('/dev/scenes?scene=qf-summary&width=390', { waitUntil: 'networkidle' })
  const scene = page.locator('[data-scene-content]')

  await expect(scene.getByText('KVARTSFINALERNA AVGJORDA')).toBeVisible()
  await expect(scene.getByText('Semifinalerna väntar. Bäst av fem.')).toBeVisible()
  await expect(scene.getByText('SEMIFINALER — BÄST AV 5')).toBeVisible()
  await expect(scene.getByRole('button', { name: /STARTA SEMIFINALERNA/ })).toBeVisible()
})

test('Champion-scenen visar hela slutspelsresan och SM-guldet', async ({ page }) => {
  await page.goto('/dev/scenes?scene=champion&width=390', { waitUntil: 'networkidle' })
  const scene = page.locator('[data-scene-content]')

  await expect(scene.getByRole('heading', { name: 'Svenska Mästare!' })).toBeVisible()
  await expect(scene.getByText('SLUTSPELSRESA')).toBeVisible()
  await expect(scene.getByText(/^Kvartsfinal vs /)).toBeVisible()
  await expect(scene.getByText(/^Semifinal vs /)).toBeVisible()
  await expect(scene.getByText(/^SM-Final vs /)).toBeVisible()
  await expect(scene.getByRole('button', { name: /Nästa säsong/ })).toBeVisible()
})

test('Lönekravsscenen visar två verkliga spelare och ett aktivt val', async ({ page }) => {
  await page.goto('/dev/scenes?scene=contract-demands&width=390', { waitUntil: 'networkidle' })
  const scene = page.locator('[data-scene-content]')

  await expect(scene.getByText('LÖNEKRAV')).toBeVisible()
  await expect(scene.getByText('Mattias Holm')).toBeVisible()
  await expect(scene.getByText('Daniel Pettersson')).toBeVisible()
  await expect(scene.getByRole('button', { name: 'BEKRÄFTA BESLUT →' })).toBeVisible()
})

test('Karriäruppehållet visar säsongen utan spelaren före marknaden', async ({ page }) => {
  await page.goto('/dev/scenes?scene=career-break&width=390', { waitUntil: 'networkidle' })
  const scene = page.locator('[data-scene-content]')

  await expect(scene.getByText('Edsbyn BK', { exact: true })).toBeVisible()
  await expect(scene.getByText(/Oskar Berglund/)).toBeVisible()
  await expect(scene.getByRole('button')).toBeVisible()
})

test('Inkorgsscenen visar alla tre severity-grupperna', async ({ page }) => {
  await page.goto('/dev/scenes?scene=inbox&width=390', { waitUntil: 'networkidle' })
  const scene = page.locator('[data-scene-content]')

  await expect(scene.getByText('KRÄVER SVAR')).toBeVisible()
  await expect(scene.getByText('NYHETER')).toBeVisible()
  await expect(scene.getByText('RAPPORTER')).toBeVisible()
})

test('Simuleringssammanfattningen visar tre matcher och tabellklättring', async ({ page }) => {
  await page.goto('/dev/scenes?scene=sim-summary&width=390', { waitUntil: 'networkidle' })
  const scene = page.locator('[data-scene-content]')

  await expect(scene.getByText('SIMULERINGSRESULTAT')).toBeVisible()
  await expect(scene.getByText('3 matcher simulerade')).toBeVisible()
  await expect(scene.getByText('5:e')).toBeVisible()
  await expect(scene.getByText('3:e')).toBeVisible()
})

test('Hallprövningen visar förankringsfas och stöd-mätare', async ({ page }) => {
  await page.goto('/dev/scenes?scene=hall-provning&width=390', { waitUntil: 'networkidle' })
  const scene = page.locator('[data-scene-content]')

  await expect(scene.getByText('FÖRANKRING')).toBeVisible()
  await expect(scene.getByText('STÖD I BYGDEN')).toBeVisible()
  await expect(scene.getByText('56')).toBeVisible()
})

test('Kafferummet visar ett verkligt vardagsutbyte', async ({ page }) => {
  await page.goto('/dev/scenes?scene=coffee-room&width=390', { waitUntil: 'networkidle' })
  const scene = page.locator('[data-scene-content]')

  await expect(scene.getByText('I DETTA ÖGONBLICK')).toBeVisible()
  await expect(scene.getByRole('button', { name: /Tillbaka/ })).toBeVisible()
})

test('Valet visar byggalternativ och ett likvärdigt avstå-val', async ({ page }) => {
  await page.goto('/dev/scenes?scene=valet&width=390', { waitUntil: 'networkidle' })
  const scene = page.locator('[data-scene-content]')

  await expect(scene.getByText(/Vad bygger Edsbyn BK i år/)).toBeVisible()
  await expect(scene.getByText('Värmestuga', { exact: true })).toBeVisible()
  await expect(scene.getByText('Vi väntar i år', { exact: true })).toBeVisible()
})

test('Journalistrelationen visar namn, relation och minnen', async ({ page }) => {
  await page.goto('/dev/scenes?scene=journalist-relationship&width=390', { waitUntil: 'networkidle' })
  const scene = page.locator('[data-scene-content]')

  await expect(scene.getByText('Britta Sandström', { exact: true })).toBeVisible()
  await expect(scene.getByText('Relation', { exact: true })).toBeVisible()
  await expect(scene.getByText('Senast hörda')).toBeVisible()
})

test('Cupintrot visar första beatet och nästa CTA', async ({ page }) => {
  await page.goto('/dev/scenes?scene=cup-intro&width=390', { waitUntil: 'networkidle' })
  const scene = page.locator('[data-scene-content]')

  await expect(scene.getByText('CUPEN')).toBeVisible()
  await expect(scene.getByText('Innan serien')).toBeVisible()
  await expect(scene.getByRole('button')).toBeVisible()
})

test('Söndagsträningen visar plats, spelare och val', async ({ page }) => {
  await page.goto('/dev/scenes?scene=sunday-training&width=390', { waitUntil: 'networkidle' })
  const scene = page.locator('[data-scene-content]')

  await expect(scene.getByText('I DETTA ÖGONBLICK')).toBeVisible()
  await expect(scene.getByRole('button')).toHaveCount(4)
})

test('Säsongssignaturen visar kall vinter som riktig scen', async ({ page }) => {
  await page.goto('/dev/scenes?scene=season-signature-reveal&width=390', { waitUntil: 'networkidle' })
  const scene = page.locator('[data-scene-content]')

  await expect(scene.getByText('KÖLDVINTERN')).toBeVisible()
  await expect(scene.getByRole('button')).toBeVisible()
})

test('Scouting-scenen visar både talangspaning och utvärderingspool', async ({ page }) => {
  await page.goto('/dev/scenes?scene=scouting&width=390', { waitUntil: 'networkidle' })
  const scene = page.locator('[data-scene-content]')

  await expect(scene.getByText('Ny talangspaning')).toBeVisible()
  await expect(scene.getByText('Spelare att utvärdera')).toBeVisible()
  await expect(scene.getByRole('button', { name: 'Utvärdera' }).first()).toBeVisible()
})

test('Introt går från kallöppning till karriär-CTA', async ({ page }) => {
  await page.goto('/dev/scenes?scene=intro-sequence&width=390', { waitUntil: 'networkidle' })

  await expect(page.getByText('Strålkastarna tänds. Isen ligger klar.')).toBeVisible({ timeout: 3_000 })
  await expect(page.getByRole('button', { name: 'STARTA KARRIÄREN' })).toBeVisible({ timeout: 7_000 })
  await expect(page.getByText('En ort. Ett lag. Ett mål.')).toBeVisible()
})

test('Tillträdet visar klubb, assistent och första riktiga steg', async ({ page }) => {
  await page.goto('/dev/scenes?scene=tilltrade&width=390', { waitUntil: 'networkidle' })
  const scene = page.locator('[data-scene-content]')

  await expect(scene.getByText(/Tillträdet/)).toBeVisible()
  await expect(scene.getByText('Assisterande tränare', { exact: false })).toBeVisible()
  await expect(scene.getByRole('button', { name: 'Visa mig' })).toBeVisible()
})

test('Namnsteget visar identitetsfråga, fält och nästa CTA', async ({ page }) => {
  await page.goto('/dev/scenes?scene=name-input&width=390', { waitUntil: 'networkidle' })
  const scene = page.locator('[data-scene-content]')

  await expect(scene.getByText('VEM ÄR DU?')).toBeVisible()
  await expect(scene.getByPlaceholder('Ditt namn')).toBeVisible()
  await expect(scene.getByRole('button', { name: /GÅ VIDARE/ })).toBeVisible()
})

test('Klubbpärmen visar riktig dialog, klubb och kapitel', async ({ page }) => {
  await page.goto('/dev/scenes?scene=klubbparm&width=390', { waitUntil: 'networkidle' })
  const dialog = page.getByRole('dialog', { name: 'Klubbpärmen' })

  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Klubbpärmen', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Stäng' })).toBeVisible()
})

test('Avskedsceremonin visar spelaren, avskedet och båda valen', async ({ page }) => {
  await page.goto('/dev/scenes?scene=ceremony-retirement&width=390', { waitUntil: 'networkidle' })

  await expect(page.getByText('🎖️ AVSKED', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Karl Lindström' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Erbjud en roll i ledarstaben' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tacka av honom på isen' })).toBeVisible()
})

test('Granska nivå 3 visar det persisterade valet som belagt citat', async ({ page }) => {
  await page.goto('/dev/scenes?scene=granska-level3&width=390&inspect=1', { waitUntil: 'networkidle' })
  const chosen = page.locator('[data-scene-content]').getByText('Godkänn kravet', { exact: true })

  await chosen.scrollIntoViewIfNeeded()
  await expect(chosen).toBeVisible()
  await expect(chosen.locator('xpath=preceding-sibling::span[1]')).toHaveText('✓')
})

test('Styrelsens minimalkort visar ultimatum, orsak och väg tillbaka', async ({ page }) => {
  await page.goto('/dev/scenes?scene=board-patience-minimal&width=390&inspect=1', { waitUntil: 'networkidle' })
  const scene = page.locator('[data-scene-content]')

  await expect(scene.getByText('Ultimatum', { exact: true })).toBeVisible()
  await expect(scene.getByText('Ni ligger under det de begärde.')).toBeVisible()
  await expect(scene.getByText('Det som återstår: Nå topp 6.')).toBeVisible()
})

test('Derbykortets vs-gren renderas i portalens mörka kontext', async ({ page }) => {
  await page.goto('/dev/scenes?scene=next-match-derby&width=390&inspect=1', { waitUntil: 'networkidle' })
  const primary = page.locator('[data-primary-card]')

  await expect(primary).toBeVisible()
  await expect(primary.getByText('DERBY', { exact: true })).toBeVisible()
  await expect(primary.getByText('vs', { exact: true })).toBeVisible()
})

test('Annandagskortets vs-gren renderas i portalens mörka kontext', async ({ page }) => {
  await page.goto('/dev/scenes?scene=next-match-annandagen&width=390&inspect=1', { waitUntil: 'networkidle' })
  const primary = page.locator('[data-primary-card]')

  await expect(primary).toBeVisible()
  await expect(primary.getByText('Annandagsbandyn', { exact: true })).toBeVisible()
  await expect(primary.getByText('vs', { exact: true })).toBeVisible()
})
