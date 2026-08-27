/**
 * PÅSTÅENDEGRINDEN nivå 1 — täckningsmätning (2026-08-24, Jacobs order).
 *
 * "Börja med att mäta täckningen. Hur många textproducerande funktioner
 * finns, och hur många av dem gör påståenden enligt kartans definition
 * ... Siffran avgör om deklarationen är en dags arbete eller en veckas."
 *
 * Metod: ren syntax-parsning (ts.createSourceFile, INGEN TypeChecker, ingen
 * ts.Program) av varje fil i de scope Jacob/kartan pekar ut. För varje
 * MODULNIVÅ-funktion (export function / export const X = (...) => ... /
 * namngiven const-funktion, INTE varje inline-callback — samma granularitet
 * som en @cites-annotering rimligen sitter på) samlas alla sträng-/
 * mallliteraler i dess kropp (inkl. nästlade inline-arrows, eftersom deras
 * text ändå räknas till vad den namngivna funktionen producerar).
 *
 * "Textproducerande" = åtminstone en sträng ser ut som svensk prosa (två
 * ordliknande tokens separerade av mellanslag — filtrerar bort CSS-klasser,
 * import-paths, enstaka nycklar).
 *
 * "Gör ett påstående" (kartans definition, PASTAENDEGRINDEN.md rad 20-24):
 *   - preteritum om spelvärlden (verblista nedan)
 *   - ett tal som beskriver ett utfall (\d + enhet: tkr/kr/matcher/år/mål/%...)
 *   - en kausal koppling (därför/det gav/det ledde till/vilket gjorde)
 *   - (informativt, inte eget OR-villkor) namn-i-händelse approximeras som
 *     mall-interpolation (${...}) SAMTIDIGT som preteritum-listan träffar
 *     samma funktion — rapporteras separat, räknas inte dubbelt mot totalen.
 *
 * Detta är en APPROXIMATION för att sätta STORLEKSORDNING på uppgiften, inte
 * en exakt klassificerare — rapporteras som sådan. Verbslistan och
 * mönstren är brett satta (högre recall, lägre precision) eftersom
 * konsekvensen av att UNDERSKATTA är värre här (nivå 1 byggs för smalt) än
 * att ÖVERSKATTA (några extra false-positives spottas ut i en manuell
 * stickprovskontroll).
 */
import * as ts from 'typescript'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
function dirname(p: string): string { return p.replace(/\/[^/]+$/, '') }
const REPO_ROOT = join(__dirname, '..')

const SCOPE_DIRS = [
  'src/presentation',
  'src/domain/services',
  'src/domain/data',
  'src/application/services',
]

const EXCLUDE_PATTERNS = [/__tests__/, /\.test\.[tj]sx?$/, /\.spec\.[tj]sx?$/, /\.stories\.[tj]sx?$/]

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      walk(full, out)
    } else if (['.ts', '.tsx'].includes(extname(full))) {
      const rel = relative(REPO_ROOT, full)
      if (EXCLUDE_PATTERNS.some(p => p.test(rel))) continue
      out.push(full)
    }
  }
}

const files: string[] = []
for (const d of SCOPE_DIRS) walk(join(REPO_ROOT, d), files)

// Preteritum-lista — spelvärldens vanliga händelseverb, breda former
// (recall före precision, se filhuvudet).
const PRETERITUM = [
  'sålde', 'köpte', 'vann', 'förlorade', 'lämnade', 'valde', 'kostade',
  'tog', 'fick', 'blev', 'gjorde', 'spelade', 'skrev', 'drog', 'höll',
  'stod', 'gav', 'ledde', 'satte', 'sköt', 'kvitterade', 'utökade',
  'reducerade', 'stängdes', 'bötfälldes', 'varnades', 'skadades',
  'återhämtade', 'förnyade', 'anställde', 'befordrades', 'degraderades',
  'kvalificerade', 'missade', 'nekade', 'accepterade', 'bytte',
  'förlängde', 'sjönk', 'steg', 'ökade', 'minskade', 'avgjorde',
  'utsågs', 'utnämndes', 'krossade', 'besegrade', 'slog', 'tackade',
  'presterade', 'imponerade', 'besvikade', 'chockade', 'avslutade',
  'inledde', 'startade', 'debuterade', 'pensionerade', 'avtackades',
  'meddelade', 'bekräftade', 'nådde', 'klarade', 'misslyckades',
]
const NUMERIC_OUTCOME_RE = /\d[\d\s]*\s*(tkr|kr\b|kronor|matcher\b|match\b|år\b|dagar\b|poäng|mål\b|%|procent|omgångar|säsonger)/i

