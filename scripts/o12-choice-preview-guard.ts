/**
 * O12 §2 + DOM_O12_VECKOBESLUT_2026-09-09 — statisk grind för EventChoice-
 * och WeeklyDecisionOption-förhandsytan.
 *
 * DOM_O12_FORHANDSTEXT_KONTRAKT_2026-09-09 låser kontraktet till exakt
 * pengar men kvalitativ riktning för alla andra resurser. Domen utvidgades
 * 2026-09-09 till WeeklyDecision (`weeklyDecisionService.ts`), en separat
 * katalogform (label + preview) som EventChoice-grenen inte fångar. Det här
 * är ingen runtime-sanering: bygggrinden läser TypeScript-syntaxen och
 * stoppar en ny label/subtitle/preview som kodar exempelvis "+5 moral"
 * eller "relation −30". Speltexten når därför aldrig produktion i trasigt
 * skick och pengar kan fortsätta vara exakta.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'

const ROOT = resolve(import.meta.dirname, '..')
const DOMAIN_ROOT = resolve(ROOT, 'src', 'domain')

interface Violation {
  file: string
  line: number
  property: 'label' | 'subtitle' | 'preview'
  preview: string
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = resolve(dir, name)
    if (statSync(path).isDirectory()) {
      return name === '__tests__' ? [] : sourceFiles(path)
    }
    return name.endsWith('.ts') ? [path] : []
  })
}

function propertyName(node: ts.PropertyName): string | undefined {
  return ts.isIdentifier(node) || ts.isStringLiteral(node) ? node.text : undefined
}

/** Behåll uttryck som platshållare så dynamiska `+${amount} moral` också syns. */
function previewText(node: ts.Expression, source: ts.SourceFile): string {
  if (ts.isStringLiteralLike(node)) return node.text
  if (ts.isTemplateExpression(node)) {
    return node.head.text + node.templateSpans
      .map(span => `\${${span.expression.getText(source)}}${span.literal.text}`)
      .join('')
  }
  if (ts.isConditionalExpression(node)) {
    return `${previewText(node.whenTrue, source)} ${previewText(node.whenFalse, source)}`
  }
  return ''
}

const NON_MONEY_RESOURCE = [
  'moral', 'rykte', 'anseende', 'reputation', 'communityStanding',
  'stämning', 'fanMood', 'supporterMood', 'happiness', 'lojalitet',
  'tålamod', 'inflytande', 'pressrelation', 'journalistrelation',
  'kommunrelation', 'kommunstatus', 'domarrelation', 'boardPatience',
  // DOM_O12_VECKOBESLUT_2026-09-09 — WeeklyDecision-katalogens resurser,
  // som EventChoice-domen inte namngav.
  'kondition', 'hörnskicklighet', 'hörnförsvar',
].join('|')

// ${uttryck} räknas bara som ett läckt värde om uttrycket inte är en
// .name-property (t.ex. ${mecenat.name}) — annars flaggar vakten all
// namn-interpolation nära ett resursord (tålamod, moral, ...) som ett
// läckt tal, trots att den bara sätter in en persons namn i texten.
const VALUE_LITERAL = String.raw`(?:\d+(?:[.,]\d+)?|\$\{(?![^}]*\.name\s*\})[^}]+\})`
const EXACT_VALUE = String.raw`(?:[+\-−]\s*)?${VALUE_LITERAL}`
const MONEY = new RegExp(
  String.raw`${EXACT_VALUE}\s*(?:kr|tkr|k)(?:\s*\/\s*(?:mån|vecka|säsong|match|hemmamatch|omgång))?`,
  'gi',
)
// Tecken-klasserna nedan escapar bindestrecket (\-) explicit — [+-−] och
// [+:-−] tolkades tidigare som INTERVALL (':' t.o.m. '−', U+003A–U+2212)
// istället för fyra enskilda tecken, vilket både lät ett bokstavligt
// "-" i "moral -5" undgå matchning och fick nästan vilket tecken som
// helst före ett tal räknas som "tecken". Escapningen fixar båda.
const VALUE_THEN_RESOURCE = new RegExp(
  String.raw`[+\-−]\s*${VALUE_LITERAL}[^\n·]{0,18}(?:${NON_MONEY_RESOURCE})`,
  'i',
)
const RESOURCE_THEN_VALUE = new RegExp(
  String.raw`(?:${NON_MONEY_RESOURCE})[^\n·]{0,18}(?:[+:\-−]\s*)${VALUE_LITERAL}`,
  'i',
)
const INTERNAL_COUNTER = /\bcooldown\s+\d+/i

function hasExactNonMoneyValue(text: string): boolean {
  const withoutMoney = text.replace(MONEY, '')
  return VALUE_THEN_RESOURCE.test(withoutMoney)
    || RESOURCE_THEN_VALUE.test(withoutMoney)
    || INTERNAL_COUNTER.test(withoutMoney)
}

const violations: Violation[] = []

for (const absoluteFile of sourceFiles(DOMAIN_ROOT)) {
  const sourceText = readFileSync(absoluteFile, 'utf8')
  const source = ts.createSourceFile(absoluteFile, sourceText, ts.ScriptTarget.Latest, true)

  function visit(node: ts.Node): void {
    if (ts.isObjectLiteralExpression(node)) {
      const properties = new Map<string, ts.PropertyAssignment>()
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property)) continue
        const name = propertyName(property.name)
        if (name) properties.set(name, property)
      }

      // Ett faktiskt EventChoice-objekt i produktion: id + effect + synlig text.
      if (properties.has('id') && properties.has('effect')) {
        for (const property of ['label', 'subtitle'] as const) {
          const assignment = properties.get(property)
          if (!assignment) continue
          const preview = previewText(assignment.initializer, source)
          if (!preview || !hasExactNonMoneyValue(preview)) continue
          violations.push({
            file: absoluteFile.slice(ROOT.length + 1),
            line: source.getLineAndCharacterOfPosition(assignment.getStart(source)).line + 1,
            property,
            preview,
          })
        }
      }

      // Ett WeeklyDecisionOption i produktion (DOM_O12_VECKOBESLUT_2026-09-09):
      // label + preview, samma kontrakt som EventChoice men annan formträff
      // (ingen id/effect på det här objektet — de sitter på det yttre
      // WeeklyDecision-objektet).
      if (properties.has('label') && properties.has('preview')) {
        const assignment = properties.get('preview')!
        const preview = previewText(assignment.initializer, source)
        if (preview && hasExactNonMoneyValue(preview)) {
          violations.push({
            file: absoluteFile.slice(ROOT.length + 1),
            line: source.getLineAndCharacterOfPosition(assignment.getStart(source)).line + 1,
            property: 'preview',
            preview,
          })
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(source)
}

if (violations.length > 0) {
  console.error('o12-choice-preview-guard: exakt icke-pengatal har läckt in i förhandsytan')
  for (const violation of violations) {
    console.error(`  - ${violation.file}:${violation.line} ${violation.property}: ${violation.preview}`)
  }
  console.error('Använd O12:s låsta kvalitativa vokabulär; exakta faktiska deltan visas efter valet.')
  process.exit(1)
}

console.log('o12-choice-preview-guard: inga exakta icke-pengatal i EventChoice label/subtitle eller WeeklyDecisionOption preview ✓')
