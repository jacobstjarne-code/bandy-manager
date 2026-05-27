/**
 * dev-screenshots.mjs — Take PNG screenshots of the dev gallery scenes.
 * Usage: node scripts/dev-screenshots.mjs
 * Requires: npx playwright install chromium (first time)
 */

import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const BASE_URL = 'http://localhost:5173'
const OUT_DIR = 'screenshots'
mkdirSync(OUT_DIR, { recursive: true })

const SCENES = [
  { id: 'cup-victory',  label: 'cup_victory',  nav: true },
  { id: 'sm-victory',   label: 'sm_victory',   nav: true },
  { id: 'season-arc',   label: 'season_arc',   nav: true },
  { id: 'portal-cards', label: 'portal_cards', nav: true },
]

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
})
const page = await context.newPage()

// Navigate to first scene to load the gallery
await page.goto(`${BASE_URL}/dev/scenes`, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)

for (const scene of SCENES) {
  // Click the nav button for this scene
  await page.click(`button:has-text("${scene.id === 'cup-victory' ? 'Cup Victory' : scene.id === 'sm-victory' ? 'SM-Final Victory' : scene.id === 'season-arc' ? 'SeasonArcCard' : 'Portal Cards'}")`)
  await page.waitForTimeout(600)

  const path = `${OUT_DIR}/${scene.label}.png`
  await page.screenshot({ path, fullPage: true })
  console.log(`✓ ${path}`)
}

await browser.close()
console.log('\nDone. PNGs in screenshots/')