const CAUSAL_RE = /\bdärför\b|\bdet gav\b|\bdet ledde till\b|\bvilket (gjorde|ledde)\b|\bdärmed\b/i

// Filtrerar bort CSS-klasser/importvägar/enstaka nycklar: kräver minst två
// ordliknande tokens separerade av mellanslag, och åtminstone en å/ä/ö ELLER
// ett vanligt kort svenskt funktionsord (för att inte råka acceptera
// engelska loggsträngar/konsolmeddelanden som "prosa").
const SWEDISH_WORD_RE = /\b(och|att|som|har|inte|för|med|till|en|ett|är|det|du|han|hon|de)\b/i
function looksLikeProse(s: string): boolean {
  if (s.length < 8) return false
  if (!/[a-zA-ZåäöÅÄÖ]{3,}\s+[a-zA-ZåäöÅÄÖ]{2,}/.test(s)) return false
  if (/[åäöÅÄÖ]/.test(s)) return true
  return SWEDISH_WORD_RE.test(s)
}

interface FnRecord {
  file: string
  name: string
  isTextProducing: boolean
  isClaim: boolean
  matchedPreteritum: string[]
  matchedNumeric: boolean
  matchedCausal: boolean
  hasInterpolationWithPreteritum: boolean
  sample: string
}

const records: FnRecord[] = []

function collectStringLiterals(node: ts.Node, out: string[]): void {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    out.push(node.text)
  } else if (ts.isTemplateExpression(node)) {
    out.push(node.head.text)
    for (const span of node.templateSpans) out.push(span.literal.text)
  } else if (ts.isJsxText(node)) {
    // JSX-barntext (<div>Han vann matchen {x}</div>) är INTE en StringLiteral
    // — utan detta missas prosa som ligger direkt i JSX-trädet istf i en
    // separat textpool-array, vilket hade underskattat .tsx-komponenter
    // specifikt (presentation-lagret Jacob explicit bad om täckning för).
    out.push(node.text)
  }
  ts.forEachChild(node, child => collectStringLiterals(child, out))
}

function hasTemplateInterpolation(node: ts.Node): boolean {
  let found = false
  function visit(n: ts.Node): void {
    if (found) return
    if (ts.isTemplateExpression(n)) { found = true; return }
    ts.forEachChild(n, visit)
  }
  visit(node)
  return found
}

function fnName(node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ArrowFunction | ts.FunctionExpression, fallback: string): string {
  if ('name' in node && node.name && ts.isIdentifier(node.name)) return node.name.text
  return fallback
}

function analyzeFunction(file: string, name: string, body: ts.Node): void {
  const literals: string[] = []
  collectStringLiterals(body, literals)
  const prose = literals.filter(looksLikeProse)
  if (prose.length === 0) return // inte textproducerande — hoppa

  const joined = prose.join(' \n ')
  const preteritumHits = [...new Set(PRETERITUM.filter(v => new RegExp(`\\b${v}\\b`, 'i').test(joined)))]
  const numericHit = NUMERIC_OUTCOME_RE.test(joined)
  const causalHit = CAUSAL_RE.test(joined)
  const isClaim = preteritumHits.length > 0 || numericHit || causalHit
  const interpolationWithPreteritum = hasTemplateInterpolation(body) && preteritumHits.length > 0

  records.push({
    file: relative(REPO_ROOT, file),
    name,
    isTextProducing: true,
    isClaim,
    matchedPreteritum: preteritumHits,
    matchedNumeric: numericHit,
    matchedCausal: causalHit,
    hasInterpolationWithPreteritum: interpolationWithPreteritum,
    sample: prose[0].slice(0, 80),
  })
}

