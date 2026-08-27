import * as ts from 'typescript'
import { readFileSync } from 'node:fs'
import { stripComments } from './forbudslistan'

/**
 * PÅSTÅENDEGRINDEN nivå 1 — @cites-deklarationen (docs/PASTAENDEGRINDEN_2026-08-24.md).
 *
 * BILLIGA VARIANTEN (Jacobs dom 2026-08-24, efter kostnadsrapport): den fullt
 * typkontrollerade AST-varianten (ts.Program + TypeChecker, som skulle
 * resolvera VARJE property-access till dess deklarerade typ OCH spåra
 * indirektion genom hjälpfunktioner ett eller flera steg bort) är dyr av två
 * skäl, inte ett: (1) att bygga ett fullt Program över hela src/ kostar
 * ungefär vad `tsc` redan kostar (sekunder, inte gratis, men görbart), MEN
 * (2) den verkliga kostnadsdrivaren är korsfunktionsspårning — flera av
 * seriens 55 fynd (fulfillmentPct via boardMeetingStateResolver.ts, fanMood
 * via evaluateObjective) satt bakom EN hjälpfunktion, inte inline i
 * anroparen. Att verifiera "läser den anropade funktionen fältet, inte bara
 * anroparen" kräver ett litet points-to-liknande grafbygge, inte bara
 * type-resolution — det är dagar av bygge, inte en dag, och har äkta
 * precisionsrisk (missar indirektion mer än ett steg bort, riskerar falska
 * negativ på samma sätt som pastaendeGrindNiva2.test.ts:s ursprungliga
 * sort-regex).
 *
 * LÖSNING PÅ KORSFUNKTIONSPROBLEMET SOM GÖR DEN BILLIGA VARIANTEN DUGLIG:
 * en @cites-deklaration ska sitta på den funktion som FAKTISKT LÄSER fältet
 * för att fatta sitt beslut (resolveBoardMeetingState läser boardPatience
 * direkt i sin egen kropp, evaluateObjective läser supporterGroup.mood
 * direkt i sin egen kropp) — INTE på varje anropande skärm längre upp i
 * kedjan. Med den skopningen behöver grinden ALDRIG spåra över
 * funktionsgränser: den beslutsfattande funktionen har alltid fältet i sin
 * EGEN kropp. Detta är alltså inte bara "den billiga genvägen" — det är den
 * KORREKTA skopningen oavsett variant, och den gör att den billiga varianten
 * inte förlorar särskilt mycket jämfört med den dyra.
 *
 * VAD DEN GÖR (syntax-only, ts.createSourceFile, INGEN TypeChecker, INGEN
 * ts.Program — samma kostnadsklass som nivå 2:s regex, bara med riktig
 * funktionsgräns-parsning istf regex-gissning av var en funktion slutar):
 *
 *   1. Hittar varje MODULNIVÅ-funktion (export function / export const X =
 *      arrow|function-expression) vars ledande kommentar innehåller en
 *      `@cites Fält.a, Fält.b`-tagg.
 *   2. KRÄVER att varje deklarerat fält förekommer som substräng någonstans
 *      i funktionens EGEN källtext (bevisar inte att deklarationen är
 *      fabricerad — svagare än en riktig type-checked "läser precis detta
 *      och inget annat", men billigt och körbart i dag).
 *   3. FÖRBJUDER att någon av de KÄNDA proxy-tokens (samma vokabulär som
 *      nivå 2:s FORBUDSLISTA, forbudslistan.ts) förekommer i kroppen UTAN
 *      att vara med i deklarationen — en funktion FÅR läsa ett känt-dåligt
 *      fält om den öppet deklarerar det (då är det en medveten, granskningsbar
 *      avvikelse), men får aldrig göra det TYST.
 *
 * Detta fångar INTE varje tänkbart okänt fält (det gör bara den fulla
 * type-checked varianten, och även den bara om korsfunktionsspårningen är
 * komplett) — men det gör återfall av REDAN KÄNDA proxyer omöjliga i varje
 * funktion som väljer att delta (deklarera @cites), och det ger — till
 * skillnad från nivå 2 — ett positivt krav (deklarerade fält måste synas),
 * inte bara ett negativt (kända fält får inte synas).
 */

export interface CitesTag {
  file: string
  functionName: string
  declaredFields: string[]
  bodyText: string
}

export interface CitesViolation {
  file: string
  functionName: string
  kind: 'odeklarerat-fält-saknas-i-koden' | 'odeklarerad-känd-proxy-läst'
  detail: string
}

