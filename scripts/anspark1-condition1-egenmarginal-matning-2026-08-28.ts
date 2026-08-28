/**
 * MEASUREMENT-ONLY. Anspråk 1 (lönekravshändelsen), Jacobs omdesign 2026-08-28
 * efter fyndet i anspark1-condition2-absolut-matning-2026-08-28.ts: villkor 1
 * (tröskel mot ligasnitt) mättade nära 100% för en boostad dominant klubb
 * eftersom ability-boost lyfter FLERA spelare över snittet samtidigt, inte
 * bara en — "finns det en spelare som klarar ligasnittet" särskiljer knappt.
 * Villkor 2:s "ELLER förbättrad mot föregående säsong" triggade 35-40% av
 * ren säsong-till-säsong-varians för vilken icke-kollapsande klubb som helst
 * — inte en sällsynt händelse.
 *
 * NYTT VILLKOR 1 (denna mätning): marginal mot TRUPPENS EGEN tvåa, inte
 * ligasnittet. Vad gör en spelare kravställande är inte att vara bra i
 * absoluta tal — det är att vara DEN ENA som bär laget. En trupp med fem
 * stjärnor har ingen som sticker ut; en trupp där en man gjorde skillnaden
 * har det. Rankar truppens kvalificerade spelare (samma
 * MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR-grind, samma computeContractMinSalary-
 * performanceFactor-formel, economyService.ts:305-343) fallande på
 * performanceFactor. Marginal = topFactor - secondFactor (#1 minus #2).
 * INGEN tröskel gissas i förväg — detta script dumpar FÖRST hela
 * fördelningen, sedan föreslås ett tröskelvärde baserat på var den faktiskt
 * separerar.
 *
 * NYTT VILLKOR 2 (denna mätning): "förbättrad mot föregående säsong"-dörren
 * SLOPAD helt. Kvar: ENBART topp-3 i ligan ELLER titel (ligamästare via
 * slutspel, playoffResult === 'champion', ELLER cupvinnare, cupResult ===
 * 'winner'). Ingen tredje dörr, inget game.seasonSummaries[i-1]-uppslag
 * (verifieras explicit i rapporten — grep i denna fil visar att prevSummary
 * aldrig läses).
 *
 * Samma harness, SAMMA seeds och klubbkonstruktioner som föregångar-scripten:
 *   A. Dominant — club_vastanfors, +30 CA-boost (klampat 99), seed=100
 *      + robusthets-pool seeds 101-110
 *   B. Mid-table — club_malilla, orörd trupp, seed=2
 *      + robusthets-pool seeds 3-12
 *
 * Kör: node_modules/.bin/vite-node scripts/anspark1-condition1-egenmarginal-matning-2026-08-28.ts
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

// Samma robusthets-seeds som föregångarscriptet (icke cherry-plockade,
// löpande heltal, inte filtrerade på överlevnad).
const DOMINANT_ROBUST_SEEDS = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110]
const MIDTABLE_ROBUST_SEEDS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const PERFORMANCE_FACTOR_MIN = 0.85
const PERFORMANCE_FACTOR_MAX = 1.40
function clampPerformanceFactor(v: number): number {
  return Math.max(PERFORMANCE_FACTOR_MIN, Math.min(PERFORMANCE_FACTOR_MAX, v))
}

// Kandidat-marginaltrösklar att rapportera fire-rate för i steg 1 (ren
// distributionsdumpning, ingen gissning används för att FILTRERA här —
// dessa används bara för att visa "hur många säsonger klarar >= X" längs
// hela fördelningen, så separationspunkten blir synlig innan ett tal väljs).
const CANDIDATE_MARGINS = [0, 0.02, 0.05, 0.08, 0.10, 0.12, 0.15, 0.18, 0.20, 0.25, 0.30]

interface MarginResult {
  qualifiedCount: number
  topFactor: number | null
  secondFactor: number | null
  margin: number | null // null om <2 kvalificerade spelare
}

interface SeasonRow {
  season: number
  margin: MarginResult
  finalPosition: number | null
  top3: boolean
  wonTrophy: boolean
  gate2: boolean
  managerFired: boolean
}

function makeGame(clubId: string, boost: number, seed: number): SaveGame {
  const game = createNewGame({ managerName: `A1C1MARG-${clubId}`, clubId, seed })
  if (boost === 0) return { ...game, pendingScreen: null }
  const boosted = game.players.map(p =>
    p.clubId === game.managedClubId ? { ...p, currentAbility: Math.min(99, p.currentAbility + boost) } : p,
  )
  return { ...game, players: boosted, pendingScreen: null }
}

function marginForManagedSquad(game: SaveGame): MarginResult {
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
  factors.sort((a, b) => b - a) // fallande
  const qualifiedCount = factors.length
  if (qualifiedCount < 2) {
    return { qualifiedCount, topFactor: factors[0] ?? null, secondFactor: null, margin: null }
  }
  const topFactor = factors[0]
  const secondFactor = factors[1]
  return { qualifiedCount, topFactor, secondFactor, margin: topFactor - secondFactor }
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

    const margin = marginForManagedSquad(preRollover)

    // OBS villkor 2: läser BARA thisSummary. Inget game.seasonSummaries[i-1]-
    // uppslag någonstans i detta script — bekräftar att "förbättrad mot
    // föregående säsong" är helt borttaget, inte bara ovägt.
    const summaries: SeasonSummary[] = game.seasonSummaries ?? []
    const thisSummary = summaries[summaries.length - 1]

    const finalPosition = thisSummary?.finalPosition ?? null
    const top3 = finalPosition !== null && finalPosition <= 3
    const wonTrophy = !!thisSummary && (thisSummary.playoffResult === 'champion' || thisSummary.cupResult === 'winner')
    const gate2 = top3 || wonTrophy

    rows.push({
      season,
      margin,
      finalPosition,
      top3,
      wonTrophy,
      gate2,
      managerFired: !!game.managerFired,
    })

    if (game.managerFired) {
      console.log(`  [${label} seed=${seed}] avskedad efter säsong ${season} — stoppar körningen (${seasons - season} säsonger saknas)`)
      break
    }
  }
  return rows
}

function printSeasonTable(label: string, rows: SeasonRow[]): void {
  console.log(`\n=== ${label} ===`)
  console.log('Säsong | #kval | topPF   | 2:aPF   | marginal | placering | topp3 | titel | G2')
  for (const r of rows) {
    const m = r.margin
    const top = m.topFactor !== null ? m.topFactor.toFixed(3) : '  n/a  '
    const second = m.secondFactor !== null ? m.secondFactor.toFixed(3) : '  n/a  '
    const marg = m.margin !== null ? m.margin.toFixed(3) : '  n/a  '
    console.log(
      `${String(r.season).padStart(6)} | ${String(m.qualifiedCount).padStart(5)} | ${top} | ${second} | ${marg}   | ` +
      `${String(r.finalPosition ?? '-').padStart(9)} | ${r.top3 ? '  J  ' : '  N  '} | ${r.wonTrophy ? '  J  ' : '  N  '} | ` +
      `${r.gate2 ? 'J' : 'N'}${r.managerFired ? ' (AVSKEDAD)' : ''}`,
    )
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function reportDistribution(label: string, rows: SeasonRow[]): void {
  const n = rows.length
  const under2 = rows.filter(r => r.margin.qualifiedCount < 2).length
  const margins = rows.filter(r => r.margin.margin !== null).map(r => r.margin.margin as number).sort((a, b) => a - b)

  console.log(`\n--- Fördelning ${label}: ${n} säsonger totalt (${under2} med <2 kvalificerade spelare) ---`)
  if (margins.length === 0) {
    console.log('  Inga säsonger med >=2 kvalificerade spelare — ingen marginal beräkningsbar.')
    return
  }
  console.log(`  N (marginal beräkningsbar): ${margins.length}`)
  console.log(`  min:    ${margins[0].toFixed(4)}`)
  console.log(`  p10:    ${percentile(margins, 0.10).toFixed(4)}`)
  console.log(`  p25:    ${percentile(margins, 0.25).toFixed(4)}`)
  console.log(`  median: ${percentile(margins, 0.50).toFixed(4)}`)
  console.log(`  p75:    ${percentile(margins, 0.75).toFixed(4)}`)
  console.log(`  p90:    ${percentile(margins, 0.90).toFixed(4)}`)
  console.log(`  max:    ${margins[margins.length - 1].toFixed(4)}`)

  console.log(`  Andel säsonger (av alla ${n}, <2-kval räknas som "klarar ej") som klarar marginal >= X:`)
  for (const cand of CANDIDATE_MARGINS) {
    const clears = rows.filter(r => r.margin.margin !== null && r.margin.margin >= cand).length
    console.log(`    >= ${cand.toFixed(2)}: ${clears}/${n} (${(100 * clears / n).toFixed(0)}%)`)
  }
}

function summarizeFullGate(label: string, rows: SeasonRow[], marginThreshold: number): { g1: number; g2: number; fires: number; n: number } {
  const n = rows.length
  const g1 = rows.filter(r => r.margin.margin !== null && r.margin.margin >= marginThreshold).length
  const g2 = rows.filter(r => r.gate2).length
  const fires = rows.filter(r => r.margin.margin !== null && r.margin.margin >= marginThreshold && r.gate2).length
  console.log(`\n--- Full grind ${label} @ marginaltröskel ${marginThreshold}: ${n} säsonger ---`)
  console.log(`  Villkor 1 (marginal >= ${marginThreshold}): ${g1}/${n} (${(100 * g1 / n).toFixed(0)}%)`)
  console.log(`  Villkor 2 (topp3/titel):                 ${g2}/${n} (${(100 * g2 / n).toFixed(0)}%)`)
  console.log(`  FIRES (AND):                              ${fires}/${n} (${(100 * fires / n).toFixed(0)}%)`)
  return { g1, g2, fires, n }
}

function main(): void {
  console.log(`\n=== Anspråk 1, villkor 1 OMDESIGN (egen marginal #1 vs #2) — ${SEASONS} säsonger ===`)

  console.log(`\n--- Kör DOMINANT klubb (club_vastanfors, +30 CA-boost, seed=${DOMINANT_SEED}) ---`)
  const dominantRows = runClub('DOMINANT', 'club_vastanfors', DOMINANCE_BOOST, DOMINANT_SEED, SEASONS)

  console.log(`\n--- Kör MID-TABLE klubb (club_malilla, ORÖRD trupp, seed=${MIDTABLE_SEED}) ---`)
  const midRows = runClub('MID-TABLE', 'club_malilla', 0, MIDTABLE_SEED, SEASONS)

  printSeasonTable('DOMINANT KLUBB (club_vastanfors, boost=+30 CA, seed=100)', dominantRows)
  printSeasonTable('MID-TABLE KLUBB (club_malilla, ingen boost, seed=2)', midRows)

  console.log('\n\n=== ROBUSTHETS-POOL (10 extra seeds per klubbtyp, ej filtrerade på överlevnad) ===')
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

  console.log('\n\n========== STEG 1: DISTRIBUTION (ingen tröskel filtrerar ännu) ==========')
  reportDistribution('DOMINANT (huvudkörning, 10 säsonger)', dominantRows)
  reportDistribution('DOMINANT (huvud + pool, upp till 110 säsonger)', dominantPool)
  reportDistribution('MID-TABLE (huvudkörning, 10 säsonger)', midRows)
  reportDistribution('MID-TABLE (huvud + pool, upp till 110 säsonger)', midPool)

  console.log('\n\n========== STEG 3: FULL GRIND @ KANDIDATTRÖSKLAR ==========')
  // Rapporteras för ett spann av kandidater kring den sannolika separationspunkten
  // — det slutgiltiga förslaget/motiveringen skrivs i den separata rapporten
  // till Jacob, baserat på dessa siffror, inte hårdkodat här.
  for (const cand of [0.05, 0.08, 0.10, 0.12, 0.15, 0.18, 0.20]) {
    console.log(`\n--- Kandidat marginaltröskel: ${cand} ---`)
    summarizeFullGate('DOMINANT huvud (10 säsonger)', dominantRows, cand)
    summarizeFullGate('DOMINANT huvud+pool', dominantPool, cand)
    summarizeFullGate('MID-TABLE huvud (10 säsonger)', midRows, cand)
    summarizeFullGate('MID-TABLE huvud+pool', midPool, cand)
  }

  console.log('\n=== SLUT ===\n')
}

main()
