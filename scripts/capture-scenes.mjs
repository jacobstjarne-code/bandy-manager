#!/usr/bin/env node
/**
 * capture-scenes.mjs — maskinell ◉ syn-audit. Renderar varje /dev/scenes-yta headless
 * (deterministisk fingerad state, ?scene=<id>) → screenshots/audit/<id>.png + INDEX.md.
 *
 * Den samlade bilagan (INDEX.md) är vad Jacob godkänner i stället för en live-session.
 * Kräver en körande server (dev eller `vite preview`). BASE_URL override via env.
 *
 *   npm run dev &        # eller: npm run build && npx vite preview --port 5173
 *   node scripts/capture-scenes.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.BASE_URL || 'http://localhost:5173'
const OUT = join(import.meta.dirname, '..', 'screenshots', 'audit')

// Speglar SCENES i DevScenesScreen.tsx (svep-ytorna). Håll i synk vid nya scener.
const SCENES = [
  ['cup-victory', 'Cup Victory (ceremoni)'],
  ['sm-victory', 'SM-Final Victory (ceremoni)'],
  ['season-arc', 'SeasonArcCard (toppa)'],
  ['portal-cards', 'Portal Cards (mörk yta)'],
  ['efterklang', 'Efterklang + economicScar-efterdyning'],
  ['squad', 'SquadScreen (DB-5 stripe + R2-3 chip + Q1)'],
  ['portal', 'PortalScreen (dashboard)'],
  ['tranare', 'TranareTab (manager-karaktär)'],
  ['board-a', 'BoardMeeting A'],
  ['board-b', 'BoardMeeting B (DB-2: B-läge accent, ej guld)'],
  ['board-c', 'BoardMeeting C'],
  ['stillness', 'NU-stiltje'],
  ['granska', 'Granska (IA) — liga'],
  ['granska-cup', 'Granska — cup, vanlig runda (AUDIT DEL 3 matchtypsmatrisen)'],
  ['granska-cup-final', 'Granska — cup, finalhelgen neutral plan (AUDIT DEL 3 matchtypsmatrisen)'],
  ['granska-slutspel', 'Granska — slutspel (AUDIT DEL 3 matchtypsmatrisen)'],
  ['granska-avsked', 'Granska — avskedsmatch (AUDIT DEL 3 matchtypsmatrisen)'],
  ['upptakt', 'Upptakt (C-SD2)'],
  ['ekonomi', 'EkonomiTab (DB-4 saldo Georgia)'],
  ['playercard', 'PlayerCard'],
  ['season-a', 'SeasonSummary A (R2-1 hero + R2-2 btn-hero)'],
  ['season-b', 'SeasonSummary B'],
  ['season-c', 'SeasonSummary C'],
  ['miljoheader-karlsborg', 'MiljöHeader — Karlsborg (arctic_coast, mörkast/blåast)'],
  ['miljoheader-rogle', 'MiljöHeader — Rögle (scanian_coast, mildast/ljusast)'],
  // Full-täckning (audit-spec task #1) — riktiga skärmar headless
  ['tabell', 'Tabell (DB-8 solid header + managed-rad)'],
  ['season-header', 'SeasonSummary header — mästare (DB-3 + R2-1 hero-titel + R2-2 btn-hero + cup)'],
  ['season-noplayoffs', 'SeasonSummary — mittfält, inget slutspel (AUDIT DEL 2 Etapp B-baseline)'],
  ['season-fired', 'SeasonSummary — styrelsen besviken, sparkad (AUDIT DEL 2 Etapp B-baseline)'],
  ['transfers-closed', 'Transfers — fönster stängt (AUDIT DEL 2 Etapp B-baseline)'],
  ['transfers-open-nobids', 'Transfers — fönster öppet, inga bud (AUDIT DEL 2 Etapp B-baseline)'],
  ['transfers-onebid', 'Transfers — ett inkommande bud (AUDIT DEL 2 Etapp B-baseline)'],
  ['transfers-multibids', 'Transfers — flera inkommande bud (AUDIT DEL 2 Etapp B-baseline)'],
  ['finalhelg', 'Finalhelg-portal (IllustrationScene header-band)'],
  ['annandagen', 'Annandagen-anslag (IllustrationScene band)'],
  ['arrival', 'ArrivalScene (IllustrationScene fullbleed-bakgrund)'],
  ['squad-trupp', 'SquadScreen — TRUPP-flik (DB-5 stripe + R2-3 chips)', 'button:has-text("Trupp")'],
  ['momentumbar', 'MomentumBar (ärlig — kvitterings-läge, nål=homeInitiative)'],
  ['tacticmodal', 'TacticChangeModal (🟥 → mörk Stålvallen-panel)'],
  ['submodal', 'SubstitutionModal (🟥 → mörk Stålvallen-panel)'],
  ['spakb', 'Spak B — sent matchningsval (feed-kort, amber)'],
  ['club-fresh', 'Club — säsong 1, inga öppna minnen (AUDIT DEL 3, Klubben i korthet)'],
  ['club-established', 'Club — etablerad epok, flera öppna minnen (AUDIT DEL 3, Klubben i korthet)'],
]

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()

const rows = []
for (const [id, label, clickText] of SCENES) {
  try {
    await page.goto(`${BASE}/dev/scenes?scene=${id}`, { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(700) // fade-in/konfetti-animationer
    if (clickText) { // t.ex. byt till TRUPP-fliken före screenshot
      await page.click(clickText, { timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(400)
    }
    await page.screenshot({ path: join(OUT, `${id}.png`), fullPage: true })
    // Error-boundary-detektering — ✓ ska betyda RENDERAD, inte bara "ingen Playwright-throw"
    const errored = await page.locator('text=Något gick fel').count().catch(() => 0)
    if (errored > 0) {
      rows.push(`### ${label}\n\n\`${id}\` — **ERROR BOUNDARY (renderade "Något gick fel")**\n\n![${id}](./${id}.png)\n`)
      console.log(`✗ ${id}: error boundary`)
    } else {
      rows.push(`### ${label}\n\n\`${id}\`\n\n![${id}](./${id}.png)\n`)
      console.log(`✓ ${id}`)
    }
  } catch (e) {
    rows.push(`### ${label}\n\n\`${id}\` — **CAPTURE FAILED:** ${e.message}\n`)
    console.log(`✗ ${id}: ${e.message}`)
  }
}

await browser.close()

const index = `# ◉ Syn-audit — svep-ytor (maskinell bilaga)

Genererad av \`scripts/capture-scenes.mjs\` ur /dev/scenes (deterministisk fingerad state).
Jacob godkänner det visuella svepet via denna bilaga — ingen live-session krävs.
Regenerera: starta servern + \`node scripts/capture-scenes.mjs\`.

${SCENES.length} ytor.

---

${rows.join('\n')}`
writeFileSync(join(OUT, 'INDEX.md'), index)
console.log(`\nBilaga: screenshots/audit/INDEX.md (${SCENES.length} ytor)`)
