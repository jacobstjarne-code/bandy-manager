/**
 * MEASUREMENT-ONLY. Anspråk 1 (DOM_FRAMGANGSKURVAN_2026-08-27), BUDGETTRYCK
 * mot EKONOMI — ersätter wageBudget-nämnaren i
 * scripts/anspark1-budgettryck-matning-2026-08-28.ts (den filen mätte
 * `room = wageBudget - squadSalary`). Se
 * docs/DOM_AH2B_BUDGETTRYCK_KORORDER_2026-08-28.md, sektion
 * "STEG 1-DOM (2026-08-28)" — den sektionen SUPERSEDERAR filens egen
 * steg-1-instruktion (som fortfarande frågade "vilket är rätt utrymme,
 * wageBudget eller finances"). Domen svarade: wageBudget är rådgivande
 * (renewContract prövar ALDRIG den, bara computeContractMinSalary hårt-golv
 * + en mjuk wageWarning), att göra den bindande skulle tyst balansera om
 * O5/Skutskär-dynamiken ("svaga klubbar kan överspendera och blöda"). Mät
 * mot EKONOMI istället: att möta alla lönekrav ska konkurrera med samma
 * kassa som anläggning/värvning — precis framgångskurvans "ett ja är ett
 * nej någon annanstans"-princip.
 *
 * ── ÅTERANVÄNT FRÅN FÖREGÅNGAREN (steg 0, redan validerat, görs INTE om) ───
 * Dominant-klubb: club_vastanfors, +10 CA uniform boost (INTE +30 — det
 * mättar performanceFactor-taket 1.40 för halva truppen, se föregångarens
 * kommentar rad 12-30). Samma seeds (dominant=100, robusthetspool
 * 101-110; mid-table=2, robusthetspool 3-12). Samma per-spelare
 * demand-beräkning: `demand = max(0, computeContractMinSalary(...) -
 * player.salary)` för förstalagsspelare med >=5 ligamatcher
 * (MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR). Steg 0-beviset (performance-
 * faktor-fördelning) skrivs ut igen nedan som första sektion, av samma skäl
 * som föregångaren: se det INNAN något annat läses, men det är samma
 * beräkning på samma trupp — inte omgjort.
 *
 * ── VAD SOM ÄNDRAS: "utrymme" ────────────────────────────────────────────
 * Gammal nämnare (denna doktrinversion nu avvisad): wageBudget − squadSalary.
 * wageBudget sätts EN gång (createNewGame.ts:283) och rörs sedan aldrig av
 * någon applikationskod (bekräftat i föregångaren) — den är en frusen
 * skärmsiffra, inte en resurs klubben faktiskt konkurrerar om.
 *
 * Ny nämnare: `cashGrowth = seasonSummary.endFinances - seasonSummary.
 * startFinances` för den säsong lönekraven räknas på. Detta är INTE en ny
 * beräkning uppfunnen för detta script — `SeasonSummary` (SeasonSummary.ts:
 * 133-134) har redan `startFinances`/`endFinances` som fält, satta av
 * `generateSeasonSummary` (seasonSummaryService.ts:666-668) och skrivna
 * EFTER alla säsongens finansiella uppdateringar (seasonEndProcessor.ts:73:
 * "seasonSummary is generated AFTER all financial updates (prize money,
 * patron, etc.)"). `startFinances` kommer i sin tur från `game.
 * seasonStartFinances`, satt vid spelstart (createNewGame.ts:356) och
 * omsatt varje rollover (seasonEndProcessor.ts:1605) — samma fält som redan
 * används för `finChange`/klubbstyrelsens förväntan (seasonEndProcessor.ts:
 * 414) och i `boardObjectiveService.ts:446`. Att läsa
 * `thisSummary.startFinances`/`endFinances` är alltså att återanvända en
 * BEFINTLIG, redan konsumerad kassaflödesberäkning — inte en ny mätpunkt.
 *
 * Varför cashGrowth (inte t.ex. bruttoinkomst eller en genomsnittsserie):
 * `finances` är en KASSABEHÅLLNING (stock) som ALLA utgifter drar från —
 * lön, facility_upkeep (löpande drift), facility clubCost (nybygge,
 * gameStore.ts:867 `applyFinanceChange(..., -chosen.clubCost)`),
 * transferavgifter (transferService.ts), samt inkomster (matchintäkter,
 * sponsring, prispengar, mecenat, kommunbidrag). `cashGrowth` är alltså
 * REDAN netto av "vad klubben la på anläggning/värvning den här säsongen" —
 * en säsong där klubben investerar tungt i facilities har per definition
 * LÄGRE cashGrowth, vilket ger en HÖGRE lastkvot för samma lönekrav. Det är
 * exakt konkurrensen doktrinen efterfrågar ("ska en klubb som SAMTIDIGT
 * investerar i anläggning ha mindre effektivt utrymme för lönekrav — ja,
 * eftersom båda dras ur samma kassa"): cashGrowth fångar det AUTOMATISKT,
 * utan att jag behöver en separat "facility-spend denna säsong"-signal (en
 * sådan diskret post finns inte som eget fält i kodbasen — grep bekräftar
 * bara `facilityState.builtNodeIds` (VILKA noder), inte en per-säsongs
 * kronsumma isolerad från övriga finansflöden). Att extrahera en isolerad
 * facility-post ur `finances`-deltat hade krävt att bygga ny loggning i
 * produktionskod — measurement-only tillåter inte det, och det behövs inte:
 * nettot är redan rätt mätpunkt för "vad har klubben att röra sig med".
 *
 * En känd snedvridning att hålla i huvudet vid tolkning (rapporteras, inte
 * korrigerad): prispengar för placering/titel (seasonEndProcessor.ts:288,
 * PRIZE_MONEY) läggs till INNAN endFinances fryses. En säsong där klubben
 * vinner (och alltså har FLER kravställare, eftersom att vinna kräver att
 * många spelare presterat över snitt) får SAMTIDIGT en prispengar-boost i
 * cashGrowth. Det kan dra lastkvoten NEDÅT just de säsongerna — motsatt
 * riktning mot vad domen misstänkte skulle hända (villkor 2 kunde tänkas
 * vara redundant för att framgång→krav går hand i hand; men om framgång
 * OCKSÅ ger mer cashGrowth kan de två effekterna delvis ta ut varandra).
 * Se villkor 2-testet nedan för det faktiska utfallet.
 *
 * `lastkvot = totalDemand / max(cashGrowth, ROOM_EPSILON)` — kvot > 1
 * betyder: att möta alla krav skulle äta hela säsongens överskott (tvinga
 * ett nej på anläggning/värvning). Om cashGrowth är NEGATIV (klubben
 * blödde redan, O5/Skutskär-läge) klampas nämnaren till epsilon, vilket ger
 * en mycket hög/oändligt hög kvot — korrekt tolkat: en klubb som redan går
 * back har noll utrymme för NÅGON löneökning utan att gå djupare i rött.
 *
 * Kör: node_modules/.bin/vite-node scripts/anspark1-budgettryck-ekonomi-matning-2026-08-28.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import { computeLeaguePositionAverages, computeContractMinSalary, MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR } from '../src/domain/services/economyService'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { SeasonSummary } from '../src/domain/entities/SeasonSummary'

const SEASONS = 10
const DOMINANCE_BOOST = 10 // återanvänt steg 0-val, se filhuvud — görs inte om

const DOMINANT_SEED = 100
const MIDTABLE_SEED = 2
// Samma robusthetspool-seeds som föregångarscripten (kontinuitet/jämförbarhet).
const DOMINANT_ROBUST_SEEDS = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110]
const MIDTABLE_ROBUST_SEEDS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const PERFORMANCE_FACTOR_MIN = 0.85
const PERFORMANCE_FACTOR_MAX = 1.40
function clampPerformanceFactor(v: number): number {
  return Math.max(PERFORMANCE_FACTOR_MIN, Math.min(PERFORMANCE_FACTOR_MAX, v))
}

const ROOM_EPSILON = 1 // kr — golv i nämnaren, doktrinens "max(utrymme, ε)"

interface SeasonRow {
  season: number
  qualifiedCount: number
  kravstallare: number
  demands: number[]           // rå demand-belopp för kravställarna (>0), för distribution
  totalDemand: number
  currentSquadSalary: number
  wageBudget: number           // rapporteras fortfarande, för jämförelse — inte längre nämnare
  startFinances: number
  endFinances: number
  cashGrowth: number            // NY nämnare: endFinances - startFinances
  room: number                  // = cashGrowth (kan vara negativt — rapporteras rått)
  lastkvot: number              // totalDemand / max(room, EPSILON)
  overBudget: boolean           // lastkvot > 1
  atCap: number                 // #spelare med performanceFactor >= taket (steg 0-bevis)
  finalPosition: number | null
  top3: boolean
  wonTrophy: boolean
  gate2: boolean
  managerFired: boolean
}

function makeGame(clubId: string, boost: number, seed: number): SaveGame {
  const game = createNewGame({ managerName: `AH2B-ECO-${clubId}`, clubId, seed })
  if (boost === 0) return { ...game, pendingScreen: null }
  const boosted = game.players.map(p =>
    p.clubId === game.managedClubId ? { ...p, currentAbility: Math.min(99, p.currentAbility + boost) } : p,
  )
  return { ...game, players: boosted, pendingScreen: null }
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

    // preRollover: spelarnas seasonStats/salary/club.wageBudget INNAN säsongsrollover
    // nollställer dem — samma konvention som föregångarscripten (demand-sidan
    // av mätningen är oförändrad, bara nämnaren byts).
    const club = preRollover.clubs.find(c => c.id === preRollover.managedClubId)!
    const leagueAverages = computeLeaguePositionAverages(preRollover)
    const squad = preRollover.players.filter(p => p.clubId === preRollover.managedClubId)

    const currentSquadSalary = squad.reduce((s, p) => s + p.salary, 0)

    let qualifiedCount = 0
    let atCap = 0
    const demands: number[] = []
    for (const p of squad) {
      const stats = p.seasonStats
      if (!stats || stats.gamesPlayed < MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR) continue
      qualifiedCount++
      const avg = leagueAverages[p.position]
      const ratingDelta = stats.averageRating - avg.avgRating
      const goalsDelta = stats.goals - avg.avgGoals
      const assistsDelta = stats.assists - avg.avgAssists
      const pf = clampPerformanceFactor(1 + ratingDelta * 0.08 + goalsDelta * 0.015 + assistsDelta * 0.012)
      if (pf >= PERFORMANCE_FACTOR_MAX - 1e-9) atCap++

      const minSalaryNew = computeContractMinSalary(p, club, leagueAverages)
      const demand = Math.max(0, minSalaryNew - p.salary)
      if (demand > 0) demands.push(demand)
    }

    const totalDemand = demands.reduce((s, d) => s + d, 0)

    // Säsongssummary (post-rollover-anrop, samma `game` som avslutade säsongen)
    // — SeasonSummary.startFinances/endFinances (SeasonSummary.ts:133-134) är
    // redan beräknade EFTER alla finansiella uppdateringar (prispengar, mecenat,
    // kommunbidrag — seasonEndProcessor.ts:73). Föregående säsong läses aldrig
    // (bekräftat icke-fråga sedan mätning 3): summaries[length-1] är ALLTID
    // just avslutad säsong.
    const summaries: SeasonSummary[] = game.seasonSummaries ?? []
    const thisSummary = summaries[summaries.length - 1]
    const startFinances = thisSummary?.startFinances ?? 0
    const endFinances = thisSummary?.endFinances ?? 0
    const cashGrowth = endFinances - startFinances
    const room = cashGrowth
    const lastkvot = totalDemand / Math.max(room, ROOM_EPSILON)

    const finalPosition = thisSummary?.finalPosition ?? null
    const top3 = finalPosition !== null && finalPosition <= 3
    const wonTrophy = !!thisSummary && (thisSummary.playoffResult === 'champion' || thisSummary.cupResult === 'winner')
    const gate2 = top3 || wonTrophy

    rows.push({
      season,
      qualifiedCount,
      kravstallare: demands.length,
      demands,
      totalDemand,
      currentSquadSalary,
      wageBudget: club.wageBudget,
      startFinances,
      endFinances,
      cashGrowth,
      room,
      lastkvot,
      overBudget: lastkvot > 1,
      atCap,
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

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function fmtKr(n: number): string {
  return Math.round(n).toLocaleString('sv-SE')
}

function printStep0Proof(label: string, rows: SeasonRow[]): void {
  console.log(`\n--- STEG 0-BEVIS (återanvänt, ej omgjort): performanceFactor-fördelning, ${label} (boost=+${DOMINANCE_BOOST} CA) ---`)
  for (const r of rows) {
    console.log(`  S${r.season}: kvalificerade=${r.qualifiedCount}  vid_taket_1.40=${r.atCap}  placering=${r.finalPosition ?? '-'}  titel=${r.wonTrophy ? 'J' : 'N'}`)
  }
  const avgAtCap = rows.reduce((s, r) => s + r.atCap, 0) / rows.length
  const avgQualified = rows.reduce((s, r) => s + r.qualifiedCount, 0) / rows.length
  console.log(`  Snitt vid taket/säsong: ${avgAtCap.toFixed(2)} av ${avgQualified.toFixed(1)} kvalificerade (${(100 * avgAtCap / avgQualified).toFixed(0)}%) — INTE halva truppen, samma slutsats som föregångaren.`)
}

function printSeasonTable(label: string, rows: SeasonRow[]): void {
  console.log(`\n=== ${label} ===`)
  console.log('Säsong | #kval | kravst | totalDemand | startFin   | endFin     | cashGrowth | lastkvot | >1 | plac | top3 | titel')
  for (const r of rows) {
    console.log(
      `${String(r.season).padStart(6)} | ${String(r.qualifiedCount).padStart(5)} | ${String(r.kravstallare).padStart(6)} | ` +
      `${fmtKr(r.totalDemand).padStart(11)} | ${fmtKr(r.startFinances).padStart(10)} | ${fmtKr(r.endFinances).padStart(10)} | ` +
      `${fmtKr(r.cashGrowth).padStart(10)} | ${r.lastkvot.toFixed(2).padStart(8)} | ${r.overBudget ? ' J' : ' N'} | ` +
      `${String(r.finalPosition ?? '-').padStart(4)} | ${r.top3 ? ' J ' : ' N '} | ${r.wonTrophy ? ' J ' : ' N '}` +
      `${r.managerFired ? '  (AVSKEDAD)' : ''}`,
    )
  }
}

function printDistribution(label: string, rows: SeasonRow[]): void {
  const n = rows.length
  const kravstallareCounts = rows.map(r => r.kravstallare).sort((a, b) => a - b)
  const totalDemands = rows.map(r => r.totalDemand).sort((a, b) => a - b)
  const cashGrowths = rows.map(r => r.cashGrowth).sort((a, b) => a - b)
  const lastkvoter = rows.map(r => r.lastkvot).sort((a, b) => a - b)
  const over1 = rows.filter(r => r.overBudget).length
  const twoPlus = rows.filter(r => r.kravstallare >= 2).length
  const negRoom = rows.filter(r => r.room < 0).length

  console.log(`\n--- Fördelning: ${label} (N=${n} säsonger) ---`)
  console.log(`  #kravställare/säsong: min=${kravstallareCounts[0]} p25=${percentile(kravstallareCounts, 0.25).toFixed(1)} median=${percentile(kravstallareCounts, 0.5).toFixed(1)} p75=${percentile(kravstallareCounts, 0.75).toFixed(1)} max=${kravstallareCounts[n - 1]}`)
  console.log(`  totalDemand (kr):     min=${fmtKr(totalDemands[0])} p25=${fmtKr(percentile(totalDemands, 0.25))} median=${fmtKr(percentile(totalDemands, 0.5))} p75=${fmtKr(percentile(totalDemands, 0.75))} max=${fmtKr(totalDemands[n - 1])}`)
  console.log(`  cashGrowth (kr, kan vara <0): min=${fmtKr(cashGrowths[0])} p25=${fmtKr(percentile(cashGrowths, 0.25))} median=${fmtKr(percentile(cashGrowths, 0.5))} p75=${fmtKr(percentile(cashGrowths, 0.75))} max=${fmtKr(cashGrowths[n - 1])}`)
  console.log(`  ANDEL säsonger med NEGATIV cashGrowth (klubben gick back):  ${negRoom}/${n} (${(100 * negRoom / n).toFixed(0)}%)`)
  console.log(`  lastkvot:             min=${lastkvoter[0].toFixed(2)} p25=${percentile(lastkvoter, 0.25).toFixed(2)} median=${percentile(lastkvoter, 0.5).toFixed(2)} p75=${percentile(lastkvoter, 0.75).toFixed(2)} max=${lastkvoter[n - 1].toFixed(2)}`)
  console.log(`  ANDEL lastkvot>1 (kan inte möta alla krav utan att äta överskottet):  ${over1}/${n} (${(100 * over1 / n).toFixed(0)}%)`)
  console.log(`  ANDEL >=2 kravställare samtidigt:             ${twoPlus}/${n} (${(100 * twoPlus / n).toFixed(0)}%)`)

  const buckets = new Map<number, number>()
  for (const c of kravstallareCounts) {
    const b = Math.min(c, 4)
    buckets.set(b, (buckets.get(b) ?? 0) + 1)
  }
  console.log('  Histogram #kravställare:')
  for (let b = 0; b <= 4; b++) {
    const count = buckets.get(b) ?? 0
    const bar = '#'.repeat(count)
    console.log(`    ${b === 4 ? '4+' : String(b)}: ${String(count).padStart(3)} ${bar}`)
  }
}

function condition2Test(label: string, rows: SeasonRow[]): void {
  const gated = rows.filter(r => r.gate2)
  const ungated = rows.filter(r => !r.gate2)
  console.log(`\n--- Villkor 2-test (topp3/titel-gate) MOT NYA METRIKEN: ${label} ---`)
  console.log(`  Gated (topp3/titel): N=${gated.length}`)
  console.log(`  Ungated (ej topp3/titel): N=${ungated.length}`)
  if (gated.length > 0) {
    const gatedLK = gated.map(r => r.lastkvot).sort((a, b) => a - b)
    const gatedOver1 = gated.filter(r => r.overBudget).length
    const gatedCG = gated.map(r => r.cashGrowth).sort((a, b) => a - b)
    console.log(`    Gated:   median lastkvot=${percentile(gatedLK, 0.5).toFixed(2)}  andel>1=${(100 * gatedOver1 / gated.length).toFixed(0)}%  median cashGrowth=${fmtKr(percentile(gatedCG, 0.5))}`)
  }
  if (ungated.length > 0) {
    const ungatedLK = ungated.map(r => r.lastkvot).sort((a, b) => a - b)
    const ungatedOver1 = ungated.filter(r => r.overBudget).length
    const ungatedCG = ungated.map(r => r.cashGrowth).sort((a, b) => a - b)
    console.log(`    Ungated: median lastkvot=${percentile(ungatedLK, 0.5).toFixed(2)}  andel>1=${(100 * ungatedOver1 / ungated.length).toFixed(0)}%  median cashGrowth=${fmtKr(percentile(ungatedCG, 0.5))}`)
  }
  const allLK = rows.map(r => r.lastkvot).sort((a, b) => a - b)
  const allOver1 = rows.filter(r => r.overBudget).length
  console.log(`    Hela poolen (ref): median lastkvot=${percentile(allLK, 0.5).toFixed(2)}  andel>1=${(100 * allOver1 / rows.length).toFixed(0)}%`)
}

function main(): void {
  console.log('\n============================================================')
  console.log('A-H2b BUDGETTRYCK MOT EKONOMI — mätning 2026-08-28')
  console.log('(ersätter wageBudget-nämnaren, se STEG 1-DOM i körordern)')
  console.log('============================================================')

  console.log(`\n--- Kör DOMINANT klubb (club_vastanfors, boost=+${DOMINANCE_BOOST} CA, seed=${DOMINANT_SEED}) — återanvänd steg 0-konstruktion ---`)
  const dominantMain = runClub('DOMINANT', 'club_vastanfors', DOMINANCE_BOOST, DOMINANT_SEED, SEASONS)

  console.log(`\n--- Kör MID-TABLE klubb (club_malilla, ORÖRD trupp, seed=${MIDTABLE_SEED}) ---`)
  const midMain = runClub('MID-TABLE', 'club_malilla', 0, MIDTABLE_SEED, SEASONS)

  printStep0Proof('DOMINANT huvudkörning (seed=100)', dominantMain)

  console.log('\n\n=== ROBUSTHETSPOOL (10 extra seeds per klubbtyp, samma konvention som föregångarna) ===')
  const dominantPool: SeasonRow[] = [...dominantMain]
  for (const s of DOMINANT_ROBUST_SEEDS) {
    const rows = runClub('DOMINANT-POOL', 'club_vastanfors', DOMINANCE_BOOST, s, SEASONS)
    dominantPool.push(...rows)
  }
  const midPool: SeasonRow[] = [...midMain]
  for (const s of MIDTABLE_ROBUST_SEEDS) {
    const rows = runClub('MIDTABLE-POOL', 'club_malilla', 0, s, SEASONS)
    midPool.push(...rows)
  }

  printStep0Proof('DOMINANT hela poolen (huvud+robusthet)', dominantPool)

  printSeasonTable('DOMINANT KLUBB — huvudkörning (club_vastanfors, seed=100)', dominantMain)
  printSeasonTable('MID-TABLE KLUBB — huvudkörning (club_malilla, seed=2)', midMain)

  printDistribution('DOMINANT (huvud+pool)', dominantPool)
  printDistribution('MID-TABLE (huvud+pool)', midPool)

  condition2Test('DOMINANT (huvud+pool)', dominantPool)
  condition2Test('MID-TABLE (huvud+pool)', midPool)

  const domOver1 = dominantPool.filter(r => r.overBudget).length
  const midOver1 = midPool.filter(r => r.overBudget).length
  const domTwoPlus = dominantPool.filter(r => r.kravstallare >= 2).length
  const midTwoPlus = midPool.filter(r => r.kravstallare >= 2).length
  console.log('\n\n=== ORDNINGSKOLL (utan tuning) — NY METRIK ===')
  console.log(`  DOMINANT lastkvot>1:    ${domOver1}/${dominantPool.length} (${(100 * domOver1 / dominantPool.length).toFixed(0)}%)`)
  console.log(`  MID-TABLE lastkvot>1:   ${midOver1}/${midPool.length} (${(100 * midOver1 / midPool.length).toFixed(0)}%)`)
  console.log(`  DOMINANT >=2 kravställare: ${domTwoPlus}/${dominantPool.length} (${(100 * domTwoPlus / dominantPool.length).toFixed(0)}%)`)
  console.log(`  MID-TABLE >=2 kravställare: ${midTwoPlus}/${midPool.length} (${(100 * midTwoPlus / midPool.length).toFixed(0)}%)`)
  console.log(`  Ordning håller (dominant oftare över + fler samtidiga kravställare)?  ${domOver1 / dominantPool.length > midOver1 / midPool.length && domTwoPlus / dominantPool.length > midTwoPlus / midPool.length ? 'JA' : 'NEJ'}`)

  console.log('\n=== SLUT ===\n')
}

main()
