import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { SCENES } from './sceneRegistry'

/**
 * META-GRINDEN (människoupplevelse-audit 7024f8a, 2026-08-24, H1-uppföljning).
 *
 * "Skydd eller illusion?" (SLUTTEST_KO.md, 2026-08-20) mätte täckningen EN
 * gång, för hand, och fann 35 av 55 visuella ytor onåbara via /dev/scenes.
 * Ingen av de fem grindarna svepte dem, för de svepte bara SCENES-listan —
 * en lista ingen jämförde mot vad appen FAKTISKT routar till. Bygget (H1:s
 * nav-overlap + den äldre Annika-finansieringsbuggen) var ett konkret exempel
 * på precis den luckan: en rutt (`/game/bygget`) utan en enda dev-scen.
 *
 * Den här filen gör jämförelsen maskinellt och repeterbart: parsar de
 * faktiska `/game`-rutterna direkt ur AppRouter.tsx (källan, inte ett
 * handskrivet minne av den) och slår upp varje rutt mot ROUTE_SCENE_MAP →
 * SCENES. En rutt utan täckning här är en rutt "Skydd eller illusion?"-
 * fyndet skulle ha räknat som onåbar.
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const APP_ROUTER_PATH = join(__dirname, '../../src/presentation/navigation/AppRouter.tsx')

/** Alla `/game/*`-rutter, parsade ur AppRouter.tsx. Relativa sub-rutter under
 *  `<Route path="/game" element={<GameShell />}>` normaliseras utan
 *  ledande `/game/`; absoluta `/game/*`-rutter (GameGuard-blocket) likaså —
 *  samma nyckelrymd, oavsett hur AppRouter.tsx råkar deklarera dem. */
export function getGameRoutes(): string[] {
  const src = readFileSync(APP_ROUTER_PATH, 'utf-8')
  const allPaths = [...src.matchAll(/<Route\s+path="([^"]+)"/g)].map(m => m[1])
  return allPaths
    .filter(p => p !== '*' && (!p.startsWith('/') || p.startsWith('/game/')))
    .map(p => (p.startsWith('/game/') ? p.slice('/game/'.length) : p))
}

// Coverage = ett scen-id i SCENES (sveps av scenes.visual.ts/tapTargetGate/
// rawTokenGate automatiskt) ELLER ett DevScenesScreen-SceneId som medvetet
// INTE står i SCENES men sveps av en egen, namngiven regressionstest —
// samma mönster som 'navgate-laddning-band' (SÄTT LAGET) etablerade före
// H1: en scen som kräver riktiga klick/en riktig BottomNav för att nå sitt
// verkliga tillstånd hör hemma i en bespoke test, inte i den generiska
// clickText-sveparen (som bara stödjer ETT klick). Lägg till här när en ny
// sådan scen byggs — annars räknas den (felaktigt) som otäckt.
const MANUALLY_COVERED_SCENE_IDS = new Set([
  'navgate-laddning-band', // tapTargetGate.visual.ts: tap-target-regression — MatchLaddningBand
  'bygget-avveckling',     // tapTargetGate.visual.ts: tap-target-regression — Bygget (H1)
])

const REGISTERED_SCENE_IDS = new Set([
  ...SCENES.map(([id]) => id),
  ...MANUALLY_COVERED_SCENE_IDS,
])

/**
 * Rutt → scen-id(n) i tests/visual/sceneRegistry.ts som faktiskt sveper den
 * ruttens skärmkomponent. En rutt UTAN rad här, eller vars samtliga
 * scen-id:n saknas ur SCENES, räknas otäckt.
 *
 * Underhålls för hand (som contentContract.ts) — ingen mekanisk härledning
 * kan veta VILKEN scen som visuellt motsvarar vilken rutt, bara att den gör
 * det. Ny rutt i AppRouter.tsx → lägg en rad här samma commit, annars
 * fångar `route saknar rad i ROUTE_SCENE_MAP`-grenen nedan den ändå (som
 * otäckt, inte som ett krasch) nästa gång testet körs.
 */
