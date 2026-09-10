import { expect, test, type Page } from '@playwright/test'

async function expectLoadedImage(page: Page, sourceSuffix: string) {
  const image = page.locator(`img[src$="${sourceSuffix}"], img[src*="${sourceSuffix}?"]`).first()
  await expect(image).toBeVisible()
  await expect.poll(async () => image.evaluate(el => {
    const img = el as HTMLImageElement
    return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0
  })).toBe(true)
}

test('all twelve club images are wired in arrival and opponent-intro surfaces', async ({ page }) => {
  const clubs = [
    'forsbacka', 'gagnef', 'halleforsnas', 'heros', 'karlsborg', 'lesjofors',
    'malilla', 'rogle', 'skutskar', 'slottsbron', 'soderfors', 'vastanfors',
  ]

  for (const club of clubs) {
    await page.goto(`/dev/scenes?scene=arrival&club=club_${club}&width=390&inspect=1`)
    await expectLoadedImage(page, `intro-${club}.webp`)

    await page.goto(`/dev/scenes?scene=opponent-intro&club=club_${club}&width=390&inspect=1`)
    await expectLoadedImage(page, `intro-${club}.webp`)
  }
})

test('every product moment with a dedicated image renders a loaded asset', async ({ page }) => {
  const scenes: Array<[string, string]> = [
    ['annandagen', 'annandagen.jpg'],
    ['finalhelg', 'final.jpg'],
    ['match-laddning-nyar', 'nyar.jpg'],
    ['portal-facility-completed', 'facility-completed.jpg'],
    ['press-conference', 'press.jpg'],
    ['career-break', 'career-break.jpg'],
    ['coffee-room', 'kafferummet.jpg'],
    ['valet', 'valet.jpg'],
    ['cup-intro', 'cup.jpg'],
    ['mecenat-dinner', 'mecenat-dinner.jpg'],
    ['ceremony-cup-final', 'cupguld.jpg'],
    ['season-header', 'season-end.jpg'],
  ]

  for (const [scene, asset] of scenes) {
    await page.goto(`/dev/scenes?scene=${scene}&width=390&inspect=1`)
    await expectLoadedImage(page, asset)
  }
})

test('curated player portraits load while the unfinished experienced tier uses its safe fallback', async ({ page }) => {
  await page.goto('/dev/scenes?scene=squad-trupp&width=390&inspect=1')
  await page.getByRole('tab', { name: 'Trupp' }).click()

  const curated = page.locator('[data-player-portrait-kind="curated"]')
  await expect(curated.first()).toBeVisible()
  expect(await curated.count()).toBeGreaterThan(0)
  for (let index = 0; index < await curated.count(); index++) {
    expect(await curated.nth(index).evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  }

  await expect(page.locator('[data-player-portrait-kind="fallback"]').first()).toBeVisible()
})