// Samma vokabulär som forbudslistan.ts:s nivå 2-tabell, generisk (fil-
// oberoende) eftersom nivå 1 ska kunna appliceras på VILKEN funktion som
// helst som väljer att delta, inte bara de åtta redan kända ytorna.
// `choiceId` (ensamt) är MEDVETET UTESLUTEN här: det är ett vanligt,
// legitimt funktionsparameternamn (t.ex. eventResolver.ts:s resolveEvent)
// och en blind token-scan hade gett brus i varje funktion som bara TAR
// EMOT choiceId som ett anropsargument utan att påstå något om det — nivå 2:s
// fil-skopade `player.clubId === gameAfter.managedClubId`-krav
// (seasonDecisionCaptureService.ts) är redan den precisa vakten för just den
// klassen.
export const KNOWN_PROXY_TOKENS: { label: string; pattern: RegExp; correctField: string; claim: string; declareAs: string[] }[] = [
  { label: 'htTempo/htPress/htMentality', pattern: /\bhtTempo\b|\bhtPress\b|\bhtMentality\b/, correctField: 'resolvedChoices', claim: 'vilket val spelaren gjorde', declareAs: ['httempo', 'htpress', 'htmentality'] },
  { label: 'fulfillmentPct', pattern: /\bfulfillmentPct\b/, correctField: 'boardPatience / getBoardPatienceZone', claim: 'styrelsens nöjdhet', declareAs: ['fulfillmentpct'] },
  { label: 'roundNumber', pattern: /\broundNumber\b/, correctField: 'matchday', claim: 'ordning mellan matcher', declareAs: ['roundnumber'] },
  { label: 'fanMood', pattern: /\.fanMood\b/, correctField: 'supporterGroup.mood', claim: 'publikens humör', declareAs: ['fanmood'] },
  { label: 'playoffBracket', pattern: /\bplayoffBracket\b/, correctField: 'championClubId / eliminatedByClubId (snapshottat)', claim: 'vem som blev mästare / eliminerades', declareAs: ['playoffbracket'] },
]

// Parserfragilitet fångad och fixad (2026-08-25, Jacobs order): den
// ursprungliga versionen matchade "@cites" VAR SOM HELST i en kommentar —
// inklusive löpande prosa som råkade nämna ordet ("...citatdeklarationen
// hör hemma DÄR" hade ALDRIG triggat, men en tidigare variant som
// bokstavligen skrev "@cites hör hemma DÄR" som en förklarande MENING
// gjorde det, och parsern kunde inte skilja den från en riktig deklaration).
// Detta är en fälla för nästa person: att skriva om ett @cites-beslut i
// prosa (fullt rimligt att vilja göra) kan av misstag skapa en NY,
// felaktig deklaration bara för att ordet förekommer. Fixen: kräv att
// "@cites" står FÖRST på sin rad (efter valfritt inledande whitespace och
// JSDoc:s enda `*`-prefix) i en BLOCK-kommentar (/** */, aldrig en //-rad)
// direkt före funktionsdeklarationen — allt annat ignoreras, oavsett var i
// kommentaren ordet "@cites" annars förekommer.
// Utökad 2026-08-25 (självupptäckt under användning, samma session): den
// ursprungliga versionen krävde exakt ETT `*`-prefix (JSDoc:s ` * `-rad) och
// fångade INTE ett giltigt, kompakt engradsformat (`/** @cites X */`) — en
// helt naturlig JSDoc-stil vem som helst skulle skriva. Resultat: taggen
// syntes i källkoden men grinden ignorerade den tyst, en falsk NEGATIV
// (motsatsen till prosa-kollisionen ovan, men samma fälleklass — författaren
// TROR funktionen är skyddad, den är det inte). `\/?\*+` matchar nu BÅDA
// prefixformerna (`*` eller `/**`), och en valfri `\*\/`-svans i slutet av
// den fångade fältlistan stryks — engradsformatets avslutande `*/` hamnade
// annars som en del av sista fältnamnet.
const CITES_LINE_RE = /^[ \t]*\/?\*+[ \t]*@cites[ \t]+([^\n]*?)[ \t]*(?:\*\/)?[ \t]*$/m

function getLeadingCitesTag(sf: ts.SourceFile, node: ts.Node): string[] | null {
  const fullText = sf.getFullText()
  const ranges = ts.getLeadingCommentRanges(fullText, node.getFullStart())
  if (!ranges) return null
  for (const r of ranges) {
    if (r.kind !== ts.SyntaxKind.MultiLineCommentTrivia) continue
    const commentText = fullText.slice(r.pos, r.end)
    const m = commentText.match(CITES_LINE_RE)
    if (m) return m[1].split(',').map(s => s.trim()).filter(Boolean)
  }
  return null
}

function fnName(node: ts.FunctionDeclaration, fallback: string): string {
  return node.name?.text ?? fallback
}