export const ROUTE_SCENE_MAP: Record<string, string[]> = {
  dashboard: ['portal', 'portal-cards', 'portal-tom', 'portal-normal', 'portal-full', 'portal-grind', 'portal-bid-single', 'portal-bid-multi'],
  squad: ['squad', 'squad-trupp', 'trupp-blandat', 'trupp-kris', 'lineup-empty', 'lineup-filled'],
  match: ['navgate-laddning-band'], // renderar MatchScreen — se DevScenesScreen.tsx
  'match/live': ['match-live'],
  transfers: ['transfers-closed', 'transfers-open-nobids', 'transfers-onebid', 'transfers-multibids'],
  club: ['club-fresh', 'club-established'],
  tabell: ['tabell'],
  'season-summary': ['season-a', 'season-b', 'season-c', 'season-header', 'season-noplayoffs', 'season-fired'],
  'season-summary/:season': ['season-a', 'season-b', 'season-c', 'season-header', 'season-noplayoffs', 'season-fired'],
  taktik: ['taktik'],
  // Jacobs order (2026-08-24): lyft ur ratchet-skulden, inte kvar som TODO.
  // 'sommaren-*' renderar redan <SeasonTransitionScene /> (DevScenesScreen.tsx,
  // byggt i samband med 5.1 Sommaren, SLUTTEST_KO.md 2026-08-18) — samma
  // komponent som /game/season-transition routar till. Ren kartläggningsfix,
  // ingen ny dev-scen behövdes.
  'season-transition': ['sommaren-s2', 'sommaren-titelforsvarare', 'sommaren-tomt', 'sommaren-siffra'],
  review: ['granska', 'granska-cup', 'granska-cup-final', 'granska-slutspel', 'granska-sm-final', 'granska-avsked'],
  // H1 (2026-08-24): tidigare helt otäckt. AppRouter.tsx:158-159 — 'bygget'
  // är den kanoniska flik-destinationen, 'facility' behålls bara för
  // deep-links (push) men routar till exakt samma FacilityScreen.
  bygget: ['bygget'],
  facility: ['bygget'],
  'half-time-summary': ['halftime-summary'],
  // Jacobs order (2026-08-24): avskedsvägen — den enda ytan där en spelares
  // hela karriär tar slut. Lyft ur ratchet-skulden, inte kvar som TODO.
  'game-over': ['game-over'],
  'game-over/historik': ['game-over-historik'],
  // Route-ratchet 2026-09-01: HistoryScreen var redan registrerad via
  // game-over-historik men saknade bara denna kartläggning. De tre
  // slutspelsrutterna har nu egna deterministiska, generellt svepta scener.
  history: ['game-over-historik'],
  'playoff-intro': ['playoff-intro'],
  'qf-summary': ['qf-summary'],
  champion: ['champion'],
  'contract-demands': ['contract-demands'],
  'career-break': ['career-break'],
  inbox: ['inbox'],
  'sim-summary': ['sim-summary'],
  'hall-provning': ['hall-provning'],
}

export interface UncoveredRoute { route: string; reason: string }

export function getUncoveredGameRoutes(): UncoveredRoute[] {
  const result: UncoveredRoute[] = []
  for (const route of getGameRoutes()) {
    const sceneIds = ROUTE_SCENE_MAP[route]
    if (!sceneIds || sceneIds.length === 0) {
      result.push({ route, reason: 'ingen rad i ROUTE_SCENE_MAP' })
      continue
    }
    const registered = sceneIds.filter(id => REGISTERED_SCENE_IDS.has(id))
    if (registered.length === 0) {
      result.push({ route, reason: `mappade scen-id:n saknas i SCENES: ${sceneIds.join(', ')}` })
    }
  }
  return result
}
