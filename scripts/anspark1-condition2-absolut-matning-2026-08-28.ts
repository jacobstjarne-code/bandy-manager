/**
 * MEASUREMENT-ONLY. Anspråk 1 (lönekravshändelsen), omdesignad tvåvillkorsgrind
 * efter fyndet i anspark1-condition2-boardexpectation-matning-2026-08-28.ts
 * (tier-relativ villkor 2 var bakvänd: dominant 7/10, mid-table 9/10 —
 * fel håll).
 *
 * NYTT VILLKOR 1 (höjd tröskel): samma källa som förut
 * (computeContractMinSalary-formeln, economyService.ts, gated på
 * gamesPlayed >= MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR (5)), men
 * tröskeln höjd 1.25 -> 1.35 (nära formelns tak 1.40).
 *
 * NYTT VILLKOR 2 (absolut, ej tier-relativt): minst ETT av:
 *   (a) topp-3 i ligan (finalPosition <= 3)
 *   (b) vann en titel (ligan via slutspel: playoffResult === 'champion',
 *       ELLER cupen: cupResult === 'winner')
 *   (c) förbättrad ligaplacering mot FÖREGÅENDE säsong (lägre finalPosition-
 *       tal = bättre placering, dvs thisSeason.finalPosition <
 *       prevSeason.finalPosition)
 *
 * Föregående säsongs placering läses ur game.seasonSummaries[i-1] — detta
 * fält ackumulerar EN post per säsong för den STYRDA klubben (verifierat:
 * seasonEndProcessor.ts rad ~1579, `seasonSummaries: [...(game.seasonSummaries
 * ?? []), seasonSummary]`, och generateSeasonSummary anropas bara för
 * managedClubId). game.standings är INTE använt för detta — den nollställs
 * till en alfabetisk dummytabell vid rollover (dokumenterad fälla).
 *
 * Samma harness, SAMMA seeds och klubbkonstruktioner som föregångar-scriptet:
 *   A. Dominant — club_vastanfors, +30 CA-boost (klampat 99), seed=100
 *   B. Mid-table — club_malilla, orörd trupp, seed=2
 *
 * Kör: node_modules/.bin/vite-node scripts/anspark1-condition2-absolut-matning-2026-08-28.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import { computeLeaguePositionAverages, MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR } from '../src/domain/services/economyService'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { SeasonSummary } from '../src/domain/entities/SeasonSummary'

const SEASONS = 10
const DOMINANCE_BOOST = 30

const DOMINANT_SEED = 100
const MIDTABLE_SEED = 2

// Extra robusthets-seeds (ej cherry-plockade — löpande heltal, samma mönster
// som seed-scan-metoden i föregångarscriptet, men INTE filtrerade på överlevnad
// den här gången: en klubb som blir avskedad halvvägs bidrar ändå sina spelade
// säsonger till poolen).
const DOMINANT_ROBUST_SEEDS = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110]
const MIDTABLE_ROBUST_SEEDS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const PERFORMANCE_FACTOR_MIN = 0.85
const PERFORMANCE_FACTOR_MAX = 1.40
function clampPerformanceFactor(v: number): number {
  return Math.max(PERFORMANCE_FACTOR_MIN, Math.min(PERFORMANCE_FACTOR_MAX, v))
}
const GATE1_THRESHOLD = 1.35

interface SeasonRow {
  season: number
  topPF: number | null
  gate1: boolean
  finalPosition: number | null
  prevPosition: number | null
  top3: boolean
  wonTrophy: boolean
  improved: boolean
  gate2: boolean
  fires: boolean
  managerFired: boolean
}

function makeGame(clubId: string, boost: number, seed: number): SaveGame {
  const game = createNewGame({ managerName: `A1C2ABS-${clubId}`, clubId, seed })
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

function runClub(label: string, clubId: string, boost: number, seed: number, seasons: number): SeasonRow[] {
  let game = makeGame(clubId, boost, seed)
  const rows: SeasonRow[] = []
  let stepSeed = seed * 1000

  for (let season = 1; season <= seasons; season++) {
    let seasonDone = false
    let preRollover = game
    let guard = 0

    while (!seasonDone) {
      guard++
      if (guard > 2000) throw new Error(`${label} seed=${seed} säsong ${season}: round guard tripped`)
      game = autoSelectLineup(game)
      const screenResult = autoResolvePendingScreen(game)
      game = screenResult.game
      if (screenResult.unresolvable) {
        console.log(`  [${label} seed=${seed}] säsong ${season}: unresolvable pendingScreen (${screenResult.screenType}) — avbryter körning`)
        return rows
      }
      preRollover = game
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game
      if (result.seasonEnded || game.managerFired) seasonDone = true
    }

    const topPF = topPerformanceFactorForManagedSquad(preRollover)
    const gate1 = topPF !== null && topPF >= GATE1_THRESHOLD

    const summaries: SeasonSummary[] = game.seasonSummaries ?? []
    const thisSummary = summaries[summaries.length - 1]
    const prevSummary = summaries.length >= 2 ? summaries[summaries.length - 2] : null

    const finalPosition = thisSummary?.finalPosition ?? null
    const prevPosition = prevSummary?.finalPosition ?? null
    const top3 = finalPosition !== null && finalPosition <= 3
    const wonTrophy = !!thisSummary && (thisSummary.playoffResult === 'champion' || thisSummary.cupResult === 'winner')
    const improved = finalPosition !== null && prevPosition !== null && finalPosition < prevPosition
    const gate2 = top3 || wonTrophy || improved

    rows.push({
      season,
      topPF,
      gate1,
      finalPosition,
      prevPosition,
      top3,
      wonTrophy,
      improved,
      gate2,
      fires: gate1 && gate2,
      managerFired: !!game.managerFired,
    })

    if (game.managerFired) {
      console.log(`  [${label} seed=${seed}] avskedad efter säsong ${season} — stoppar körningen (${seasons - season} säsonger saknas)`)
      break
    }
  }
  return rows
}

function printTable(label: string, rows: SeasonRow[]): void {
  console.log(`\n=== ${label} ===`)
  console.log('Säsong | topPF   | G1(>=1.35) | placering | föreg | topp3 | titel | förbättr | G2 | FIRES')
  for (const r of rows) {
    const pf = r.topPF !== null ? r.topPF.toFixed(3) : '  n/a  '
    console.log(
      `${String(r.season).padStart(6)} | ${pf} | ${r.gate1 ? '    J     ' : '    N     '} | ` +
      `${String(r.finalPosition ?? '-').padStart(9)} | ${String(r.prevPosition ?? '-').padStart(5)} | ` +
      `${r.top3 ? '  J  ' : '  N  '} | ${r.wonTrophy ? '  J  ' : '  N  '} | ${r.improved ? '   J    ' : '   N    '} | ` +
      `${r.gate2 ? 'J' : 'N'}  | ${r.fires ? 'JA' : 'nej'}${r.managerFired ? ' (AVSKEDAD)' : ''}`,
    )
  }
  const fires = rows.filter(r => r.fires).length
  const g1 = rows.filter(r => r.gate1).length
  const g2 = rows.filter(r => r.gate2).length
  console.log(`\nTotalt: ${fires}/${rows.length} säsonger triggar (BÅDA villkor).`)
  console.log(`  Villkor 1 ensamt (PF>=1.35): ${g1}/${rows.length}`)
  console.log(`  Villkor 2 ensamt (topp3/titel/förbättrad): ${g2}/${rows.length}`)
}

function summarizePool(label: string, allRows: SeasonRow[]): void {
  const n = allRows.length
  const g1 = allRows.filter(r => r.gate1).length
  const g2 = allRows.filter(r => r.gate2).length
  const fires = allRows.filter(r => r.fires).length
  console.log(`\n--- Pool-sammanfattning ${label}: ${n} säsonger totalt ---`)
  console.log(`  Villkor 1 (PF>=1.35): ${g1}/${n} (${(100 * g1 / n).toFixed(0)}%)`)
  console.log(`  Villkor 2 (absolut):  ${g2}/${n} (${(100 * g2 / n).toFixed(0)}%)`)
  console.log(`  FIRES (AND):          ${fires}/${n} (${(100 * fires / n).toFixed(0)}%)`)
}

function main(): void {
  console.log(`\n=== Anspråk 1, villkor 2 OMDESIGN (absolut, ej tier-relativt) — ${SEASONS} säsonger ===`)

  console.log(`\n--- Kör DOMINANT klubb (club_vastanfors, +30 CA-boost, seed=${DOMINANT_SEED}) ---`)
  const dominantRows = runClub('DOMINANT', 'club_vastanfors', DOMINANCE_BOOST, DOMINANT_SEED, SEASONS)

  console.log(`\n--- Kör MID-TABLE klubb (club_malilla, ORÖRD trupp, seed=${MIDTABLE_SEED}) ---`)
  const midRows = runClub('MID-TABLE', 'club_malilla', 0, MIDTABLE_SEED, SEASONS)

  printTable('DOMINANT KLUBB (club_vastanfors, boost=+30 CA, seed=100)', dominantRows)
  printTable('MID-TABLE KLUBB (club_malilla, ingen boost, seed=2)', midRows)

  // Robusthets-pool: 10 extra seeds per klubbtyp, ej cherry-plockade
  console.log('\n\n=== ROBUSTHETS-POOL (10 extra seeds per klubbtyp, ej filtrerade på överlevnad) ===')
  const dominantPool: SeasonRow[] = []
  for (const s of DOMINANT_ROBUST_SEEDS) {
    const rows = runClub('DOMINANT-POOL', 'club_vastanfors', DOMINANCE_BOOST, s, SEASONS)
    dominantPool.push(...rows)
  }
  const midPool: SeasonRow[] = []
  for (const s of MIDTABLE_ROBUST_SEEDS) {
    const rows = runClub('MIDTABLE-POOL', 'club_malilla', 0, s, SEASONS)
    midPool.push(...rows)
  }

  summarizePool('DOMINANT (10 seeds x upp till 10 säsonger)', dominantPool)
  summarizePool('MID-TABLE (10 seeds x upp till 10 säsonger)', midPool)

  console.log('\n=== SLUT ===\n')
}

main()