export function findCitesTags(file: string): CitesTag[] {
  const text = readFileSync(file, 'utf-8')
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const out: CitesTag[] = []

  sf.forEachChild(node => {
    if (ts.isFunctionDeclaration(node) && node.body) {
      const tag = getLeadingCitesTag(sf, node)
      if (tag) out.push({ file, functionName: fnName(node, '(anonym)'), declaredFields: tag, bodyText: node.getText(sf) })
      return
    }
    if (ts.isVariableStatement(node)) {
      const tag = getLeadingCitesTag(sf, node)
      if (!tag) return
      for (const decl of node.declarationList.declarations) {
        if (!decl.initializer) continue
        if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
          const name = ts.isIdentifier(decl.name) ? decl.name.text : '(destructured)'
          out.push({ file, functionName: name, declaredFields: tag, bodyText: node.getText(sf) })
        }
      }
    }
  })
  return out
}

export function checkCitesTag(tag: CitesTag): CitesViolation[] {
  const violations: CitesViolation[] = []
  // Kommentarer strippade INNAN båda kontrollerna — samma motivering som
  // forbudslistan.ts:s egen stripComments-kommentar: en rotorsak-kommentar
  // som (med rätta) i PROSA nämner ett förbjudet fältnamn ("läste tidigare
  // fanMood...") är inte en kodrad och ska inte trigga grinden. Utan detta
  // flaggade generatePostAdvanceEvents/evaluateObjective sina EGNA
  // förklarande kommentarer om fixen som om de vore ett nytt brott — fångat
  // av att köra detta mot riktig kod innan leverans, inte i teorin.
  const strippedBody = stripComments(tag.bodyText)

  for (const field of tag.declaredFields) {
    // Substräng-koll (svagare än type-checked "läser precis detta", se
    // filhuvudet) — kräver bara att den sista identifieraren i en
    // punktkedja ("SaveGame.resolvedChoices" → "resolvedChoices") faktiskt
    // förekommer i källkoden. Case-okänslig, INGEN \b-ordgräns: en
    // @cites-deklaration refererar prosamässigt till ett fält
    // ("boardPatience") medan koden ofta citerar det via en accessor med
    // annan case OCH som del av ett sammansatt camelCase-namn
    // (getBoardPatienceZone) — \b matchar bara vid en riktig \w/\W-gräns,
    // inte mitt i en sammanhängande identifierare som "getBoardPatienceZone"
    // (inget tecken mellan "get" och "Board" är en \W), så ett \b-krav gav
    // ett FALSKT NEGATIV på precis den korrekta skopningen filhuvudet
    // argumenterar för (citatet sitter i en getter/selector-anropskedja).
    // Ren substräng räcker för detta redan medvetet svaga bevis.
    const shortName = field.split('.').pop() ?? field
    if (!shortName || strippedBody.toLowerCase().includes(shortName.toLowerCase()) === false) {
      violations.push({
        file: tag.file, functionName: tag.functionName, kind: 'odeklarerat-fält-saknas-i-koden',
        detail: `deklarerar @cites ${field} men "${shortName}" förekommer aldrig i funktionskroppens KOD (kommentarer strippade) — fabricerad eller föråldrad deklaration.`,
      })
    }
  }

  const declaredShortNames = new Set(tag.declaredFields.map(f => (f.split('.').pop() ?? f).toLowerCase()))
  for (const proxy of KNOWN_PROXY_TOKENS) {
    if (!proxy.pattern.test(strippedBody)) continue
    // Deklarerad medvetet (funktionen SÄGER öppet att den läser detta) —
    // inte grindens jobb att bedöma OM det är rätt, bara att det inte är
    // TYST. Nivå 2:s fil-skopade regler är den hårdare, precisa vakten mot
    // just dessa åtta kända ytor. Exakt token-jämförelse (declareAs), INTE
    // substräng-innehåll — en tidigare version av detta test använde
    // .includes() här och lät t.ex. en deklaration av "mood" (för
    // supporterGroup.mood) av misstag TÄCKA över en odeklarerad "fanMood"-
    // läsning bara för att "fanmood" råkar innehålla "mood" som substräng.
    const isDeclared = proxy.declareAs.some(d => declaredShortNames.has(d))
    if (isDeclared) continue
    violations.push({
      file: tag.file, functionName: tag.functionName, kind: 'odeklarerad-känd-proxy-läst',
      detail: `läser "${proxy.label}" (känd proxy för "${proxy.claim}") utan att deklarera det i @cites. Ska citera: ${proxy.correctField}.`,
    })
  }

  return violations
}

export function scanCitesDeclarations(files: string[]): CitesViolation[] {
  const violations: CitesViolation[] = []
  for (const file of files) {
    for (const tag of findCitesTags(file)) {
      violations.push(...checkCitesTag(tag))
    }
  }
  return violations
}
