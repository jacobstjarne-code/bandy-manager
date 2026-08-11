import type { Page } from '@playwright/test'

/**
 * Entitets-dedup-grinden (AUDIT DEL 2, 2026-08-12).
 *
 * Lärdom 27 (Portal-event dubbelrendering) hindrade inte fyra återfall i
 * samma bugklass under den här auditen (DIN SÄSONG/SÄSONGENS BERÄTTELSER,
 * DINA VAL, OpenBidsSecondary/PortalEventSlot, TransferDeadlinePrimary) —
 * ett dokument upprätthåller sig inte själv (Lärdom 39). Detta är grinden:
 * en levande DOM-assertion som körs över VARJE befintlig Playwright-scen,
 * inte ett nytt kontrollskript någon måste komma ihåg att köra.
 *
 * Kontrakt: komponenter som renderar EN instans av ett spelobjekt (bud,
 * event, storyline — de tre typer som orsakat dubbleringar hittills) sätter
 * `data-entity-id="<typ>:<id>"` + `data-entity-source="<Komponentnamn>"` på
 * sitt rotelement. Denna funktion skannar en scens data-scene-content-yta
 * (samma gräns skärmdumparna redan använder — "per skärm" betyder samma
 * sak här som för toHaveScreenshot) och failar om samma entity-id
 * förekommer via mer än en källa, MED ETT undantag.
 *
 * DET ENDA DEKLARERADE UNDANTAGET: EventPrimary + EventOverlay för samma
 * event-id. Rotorsak (inte kosmetisk): EventPrimary konkurrerar om Portal-
 * primary-platsen även när samma kritiska event tvingar fram en
 * EventOverlay (GameShell, skal-nivå) — ingen koordinering mellan lagren.
 * Overlayen täcker kortet visuellt så ingen spelare SER två kort, men båda
 * monterar i DOM:en. Flaggat, inte fixat — se docs/BACKLOG.md (C-EVT1).
 * Fixen hör hemma i portalBuilder-lagret med egen baseline+rotorsak, inte
 * inklämd här. Undantaget är SNÄVT: bara detta EXAKTA par för SAMMA id.
 * Om EventPrimary eller EventOverlay dubblerar mot NÅGOT ANNAT (eller mot
 * varandra i grupper >2), failar grinden som vanligt.
 */
const ALLOWED_DUPLICATE_SOURCE_PAIR = ['EventOverlay', 'EventPrimary'].sort().join('|')

export async function assertNoDuplicateEntityIds(
  page: Page,
  scopeSelector = '[data-scene-content]',
): Promise<void> {
  const entities = await page.locator(`${scopeSelector} [data-entity-id]`).evaluateAll(nodes =>
    nodes.map(n => ({
      id: n.getAttribute('data-entity-id') ?? '',
      source: n.getAttribute('data-entity-source') ?? 'okänd källa',
    })),
  )

  const bySource = new Map<string, string[]>()
  for (const { id, source } of entities) {
    if (!id) continue
    bySource.set(id, [...(bySource.get(id) ?? []), source])
  }

  const violations: string[] = []
  for (const [id, sources] of bySource) {
    if (sources.length <= 1) continue
    const isDeclaredException =
      sources.length === 2 && [...sources].sort().join('|') === ALLOWED_DUPLICATE_SOURCE_PAIR
    if (isDeclaredException) continue
    violations.push(`${id} renderas ${sources.length}× via [${sources.join(', ')}]`)
  }

  if (violations.length > 0) {
    throw new Error(
      `Entitets-dedup-grinden (AUDIT DEL 2): samma spelobjekt renderat flera gånger på skärmen:\n` +
      violations.map(v => `  - ${v}`).join('\n'),
    )
  }
}
