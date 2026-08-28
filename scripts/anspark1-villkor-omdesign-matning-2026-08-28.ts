/**
 * MEASUREMENT-ONLY. Anspråk 1 (lönekravshändelsen), tredje mätningen —
 * ägarens omdesign efter fyndet i
 * anspark1-condition2-absolut-matning-2026-08-28.ts (båda villkor fortfarande
 * för frekventa: dominant 9/10 / 71% pool, mid-table 5/10 / 27% pool. Mål:
 * dominant ≈50%, mid-table klart under 20%).
 *
 * NYTT VILLKOR 1 (marginal mot egna truppens tvåa, INTE liga-snitt):
 *   Rangordna den styrda truppens kvalificerade spelare (samma gate,
 *   gamesPlayed >= MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR, samma
 *   performanceFactor-formel som computeContractMinSalary i
 *   economyService.ts) fallande på performanceFactor. Mät
 *   gap = topFactor - secondFactor (etta minus tvåa). Ingen gissad tröskel —
 *   scriptet körs FÖRST med all gap-data odumpad, och tröskeln väljs i steg 2
 *   av denna fil (GATE1_MARGIN) efter att ha inspekterat fördelningen i en
 *   första körning (se rapport för resonemang).
 *
 * NYTT VILLKOR 2 (absolut, ingen "förbättrad"-klausul kvar): endast
 *   (a) topp-3 i ligan (finalPosition <= 3), ELLER
 *   (b) titel (playoffResult === 'champion' ELLER cupResult === 'winner').
 *   INGEN föregående säsong läses — game.seasonSummaries[i-1] används
 *   aldrig i den här filen. Det är avsiktligt: en klubb utan jämförbar
 *   föregående säsong (ny manager på ny klubb, A-M8-scenariot) ska inte
 *   längre vara ett specialfall.
 *
 * Samma harness, seeds och klubbkonstruktioner som föregångarscripten:
 *   A. Dominant — club_vastanfors, +30 CA-boost (klampat 99), seed=100
 *   B. Mid-table — club_malilla, orörd trupp, seed=2
 *   Robusthetspool: 10 extra seeds per klubbtyp (samma som föregångaren).
 *
 * Kör: node_modules/.bin/vite-node scripts/anspark1-villkor-omdesign-matning-2026-08-28.ts
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

const DOMINANT_ROBUST_SEEDS = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110]
const MIDTABLE_ROBUST_SEEDS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const PERFORMANCE_FACTOR_MIN = 0.85
const PERFORMANCE_FACTOR_MAX = 1.40
function clampPerformanceFactor(v: number): number {
  return Math.max(PERFORMANCE_FACTOR_MIN, Math.min(PERFORMANCE_FACTOR_MAX, v))
}

// GATE1_MARGIN väljs EFTER att distributionen (steg 1) inspekterats — se
// rapport. Satt här till det värde som slutrapporten föreslår, så att en
// enda körning av filen producerar både distribution och full-gate-resultat.
// FYND (se rapport): INGEN marginal ger rätt riktning. Vid varje positiv
// marginal triggar MID-TABLE villkor 1 oftare än DOMINANT — tvärtom mot
// designavsikten — eftersom den fyrkantiga +30 CA-boosten på hela dominant-
// truppen klampar flera spelare samtidigt i performanceFactor-taket 1.40
// (68% av dominant-säsongerna har exakt gap=0.000), medan mid-table-truppens
// naturliga varians ger STÖRRE gap av slump. 0.02 nedan är kvar som
// belägg-exempel i full-gate-tabellen, inte en rekommenderad tröskel.
const GATE1_MARGIN = 0.02

interface SeasonRow {
  season: number
  topFactor: number | null
  secondFactor: number | null
  gap: number | null
  qualifiedCount: number
  gate1: boolean
  finalPosition: number | null
  top3: boolean
  wonTrophy: boolean
  gate2: boolean
  fires: boolean
  managerFired: boolean
}

function makeGame(clubId: string, boost: number, seed: number): SaveGame {
  const game = createNewGame({ managerName: `A1REDESIGN-${clubId}`, clubId, seed })
  if (boost === 0) return { ...game, pendingScreen: null }
  const boosted = game.players.map(p =>
    p.clubId === game.managedClubId ? { ...p, currentAbility: Math.min(99, p.currentAbility + boost) } : p,
  )
  return { ...game, players: boosted, pendingScreen: null }
}

/** Rangordnar styrda truppens kvalificerade spelare fallande på performanceFactor. */
function rankedPerformanceFactors(game: SaveGame): number[] {
  const leagueAverages = computeLeaguePositionAverages(game)
  const squad = game.players.filter(p => p.clubId === game.managedClubId)
  const factors: number[] = []
  for (const p of squad) {
    const stats = p.seasonStats
    if (!stats || stats.gamesPlayed < MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR) continue
    const avg = leagueAverages[p.position]
    const ratingDelta = stats.averageRating - avg.avgRating
    const goalsDelta = stats.goals - avg.avgGoals
    const assistsDelta = stats.assists - avg.avgAssists
    const pf = clampPerformanceFactor(1 + ratingDelta * 0.08 + goalsDelta * 0.015 + assistsDelta * 0.012)
    factors.push(pf)
  }
  factors.sort((a, b) => b - a)
  return factors
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

    const ranked = rankedPerformanceFactors(preRollover)
    const topFactor = ranked.length >= 1 ? ranked[0] : null
    const secondFactor = ranked.length >= 2 ? ranked[1] : null
    const gap = topFactor !== null && secondFactor !== null ? topFactor - secondFactor : null
    // Policy: <2 kvalificerade spelare -> ingen "ensam bärare" kan
    // identifieras -> villkor 1 FALLERAR (kan inte påvisa att en enda man
    // stack ut om det inte finns en jämförbar tvåa att mäta gapet mot).
    const gate1 = gap !== null && gap >= GATE1_MARGIN

    const summaries: SeasonSummary[] = game.seasonSummaries ?? []
    const thisSummary = summaries[summaries.length - 1]
    // OBS: game.seasonSummaries[i-1] (föregående säsong) läses ALDRIG i
    // den här filen — villkor 2 är enbart topp-3/titel för INNEVARANDE säsong.

    const finalPosition = thisSummary?.finalPosition ?? null
    const top3 = finalPosition !== null && finalPosition <= 3
    const wonTrophy = !!thisSummary && (thisSummary.playoffResult === 'champion' || thisSummary.cupResult === 'winner')
    const gate2 = top3 || wonTrophy

    rows.push({
      season,
      topFactor,
      secondFactor,
      gap,
      qualifiedCount: ranked.length,
      gate1,
      finalPosition,
      top3,
      wonTrophy,
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
  console.log(`Säsong | topPF   | 2:aPF   | gap    | #kval | G1(>=${GATE1_MARGIN}) | placering | topp3 | titel | G2 | FIRES`)
  for (const r of rows) {
    const top = r.topFactor !== null ? r.topFactor.toFixed(3) : '  n/a  '
    const snd = r.secondFactor !== null ? r.secondFactor.toFixed(3) : '  n/a  '
    const gap = r.gap !== null ? r.gap.toFixed(3) : ' n/a  '
    console.log(
      `${String(r.season).padStart(6)} | ${top} | ${snd} | ${gap} | ${String(r.qualifiedCount).padStart(5)} | ` +
      `${r.gate1 ? '    J     ' : '    N     '} | ${String(r.finalPosition ?? '-').padStart(9)} | ` +
      `${r.top3 ? '  J  ' : '  N  '} | ${r.wonTrophy ? '  J  ' : '  N  '} | ${r.gate2 ? 'J' : 'N'}  | ` +
      `${r.fires ? 'JA' : 'nej'}${r.managerFired ? ' (AVSKEDAD)' : ''}`,
    )
  }
  const fires = rows.filter(r => r.fires).length
  const g1 = rows.filter(r => r.gate1).length
  const g2 = rows.filter(r => r.gate2).length
  console.log(`\nTotalt: ${fires}/${rows.length} säsonger triggar (BÅDA villkor).`)
  console.log(`  Villkor 1 ensamt (gap>=${GATE1_MARGIN}): ${g1}/${rows.length}`)
  console.log(`  Villkor 2 ensamt (topp3/titel): ${g2}/${rows.length}`)
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function printDistribution(label: string, rows: SeasonRow[]): void {
  const gaps = rows.filter(r => r.gap !== null).map(r => r.gap as number).sort((a, b) => a - b)
  const nullCount = rows.length - gaps.length
  console.log(`\n--- Gap-distribution (topFactor - secondFactor): ${label} ---`)
  console.log(`  N totalt: ${rows.length}, varav <2 kvalificerade spelare (gap=n/a): ${nullCount}`)
  if (gaps.length === 0) {
    console.log('  Inga mätbara gap.')
    return
  }
  console.log(`  min=${gaps[0].toFixed(3)} p25=${percentile(gaps, 0.25).toFixed(3)} median=${percentile(gaps, 0.5).toFixed(3)} p75=${percentile(gaps, 0.75).toFixed(3)} max=${gaps[gaps.length - 1].toFixed(3)}`)
  const exactZero = gaps.filter(g => g < 1e-9).length
  console.log(`  exakt gap=0.000 (bundna på samma performanceFactor, t.ex. båda i taket 1.40): ${exactZero}/${gaps.length}`)
  // Finmaskig histogram, bucket-bredd 0.01 (för att se strukturen nära noll,
  // där klampningen vid 1.40 skapar en topp av exakta bindningar).
  const buckets = new Map<number, number>()
  for (const g of gaps) {
    const b = Math.floor((g + 1e-9) / 0.01) * 0.01
    buckets.set(b, (buckets.get(b) ?? 0) + 1)
  }
  const sortedBuckets = [...buckets.entries()].sort((a, b) => a[0] - b[0])
  for (const [b, count] of sortedBuckets) {
    const bar = '#'.repeat(count)
    console.log(`  [${b.toFixed(2)}-${(b + 0.05).toFixed(2)}): ${String(count).padStart(3)} ${bar}`)
  }
}

function summarizePool(label: string, allRows: SeasonRow[]): void {
  const n = allRows.length
  const g1 = allRows.filter(r => r.gate1).length
  const g2 = allRows.filter(r => r.gate2).length
  const fires = allRows.filter(r => r.fires).length
  console.log(`\n--- Pool-sammanfattning ${label}: ${n} säsonger totalt ---`)
  console.log(`  Villkor 1 (gap>=${GATE1_MARGIN}): ${g1}/${n} (${(100 * g1 / n).toFixed(0)}%)`)
  console.log(`  Villkor 2 (topp3/titel):         ${g2}/${n} (${(100 * g2 / n).toFixed(0)}%)`)
  console.log(`  FIRES (AND):                     ${fires}/${n} (${(100 * fires / n).toFixed(0)}%)`)
}

function main(): void {
  console.log(`\n=== Anspråk 1, villkor OMDESIGN (marginal mot egen tvåa + rent topp3/titel) — ${SEASONS} säsonger ===`)
  console.log(`GATE1_MARGIN = ${GATE1_MARGIN}`)

  console.log(`\n--- Kör DOMINANT klubb (club_vastanfors, +30 CA-boost, seed=${DOMINANT_SEED}) ---`)
  const dominantRows = runClub('DOMINANT', 'club_vastanfors', DOMINANCE_BOOST, DOMINANT_SEED, SEASONS)

  console.log(`\n--- Kör MID-TABLE klubb (club_malilla, ORÖRD trupp, seed=${MIDTABLE_SEED}) ---`)
  const midRows = runClub('MID-TABLE', 'club_malilla', 0, MIDTABLE_SEED, SEASONS)

  printTable('DOMINANT KLUBB (club_vastanfors, boost=+30 CA, seed=100)', dominantRows)
  printTable('MID-TABLE KLUBB (club_malilla, ingen boost, seed=2)', midRows)

  console.log('\n\n=== ROBUSTHETS-POOL (10 extra seeds per klubbtyp) ===')
  const dominantPool: SeasonRow[] = [...dominantRows]
  for (const s of DOMINANT_ROBUST_SEEDS) {
    const rows = runClub('DOMINANT-POOL', 'club_vastanfors', DOMINANCE_BOOST, s, SEASONS)
    dominantPool.push(...rows)
  }
  const midPool: SeasonRow[] = [...midRows]
  for (const s of MIDTABLE_ROBUST_SEEDS) {
    const rows = runClub('MIDTABLE-POOL', 'club_malilla', 0, s, SEASONS)
    midPool.push(...rows)
  }

  console.log('\n\n=== DISTRIBUTION: gap = topFactor - secondFactor (hela poolen, inkl. huvudkörning) ===')
  printDistribution('DOMINANT (main+pool)', dominantPool)
  printDistribution('MID-TABLE (main+pool)', midPool)

  console.log('\n\n=== FULL GATE (villkor 1 AND villkor 2) — pool-sammanfattning (GATE1_MARGIN konstant) ===')
  summarizePool('DOMINANT (main+pool)', dominantPool)
  summarizePool('MID-TABLE (main+pool)', midPool)

  console.log('\n\n=== MARGIN-SVEP (post-hoc på redan insamlad data, ingen omkörning) ===')
  console.log('margin | DOM g1% | DOM fires% | MID g1% | MID fires%')
  const candidateMargins = [0, 0.001, 0.002, 0.003, 0.005, 0.007, 0.01, 0.015, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.10, 0.12, 0.15]
  for (const m of candidateMargins) {
    const domG1 = dominantPool.filter(r => r.gap !== null && r.gap >= m).length
    const domFires = dominantPool.filter(r => r.gap !== null && r.gap >= m && r.gate2).length
    const midG1 = midPool.filter(r => r.gap !== null && r.gap >= m).length
    const midFires = midPool.filter(r => r.gap !== null && r.gap >= m && r.gate2).length
    console.log(
      `${m.toFixed(2).padStart(6)} | ${(100 * domG1 / dominantPool.length).toFixed(0).padStart(6)}% | ` +
      `${(100 * domFires / dominantPool.length).toFixed(0).padStart(9)}% | ${(100 * midG1 / midPool.length).toFixed(0).padStart(6)}% | ` +
      `${(100 * midFires / midPool.length).toFixed(0).padStart(9)}%`,
    )
  }

  console.log('\n=== SLUT ===\n')
}

main()
