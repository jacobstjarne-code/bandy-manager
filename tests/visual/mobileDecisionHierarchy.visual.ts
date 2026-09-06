import { test, expect, type Page } from '@playwright/test'
import { findControlSizeViolations } from './minControlSizeGate'

async function openMobileScene(page: Page, scene: string) {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/dev/scenes?scene=${scene}&width=390`, { waitUntil: 'networkidle' })
  await page.getByText('DEV GALLERY').waitFor({ timeout: 15_000 })
  await page.addStyleTag({ content: '[data-dev-nav] { display: none !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(200)
}

function luminance([r, g, b]: number[]) {
  const channels = [r, g, b].map(value => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function rgb(value: string): number[] {
  const match = value.match(/[\d.]+/g)
  if (!match || match.length < 3) throw new Error(`Kunde inte läsa färgen: ${value}`)
  return match.slice(0, 3).map(Number)
}

function contrast(foreground: string, background: string) {
  const light = Math.max(luminance(rgb(foreground)), luminance(rgb(background)))
  const dark = Math.min(luminance(rgb(foreground)), luminance(rgb(background)))
  return (light + 0.05) / (dark + 0.05)
}

test.describe('mobil beslutshierarki @ 390×844', () => {
  test('Game Over visar tre jämlika, tryckbara CTA:er inom safe area', async ({ page }) => {
    await openMobileScene(page, 'game-over')

    const buttons = [
      page.getByRole('button', { name: 'SE KARRIÄREN', exact: true }),
      page.getByRole('button', { name: 'Se hur det går utan dig', exact: true }),
      page.getByRole('button', { name: 'NY KARRIÄR', exact: true }),
    ]
    const boxes = []
    for (const button of buttons) {
      await expect(button).toBeVisible()
      const box = await button.boundingBox()
      if (!box) throw new Error('Game Over-CTA saknar bounding box')
      boxes.push(box)
    }

    expect(boxes.map(box => Math.round(box.height))).toEqual([44, 44, 44])
    expect(new Set(boxes.map(box => Math.round(box.width))).size).toBe(1)
    expect(Math.round(boxes[1].y - (boxes[0].y + boxes[0].height))).toBe(12)
    expect(Math.round(boxes[2].y - (boxes[1].y + boxes[1].height))).toBe(12)
    expect(boxes[2].y + boxes[2].height).toBeLessThanOrEqual(844 - 24)

    const sizeCheck = await findControlSizeViolations(page, '[data-scene-content]')
    expect(sizeCheck.violations.map(v => v.message)).toEqual([])
  })

  test('månadsbeslut batchas till ett läsbart sekundärkort med rätt räknare', async ({ page }) => {
    await openMobileScene(page, 'portal-month-decisions')

    const primary = page.locator('.event-card-inline')
    await expect(primary).toHaveCount(1)
    const secondary = page.locator('.portal-secondary-card').filter({ hasText: 'Denna månad' })
    await expect(secondary).toHaveCount(1)
    await expect(secondary).toContainText('2 väntar')

    const primaryBox = await primary.boundingBox()
    const secondaryBox = await secondary.boundingBox()
    if (!primaryBox || !secondaryBox) throw new Error('Beslutskort saknar bounding box')
    expect(secondaryBox.y).toBeGreaterThanOrEqual(primaryBox.y + primaryBox.height)

    const colors = await secondary.locator('div').filter({ hasText: '2 väntar' }).last().evaluate(element => {
      const text = getComputedStyle(element)
      const card = getComputedStyle(element.closest('.portal-secondary-card') as Element)
      return { foreground: text.color, background: card.backgroundColor }
    })
    expect(contrast(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5)
  })

  test('notis, dilemma och brytpunkt har tre synligt skilda vikter', async ({ page }) => {
    await openMobileScene(page, 'decision-modes')

    const cards = page.locator('[data-decision-mode-gallery] [data-decision-card]')
    await expect(cards).toHaveCount(3)
    const styles = await cards.evaluateAll(elements => elements.map(element => {
      const style = getComputedStyle(element)
      return {
        mode: element.getAttribute('data-decision-mode'),
        background: style.backgroundColor,
        borderLeftWidth: style.borderLeftWidth,
        shadow: style.boxShadow,
      }
    }))
    const notis = styles.find(style => style.mode === 'notis')!
    const dilemma = styles.find(style => style.mode === 'dilemma')!
    const breakpoint = styles.find(style => style.mode === 'brytpunkt')!

    expect(notis.background).not.toBe(dilemma.background)
    expect(notis.shadow).toBe('none')
    expect(dilemma.shadow).toBe('none')
    expect(parseFloat(breakpoint.borderLeftWidth)).toBeGreaterThanOrEqual(3)
    expect(breakpoint.shadow).not.toBe('none')

    // Dev-galleriet ska visa de tre vikterna med verkliga produktval. Generiska
    // platshållare gör att en designgranskare bedömer en yta som spelaren
    // aldrig möter och kan dessutom misstas för läckande produktcopy.
    await expect(page.getByRole('button', { name: 'Lyft det öppet' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Acceptera \(2000 kr\/vecka\)/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Skydda truppen' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Välj den (ena|andra) vägen/ })).toHaveCount(0)
  })

  test('rund EventOverlay behåller brytpunktens accentkant', async ({ page }) => {
    await openMobileScene(page, 'event-overlay-breakpoint')

    const card = page.locator('[data-decision-mode="brytpunkt"]')
    await expect(card).toBeVisible()
    const style = await card.evaluate(element => {
      const computed = getComputedStyle(element)
      return { borderLeftWidth: computed.borderLeftWidth, borderLeftStyle: computed.borderLeftStyle, shadow: computed.boxShadow }
    })
    expect(parseFloat(style.borderLeftWidth)).toBeGreaterThanOrEqual(3)
    expect(style.borderLeftStyle).toBe('solid')
    expect(style.shadow).not.toBe('none')
  })

  test('taktiktavlans elva spelarval har tumträffyta och går att välja', async ({ page }) => {
    await openMobileScene(page, 'taktik')

    const playerDots = page.locator('svg g[role="button"][aria-label]')
    await expect(playerDots).toHaveCount(11)

    const boxes = await playerDots.evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }))
    for (const box of boxes) {
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }

    const firstDot = playerDots.first()
    await firstDot.scrollIntoViewIfNeeded()
    const firstBox = await firstDot.boundingBox()
    if (!firstBox) throw new Error('Spelarvalet saknar bounding box')
    await page.mouse.click(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2)
    await expect(page.getByText('VÄLJ FRÅN BÄNKEN ELLER EN ANNAN POSITION')).toBeVisible()

    const sizeCheck = await findControlSizeViolations(page, '[data-scene-content]')
    expect(sizeCheck.violations.map(v => v.message)).toEqual([])
  })
})
