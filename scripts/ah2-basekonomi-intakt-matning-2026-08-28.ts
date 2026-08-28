/**
 * AH2 basekonomi-intäkt, VÄG B — mätning (DOM_AH2_BASEKONOMI_INTAKT_2026-08-28.md).
 *
 * Mäter DEN FAKTISKA per-omgång-förändringen i `club.finances` (inte en
 * ombyggd kopia av calcRoundIncome — den riktiga produktionsvägen:
 * economyProcessor.ts:s calcRoundIncome-anrop, appliceras via
 * applyFinanceChange, plus cupvinstpengar/socialmedia-bonusar som också
 * går via `club.finances` i samma omgång) för tre klubbar:
 *
 *   - KONTROLL: club_malilla — kriterium 1 (break-even i steady-state).
 *   - DOMINANT: club_vastanfors, +10 CA (STEG 0-konstruktionen, redan
 *     verifierad icke-mättande i anspark1-budgettryck-matning-2026-08-28.ts:
 *     top-3 i 10/10 provsäsonger på huvudseeden, performanceFactor-tak
 *     träffat av bara en minoritet av truppen — återanvänd rakt av, ingen
 *     ny gissning) — kriterium 2 (uppgångsfönster, säsong-för-säsong-trend
 *     på huvudseeden) och kriterium 3 (≤~3× kontrollens netto).
 *   - HEROS: club_heros, dyraste anläggningstiern (kiosk 'upgraded' +
 *     vipTent, samma tier som RAPPORT_ASKADAREKONOMIN_V2_MATNING_2026-08-27.md
 *     mätte "5472→2173" på) — kanonisk Heros-styrka, ingen tvingad
 *     communityStanding (H4-domen: förlorar >75% av matcherna, botten av
 *     tabellen) — kriterium 4 (Survive-golvet, ska fortsatt gå back).
 *
 * Robusthet: huvudseed rapporteras säsong-för-säsong (för kriterium 2:s
 * uppgångsfönster-fråga), plus en POOL av ytterligare seeds (samma mönster
 * som anspark1-budgettryck-matning-2026-08-28.ts:s *_ROBUST_SEEDS) vars
 * SAMLADE snitt netto/omgång är den siffra kriterium 1/3 faktiskt döms mot
 * — en enda seed är en enskild historia, inte steady-state.
 *
 * communityActivities: default 'none'/false för kontroll+dominant (samma
 * som spelaren startar med, samma val som föregångarscripten redan gjorde
 * — ingen ny gissning om vad spelaren "borde" investera i).
 *
 * Samma script körs OFÖRÄNDRAT före och efter varje knapp-ändring i
 * economyService.ts — produktionsformeln läses direkt, ingen kopia.
 *
 * Kör: node_modules/.bin/vite-node scripts/ah2-basekonomi-intakt-matning-2026-08-28.ts [label]
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { CommunityActivities } from '../src/domain/entities/SaveGame'

const MAIN_SEASONS = 5
const POOL_SEASONS = 3
const DOMINANCE_BOOST = 10 // STEG 0, se filhuvud — återanvänd, ej omgissad

const CONTROL_CLUB = 'club_malilla'
const CONTROL_SEED = 2
const CONTROL_POOL_SEEDS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const DOMINANT_CLUB = 'club_vastanfors'
const DOMINANT_SEED = 100
const DOMINANT_POOL_SEEDS = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110]

const HEROS_CLUB = 'club_heros'
const HEROS_SEED = 91_000
const HEROS_POOL_SEEDS = [91_001, 91_002, 91_003, 91_004, 91_005]

const DYRASTE_TIER: CommunityActivities = {
  kiosk: 'upgraded',
  lottery: 'none',
  bandyplay: false,
  functionaries: false,
  julmarknad: false,
  vipTent: true,
}

interface SeasonAgg {
  season: number
  finalPosition: number | null
  netTotal: number
  rounds: number
  netPerRound: number
}

interface RunResult {
  seasonAggs: SeasonAgg[]
  crashed: boolean
  allRoundDeltas: number[]
}

function makeGame(clubId: string, boost: number, seed: number, forceActivities?: CommunityActivities): SaveGame {
  const game = createNewGame({ managerName: `AH2-${clubId}`, clubId, seed })
  let g: SaveGame = { ...game, pendingScreen: null }
  if (boost !== 0) {
    const boosted = g.players.map(p =>
      p.clubId === g.managedClubId ? { ...p, currentAbility: Math.min(99, p.currentAbility + boost) } : p,
    )
    g = { ...g, players: boosted }
  }
  if (forceActivities) g = { ...g, communityActivities: forceActivities }
  return g
}

function runClub(
  label: string,
  clubId: string,
  boost: number,
  seed: number,
  seasons: number,
  forceActivities?: CommunityActivities,
): RunResult {
  let game = makeGame(clubId, boost, seed, forceActivities)
  const seasonAggs: SeasonAgg[] = []
  const allRoundDeltas: number[] = []
  let stepSeed = seed * 1000

  for (let season = 1; season <= seasons; season++) {
    let seasonDone = false
    let guard = 0
    let netTotal = 0
    let rounds = 0

    while (!seasonDone) {
      guard++
      if (guard > 2000) throw new Error(`${label} seed=${seed} säsong ${season}: round guard tripped`)

      game = autoSelectLineup(game)
      if (forceActivities) game = { ...game, communityActivities: forceActivities }
      const before = game.clubs.find(c => c.id === clubId)!.finances

      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game

      if (result.roundPlayed != null) {
        const after = game.clubs.find(c => c.id === clubId)!.finances
        const delta = after - before
        allRoundDeltas.push(delta)
        netTotal += delta
        rounds += 1
      }

      if (result.seasonEnded || game.managerFired) {
        seasonDone = true
      } else {
        const resolved = autoResolvePendingScreen(game)
        if (resolved.unresolvable) {
          console.log(`  [${label} seed=${seed}] säsong ${season}: unresolvable pendingScreen (${resolved.screenType}) — avbryter`)
          return { seasonAggs, allRoundDeltas, crashed: true }
        }
        game = resolved.game
      }
    }

    const summaries = game.seasonSummaries ?? []
    const thisSummary = summaries[summaries.length - 1]
    seasonAggs.push({
      season,
      finalPosition: thisSummary?.finalPosition ?? null,
      netTotal,
      rounds,
      netPerRound: rounds > 0 ? netTotal / rounds : 0,
    })

    if (game.managerFired) {
      console.log(`  [${label} seed=${seed}] avskedad efter säsong ${season} — stoppar (${seasons - season} säsonger saknas)`)
      break
    }
  }

  return { seasonAggs, allRoundDeltas, crashed: false }
}

function avg(xs: number[]): number {
  return xs.length > 0 ? xs.reduce((s, x) => s + x, 0) / xs.length : 0
}

function runPool(
  label: string,
  clubId: string,
  boost: number,
  seeds: number[],
  seasons: number,
  forceActivities?: CommunityActivities,
): { pooledAvg: number; totalRounds: number; perSeedAvg: number[] } {
  const perSeedAvg: number[] = []
  const allDeltas: number[] = []
  for (const seed of seeds) {
    const r = runClub(label, clubId, boost, seed, seasons, forceActivities)
    perSeedAvg.push(avg(r.allRoundDeltas))
    allDeltas.push(...r.allRoundDeltas)
  }
  return { pooledAvg: avg(allDeltas), totalRounds: allDeltas.length, perSeedAvg }
}

function printMainSeed(label: string, result: RunResult): void {
  console.log(`\n=== ${label} (huvudseed, säsong-för-säsong) ===`)
  if (result.crashed) console.log('  (avbröts — se ovan)')
  for (const s of result.seasonAggs) {
    console.log(
      `  säsong ${s.season}: slutplacering=${s.finalPosition ?? '?'} rundor=${s.rounds} ` +
      `netto-totalt=${Math.round(s.netTotal)} netto/omgång=${Math.round(s.netPerRound)}`,
    )
  }
  console.log(`  --- Huvudseed snitt netto/omgång (${result.allRoundDeltas.length} rundor): ${Math.round(avg(result.allRoundDeltas))}`)
}

function main(): void {
  const label = process.argv[2] ?? 'ONAMNGIVEN'
  console.log(`\n########## AH2 BASEKONOMI-MÄTNING — ${label} ##########`)

  // ── Kontroll ────────────────────────────────────────────────────────────
  const controlMain = runClub('KONTROLL', CONTROL_CLUB, 0, CONTROL_SEED, MAIN_SEASONS)
  printMainSeed(`KONTROLL (${CONTROL_CLUB}, seed=${CONTROL_SEED})`, controlMain)
  const controlPool = runPool('KONTROLL-POOL', CONTROL_CLUB, 0, CONTROL_POOL_SEEDS, POOL_SEASONS)
  console.log(`  Pool (${CONTROL_POOL_SEEDS.length} seeds × ${POOL_SEASONS} säsonger, ${controlPool.totalRounds} rundor totalt):`)
  console.log(`    per-seed snitt: ${controlPool.perSeedAvg.map(v => Math.round(v)).join(', ')}`)
  console.log(`    POOLAT SNITT netto/omgång: ${Math.round(controlPool.pooledAvg)}`)

  // ── Dominant ────────────────────────────────────────────────────────────
  const dominantMain = runClub('DOMINANT', DOMINANT_CLUB, DOMINANCE_BOOST, DOMINANT_SEED, MAIN_SEASONS)
  printMainSeed(`DOMINANT (${DOMINANT_CLUB}, seed=${DOMINANT_SEED}, boost=+${DOMINANCE_BOOST})`, dominantMain)
  const dominantPool = runPool('DOMINANT-POOL', DOMINANT_CLUB, DOMINANCE_BOOST, DOMINANT_POOL_SEEDS, POOL_SEASONS)
  console.log(`  Pool (${DOMINANT_POOL_SEEDS.length} seeds × ${POOL_SEASONS} säsonger, ${dominantPool.totalRounds} rundor totalt):`)
  console.log(`    per-seed snitt: ${dominantPool.perSeedAvg.map(v => Math.round(v)).join(', ')}`)
  console.log(`    POOLAT SNITT netto/omgång: ${Math.round(dominantPool.pooledAvg)}`)

  // ── Heros ───────────────────────────────────────────────────────────────
  const herosMain = runClub('HEROS', HEROS_CLUB, 0, HEROS_SEED, 1, DYRASTE_TIER)
  printMainSeed(`HEROS (${HEROS_CLUB}, seed=${HEROS_SEED}, dyraste tier)`, herosMain)
  const herosPool = runPool('HEROS-POOL', HEROS_CLUB, 0, HEROS_POOL_SEEDS, 1, DYRASTE_TIER)
  console.log(`  Pool (${HEROS_POOL_SEEDS.length} seeds × 1 säsong, ${herosPool.totalRounds} rundor totalt):`)
  console.log(`    per-seed snitt: ${herosPool.perSeedAvg.map(v => Math.round(v)).join(', ')}`)
  console.log(`    POOLAT SNITT netto/omgång: ${Math.round(herosPool.pooledAvg)}`)

  // ── Kriterier, sammanfattning ────────────────────────────────────────────
  console.log(`\n########## SAMMANFATTNING — ${label} ##########`)
  console.log(`Kriterium 1 (kontroll ≈ 0, poolat): ${Math.round(controlPool.pooledAvg)} kr/omgång`)
  const kvot = controlPool.pooledAvg !== 0 ? dominantPool.pooledAvg / Math.abs(controlPool.pooledAvg) : NaN
  console.log(`Kriterium 3 (dominant ≤ ~3× kontroll, poolat): dominant=${Math.round(dominantPool.pooledAvg)}, kontroll=${Math.round(controlPool.pooledAvg)}, kvot=${Number.isFinite(kvot) ? kvot.toFixed(2) : 'n/a'}`)
  console.log(`Kriterium 4 (Heros back, poolat): ${Math.round(herosPool.pooledAvg)} kr/omgång — ${herosPool.pooledAvg < 0 ? 'BACK (OK)' : 'PLUS (BRYTER KRITERIUM 4)'}`)
  console.log(`\nDominant säsong-för-säsong netto/omgång, huvudseed (kriterium 2, uppgångsfönster):`)
  for (const s of dominantMain.seasonAggs) {
    console.log(`  säsong ${s.season} (slutplacering ${s.finalPosition}): ${Math.round(s.netPerRound)} kr/omgång`)
  }
  console.log(`Jämförelse: kontrollens poolade steady-state = ${Math.round(controlPool.pooledAvg)} kr/omgång — ingen dominant-säsong ovan ska falla under detta bara för att CA sprungit ifrån rykte tidigt i klättringen.`)
}

main()
