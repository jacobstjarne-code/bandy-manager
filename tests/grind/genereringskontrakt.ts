import * as ts from 'typescript'
import { readFileSync } from 'node:fs'
import { stripComments } from './forbudslistan'

/**
 * PÅSTÅENDEGRINDEN, genererings-tids-lagret (DOM_PASTAENDE_GENERERINGSKONTRAKT_2026-09-08).
 *
 * Skiljer sig från nivå 1 (@cites, citesDeclaration.ts): den grinden verifierar
 * att ett DEKLARERAT fält faktiskt förekommer i en funktions kropp — den
 * SVARAR INTE på om ett events/*-påstående (en GameEvent konstruerad vid
 * genereringstillfället) har någon belägning alls. Det är det gap den här
 * filen stänger: varje `GameEvent`-konstruktion i en deltagande fil måste
 * bära ett `proofSource`-fält (se `src/domain/entities/ProofSource.ts`) av
 * EXAKT en av tre former — grinden checkar att fältet FINNS och att formen
 * är en av de tre giltiga, aldrig att prosan i kortet är sann (det kan ingen
 * statisk grind avgöra). Samma "billiga variant"-kostnadsklass som nivå 1/2:
 * ts.createSourceFile, ingen ts.Program, ingen TypeChecker.
 *
 * En "GameEvent-konstruktion" identifieras heuristiskt som ett objektlitteral
 * med BÅDE en `id:`- och en `body:`-property (de två fält varje verklig
 * GameEvent-konstruktion i denna kodbas alltid sätter, och som knappast
 * förekommer ihop i något orelaterat objekt) som antingen (a) är argumentet
 * till ett anrop `events.push(...)`/`<array>.push(...)`, eller (b) är
 * `return`-satsens uttryck i en funktion vars namn matchar `generate*Event*`
 * (samma namnkonvention som redan gäller i events/*).
 */

export interface EventConstructionSite {
  file: string
  line: number
  hasProofSource: boolean
  proofSourceFormLiteral: string | null
  snippet: string
}

export interface GenereringskontraktViolation {
  file: string
  line: number
  kind: 'proofSource-saknas' | 'proofSource-ogiltig-form'
  detail: string
}

const VALID_FORMS = new Set(['state-predicate', 'ledger', 'timeless'])

function isEventLiteral(node: ts.Node): node is ts.ObjectLiteralExpression {
  if (!ts.isObjectLiteralExpression(node)) return false
  const keys = node.properties
    .map(p => (p.name && ts.isIdentifier(p.name) ? p.name.text : null))
    .filter((x): x is string => x !== null)
  return keys.includes('id') && keys.includes('body')
}

function extractProofSource(node: ts.ObjectLiteralExpression): { present: boolean; formLiteral: string | null } {
  const prop = node.properties.find(
    p => p.name && ts.isIdentifier(p.name) && p.name.text === 'proofSource'
  )
  if (!prop || !ts.isPropertyAssignment(prop)) return { present: false, formLiteral: null }
  const init = prop.initializer
  if (!ts.isObjectLiteralExpression(init)) return { present: true, formLiteral: null }
  const formProp = init.properties.find(
    p => p.name && ts.isIdentifier(p.name) && p.name.text === 'form'
  )
  if (!formProp || !ts.isPropertyAssignment(formProp)) return { present: true, formLiteral: null }
  const formInit = formProp.initializer
  if (ts.isStringLiteral(formInit)) return { present: true, formLiteral: formInit.text }
  return { present: true, formLiteral: null }
}

export function findEventConstructionSites(file: string): EventConstructionSite[] {
  const text = readFileSync(file, 'utf-8')
  const strippedForDisplay = stripComments(text)
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const out: EventConstructionSite[] = []

  function visit(node: ts.Node) {
    let candidate: ts.ObjectLiteralExpression | null = null

    // (a) events.push({...}) / <naam>.push({...})
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'push') {
      const arg = node.arguments[0]
      if (arg && isEventLiteral(arg)) candidate = arg
    }

    // (b) return {...} i en generate*Event*-funktion
    if (ts.isReturnStatement(node) && node.expression && isEventLiteral(node.expression)) {
      candidate = node.expression
    }

    if (candidate) {
      const { present, formLiteral } = extractProofSource(candidate)
      const { line } = sf.getLineAndCharacterOfPosition(candidate.getStart(sf))
      out.push({
        file,
        line: line + 1,
        hasProofSource: present,
        proofSourceFormLiteral: formLiteral,
        snippet: strippedForDisplay.split('\n')[line]?.trim() ?? '',
      })
    }

    ts.forEachChild(node, visit)
  }
  visit(sf)
  return out
}

export function checkGenereringskontrakt(file: string): GenereringskontraktViolation[] {
  const violations: GenereringskontraktViolation[] = []
  for (const site of findEventConstructionSites(file)) {
    if (!site.hasProofSource) {
      violations.push({
        file: site.file, line: site.line, kind: 'proofSource-saknas',
        detail: `GameEvent-konstruktion utan deklarerad proofSource (rad ${site.line}): "${site.snippet}"`,
      })
      continue
    }
    if (!site.proofSourceFormLiteral || !VALID_FORMS.has(site.proofSourceFormLiteral)) {
      violations.push({
        file: site.file, line: site.line, kind: 'proofSource-ogiltig-form',
        detail: `proofSource.form är inte en av 'state-predicate'|'ledger'|'timeless' (rad ${site.line}): "${site.snippet}"`,
      })
    }
  }
  return violations
}

export function scanGenereringskontrakt(files: string[]): GenereringskontraktViolation[] {
  return files.flatMap(checkGenereringskontrakt)
}
