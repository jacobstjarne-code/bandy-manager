/**
 * MEASUREMENT-ONLY. Anspråk 1 (lönekravshändelsen), Jacobs tvåvillkorsdom
 * 2026-08-27/28: händelsen ska bara triggas när BÅDA gäller samma säsong —
 *
 *   Villkor 1 (redan mätt tidigare, prestationsfaktor-matning-2026-08-27.ts):
 *     den ENDA högst-presterande kvalificerade spelaren i truppen har
 *     performanceFactor >= 1.25 (computeContractMinSalary-formeln,
 *     economyService.ts:321-343, gated på gamesPlayed >=
 *     MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR (economyService.ts:250, värde 5)).
 *
 *   Villkor 2 (NY, mäts här): den egna klubben mötte/överträffade sin
 *     boardExpectation samma säsong — dvs SeasonSummary.expectationVerdict
 *     !== 'failed' (samma boolean-spegling som seasonSummaryService.ts:477,
 *     `const metExpectation = expectationVerdict !== 'failed'`).
 *     expectationVerdict sätts av expectationVerdictFromRating (boardService.ts:460-472)
 *     ur computeSeasonVerdictRating (boardService.ts:188+, position mot
 *     BOARD_EXPECTATION_ANCHOR_POSITION-ankaret, boardService.ts:65-71) för
 *     den boardExpectation som GÄLLDE just den säsongen (SeasonSummary.boardExpectation,
 *     satt från game.seasonStartBoardExpectation vid säsongsslut, INTE den
 *     redan-stegade club.boardExpectation som gäller NÄSTA säsong).
 *
 * Två klubbar, 10 säsonger var, SAMMA seed-familj:
 *   A. Dominant — club_vastanfors (start-tier ChallengeTop), egna truppens
 *      currentAbility höjd +30 (klampat 99), samma DOMINANCE_BOOST-mönster
 *      som framgangskurvan-ansprak3-investsurplus-matning-2026-08-28.ts.
 *   B. Mid-table — club_malilla (start-tier MidTable), ORÖRD trupp — inget
 *      boost, "ordinary squad" per uppdraget.
 *
 * Per säsong: pre-rollover-snapshot (games precis INNAN det advanceToNextEvent-
 * anrop som returnerar seasonEnded=true — seasonStats nollställs av
 * handleSeasonEnd/rollover i samma anrop, se seasonEndProcessor.ts:536, så
 * detta är sista chansen att läsa dem) ger truppens seasonStats för
 * villkor 1. Post-rollover games.seasonSummaries[senaste] ger villkor 2.
 *
 * Kör: node_modules/.bin/vite-node scripts/anspark1-condition2-boardexpectation-matning-2026-08-28.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import { computeLeaguePositionAverages, MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR } from '../src/domain/services/economyService'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const SEASONS = 10
const DOMINANCE_BOOST = 30 // currentAbility-tillägg, klampat 99 — samma som ansprak3-scriptet

// Seeds valda via en seed-scan (scripts/_seedscan-dominant.ts, _seedscan-midtable.ts,
// körda och raderade efter denna mätning) för att hitta EN seed per klubbtyp som
// överlever alla 10 säsonger utan att bli sparkad halvvägs (managerFired avbryter
// annars körningen i förtid — se seed=82028 som gav 6/9 resp. 2/2 i en tidigare
// körning). Valet av seed påverkar ALDRIG spelreglerna som mäts, bara hur långt
// en enskild körning hinner innan brus/otur triggar avsked.
const DOMINANT_SEED = 100    // club_vastanfors +30 CA — 10/10 säsonger överlevda
const MIDTABLE_SEED = 2      // club_malilla, orörd — 10/10 säsonger överlevda

// Speglar de icke-exporterade PERFORMANCE_FACTOR_MIN/MAX-konstanterna i
// economyService.ts:305-306 (0.85 / 1.40) — kopierade hit eftersom filen
// inte exporterar dem, formeln (rad 337-339) reproducerad ordagrant.
const PERFORMANCE_FACTOR_MIN = 0.85
const PERFORMANCE_FACTOR_MAX = 1.40
function clampPerformanceFactor(v: number): number {
  return Math.max(PERFORMANCE_FACTOR_MIN, Math.min(PERFORMANCE_FACTOR_MAX, v))
}

interface SeasonRow {
  season: number
  gate1_topPerformanceFactor: number | null
  gate1_qualifies: boolean
  gate2_boardExpectation: string | null
  gate2_expectationVerdict: string | null
  gate2_metOrExceeded: boolean
  finalPosition: number | null
  fires: boolean
}

function makeGame(clubId: string, boost: number, seed: number): SaveGame {
  const game = createNewGame({ managerName: `A1C2-${clubId}`, clubId, seed })
  if (boost === 0) return { ...game, pendingScreen: null }
  const boosted = game.players.map(p =>
    p.clubId === game.managedClubId ? { ...p, currentAbility: Math.min(99, p.currentAbility + boost) } : p,
  )
  return { ...game, players: boosted, pendingScreen: null }
}

function topPerformanceFactorForManagedSquad(game: SaveGame): number | null {
  const leagueAverages = computeLeaguePositionAverages(game)
  const squad = game.players.filter(p => p.clubId === game.managedClubId)
  let best: number | null = null
  for (const p of squad) {
    const stats = p.seasonStats
    if (!stats || stats.gamesPlayed < MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR) continue
    const avg = leagueAverages[p.position]
    const ratingDelta = stats.averageRating - avg.avgRating
    const goalsDelta = stats.goals - avg.avgGoals
    const assistsDelta = stats.assists - avg.avgAssists
    const pf = clampPerformanceFactor(1 + ratingDelta * 0.08 + goalsDelta * 0.015 + assistsDelta * 0.012)
    if (best === null || pf > best) best = pf
  }
  return best
}

function runClub(label: string, clubId: string, boost: number, seed: number): SeasonRow[] {
  let game = makeGame(clubId, boost, seed)
  const rows: SeasonRow[] = []
  let stepSeed = seed * 1000

  for (let season = 1; season <= SEASONS; season++) {
    let seasonDone = false
    let preRollover = game
    let guard = 0

    while (!seasonDone) {
      guard++
      if (guard > 2000) throw new Error(`${label} säsong ${season}: round guard tripped`)
      game = autoSelectLineup(game)
      const screenResult = autoResolvePendingScreen(game)
      game = screenResult.game
      if (screenResult.unresolvable) {
        console.log(`  [${label}] säsong ${season}: unresolvable pendingScreen (${screenResult.screenType}) — avbryter körning`)
        return rows
      }
      preRollover = game
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game
      if (result.seasonEnded || game.managerFired) seasonDone = true
    }

    const topPF = topPerformanceFactorForManagedSquad(preRollover)
    const gate1 = topPF !== null && topPF >= 1.25
    const lastSummary = game.seasonSummaries?.[game.seasonSummaries.length - 1]
    const gate2 = lastSummary ? lastSummary.expectationVerdict !== 'failed' : false

    rows.push({
      season,
      gate1_topPerformanceFactor: topPF,
      gate1_qualifies: gate1,
      gate2_boardExpectation: lastSummary?.boardExpectation ?? null,
      gate2_expectationVerdict: lastSummary?.expectationVerdict ?? null,
      gate2_metOrExceeded: gate2,
      finalPosition: lastSummary?.finalPosition ?? null,
      fires: !!game.managerFired,
    })

    if (game.managerFired) {
      console.log(`  [${label}] avskedad efter säsong ${season} — stoppar körningen (${SEASONS - season} säsonger saknas)`)
      break
    }
  }
  return rows
}

function printTable(label: string, rows: SeasonRow[]): void {
  console.log(`\n=== ${label} ===`)
  console.log('Säsong | topPF   | G1 | boardExp     | verdict  | G2 | slutplac | FIRES')
  for (const r of rows) {
    const pf = r.gate1_topPerformanceFactor !== null ? r.gate1_topPerformanceFactor.toFixed(3) : '  n/a  '
    console.log(
      `${String(r.season).padStart(6)} | ${pf} | ${r.gate1_qualifies ? ' J' : ' N'} | ` +
      `${(r.gate2_boardExpectation ?? '-').padEnd(12)} | ${(r.gate2_expectationVerdict ?? '-').padEnd(8)} | ` +
      `${r.gate2_metOrExceeded ? ' J' : ' N'} | ${String(r.finalPosition ?? '-').padStart(8)} | ` +
      `${r.fires ? 'JA' : ''} | FIRES=${r.gate1_qualifies && r.gate2_metOrExceeded ? 'JA' : 'nej'}`,
    )
  }
  const fires = rows.filter(r => r.gate1_qualifies && r.gate2_metOrExceeded).length
  console.log(`\nTotalt: ${fires}/${rows.length} säsonger triggar händelsen (BÅDA villkor).`)
  console.log(`  Villkor 1 ensamt (performanceFactor>=1.25): ${rows.filter(r => r.gate1_qualifies).length}/${rows.length}`)
  console.log(`  Villkor 2 ensamt (mötte/överträffade boardExpectation): ${rows.filter(r => r.gate2_metOrExceeded).length}/${rows.length}`)
}

function main(): void {
  console.log(`\n=== Anspråk 1, villkor 2-mätning (boardExpectation) — ${SEASONS} säsonger ===`)

  console.log(`\n--- Kör DOMINANT klubb (club_vastanfors, +30 CA-boost, seed=${DOMINANT_SEED}) ---`)
  const dominantRows = runClub('DOMINANT', 'club_vastanfors', DOMINANCE_BOOST, DOMINANT_SEED)

  console.log(`\n--- Kör MID-TABLE klubb (club_malilla, ORÖRD trupp, seed=${MIDTABLE_SEED}) ---`)
  const midRows = runClub('MID-TABLE', 'club_malilla', 0, MIDTABLE_SEED)

  printTable('DOMINANT KLUBB (club_vastanfors, boost=+30 CA)', dominantRows)
  printTable('MID-TABLE KLUBB (club_malilla, ingen boost)', midRows)

  console.log('\n=== SLUT ===\n')
}

main()
