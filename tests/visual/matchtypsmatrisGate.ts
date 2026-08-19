import type { Page } from '@playwright/test'
import { visasFor, type GranskaSection } from '../../src/domain/services/granskaSectionRegistry'
import type { Tavlingstyp, Skede } from '../../src/domain/services/matchTypeAxes'

/**
 * Matchtypsmatris-grinden (åtgärdslistans post 20, 2026-08-19).
 *
 * Jacobs villkor, ordagrant: grinden ska assertera FRÅNVARO när matrisen
 * säger ✕ — inte bara att rätt sektioner finns. GRANSKA DEL 4 byggdes på att
 * ✕ betyder UTELÄMNAD, aldrig ett tomt/gråtonat kort (DS-regel 12) — det är
 * den regeln som kan glida tillbaka, t.ex. genom att någon "fixar" en tom
 * sektion genom att rendera en platshållare istället för att låta den utebli.
 * En grind som bara kollar närvaro fångar aldrig det — platshållaren SKULLE
 * ju vara "närvarande".
 *
 * Metod, sju av nio sektioner (tabell/form/statistik/dinaVal/
 * omgangssammanfattning/andraMatcher/scouting): TEXT-baserad frånvarokoll,
 * inte data-attribut. En platshållare som återanvänder samma rubrik
 * ("📊 TABELL" osv) — den mest sannolika regressionsformen, eftersom en
 * platshållare annars inte skulle kännas som "samma sektion" — fångas av
 * detta. En platshållare som hittar på en HELT ny rubrik fångas inte; det
 * är en svagare men ärlig gräns, inte en dold lucka.
 *
 * Presence testas INTE för dessa sju — visasFor()==true garanterar bara att
 * SLOTEN är relevant, inte att data finns (tabell kräver `standing`,
 * statistik kräver `fixture.report`, dinaVal kräver `rows.length>0` osv).
 * Att assertera närvaro där skulle ge falska larm på tomma dev-fixturer.
 *
 * Två sektioner (nastaMatchPekare, kapitelPunkt) har data-granska-section-
 * attribut i GranskaOversikt.tsx istället för textmatchning (dynamisk
 * text). kapitelPunkt är den enda sektionen där NÄRVARO också asserteras —
 * "ankaret" post 20 explicit namnger (kapitelPunktKind är deterministisk
 * när visasFor säger ✓, ingen datalucka att gömma bakom, se
 * kapitelPunktService.ts).
 */

const SECTION_HEADINGS: Partial<Record<GranskaSection, string>> = {
  tabell: '📊 TABELL',
  form: '📈 FORM',
  statistik: 'STATISTIK',
  dinaVal: '📋 DINA VAL',
  omgangssammanfattning: 'SEDAN SIST',
  andraMatcher: 'ANDRA MATCHER',
  scouting: '🔍 SCOUTING',
}

export interface MatchtypsmatrisViolation {
  message: string
}

export async function findMatchtypsmatrisViolations(
  page: Page,
  tavlingstyp: Tavlingstyp,
  skede: Skede | undefined,
  scopeSelector = '[data-scene-content]',
): Promise<MatchtypsmatrisViolation[]> {
  const violations: MatchtypsmatrisViolation[] = []
  const axesLabel = `${tavlingstyp}${skede ? '/' + skede : ''}`

  for (const [section, heading] of Object.entries(SECTION_HEADINGS) as [GranskaSection, string][]) {
    const expected = visasFor(section, tavlingstyp, skede)
    if (expected) continue // presence är data-beroende, se filkommentar — bara frånvaro testas
    const found = await page.evaluate(({ scopeSelector, heading }) => {
      const scope = document.querySelector(scopeSelector) ?? document.body
      return (scope.textContent ?? '').includes(heading)
    }, { scopeSelector, heading })
    if (found) {
      violations.push({ message: `"${section}" (rubrik "${heading}") syns trots att matrisen säger ✕ för ${axesLabel}` })
    }
  }

  // nastaMatchPekare — marker-baserad, dynamisk text kan inte matchas fast.
  const nastaMatchExpected = visasFor('nastaMatchPekare', tavlingstyp, skede)
  const nastaMatchFound = await page.evaluate(scopeSelector => {
    const scope = document.querySelector(scopeSelector) ?? document.body
    return !!scope.querySelector('[data-granska-section="nastaMatchPekare"]')
  }, scopeSelector)
  if (!nastaMatchExpected && nastaMatchFound) {
    violations.push({ message: `"nastaMatchPekare" syns trots att matrisen säger ✕ för ${axesLabel}` })
  }

  // kapitelPunkt — ankaret. Enda sektionen där NÄRVARO också asserteras.
  const kapitelExpected = visasFor('kapitelPunkt', tavlingstyp, skede)
  const kapitelFound = await page.evaluate(scopeSelector => {
    const scope = document.querySelector(scopeSelector) ?? document.body
    return !!scope.querySelector('[data-granska-section="kapitelPunkt"]')
  }, scopeSelector)
  if (kapitelExpected && !kapitelFound) {
    violations.push({ message: `kapitelPunkt (ankaret) SAKNAS trots att matrisen säger ✓ för ${axesLabel}` })
  }
  if (!kapitelExpected && kapitelFound) {
    violations.push({ message: `kapitelPunkt renderas trots att matrisen säger ✕ för ${axesLabel}` })
  }

  return violations
}
