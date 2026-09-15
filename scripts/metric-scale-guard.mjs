#!/usr/bin/env node
/**
 * metric-scale-guard.mjs — begriplighet-klass-d (BEGRIPLIGHETSREVISION_2026-09-12,
 * Opus dom 2026-09-15): "en mätare som visas för spelaren visas ALDRIG som
 * naken siffra — antingen bar med normalzon, eller kvalitativ text."
 *
 * Ratchet, samma mönster som ds-guard.mjs: räknar nakna renderingar av kända
 * "mjuka" 0-100-mätare (communityStanding, supporterGroup.mood) i JSX-uttryck.
 * Fail bara om antalet ÖKAR mot baslinjen — befintlig skuld (aliasade
 * variabler som `cs`/`morale`, SVG-noder i OrtenMap.tsx, `Stat`-komponentens
 * `value`-prop) fångas INTE av denna första version (statisk textmatchning
 * kan inte följa variabel-alias utan en riktig AST) — se
 * MASTER_OPPET.md:s begriplighet-klass-d-e-rad för den kända kvarvarande
 * listan. Denna grind skyddar mot NYA raka `communityStanding`/`.mood`-
 * renderingar framåt; den är ett startvärde, inte ett fullständigt filter.
 *
 * Mönster som räknas (bara inuti ett JSX-uttryck `{...}`):
 *   nakedCommunityStanding — `{...communityStanding...}` utan "/100" på samma rad
 *   nakedSupporterMood     — `{...\.mood...}` (t.ex. sg.mood, supporterGroup.mood)
 *                             utan "/100" på samma rad
 *
 * Undantag: "/100" på raden (redan skalad), `klackMoodLabel(`/`moodLabel`/
 * `StatBar`/`Bar` på raden (redan kvalitativt/bar-wrappat), eller
 * `// metric-scale-exempt` på samma eller föregående rad.
 *
 * Körs av `npm run lint:metric-scale`.
 * Baslinje: scripts/metric-scale-guard-baseline.json.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const PRESENTATION = join(ROOT, 'src', 'presentation')
const BASELINE_PATH = join(ROOT, 'scripts', 'metric-scale-guard-baseline.json')

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

const SAFE_MARKERS = /\/100|klackMoodLabel\(|moodLabel|StatBar|<Bar\b/

// Bara ett STANDALONE JSX-uttryck — braces innehåller ENDAST en property-
// path (ev. med ?? fallback), inget annat (inga jämförelser/style-objekt).
// Det utesluter träffar som bara använder fältet för en färgtröskel
// (`style={{ color: communityStanding > 70 ? ... }}`) — den displayade
// siffran, om någon, står på en annan rad.
const COMMUNITY_STANDING_RE = /\{\s*(?:[\w.?]+\.)?communityStanding(?:\s*\?\?\s*[\w.]+)?\s*\}/
const SUPPORTER_MOOD_RE = /\{\s*[\w.?]*\.mood(?:\s*\?\?\s*[\w.]+)?\s*\}/

const PATTERNS = {
  nakedCommunityStanding: line =>
    COMMUNITY_STANDING_RE.test(line) && !SAFE_MARKERS.test(line),
  nakedSupporterMood: line =>
    SUPPORTER_MOOD_RE.test(line) && !SAFE_MARKERS.test(line),
}

const counts = { nakedCommunityStanding: 0, nakedSupporterMood: 0 }
const hits = { nakedCommunityStanding: [], nakedSupporterMood: [] }

for (const file of FILES) {
  const lines = readFileSync(file, 'utf8').split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const prev = i > 0 ? lines[i - 1] : ''
    if (line.includes('// metric-scale-exempt') || prev.includes('// metric-scale-exempt')) continue

    const fileRel = rel(file)
    for (const [key, test] of Object.entries(PATTERNS)) {
      if (test(line)) {
        counts[key]++
        hits[key].push(`${fileRel}:${i + 1}`)
      }
    }
  }
}

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))

let hadError = false
const LABELS = {
  nakedCommunityStanding: 'communityStanding utan skala/bar i JSX',
  nakedSupporterMood: 'supporterGroup.mood utan skala/bar i JSX',
}

for (const [key, label] of Object.entries(LABELS)) {
  const count = counts[key]
  const base = baseline[key]

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
    console.log('metric-scale-guard: på baslinje ✓')
  } else {
    console.log(`metric-scale-guard: under baslinje ✓  (${total} träffar totalt)`)
  }
}

process.exit(hadError ? 1 : 0)
