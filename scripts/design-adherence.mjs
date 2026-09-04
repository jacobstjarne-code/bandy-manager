#!/usr/bin/env node
/**
 * Designregler 11–16 — exakt ratchet för sådant som går att grep-verifiera.
 *
 * Regeln är inte att gammal skuld är godkänd. Baslinjen gör den synlig och
 * hindrar nya träffar även om en äldre träff samtidigt försvinner (till skillnad
 * från en ren totalsiffer-ratchet). `// adherence-exempt: <skäl>` på samma eller
 * föregående rad är den enda lokala frisedeln.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const PRESENTATION = join(ROOT, 'src', 'presentation')
const STYLE_ROOTS = [join(ROOT, 'src', 'styles'), join(PRESENTATION, 'styles')]
const BASELINE_PATH = join(ROOT, 'scripts', 'design-adherence-baseline.json')
const UPDATE_BASELINE = process.argv.includes('--update-baseline')

function walk(dir, extensions, acc = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue
      walk(path, extensions, acc)
    } else if (extensions.some(extension => entry.endsWith(extension)) && entry !== 'DevScenesScreen.tsx') {
      acc.push(path)
    }
  }
  return acc
}

const TSX_FILES = walk(PRESENTATION, ['.tsx'])
const CSS_FILES = STYLE_ROOTS.flatMap(dir => walk(dir, ['.css']))
const rel = path => path.slice(ROOT.length + 1)
const findings = new Map([
  ['rule11_units', []],
  ['rule12_empty_structure', []],
  ['rule13_semantic_color', []],
  ['rule14_graph_anchor', []],
  ['rule15_disabled_state', []],
  ['rule16_duplicate_class', []],
])

function normalize(value) {
  return value.trim().replace(/\s+/g, ' ')
}

function add(rule, file, lineNumber, evidence) {
  const fileRel = rel(file)
  const normalizedEvidence = normalize(evidence)
  findings.get(rule).push({
    file: fileRel,
    line: lineNumber,
    evidence: normalizedEvidence,
    fingerprint: `${fileRel}|${normalizedEvidence}`,
  })
}

function isExempt(lines, index, marker = 'adherence-exempt') {
  return lines[index]?.includes(marker) || (index > 0 && lines[index - 1]?.includes(marker))
}

for (const file of TSX_FILES) {
  const source = readFileSync(file, 'utf8')
  const lines = source.split('\n')

  // Flerradiga block-/JSX-kommentarer (`/* ... */`, `{/* ... */}`) följde
  // tidigare inte med — bara rader som TRIMMADE börjar med `//`/`*` hoppades
  // över, så en kommentars fortsättningsrader (ingen ledande `*`-konvention
  // i JSX) och ensamradiga `{/* ... */}`-block lästes som kod. Upptäckt när
  // HistoryScreen.tsx:s rubrik-kommentar (flerradig, ingen `*`-prefix)
  // false-positivade två byggen i rad.
  let inBlockComment = false

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const trimmed = line.trim()

    if (inBlockComment) {
      if (line.includes('*/')) inBlockComment = false
      continue
    }
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) continue
    // Bara när HELA raden är en kommentar, från radens start (`{/*`/`/*`) —
    // en TRAILING inline-kommentar efter riktig kod (t.ex. en style-rad som
    // avslutas med `{/* ds-exempt: ... */}`) ska INTE hoppas över, annars
    // döljs den riktiga koden som föregår kommentaren på samma rad.
    if (trimmed.startsWith('{/*') || trimmed.startsWith('/*')) {
      if (!line.includes('*/')) inBlockComment = true
      continue
    }
    if (isExempt(lines, index)) continue

    // 11 · Tal & enheter: rå kronprecision/kr-period och rå säsongsaxel i UI.
    // Trailing gräns är EXPLICIT (inte \b) — JS:s \b ser åäö som "icke-ord",
    // så \bkr\b matchade tidigare "kr" inuti svenska ord som "krönika"
    // (kr+önika, ö räknas som gräns) — falskt larm, ingen kod-avvikelse.
    if (/\bkr(?:\/mån|\/vecka|\/säsong)?(?![a-zA-ZåäöÅÄÖ])/.test(line) && !/\btkr(?:\/mån)?\b/.test(line)) {
      add('rule11_units', file, index + 1, line)
    }
    if (/Säsong\s+(?:\$\{[^}]*\.currentSeason|\{[^}]*\.currentSeason)/.test(line) && !line.includes('seasonSpanLabel')) {
      add('rule11_units', file, index + 1, line)
    }

    // 12 · Tom struktur: visuella dash-fallbacks och tomma värderader.
    if (/>(?:\{'\s*'\})?—</.test(line) || /(?:\?\?|\|\||:\s*|value:\s*|income:\s*)['"]—['"]/.test(line)) {
      add('rule12_empty_structure', file, index + 1, line)
    }

    // 13 · Ny semantisk färg måste bära en lokal, granskningsbar nyckelmarkör.
    if (/(?:color|background|border(?:Color)?):[^\n]*var\(--(?:success|warning|danger|cold|warm)(?:-[^)]+)?\)/.test(line)
      && !isExempt(lines, index, 'adherence-semantic-key')) {
      add('rule13_semantic_color', file, index + 1, line)
    }

    // 14 · Nya grafer går genom Sparkline-primitiven och deklarerar ankaret.
    const nearby = lines.slice(Math.max(0, index - 6), index + 1).join('\n')
    if (/<Sparkline\b/.test(line) && !nearby.includes('adherence-graph-anchor')) {
      add('rule14_graph_anchor', file, index + 1, line)
    }
    if ((/function\s+\w*Sparkline\b/.test(line) || /<polyline\b/.test(line)) && !file.endsWith('/primitives/Sparkline.tsx')) {
      add('rule14_graph_anchor', file, index + 1, line)
    }
    if (/minPoints=\{\s*[0-4]\s*\}/.test(line)) {
      add('rule14_graph_anchor', file, index + 1, line)
    }
  }

  // 15 · Knappen får inte skapa en egen opacity-mekanik vid disabled.
  for (const match of source.matchAll(/<button\b[\s\S]*?<\/button>/g)) {
    const block = match[0]
    if (!/\bdisabled=/.test(block) || !/opacity\s*:/.test(block) || /opacity\s*:\s*['"]?var\(--disabled-opacity\)/.test(block)) continue
    const start = match.index ?? 0
    const lineNumber = source.slice(0, start).split('\n').length
    const firstOpacity = block.split('\n').find(line => line.includes('opacity:')) ?? block.split('\n')[0]
    if (!firstOpacity.includes('adherence-exempt')) add('rule15_disabled_state', file, lineNumber, firstOpacity)
  }
}

for (const file of CSS_FILES) {
  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(/([^{}]*:disabled[^{}]*)\{([^{}]*)\}/g)) {
    const selector = normalize(match[1])
    const body = match[2]
    if (selector.includes('.btn')) continue // ärver den gemensamma .btn:disabled-mekanismen
    const hasMechanism = /opacity:\s*var\(--disabled-opacity\)/.test(body) && /pointer-events:\s*none/.test(body)
    const changesFamily = /(?:background|color|border(?:-color)?):/.test(body)
    if (hasMechanism && !changesFamily) continue
    const lineNumber = source.slice(0, match.index ?? 0).split('\n').length
    add('rule15_disabled_state', file, lineNumber, `${selector} { ${normalize(body)} }`)
  }
}

