import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stripComments } from './forbudslistan'

/**
 * GRIND 2 — BEVARANDETEXT-RADERINGSGRIND (SPEC_SANNINGSGRINDAR_2026-08-31.md).
 *
 * Rotorsak: `d0d4d923` raderade `hallDebateData.ts` och tog med sig fyra
 * bevarandelistade textpooler i samma svep — motiveringen gällde bara
 * `HALL_DEBATE_EVENTS`, de andra fyra föll osynligt med filen.
 * `docs/BEVARANDELISTA.md`s regel ("ingen rad raderas") hade ingen mothake
 * i kod, så raderingen syntes aldrig förrän någon läste filen manuellt.
 *
 * Metod: samma "billiga nivå 2"-avvägning som opusPlaceholderGate.ts/
 * standingPositionReadGate.ts (kodbas-brett grep, `stripComments`, exkl.
 * tester och dev-scenes) — inte en AST-parser. Källan till sanning är
 * BEVARANDELISTA.mds maskinläsbara ```bevarandelista-block, inte en kopia
 * av namnlistan här: en radering av namnet i blocket (avsiktligt, när en
 * pool får en yta och slutar vara bevarandelistad) ska INTE kräva en
 * ändring i den här filen också — grinden läser blocket varje körning.
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '../..')

const BEVARANDELISTA_PATH = join(REPO_ROOT, 'docs/BEVARANDELISTA.md')
const FENCE_START = '```bevarandelista'
const FENCE_END = '```'

const SCOPE_DIRS = ['src']
const EXCLUDE_DIR_PATTERNS = [
  /__tests__/,
  /\.test\.[tj]sx?$/,
  /\.spec\.[tj]sx?$/,
  /^src\/presentation\/screens\/dev\//,
]

/**
 * Läser det maskinläsbara blocket i BEVARANDELISTA.md — en export-
 * identifierare per rad mellan ```bevarandelista och nästa ```.
 */
export function readPreservedNames(): string[] {
  const md = readFileSync(BEVARANDELISTA_PATH, 'utf-8')
  const startIdx = md.indexOf(FENCE_START)
  if (startIdx === -1) {
    throw new Error(`preservationGate: hittar inte ${FENCE_START}-blocket i docs/BEVARANDELISTA.md`)
  }
  const afterStart = md.slice(startIdx + FENCE_START.length)
  const endIdx = afterStart.indexOf(FENCE_END)
  if (endIdx === -1) {
    throw new Error('preservationGate: ```bevarandelista-blocket i docs/BEVARANDELISTA.md stängs aldrig')
  }
  return afterStart
    .slice(0, endIdx)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      walk(full, out)
    } else if (['.ts', '.tsx'].includes(extname(full))) {
      out.push(full)
    }
  }
}

export interface PreservationViolation {
  name: string
}

/**
 * Sveper hela `src/` (exkl. tester och dev-only-skalet) efter varje
 * bevarandelistat namn. Noll förekomster utanför kommentarer = namnet är
 * borta ur koden — bevarad text raderad, som `hallDebateData` i `d0d4d923`.
 */
export function scanPreservationDeletions(): PreservationViolation[] {
  const names = readPreservedNames()
  const files: string[] = []
  for (const d of SCOPE_DIRS) walk(join(REPO_ROOT, d), files)

  const strippedByFile = new Map<string, string>()
  for (const full of files) {
    const rel = relative(REPO_ROOT, full).split('\\').join('/')
    if (EXCLUDE_DIR_PATTERNS.some(p => p.test(rel))) continue
    strippedByFile.set(rel, stripComments(readFileSync(full, 'utf-8')))
  }

  const violations: PreservationViolation[] = []
  for (const name of names) {
    const pattern = new RegExp(`\\b${name}\\b`)
    const found = [...strippedByFile.values()].some(src => pattern.test(src))
    if (!found) violations.push({ name })
  }
  return violations
}
