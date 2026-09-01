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
