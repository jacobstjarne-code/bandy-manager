import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const errors = []
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message))
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()) })

await page.goto('http://localhost:5173/new-game', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
await page.fill('input', 'Kassortest')
await page.getByText('GÅ VIDARE').click()
await page.waitForTimeout(1500)
await page.locator('[class*="card"]').first().click()
await page.waitForTimeout(1500)
const skip = page.getByText('Hoppa över')
if (await skip.count() > 0) { await skip.click(); await page.waitForTimeout(1000) }
for (let i = 0; i < 10; i++) {
  if (page.url().includes('/game/dashboard')) break
  const buttons = page.locator('button').filter({ hasNotText: 'rapportera' })
  const n = await buttons.count()
  if (n > 0) await buttons.last().click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(1000)
}
console.log('URL:', page.url())
const frame = page.locator('.portal-tutorial-frame')
console.log('frame count:', await frame.count())
if (await frame.count() > 0) {
  console.log('frame text:', await frame.textContent())
}
console.log('errors:', JSON.stringify(errors.slice(0, 5)))
await page.screenshot({ path: '/tmp/treasurer-verify.png' })
await browser.close()
