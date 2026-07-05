#!/usr/bin/env node
/**
 * text-guard-lint.mjs — bandyterminologins efterlevnads-grind (textaudit-protokollet).
 *
 * Kodifierar TERMLISTA v2 (docs/TEXT-AUDIT-PROTOKOLL.md) FEL I BANDY-listans
 * lågtvetydiga termer till en stående grind, i samma ratchet-stil som
 * check-design-tokens.mjs: 'error' = grep-rent idag, 'warn' = känd risk kvar
 * eller medvetet flaggad för mänsklig läsning.
 *
 * MISSTANKAR-listan (döm i kontext: tackla, sparka, chippa, period, krysset,
 * kedja/femma m.fl.) kodifieras INTE här — de är för tvetydiga för regex utan
 * enorm falsk-positiv-kvot, protokollet säger uttryckligen "döm i kontext".
 * ÄKTA BANDY-listan flaggas aldrig (regelbokstermer, se protokollet).
 *
 * Körs av `npm run lint:text-guard`. Exit non-zero endast om en ERROR-regel träffar.
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

const FILES = walk(SRC, ['.ts', '.tsx', '.json']).filter(
  f => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx')
)
const rel = p => p.slice(ROOT.length + 1)

// ── Regler ──────────────────────────────────────────────────────────────────
// severity: 'error' = grep-rent, får aldrig återkomma · 'warn' = känd/ny risk, granska manuellt
const RULES = [
  {
    id: 'header-ball', ref: 'TERMLISTA v2', severity: 'error',
    desc: '"nick"/"nicka"/"skalle" (spela boll med huvud) — förbjudet i bandy',
    re: /\b(nick(a|ade|at)?|skallade?|skalla)\b.{0,20}\bboll(en)?\b|\bboll(en)?\b.{0,20}\b(nick(a|ade|at)?|skallade?|skalla)\b/i,
  },
  {
    id: 'hockey-nedslapp', ref: 'TERMLISTA v2', severity: 'error',
    desc: '"nedsläpp" — hockey (domaren släpper pucken); bandy: avslag/tekning',
    re: /\bnedsläpp(et)?\b/i,
  },
  {
    id: 'hockey-puck-icing', ref: 'TERMLISTA v2', severity: 'error',
    desc: '"puck"/"icing" — hockey, bandy spelas med boll',
    re: /\bpuck(en|ar)?\b|\bicing\b/i,
  },
  {
    id: 'rink', ref: 'TERMLISTA v2 + CLAUDE.md', severity: 'error',
    desc: '"rink" — hockey (bandy spelas på PLAN). Undantag: uttrycklig rinkbandy-kontext ELLER --ice-rink/--ice-rink-deep (etablerat DS-tokennamn, design-system/colors_and_type.css — namnbyte är en design-token-fråga, inte textaudit; flaggat separat till Design)',
    re: /\brink(en|ar)?\b/i,
    exclude: /rinkbandy|--ice-rink/i,
  },
  {
    id: 'football-restarts', ref: 'TERMLISTA v2', severity: 'error',
    desc: '"inlägg"/"hörnspark"/"frispark"/"straffspark"/"avspark" — fotboll (bandy: hörnslag/hörna, frislag, straffslag/straff, avslag)',
    re: /\b(hörnspark(en|ar)?|frispark(en|ar)?|straffspark(en|ar)?|avspark(en)?|tåpaj(en)?)\b/i,
  },
  {
    id: 'quote-role-coach', ref: 'M66b', severity: 'error',
    desc: '"role": "Coach" i citat-attribution — ska vara "Tränare"',
    re: /"role"\s*:\s*"Coach"/,
  },
  {
    id: 'ordinal-e-on-minute-token', ref: 'termlista-finalisering 2026-07-05', severity: 'error',
    desc: 'hårdkodad ":e"-ordinal på minuttoken — svenska ordinaler på tal som slutar 1/2 (utom 11/12) tar ":a" (21:a, 31:a…), inte ":e"',
    re: /\$\{\w*[Mm]inut\w*\}\s*:e\b|\}:e\s+minut\w*/,
  },
  {
    id: 'hardcoded-ot-minutes', ref: 'EFTER LÄSPASSET (Del 4)', severity: 'error',
    desc: '"30 minuter"/"120 minuter" hårdkodat i matchtext — förlängningen är 20 min, totalen 110. Undantag: "N×30 minuter" beskriver en avsiktlig historisk specialregel (t.ex. Hammarby 2010-snöfinalen), inte standardformatet',
    re: /\b(30|120)\s*minuter\b/,
    exclude: /\d\s*×\s*30\s*minuter/,
  },
  {
    id: 'automatic-relegation', ref: 'EFTER LÄSPASSET (domän 3)', severity: 'warn',
    desc: '"Två lag åker direkt" (eller liknande automatisk-nedflyttning-fras) — regelboken har kval mellan seriernas plats, inte automatisk nedflyttning',
    re: /två lag åker (direkt|ner)\b/i,
  },
  {
    id: 'period-as-half', ref: 'TERMLISTA v2', severity: 'warn',
    desc: '"period" om matchdel — bandy har HALVLEK. Hög falsk-positiv-risk ("formsvacka-period" etc), granska manuellt',
    re: /\bförsta\s+period(en)?\b|\bandra\s+period(en)?\b|\bperiod\s+\d\b/i,
  },
]

// ── Körning ───────────────────────────────────────────────────────────────────
let hadError = false
let total = 0

for (const rule of RULES) {
  const hits = []
  for (const f of FILES) {
    const lines = readFileSync(f, 'utf8').split('\n')
    lines.forEach((line, i) => {
      if (rule.exclude?.test(line)) return
      if (rule.re.test(line)) hits.push(`${rel(f)}:${i + 1}`)
    })
  }
  total += hits.length
  if (hits.length === 0) continue
  const tag = rule.severity === 'error' ? 'ERROR' : 'warn '
  if (rule.severity === 'error') hadError = true
  console.log(`\n[${tag}] ${rule.id} (${rule.ref}) — ${rule.desc}`)
  for (const h of hits) console.log(`        ${h}`)
}

console.log('')
if (total === 0) {
  console.log('text-guard: grep-rent ✓')
} else {
  console.log(`text-guard: ${total} träffar (${hadError ? 'ERROR — bygget rött' : 'endast warn — bygget grönt'})`)
}
process.exit(hadError ? 1 : 0)