// 16 · Ny CSS-klass med byte-identisk vilostate-deklaration mot en befintlig
// klass. Samma felklass som `.btn-copper`/`.btn-primary` (OPUS-REGLER #4 i
// CLAUDE.md) — upptäcktes fyra månader efter att dubbletten skapades.
// Jämför bara ENKLA klassselektorer (`.namn {`), inte kombinerade/pseudo-
// selektorer — de fångas redan av andra mekanismer (t.ex. rule15 för
// `:disabled`). Kräver ≥2 deklarationer i kroppen — ett ensamt `flex: 1;`
// eller `margin-bottom: 8px;` är ett vanligt CSS-idiom som råkar sammanfalla
// i en stor stilmall, inte en copy-paste-dubblett; `.btn-copper` var tre
// deklarationer (bakgrund+färg+skugga), en hel visuell behandling. Andra
// träffen på en identisk kropp är avvikelsen.
for (const file of CSS_FILES) {
  const source = readFileSync(file, 'utf8')
  const lines = source.split('\n')
  const seenBodies = new Map()
  for (const match of source.matchAll(/^\.([a-zA-Z][a-zA-Z0-9_-]*)\s*\{([\s\S]*?)\n\}/gm)) {
    const className = match[1]
    const body = normalize(match[2])
    if (!body || body.split(';').filter(Boolean).length < 2) continue
    const lineNumber = source.slice(0, match.index ?? 0).split('\n').length
    if (isExempt(lines, lineNumber - 1)) continue
    const prior = seenBodies.get(body)
    if (prior && prior.className !== className) {
      add('rule16_duplicate_class', file, lineNumber, `.${className} { ${body} } — byte-identisk med .${prior.className} (rad ${prior.lineNumber})`)
    } else if (!prior) {
      seenBodies.set(body, { className, lineNumber })
    }
  }
}

const current = Object.fromEntries(
  [...findings].map(([rule, rows]) => [rule, [...new Set(rows.map(row => row.fingerprint))].sort()]),
)

if (UPDATE_BASELINE) {
  writeFileSync(BASELINE_PATH, `${JSON.stringify(current, null, 2)}\n`)
  console.log(`design-adherence: baslinje uppdaterad (${Object.values(current).reduce((sum, rows) => sum + rows.length, 0)} träffar)`)
  process.exit(0)
}

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
let hadError = false

for (const [rule, rows] of findings) {
  const approved = new Set(baseline[rule] ?? [])
  const uniqueRows = [...new Map(rows.map(row => [row.fingerprint, row])).values()]
  const additions = uniqueRows.filter(row => !approved.has(row.fingerprint))
  const removals = [...approved].filter(fingerprint => !current[rule].includes(fingerprint))

  if (additions.length > 0) {
    hadError = true
    console.log(`\n[ERROR] ${rule}: ${additions.length} ny(a) designavvikelse(r) utanför baslinjen`)
    for (const row of additions) console.log(`        ${row.file}:${row.line}  ${row.evidence}`)
  }
  if (removals.length > 0) {
    console.log(`[info]  ${rule}: ${removals.length} baslinjeträff(ar) har försvunnit — kör --update-baseline efter granskning`)
  }
}

if (!hadError) {
  const total = Object.values(current).reduce((sum, rows) => sum + rows.length, 0)
  console.log(`design-adherence: inga nya avvikelser mot regler 11–16 (${total} synliga baslinjeträffar) ✓`)
}

process.exit(hadError ? 1 : 0)
