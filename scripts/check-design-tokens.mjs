#!/usr/bin/env node
/**
 * check-design-tokens.mjs — designsystemets efterlevnads-grind (FIDELITY §4).
 *
 * Kodifierar FIDELITY-CHECKLISTAns grep-villkor till en stående grind. Varje regel
 * citerar sitt DB-beslut. RATCHET: regler vars skuld är grep-rent körs som `error`;
 * regler med kvarvarande skuld körs som `warn`. När en warn-regel når noll → flippa
 * till 'error' (rad-kommentaren visar hur).
 *
 * Körs av `npm run lint:design`. Exit non-zero endast om en ERROR-regel träffar.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const SRC = join(ROOT, 'src')

// ── Filsamling ────────────────────────────────────────────────────────────────
function walk(dir, exts, acc = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    const s = statSync(p)
    if (s.isDirectory()) {
      if (entry === 'node_modules' || entry === '__tests__') continue
      walk(p, exts, acc)
    } else if (exts.some(e => entry.endsWith(e))) {
      acc.push(p)
    }
  }
  return acc
}

const TSX = walk(SRC, ['.tsx', '.ts']).filter(f => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'))
const rel = p => p.slice(ROOT.length + 1)

// ── Regler ──────────────────────────────────────────────────────────────────
// severity: 'error' = grep-rent, får aldrig återkomma · 'warn' = känd skuld kvar
const RULES = [
  {
    id: 'tailwind-rgb', db: 'DB-1', severity: 'error',
    desc: 'Tailwind-rgb (34,197,94 / 239,68,68) → använd --success / --danger',
    re: /rgba?\(\s*(?:34,\s*197,\s*94|239,\s*68,\s*68)/,
    files: f => f.endsWith('.tsx'),
  },
  {
    id: 'radius-6', db: 'DB-9', severity: 'error',
    desc: 'off-scale borderRadius 6 → var(--radius-md) (skala 14/8/3)',
    re: /border-?[Rr]adius:\s*'?6(?:px)?'?(?![0-9.])/,
    files: f => f.endsWith('.tsx'),
  },
  {
    id: 'palette-rgba', db: 'DB-1', severity: 'error', // ratchad 2026-06-07: glow-passet klart, all palett-rgba → color-mix
    desc: 'hårdkodad palett-rgba → color-mix(var(--token) N%)',
    re: /rgba\(\s*(?:196,\s*122,\s*58|176,\s*80,\s*64|140,\s*110,\s*58|90,\s*154,\s*74|126,\s*179,\s*212|26,\s*26,\s*24)/,
    files: f => f.endsWith('.tsx'),
  },
  {
    id: 'radius-12', db: 'R2-2/DB-9', severity: 'error', // ratchad 2026-06-07: städat → 14 (ceremoni) / 8 (övrigt)
    desc: 'off-scale borderRadius 12 → var(--radius) (ceremoni) eller var(--radius-md) (övrigt)',
    re: /border-?[Rr]adius:\s*'?12(?:px)?'?(?![0-9.])/,
    files: f => f.endsWith('.tsx'),
  },
  {
    id: 'ice-in-squad', db: 'Q2/R2-3', severity: 'error', // ratchad 2026-06-07: academy-chip → --cold
    desc: 'squad-domänen använder --cold/--warm, inte --ice',
    re: /var\(--ice\)/,
    files: f => f.includes('/components/squad/') || f.endsWith('/SquadScreen.tsx'),
  },
]

// ── Körning ───────────────────────────────────────────────────────────────────
let hadError = false
let total = 0

for (const rule of RULES) {
  const hits = []
  for (const f of TSX.filter(rule.files)) {
    const lines = readFileSync(f, 'utf8').split('\n')
    lines.forEach((line, i) => {
      if (rule.re.test(line)) hits.push(`${rel(f)}:${i + 1}`)
    })
  }
  total += hits.length
  if (hits.length === 0) continue
  const tag = rule.severity === 'error' ? 'ERROR' : 'warn '
  if (rule.severity === 'error') hadError = true
  console.log(`\n[${tag}] ${rule.id} (${rule.db}) — ${rule.desc}`)
  for (const h of hits) console.log(`        ${h}`)
}

console.log('')
if (total === 0) {
  console.log('design-tokens: grep-rent ✓')
} else {
  console.log(`design-tokens: ${total} träffar (${hadError ? 'ERROR — bygget rött' : 'endast warn — bygget grönt'})`)
}
process.exit(hadError ? 1 : 0)
