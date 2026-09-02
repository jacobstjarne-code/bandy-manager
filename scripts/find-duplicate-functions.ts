/**
 * Strukturell dubblett-detektor (Jacobs order 2026-08-25, efter tredje
 * dubblettformeln på tre dygn — två licenssystem, tre kopior av
 * lagvalslogiken, två attendanceRate-formler). Frågan: går det att grinda
 * "samma sanning implementerad flera gånger" på kodnivå?
 *
 * Metod, validerad mot det VERKLIGA fyndet innan detta skript skrevs klart
 * (RAPPORT_DUBBLETTGRIND_FEASIBILITY_2026-08-25.md): exakt AST-hash-matchning
 * (första försöket) missade det motiverande exemplet — de två gamla
 * attendanceRate-formlerna (economyService.ts, före fixet samma dag) hade
 * olika konstant (0,90 mot 0,95) och en extra moodWeight-faktor i den ena,
 * så en exakt hash hade ALDRIG matchat. Levenshtein-baserad tokensekvens-
 * likhet gav 0,85 mellan de två riktiga dubbletterna mot 0,41 för ett
 * kontrollpar orelaterad kod — en tydlig marginal. Det är metriken denna
 * version använder, inte exakt hash.
 *
 * ts.createSourceFile (samma billiga variant som measure-claim-coverage.ts
 * — inget fullt Program/TypeChecker). Funktioner bucket:as efter ungefärlig
 * storlek (±35% nodantal) innan parvis jämförelse, annars är fullständig
 * parvis Levenshtein O(n²) för dyrt på ~950 funktioner.
 *
 * Kör: node_modules/.bin/vite-node scripts/find-duplicate-functions.ts
 */

import * as ts from 'typescript'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname, resolve } from 'node:path'

const MIN_NODES = 40          // filtrerar bort triviala en-radare OCH generiska hjälpfunktioner (pick/hash/clamp)
const SIZE_BAND = 0.35        // jämför bara funktioner inom ±35% nodantal
const SIMILARITY_THRESHOLD = 0.72  // Levenshtein-ratio — validerat: riktig dubblett=0.85, orelaterat=0.41
const CROSS_FILE_ONLY = true  // samma-fil-syskon (trackGoal/trackAssist etc) är avsiktligt parallella, inte "tyst duplicerad sanning"
const CHECK_MODE = process.argv.includes('--check')
const BASELINE_PATH = resolve('scripts/duplicate-functions-baseline.json')

function walkDir(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue
      walkDir(full, out)
    } else if (extname(entry) === '.ts' && !entry.endsWith('.test.ts')) {
      out.push(full)
    }
  }
  return out
}

interface FnEntry {
  file: string
  name: string
  line: number
  tokens: string[]
}

interface BaselinePair {
  id: string
  disposition: 'consolidate' | 'ambiguous-canonical' | 'false-positive'
  rationale: string
}

interface DuplicateBaseline {
  reviewedAt: string
  pairs: BaselinePair[]
}

function pairId(a: FnEntry, b: FnEntry): string {
  return [`${a.file}#${a.name}`, `${b.file}#${b.name}`].sort().join(' <> ')
}

function normalize(node: ts.Node, sf: ts.SourceFile, parts: string[]): void {
  if (ts.isIdentifier(node)) {
    parts.push('ID')
  } else if (ts.isNumericLiteral(node) || ts.isStringLiteralLike(node)) {
    parts.push('LIT')
  } else {
    parts.push(String(node.kind))
  }
  node.forEachChild(child => normalize(child, sf, parts))
}