for (const file of files) {
  const text = readFileSync(file, 'utf-8')
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)

  // Bara MODULNIVÅ-funktioner (direkta barn till SourceFile, eller till en
  // export-deklaration) — samma granularitet en @cites-annotering rimligen
  // sitter på. Nästlade inline-callbacks räknas INTE som egna kandidater,
  // men deras strängar räknas in i den omslutande namngivna funktionens
  // textmängd (collectStringLiterals går rekursivt genom hela kroppen).
  sf.forEachChild(node => {
    if (ts.isFunctionDeclaration(node) && node.body) {
      analyzeFunction(file, fnName(node, '(anonym function declaration)'), node.body)
      return
    }
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (!decl.initializer) continue
        if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
          const name = ts.isIdentifier(decl.name) ? decl.name.text : '(destructured)'
          const body = decl.initializer.body
          analyzeFunction(file, name, body)
        }
      }
    }
  })
}

const textProducing = records.length
const claims = records.filter(r => r.isClaim)
const withInterpolation = records.filter(r => r.hasInterpolationWithPreteritum)

console.log(`\n=== PÅSTÅENDEGRINDEN nivå 1 — täckningsmätning ===\n`)
console.log(`Filer skannade: ${files.length} (${SCOPE_DIRS.join(', ')})`)
console.log(`Modulnivå-funktioner med minst en prosa-liknande sträng (textproducerande): ${textProducing}`)
console.log(`Varav gör ett påstående (kartans definition, preteritum ELLER siffra-utfall ELLER kausal koppling): ${claims.length}`)
console.log(`  — varav preteritum-träff: ${claims.filter(r => r.matchedPreteritum.length > 0).length}`)
console.log(`  — varav numeriskt utfall: ${claims.filter(r => r.matchedNumeric).length}`)
console.log(`  — varav kausal koppling: ${claims.filter(r => r.matchedCausal).length}`)
console.log(`  — varav mall-interpolation + preteritum i samma funktion (namn-i-händelse-approximation): ${withInterpolation.length}`)

console.log(`\n--- Filer med flest påstående-funktioner (topp 20) ---`)
const byFile = new Map<string, number>()
for (const r of claims) byFile.set(r.file, (byFile.get(r.file) ?? 0) + 1)
;[...byFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([f, n]) => console.log(`  ${n}\t${f}`))

console.log(`\n--- Stickprov, 15 slumpmässiga påstående-funktioner (för manuell verifiering) ---`)
const step = Math.max(1, Math.floor(claims.length / 15))
for (let i = 0; i < claims.length; i += step) {
  const r = claims[i]
  console.log(`  ${r.file} :: ${r.name}() — [${r.matchedPreteritum.slice(0, 3).join(',')}${r.matchedNumeric ? ',NUM' : ''}${r.matchedCausal ? ',CAUSAL' : ''}] "${r.sample}..."`)
}

console.log(`\n(Detta är en heuristisk approximation, inte en exakt klassificerare — se filhuvudets kommentar.)\n`)

// PÅSTÅENDEKARTAN-omsvepet (2026-08-24, Jacobs order efter det förlorade
// runda 2-svepet): fulla listan av kandidat-funktioner dumpad till fil så
// den kan partitioneras mellan agenter OCH överleva oavsett vad som händer
// med den här körningens chattkontext — exakt regeln som inte tillämpades
// förra gången.
import { writeFileSync } from 'node:fs'
writeFileSync(
  join(REPO_ROOT, 'docs/pastaende_sweep_2026-08-24/candidates.json'),
  JSON.stringify(claims.map(r => ({ file: r.file, name: r.name, sample: r.sample })), null, 2),
)
console.log(`Fulla kandidatlistan (${claims.length} funktioner) skriven till docs/pastaende_sweep_2026-08-24/candidates.json`)
