import { describe, it, expect } from 'vitest'
import { getGameRoutes, getUncoveredGameRoutes } from '../../tests/visual/routeSceneCoverage'

/**
 * H1 meta-grinden (människoupplevelse-audit 7024f8a, 2026-08-24). Se
 * tests/visual/routeSceneCoverage.ts för rotorsak och metod.
 *
 * RATCHET, inte nolltolerans — samma mönster som O11-enforcement
 * (SLUTTEST_KO.md rad 58, contentContract.ts): "Skydd eller illusion?"
 * (2026-08-20) hittade 35 onåbara ytor, de flesta fortfarande ostängda.
 * Grinden får inte blockera hela sviten för skuld som redan fanns innan
 * den fanns — den ska bara vägra att skulden VÄXER. Sänk BASELINE när fler
 * rutter täcks; höj den ALDRIG utan en rad i docs/BACKLOG.md om varför.
 */
// Sänkt 10 → 7 (2026-08-24, Jacobs order): season-transition, game-over och
// game-over/historik lyfta ur skulden samma dag de identifierades — inte
// lämnade som ratchet-TODO. Kvar efter 2026-09-01:s slutspelsbunt: inbox,
// sim-summary, hall-provning, contract-demands och career-break. History var
// redan byggd men saknade route-mappning; tre slutspelsrutter fick egna scener.
// Höjd 7 → 8 (2026-08-28, A-H2b DOM_AH2B_RETENTION_2026-08-28.md): ny rutt
// /game/contract-demands (SeasonContractDemandsScreen) — nåbar i normalt
// spel, bara utan en dev-scene ännu (texten är fortfarande [Opus]-platshållare).
// Se docs/BACKLOG.md ("BYGGT MEN OSYNLIGT/ONÅBART") för stäng-villkoret.
// Höjd 8 → 9 (2026-08-29, O13 DOM_TRANARMARKNADEN_2026-08-26.md): ny rutt
// /game/career-break (CareerBreakScreen) — nåbar från Game Over efter ett
// avsked, men utan dev-scene ännu av exakt samma skäl som contract-demands
// ovan: hela ytans text är [Opus]-platshållare, och skärmen läser sitt
// tillstånd ur store:t i stället för ur en prop (till skillnad från
// HistoryScreens `snapshot`), så den kan inte monteras i dev-skalet med ett
// påhittat spel förrän den tar emot careerBreak som prop. Stäng-villkor och
// ägare i docs/BACKLOG.md ("BYGGT MEN OSYNLIGT/ONÅBART").
const BASELINE_UNCOVERED_GAME_ROUTES = 0

describe('route → dev-scene-täckning (H1 meta-grind)', () => {
  it('varje /game-rutt i AppRouter.tsx har minst ett registrerat SCENES-id i ROUTE_SCENE_MAP', () => {
    const uncovered = getUncoveredGameRoutes()
    if (uncovered.length > BASELINE_UNCOVERED_GAME_ROUTES) {
      throw new Error(
        `Nya otäckta /game-rutter sedan baseline (${BASELINE_UNCOVERED_GAME_ROUTES} → ${uncovered.length}):\n` +
        uncovered.map(u => `  - ${u.route}: ${u.reason}`).join('\n'),
      )
    }
    expect(uncovered.length).toBeLessThanOrEqual(BASELINE_UNCOVERED_GAME_ROUTES)
  })

  it('rapporterar aktuell täckning (informativ — failar bara om routeparsningen går sönder)', () => {
    const routes = getGameRoutes()
    const uncovered = getUncoveredGameRoutes()
    // eslint-disable-next-line no-console
    console.log(
      `[H1 meta-grind] ${routes.length - uncovered.length}/${routes.length} /game-rutter dev-scene-täckta. ` +
      `Otäckta: ${uncovered.map(u => u.route).join(', ') || '(inga)'}`,
    )
    expect(routes.length).toBeGreaterThan(0)
  })
})
