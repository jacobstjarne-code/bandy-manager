import { test, expect } from '@playwright/test'

/**
 * SLUTTEST_KO 3.0 (2026-09-01): DevScenesScreen seedade Zustand via
 * useMemo under Reacts renderfas. Portal-scenerna gav därför en React-varning
 * trots att bilden ofta såg korrekt ut. Detta är en browserregression, inte en
 * pixelsnapshot: scenen måste montera och konsolen får inte rapportera en
 * render-phase update.
 */
test('Portal-devscenen seedar store utan uppdatering under React-render', async ({ page }) => {
  const renderPhaseWarnings: string[] = []
  page.on('console', message => {
    if (!['warning', 'error'].includes(message.type())) return
    const text = message.text()
    if (
      /cannot update a component while rendering/i.test(text) ||
      /setstate.*(?:during|while).*render/i.test(text) ||
      /update.*during an existing state transition/i.test(text)
    ) {
      renderPhaseWarnings.push(text)
    }
  })

  await page.goto('/dev/scenes?scene=portal-normal', { waitUntil: 'networkidle' })
  await expect(page.getByText('DEV GALLERY')).toBeVisible()
  await expect(page.locator('[data-scene-content]')).toBeVisible()

  expect(renderPhaseWarnings).toEqual([])
})