function collectFunctions(sf: ts.SourceFile, file: string): FnEntry[] {
  const results: FnEntry[] = []

  function visit(node: ts.Node): void {
    let name: string | null = null
    let body: ts.Node | undefined

    if (ts.isFunctionDeclaration(node) && node.body) {
      name = node.name?.text ?? '<anonymous>'
      body = node.body
    } else if (ts.isMethodDeclaration(node) && node.body) {
      name = node.name.getText(sf)
      body = node.body
    } else if (ts.isVariableDeclaration(node) && node.initializer &&
      (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
      name = node.name.getText(sf)
      body = node.initializer.body
    }

    if (name && body) {
      const parts: string[] = []
      normalize(body, sf, parts)
      if (parts.length >= MIN_NODES) {
        const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
        results.push({ file, name, line, tokens: parts })
      }
    }

    node.forEachChild(visit)
  }

  visit(sf)
  return results
}

function levenshteinRatio(a: string[], b: string[]): number {
  const m = a.length, n = b.length
  let prev = new Array(n + 1)
  let curr = new Array(n + 1)
  for (let j = 0; j <= n; j++) prev[j] = j
  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1])
    }
    [prev, curr] = [curr, prev]
  }
  const dist = prev[n]
  return 1 - dist / Math.max(m, n)
}

function main(): void {
  const roots = ['src/domain/services', 'src/domain/data', 'src/application']
  const files: string[] = []
  for (const r of roots) walkDir(r, files)

  const all: FnEntry[] = []
  for (const file of files) {
    const text = readFileSync(file, 'utf-8')
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
    all.push(...collectFunctions(sf, file))
  }

  console.log(`Analyserade ${files.length} filer, ${all.length} funktioner (>= ${MIN_NODES} normaliserade tokens).\n`)

  all.sort((a, b) => a.tokens.length - b.tokens.length)

  const reported = new Set<number>()
  let pairsChecked = 0
  const hits: Array<{ a: FnEntry; b: FnEntry; ratio: number }> = []

  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i], b = all[j]
      if (b.tokens.length > a.tokens.length * (1 + SIZE_BAND)) break  // sorterad — resten är för stora
      if (a.file === b.file && a.name === b.name) continue
      if (CROSS_FILE_ONLY && a.file === b.file) continue
      pairsChecked++
      const ratio = levenshteinRatio(a.tokens, b.tokens)
      if (ratio >= SIMILARITY_THRESHOLD) {
        hits.push({ a, b, ratio })
        reported.add(i)
        reported.add(j)
      }
    }
  }

  hits.sort((x, y) => y.ratio - x.ratio)
  for (const h of hits) {
    console.log(`── ${(h.ratio * 100).toFixed(0)}% lik (${h.a.tokens.length}/${h.b.tokens.length} tokens) ──`)
    console.log(`   ${h.a.file}:${h.a.line}  ${h.a.name}()`)
    console.log(`   ${h.b.file}:${h.b.line}  ${h.b.name}()`)
    console.log('')
  }

  console.log(`${pairsChecked} par jämförda (efter storleksbucketing), ${hits.length} över ${SIMILARITY_THRESHOLD}-tröskeln.`)

  if (CHECK_MODE) {
    const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as DuplicateBaseline
    const knownIds = new Set(baseline.pairs.map(pair => pair.id))
    const currentIds = new Set(hits.map(hit => pairId(hit.a, hit.b)))
    const newIds = [...currentIds].filter(id => !knownIds.has(id)).sort()
    const removedIds = [...knownIds].filter(id => !currentIds.has(id)).sort()

    if (removedIds.length > 0) {
      console.log(`[info] ${removedIds.length} triagerade par har försvunnit — baslinjen kan skärpas.`)
    }
    if (newIds.length > 0) {
      console.error(`\nDubblettgrinden: ${newIds.length} nytt otriagerat par hittades:`)
      for (const id of newIds) console.error(`  - ${id}`)
      console.error(`Triagera paret och uppdatera ${BASELINE_PATH}; dölj det inte genom att höja en totalsiffra.`)
      process.exitCode = 1
    } else {
      console.log(`Dubblettgrinden: inga nya par utanför baslinjen (${baseline.pairs.length} triagerade ${baseline.reviewedAt}) ✓`)
    }
  }
}

main()
