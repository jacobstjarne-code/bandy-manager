/**
 * MEASUREMENT-ONLY. Anspråk 1 (DOM_FRAMGANGSKURVAN_2026-08-27), BUDGETTRYCK —
 * ersätter marginalmåttet. Se DOM_AH2B_BUDGETTRYCK_KORORDER_2026-08-28.md
 * (auktoritativ körorder). De tre tidigare passen
 * (anspark1-condition2-boardexpectation-, anspark1-condition2-absolut-,
 * anspark1-villkor-omdesign-matning-2026-08-28.ts) mätte en sällsynt
 * individhändelse ("en exceptionell spelare"). Domen beskriver en PLURALITET:
 * flera egna förstalagsspelare som var för sig är betalbara men INTE ryms i
 * lönebudgeten SAMMA sommar. Denna fil mäter just det — ingen tröskel på en
 * enskild spelares marginal, bara summan av truppens krav mot utrymmet.
 *
 * ── STEG 0 (obligatoriskt, körd före allt annat) ────────────────────────────
 * De tre föregångarna byggde "dominant klubb" som +30 CA på HELA truppen,
 * klampat 99 — det mättar performanceFactor (taket 1.40, economyService.ts)
 * för halva truppen samtidigt (mätning 3: 68% av dominant-säsongerna hade
 * exakt gap=0.000 mellan trupp-etta och tvåa). En budgettrycksmätning på den
 * truppen mäter klampningen, inte lönekraven.
 *
 * Utforskning (körd separat, se rapport i chatten — inte i denna fil):
 * boost +10 CA på club_vastanfors (seed 100/200, 5 säsonger vardera) gav
 * konsekvent tabellplacering 1–3 med täta titlar (S1–S5 seed100: pos 3,1,1,1,3;
 * seed200: pos 3,1,1,3,2) OCH ett performanceFactor-tak-antal på 0–6 av
 * ~16–19 kvalificerade spelare per säsong (snitt ≈2,4) — inte "halva truppen".
 * boost +15 gav PARADOXALT SÄMRE och mer erratisk placering (pos 7,2,7,10 på
 * en seed) — sannolikt slump/kaos-förstärkning i matchmotorn vid större
 * ingrepp, inte mindre mättnad. +10 valdes: det ger genuin, upprepad
 * dominans (top-3 i 10/10 provsäsonger, titel i 7/10) utan att mätta
 * performanceFactor-taket för mer än en minoritet av truppen. Steg 0-
 * distributionen för HUVUDKÖRNINGEN skrivs ut nedan som första sektion —
 * det är beviset, inte utforskningskörningen.
 *
 * ── STEG 1 — lönebudgetens semantik (rapporteras, tolkas inte bort) ─────────
 * Player.salary är MÅNADSSKALA: computeContractMinSalary (economyService.ts:
 * 321-343) returnerar `CA*200*0.80 * repFactor * performanceFactor` (ingen
 * /4 någonstans i formeln) avrundat till 500. Samma skala sätts vid
 * spelstart: createNewGame.ts:278-281 sätter
 * `initialWageBudget = ceil(managedMonthlyWages * 1.1 / 1000) * 1000` där
 * `managedMonthlyWages = Σ player.salary` — INGEN /4-konvertering. Alltså:
 * wageBudget SÄTTS på samma (månads-)skala som Player.salary, med 10%
 * marginal över startlöneläget.
 *
 * MEN tre andra ställen läser wageBudget som om den vore VECKOSKALA:
 * eventProcessor.ts:301-305 (`weeklyWageEquivalent = totalSalary/4`, jämfört
 * direkt mot wageBudget), TransfersScreen.tsx:137/152 och
 * ContractsTab.tsx:78-79/97 (samma `weeklyEquiv = projectedWageBill/4 > wageBudget`-
 * mönster). Det gör att lönebudget-överskridning i de tre call-siterna kräver
 * att truppens totala månadslön nästan FYRDUBBLAS från startläget innan
 * varningen ens BÖRJAR räkna rundor (10 rundor krävs för nästa steg, som
 * ÄNDÅ aldrig skriver till `pendingPointDeductions` — se nedan). Ett fjärde
 * ställe, EkonomiTab.tsx:61/66 (`actualMonthlyWages = weeklyWages*4` jämfört
 * direkt mot wageBudget), är internt KONSISTENT med hur fältet faktiskt
 * sätts vid spelstart. Kodbasen är alltså inkonsekvent med sig själv om
 * skalan — flaggas rakt, ingen fix här (measurement-only).
 *
 * ENFORCEMENT: wageBudget är INGEN hård spärr någonstans.
 * `renewContract` (transferActions.ts:91-149) blockerar bara om
 * `newSalary < minSalary` (prestationsgolvet) — den kollar wageBudget
 * ALDRIG som villkor för att neka förlängningen. Den returnerar
 * `success: true` med en `wageWarning`-siffra oavsett (rad 144-149).
 * "Poängavdraget" som flaggas efter 10 överskridningsrundor
 * (eventProcessor.ts:325-338) skickar bara ett inbox-meddelande — det
 * skriver ALDRIG till `pendingPointDeductions` (det fältet fylls bara av
 * scandalService.ts, bekräftat via grep). Ingen spelkonsekvens existerar.
 * wageBudget är i dag rent rådgivande/dekorativt.
 *
 * YTTERLIGARE FYND: wageBudget sätts EN gång (createNewGame.ts:283) och
 * uppdateras ALDRIG av någon applikationskod därefter (grep bekräftar).
 * Över en flerårig karriär växer lönenotan (prestationsfaktor, CA-tillväxt,
 * nya kontrakt) men taket står stilla vid säsong-1-nivån. Det betyder att
 * "utrymmet" mekaniskt krymper år för år oavsett anspråk-1-mekaniken —
 * relevant för att tolka en eventuell TIDSTREND i lastkvoten nedan (den
 * reflekterar delvis "taket är fruset", inte bara "denna säsongs krav").
 *
 * UTRYMME, vald definition: `utrymme = club.wageBudget − Σ(salary för HELA
 * truppen, inte bara kvalificerade)` — bokstavligt den formel domen själv
 * föreslår, på den skala fältet FAKTISKT sätts på (månad, ingen konvertering).
 * Alternativet (mot Club.finances) avvisas: finances är en KASSABEHÅLLNING
 * (stock, påverkas av transferavgifter/anläggningskostnader/sponsring — helt
 * orelaterat till lönehållbarhet), medan wageBudget är den återkommande
 * löneramen styrelsen satt (flow-tak) — det är den som svarar mot "kan du
 * behålla alla" som domen frågar om, inte hur mycket kontanter som råkar
 * finnas i kassan just nu.
 *
 * Kör: node_modules/.bin/vite-node scripts/anspark1-budgettryck-matning-2026-08-28.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import { computeLeaguePositionAverages, computeContractMinSalary, MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR } from '../src/domain/services/economyService'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { SeasonSummary } from '../src/domain/entities/SeasonSummary'

const SEASONS = 10
const DOMINANCE_BOOST = 10 // se STEG 0 ovan — valt efter förkörning, inte gissat

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
  wageBudget: number
  room: number                 // kan vara negativt — rapporteras rått
  lastkvot: number             // totalDemand / max(room, EPSILON)
  overBudget: boolean          // lastkvot > 1
  atCap: number                // #spelare med performanceFactor >= taket (steg 0-bevis)
  finalPosition: number | null
  top3: boolean
  wonTrophy: boolean
  gate2: boolean
  managerFired: boolean
}

function makeGame(clubId: string, boost: number, seed: number): SaveGame {
  const game = createNewGame({ managerName: `AH2B-${clubId}`, clubId, seed })
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
    // nollställer dem — samma konvention som föregångarscripten.
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
      // Steg 0-bevis: samma rå performanceFactor-formel som economyService.ts
      // (inte exporterad separat — computeContractMinSalary returnerar bara
      // slutprodukten bas*rep*pf. Duplicering är avsiktlig, samma mönster
      // som föregångarscripten redan använde för samma anledning.)
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
    const room = club.wageBudget - currentSquadSalary
    const lastkvot = totalDemand / Math.max(room, ROOM_EPSILON)

    // Säsongssummary för INNEVARANDE säsong finns i `game` (post-rollover-anrop),
    // INTE i `preRollover` (den läggs till av seasonEndProcessor under samma
    // advanceToNextEvent-anrop som satte seasonEnded=true). game.seasonSummaries[i-1]
    // (föregående säsong) läses ALDRIG här — bekräftat icke-fråga sedan mätning 3.
    const summaries: SeasonSummary[] = game.seasonSummaries ?? []
    const thisSummary = summaries[summaries.length - 1]
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
  console.log(`\n--- STEG 0-BEVIS: performanceFactor-fördelning, ${label} (boost=+${DOMINANCE_BOOST} CA) ---`)
  for (const r of rows) {
    console.log(`  S${r.season}: kvalificerade=${r.qualifiedCount}  vid_taket_1.40=${r.atCap}  placering=${r.finalPosition ?? '-'}  titel=${r.wonTrophy ? 'J' : 'N'}`)
  }
  const avgAtCap = rows.reduce((s, r) => s + r.atCap, 0) / rows.length
  const avgQualified = rows.reduce((s, r) => s + r.qualifiedCount, 0) / rows.length
  console.log(`  Snitt vid taket/säsong: ${avgAtCap.toFixed(2)} av ${avgQualified.toFixed(1)} kvalificerade (${(100 * avgAtCap / avgQualified).toFixed(0)}%) — INTE halva truppen.`)
}

function printSeasonTable(label: string, rows: SeasonRow[]): void {
  console.log(`\n=== ${label} ===`)
  console.log('Säsong | #kval | kravst | totalDemand | wageBudget | squadSalary | room       | lastkvot | >1 | plac | top3 | titel')
  for (const r of rows) {
    console.log(
      `${String(r.season).padStart(6)} | ${String(r.qualifiedCount).padStart(5)} | ${String(r.kravstallare).padStart(6)} | ` +
      `${fmtKr(r.totalDemand).padStart(11)} | ${fmtKr(r.wageBudget).padStart(10)} | ${fmtKr(r.currentSquadSalary).padStart(11)} | ` +
      `${fmtKr(r.room).padStart(10)} | ${r.lastkvot.toFixed(2).padStart(8)} | ${r.overBudget ? ' J' : ' N'} | ` +
      `${String(r.finalPosition ?? '-').padStart(4)} | ${r.top3 ? ' J ' : ' N '} | ${r.wonTrophy ? ' J ' : ' N '}` +
      `${r.managerFired ? '  (AVSKEDAD)' : ''}`,
    )
  }
}

function printDistribution(label: string, rows: SeasonRow[]): void {
  const n = rows.length
  const kravstallareCounts = rows.map(r => r.kravstallare).sort((a, b) => a - b)
  const totalDemands = rows.map(r => r.totalDemand).sort((a, b) => a - b)
  const rooms = rows.map(r => r.room).sort((a, b) => a - b)
  const lastkvoter = rows.map(r => r.lastkvot).sort((a, b) => a - b)
  const over1 = rows.filter(r => r.overBudget).length
  const twoPlus = rows.filter(r => r.kravstallare >= 2).length

  console.log(`\n--- Fördelning: ${label} (N=${n} säsonger) ---`)
  console.log(`  #kravställare/säsong: min=${kravstallareCounts[0]} p25=${percentile(kravstallareCounts, 0.25).toFixed(1)} median=${percentile(kravstallareCounts, 0.5).toFixed(1)} p75=${percentile(kravstallareCounts, 0.75).toFixed(1)} max=${kravstallareCounts[n - 1]}`)
  console.log(`  totalDemand (kr):     min=${fmtKr(totalDemands[0])} p25=${fmtKr(percentile(totalDemands, 0.25))} median=${fmtKr(percentile(totalDemands, 0.5))} p75=${fmtKr(percentile(totalDemands, 0.75))} max=${fmtKr(totalDemands[n - 1])}`)
  console.log(`  room (kr, kan vara <0): min=${fmtKr(rooms[0])} p25=${fmtKr(percentile(rooms, 0.25))} median=${fmtKr(percentile(rooms, 0.5))} p75=${fmtKr(percentile(rooms, 0.75))} max=${fmtKr(rooms[n - 1])}`)
  console.log(`  lastkvot:             min=${lastkvoter[0].toFixed(2)} p25=${percentile(lastkvoter, 0.25).toFixed(2)} median=${percentile(lastkvoter, 0.5).toFixed(2)} p75=${percentile(lastkvoter, 0.75).toFixed(2)} max=${lastkvoter[n - 1].toFixed(2)}`)
  console.log(`  ANDEL lastkvot>1 (kan inte möta alla krav):  ${over1}/${n} (${(100 * over1 / n).toFixed(0)}%)`)
  console.log(`  ANDEL >=2 kravställare samtidigt:             ${twoPlus}/${n} (${(100 * twoPlus / n).toFixed(0)}%)`)

  // Histogram över kravställare-antal (0,1,2,3,4+)
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

// Doktrinens egen distribution-först-disciplin (samma som mätning 3):
// rapportera RÅ fördelning av enskilda demand-belopp INNAN någon golvtröskel
// föreslås för att sålla bort triviala krav. Ingen tröskel sätts i denna fil.
function printRawDemandDistribution(label: string, rows: SeasonRow[]): void {
  const all = rows.flatMap(r => r.demands).sort((a, b) => a - b)
  const n = all.length
  console.log(`\n--- RÅ demand-fördelning per SPELARE (inte per säsong): ${label} (N=${n} kravställare-observationer) ---`)
  if (n === 0) {
    console.log('  Inga kravställare.')
    return
  }
  console.log(`  min=${fmtKr(all[0])} p10=${fmtKr(percentile(all, 0.10))} p25=${fmtKr(percentile(all, 0.25))} median=${fmtKr(percentile(all, 0.5))} p75=${fmtKr(percentile(all, 0.75))} p90=${fmtKr(percentile(all, 0.90))} max=${fmtKr(all[n - 1])}`)
  const buckets = [
    { label: '0-500 (avrundningsgolvet i sig)', test: (d: number) => d <= 500 },
    { label: '501-2000', test: (d: number) => d > 500 && d <= 2000 },
    { label: '2001-5000', test: (d: number) => d > 2000 && d <= 5000 },
    { label: '5001-10000', test: (d: number) => d > 5000 && d <= 10000 },
    { label: '10001-20000', test: (d: number) => d > 10000 && d <= 20000 },
    { label: '20000+', test: (d: number) => d > 20000 },
  ]
  for (const b of buckets) {
    const count = all.filter(b.test).length
    const bar = '#'.repeat(Math.round(50 * count / n))
    console.log(`    ${b.label.padEnd(32)}: ${String(count).padStart(4)} (${(100 * count / n).toFixed(0).padStart(3)}%) ${bar}`)
  }
}

function condition2Test(label: string, rows: SeasonRow[]): void {
  const gated = rows.filter(r => r.gate2)
  const ungated = rows.filter(r => !r.gate2)
  console.log(`\n--- Villkor 2-test (topp3/titel-gate): ${label} ---`)
  console.log(`  Gated (topp3/titel): N=${gated.length}`)
  console.log(`  Ungated (ej topp3/titel): N=${ungated.length}`)
  if (gated.length > 0) {
    const gatedLK = gated.map(r => r.lastkvot).sort((a, b) => a - b)
    const gatedOver1 = gated.filter(r => r.overBudget).length
    console.log(`    Gated:   median lastkvot=${percentile(gatedLK, 0.5).toFixed(2)}  andel>1=${(100 * gatedOver1 / gated.length).toFixed(0)}%`)
  }
  if (ungated.length > 0) {
    const ungatedLK = ungated.map(r => r.lastkvot).sort((a, b) => a - b)
    const ungatedOver1 = ungated.filter(r => r.overBudget).length
    console.log(`    Ungated: median lastkvot=${percentile(ungatedLK, 0.5).toFixed(2)}  andel>1=${(100 * ungatedOver1 / ungated.length).toFixed(0)}%`)
  }
  const allLK = rows.map(r => r.lastkvot).sort((a, b) => a - b)
  const allOver1 = rows.filter(r => r.overBudget).length
  console.log(`    Ungated hela poolen (ref, = alla säsonger): median lastkvot=${percentile(allLK, 0.5).toFixed(2)}  andel>1=${(100 * allOver1 / rows.length).toFixed(0)}%`)
}

function main(): void {
  console.log('\n============================================================')
  console.log('A-H2b BUDGETTRYCK — mätning 2026-08-28 (ersätter marginalmåttet)')
  console.log('============================================================')

  console.log(`\n--- Kör DOMINANT klubb (club_vastanfors, boost=+${DOMINANCE_BOOST} CA, seed=${DOMINANT_SEED}) ---`)
  const dominantMain = runClub('DOMINANT', 'club_vastanfors', DOMINANCE_BOOST, DOMINANT_SEED, SEASONS)

  console.log(`\n--- Kör MID-TABLE klubb (club_malilla, ORÖRD trupp, seed=${MIDTABLE_SEED}) ---`)
  const midMain = runClub('MID-TABLE', 'club_malilla', 0, MIDTABLE_SEED, SEASONS)

  // ── STEG 0-bevis (huvudkörningen, dominant trupp) — FÖRSTA UTSKRIFT ────────
  printStep0Proof('DOMINANT huvudkörning (seed=100)', dominantMain)

  // ── Robusthetspool ──────────────────────────────────────────────────────
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

  // Steg 0-bevis även för HELA poolen (inte bara huvudkörningen) — extra robusthet.
  printStep0Proof('DOMINANT hela poolen (huvud+robusthet)', dominantPool)

  // ── Säsongstabeller (huvudkörning, läsbart) ────────────────────────────
  printSeasonTable('DOMINANT KLUBB — huvudkörning (club_vastanfors, seed=100)', dominantMain)
  printSeasonTable('MID-TABLE KLUBB — huvudkörning (club_malilla, seed=2)', midMain)

  // ── Fördelningar (hela poolen) ──────────────────────────────────────────
  printDistribution('DOMINANT (huvud+pool)', dominantPool)
  printDistribution('MID-TABLE (huvud+pool)', midPool)

  // ── Rå per-spelare demand-fördelning (doktrinens distribution-först-krav) ──
  printRawDemandDistribution('DOMINANT (huvud+pool)', dominantPool)
  printRawDemandDistribution('MID-TABLE (huvud+pool)', midPool)

  // ── Villkor 2-test ───────────────────────────────────────────────────────
  condition2Test('DOMINANT (huvud+pool)', dominantPool)
  condition2Test('MID-TABLE (huvud+pool)', midPool)

  // ── Ordningskoll — punkt 5 i rapportkravet ──────────────────────────────
  const domOver1 = dominantPool.filter(r => r.overBudget).length
  const midOver1 = midPool.filter(r => r.overBudget).length
  const domTwoPlus = dominantPool.filter(r => r.kravstallare >= 2).length
  const midTwoPlus = midPool.filter(r => r.kravstallare >= 2).length
  console.log('\n\n=== ORDNINGSKOLL (utan tuning) ===')
  console.log(`  DOMINANT lastkvot>1:    ${domOver1}/${dominantPool.length} (${(100 * domOver1 / dominantPool.length).toFixed(0)}%)`)
  console.log(`  MID-TABLE lastkvot>1:   ${midOver1}/${midPool.length} (${(100 * midOver1 / midPool.length).toFixed(0)}%)`)
  console.log(`  DOMINANT >=2 kravställare: ${domTwoPlus}/${dominantPool.length} (${(100 * domTwoPlus / dominantPool.length).toFixed(0)}%)`)
  console.log(`  MID-TABLE >=2 kravställare: ${midTwoPlus}/${midPool.length} (${(100 * midTwoPlus / midPool.length).toFixed(0)}%)`)
  console.log(`  Ordning håller (dominant oftare över + fler samtidiga kravställare)?  ${domOver1 / dominantPool.length > midOver1 / midPool.length && domTwoPlus / dominantPool.length > midTwoPlus / midPool.length ? 'JA' : 'NEJ'}`)

  console.log('\n=== SLUT ===\n')
}

main()
