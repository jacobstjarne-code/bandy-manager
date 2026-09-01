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
