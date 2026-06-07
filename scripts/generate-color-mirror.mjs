#!/usr/bin/env node
/**
 * generate-color-mirror.mjs — genererar design-system/colors_and_type.css ur
 * src/styles/global.css (FIDELITY §4: "en genererad spegel kan inte ljuga").
 *
 * global.css är sanning. Spegeln är en härledd referens för Design — den får ALDRIG
 * handredigeras (drift uppstod denna månad: --radius-md, scen-tokens, --shadow-card).
 * Kör efter varje token-/typografi-ändring i global.css:  node scripts/generate-color-mirror.mjs
 *
 * Extraherar :root-blocket + typografi-rollerna (.h-* / .text-quote). Utelämnar
 * komponent-CSS (.btn/.tag/.card/...) som bara bor i global.css.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const SRC = join(ROOT, 'src/styles/global.css')
const OUT = join(ROOT, 'design-system/colors_and_type.css')

const css = readFileSync(SRC, 'utf8')

// Komment-medveten split i topp-nivå-regler (behåller originaltext inkl. kommentarer).
function splitTopLevel(s) {
  const rules = []
  let depth = 0, start = 0
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '/' && s[i + 1] === '*') { i = s.indexOf('*/', i + 2) + 1; continue }
    if (s[i] === '{') depth++
    else if (s[i] === '}') {
      depth--
      if (depth === 0) { rules.push(s.slice(start, i + 1)); start = i + 1 }
    }
  }
  return rules
}

// Selektor = text före första { med kommentarer + whitespace bortstädade.
function selectorOf(rule) {
  return rule.slice(0, rule.indexOf('{')).replace(/\/\*[\s\S]*?\*\//g, '').trim()
}

const kept = splitTopLevel(css).filter(rule => {
  const sel = selectorOf(rule)
  return sel === ':root' || /^\.h-/.test(sel) || sel === '.text-quote'
}).map(r => r.trim())

const header = `/* ─────────────────────────────────────────────────────────────────────────
   colors_and_type.css — GENERERAD ur src/styles/global.css. REDIGERA INTE FÖR HAND.
   Kör: node scripts/generate-color-mirror.mjs  (FIDELITY §4 — spegeln kan inte ljuga)
   Innehåll: :root-tokens + typografi-roller (.h-* / .text-quote). Komponent-CSS
   (.btn/.tag/.card/...) bor enbart i global.css.
   ───────────────────────────────────────────────────────────────────────── */\n\n`

const body = kept.join('\n\n') + '\n'

// Idempotens-check: om --check, jämför utan att skriva (för CI/grind).
if (process.argv.includes('--check')) {
  const current = readFileSync(OUT, 'utf8')
  if (current !== header + body) {
    console.error('colors_and_type.css är inte i synk med global.css — kör: node scripts/generate-color-mirror.mjs')
    process.exit(1)
  }
  console.log('color-mirror: i synk ✓')
  process.exit(0)
}

writeFileSync(OUT, header + body)
console.log(`color-mirror: genererade ${kept.length} regler (:root + typografi) → design-system/colors_and_type.css`)
