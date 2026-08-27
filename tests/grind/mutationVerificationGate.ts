import * as ts from 'typescript'
import { readFileSync } from 'node:fs'
import { stripComments } from './forbudslistan'

/**
 * MUTATIONSVERIFIERINGSGRINDEN (2026-08-24) — den andra strukturella fixen
 * PASTAENDEKARTAN_2026-08-24.md:s "NÄR, inte VAR"-omdiagnos pekade ut.
 *
 * Jacobs fråga: "finns det en gemensam mekanism — t.ex. att alla 'efter
 * mutation'-fall skulle lösas av att textbyggare alltid får både gameBefore
 * och gameAfter, som captureSystemDecision nu gör?"
 *
 * Svaret, efter att ha läst `seasonDecisionCaptureService.ts` rad för rad:
 * ARKITEKTUREN fanns redan — `Builder`-typen (rad 48) tar emot BÅDA
 * `gameBefore` och `gameAfter` på VARJE post i `BUILDERS`, sedan H3-passet
 * (2026-08-24, samma dag). Det som saknades var aldrig ÅTKOMST till
 * gameAfter — det var att VARJE byggare faktiskt DEREFERERAR den för sin
 * EGEN specifika verifiering (take_loan mot economicCrisisState.outcome,
 * ask_mecenat mot happiness-delta, offer_tribute mot finansdelta — tre
 * OLIKA predikat, ingen generisk "kolla att X hände"-funktion finns eller
 * BÖR finnas, eftersom vad som räknas som "verifierat" skiljer sig per
 * påstående). Så den mekaniska delen av "gemensam mekanism" är INTE en
 * gemensam KÖRTIDSFUNKTION — det är en gemensam GRIND som kräver att varje
 * byggare i BUILDERS-registret refererar gameAfter i sin egen kropp, inte
 * bara tar emot den. Exakt samma familj kontroll som nivå 1/nivå 2 (crawlar
 * källkod, inget typkontrollerat Program) — bara riktad mot ETT specifikt
 * registermönster (event.type → choiceId → byggare) istf ett generiskt
 * @cites.
 *
 * Baseline idag: 8/8 byggare refererar redan gameAfter (H3-passet fixade
 * samtliga). Grinden är alltså en REGRESSIONSVAKT, inte en pågående fix —
 * om en nionde byggare läggs till utan att röra gameAfter, syns det här
 * innan det syns som ett nytt PÅSTÅENDEKARTAN-fynd månader senare.
 *
 * Dubbel signal, inte bara namnkonvention: (1) parametern på plats 2 ska
 * heta exakt "gameAfter", inte "_gameAfter" (filens EGEN konvention för
 * "mottagen men medvetet oanvänd", se sell_star/take_loan/etc:s
 * "_gameBefore"-prefix när BEFORE inte behövs) — OCH (2) identifieraren
 * "gameAfter" ska förekomma minst en gång TILL i kroppen, bortom parameter-
 * listan (bevisar att den faktiskt dereferereras, inte bara namngiven rätt
 * och sen ignorerad).
 */

export interface BuilderCheck {
  file: string
  eventType: string
  choiceId: string
  referencesGameAfter: boolean
  paramNamedCorrectly: boolean
}

export interface MutationGateViolation {
  file: string
  eventType: string
  choiceId: string
  detail: string
}

export function findBuilderChecks(file: string, variableName = 'BUILDERS'): BuilderCheck[] {
  const text = readFileSync(file, 'utf-8')
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const out: BuilderCheck[] = []

  function visit(node: ts.Node): void {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === variableName && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      for (const outerProp of node.initializer.properties) {
        if (!ts.isPropertyAssignment(outerProp)) continue
        const eventType = propName(outerProp.name)
        if (!ts.isObjectLiteralExpression(outerProp.initializer)) continue
        for (const innerProp of outerProp.initializer.properties) {
          if (!ts.isPropertyAssignment(innerProp)) continue
          const choiceId = propName(innerProp.name)
          const fn = innerProp.initializer
          if (!ts.isArrowFunction(fn) && !ts.isFunctionExpression(fn)) continue

          const secondParam = fn.parameters[1]
          const paramName = secondParam && ts.isIdentifier(secondParam.name) ? secondParam.name.text : ''
          const paramNamedCorrectly = paramName === 'gameAfter'

          // Kommentarer strippade INNAN kollen — samma motivering som
          // citesDeclaration.ts: en rotorsak-kommentar som i PROSA nämner
          // "gameAfter" (t.ex. "gameAfter mottagen men aldrig läst") är
          // inte en kodrad och ska inte räknas som en dereferens. Fångat av
          // grindens EGET meta-test innan leverans (samma mönster som
          // grind0/nivå 1 tidigare denna session).
          const bodyText = stripComments(fn.body.getText(sf))
          // Räkna förekomster i KROPPEN, inte i parameterlistan — body här
          // är redan bara fn.body (blocket/uttrycket), parameterlistan
          // ingår inte, så varje träff är en verklig dereferens.
          const referencesGameAfter = /\bgameAfter\b/.test(bodyText)

          out.push({ file, eventType, choiceId, referencesGameAfter, paramNamedCorrectly })
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return out
}

function propName(name: ts.PropertyName): string {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text
  return name.getText()
}

export function checkMutationGate(file: string, variableName = 'BUILDERS'): MutationGateViolation[] {
  const checks = findBuilderChecks(file, variableName)
  const violations: MutationGateViolation[] = []
  for (const c of checks) {
    if (!c.paramNamedCorrectly) {
      violations.push({
        file: c.file, eventType: c.eventType, choiceId: c.choiceId,
        detail: `byggaren för (${c.eventType}, ${c.choiceId}) namnger inte sin andra parameter "gameAfter" (filens konvention för "medvetet oanvänd" är "_gameAfter" — namnge den rätt om den används, prefixa om den inte gör det).`,
      })
      continue
    }
    if (!c.referencesGameAfter) {
      violations.push({
        file: c.file, eventType: c.eventType, choiceId: c.choiceId,
        detail: `byggaren för (${c.eventType}, ${c.choiceId}) tar emot gameAfter men dereferererar den aldrig i kroppen — en mening kan skrivas utan att verifiera mot speltillståndet EFTER effekten (H3-bugklassen: "sant i choiceId, falskt i spelvärlden").`,
      })
    }
  }
  return violations
}
