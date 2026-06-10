#!/usr/bin/env node
/**
 * ds-guard.mjs — typroll-vakt (ratchet).
 *
 * Räknar inline-reimplementeringar av kanon-typroller i src/presentation/.
 * Fail om antalet ÖKAR mot baslinjen; passerar (med info) om antalet sjunker.
 *
 * Mönster som räknas:
 *   fontSize9      — inline `fontSize: 9`  (ska vara .h-label / .h-eyebrow / .h-scene-genre)
 *   fontDisplay    — inline `fontFamily: 'var(--font-display)'`  (ska vara .h-quote / .h-display-*)
 *   offScaleRadius — inline `borderRadius:` med numeriskt värde ∉ {3, 8, 14, 99}
 *
 * INTE räknat:
 *   borderLeft / border med stripes-mönstret  (sanktionerat — aldrig false-positive)
 *   borderRadius: 'var(--radius...)'           (token, ok)
 *   DevScenesScreen.tsx, __tests__/, // ds-exempt på samma eller föregående rad
 *
 * Körs av `npm run lint:design-guard`.
 * Baslinje: scripts/ds-guard-baseline.json.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const PRESENTATION = join(ROOT, 'src', 'presentation')
const BASELINE_PATH = join(ROOT, 'scripts', 'ds-guard-baseline.json')

// ── Filsamling ────────────────────────────────────────────────────────────────
function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    const s = statSync(p)
    if (s.isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue
      walk(p, acc)
    } else if (entry.endsWith('.tsx') && entry !== 'DevScenesScreen.tsx') {
      acc.push(p)
    }
  }
  return acc
}

const FILES = walk(PRESENTATION)
const rel = p => p.slice(ROOT.length + 1)

// ── Off-scale radius detector ─────────────────────────────────────────────────
// Match `borderRadius: N` where N is a plain integer not in {3, 8, 14, 99}
// and NOT followed by 'var(' (token form).
const SCALE = new Set([3, 8, 14, 99])
const RADIUS_RE = /borderRadius:\s*(\d+)(?![0-9])/

function isOffScaleRadius(line) {
  const m = line.match(RADIUS_RE)
  if (!m) return false
  // Skip token form (already caught by "not a digit after the number" but be explicit)
  if (/borderRadius:\s*'?var\(/.test(line)) return false
  return !SCALE.has(Number(m[1]))
}

// ── Mönster ───────────────────────────────────────────────────────────────────
const PATTERNS = {
  fontSize9:       line => /fontSize:\s*9(?!\d)/.test(line),
  fontDisplay:     line => /fontFamily:\s*'var\(--font-display\)'/.test(line),
  offScaleRadius:  line => isOffScaleRadius(line),
}

// ── Scan ──────────────────────────────────────────────────────────────────────
// `// ds-exempt` on the same line OR the immediately preceding line → skip
const counts = { fontSize9: 0, fontDisplay: 0, offScaleRadius: 0 }
const hits   = { fontSize9: [], fontDisplay: [], offScaleRadius: [] }

for (const file of FILES) {
  const lines = readFileSync(file, 'utf8').split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const prev = i > 0 ? lines[i - 1] : ''
    if (line.includes('// ds-exempt') || prev.includes('// ds-exempt')) continue

    const fileRel = rel(file)
    for (const [key, test] of Object.entries(PATTERNS)) {
      if (test(line)) {
        counts[key]++
        hits[key].push(`${fileRel}:${i + 1}`)
      }
    }
  }
}

// ── Baslinje ──────────────────────────────────────────────────────────────────
const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))

// ── Rapport ───────────────────────────────────────────────────────────────────
let hadError = false
const LABELS = {
  fontSize9:      'fontSize: 9  → .h-label / .h-eyebrow / .h-scene-genre',
  fontDisplay:    "fontFamily: 'var(--font-display)'  → .h-quote / .h-display-*",
  offScaleRadius: 'borderRadius ∉ {3,8,14,99}  → radie-skalan',
}

for (const [key, label] of Object.entries(LABELS)) {
  const count = counts[key]
  const base  = baseline[key]

  if (count > base) {
    hadError = true
    console.log(`\n[ERROR] ${key} — ${label}`)
    console.log(`        baslinje ${base} → nu ${count} (+${count - base})`)
    const newHits = hits[key].slice(base)
    for (const h of newHits) console.log(`        ${h}`)
  } else if (count < base) {
    console.log(`[info]  ${key}: ${count} (baslinje ${base}) — ratchet kan sänkas till ${count}`)
  }
}

console.log('')
if (!hadError) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const allMatch = Object.entries(counts).every(([k, v]) => v === baseline[k])
  if (allMatch) {
    console.log('ds-guard: på baslinje ✓')
  } else {
    console.log(`ds-guard: under baslinje ✓  (${total} träffar totalt — uppdatera baslinjen vid nästa migreringssprint)`)
  }
}

process.exit(hadError ? 1 : 0)
