/**
 * OMMÄTNING — VÄG B / basekonomins intäkt (D033/D036), under KORRIGERADE
 * MÄTVILLKOR. 2026-08-30.
 *
 * Detta är INTE en omkalibrering. Inga låsta magnituder rörs
 * (TOP_POSITION_BONUS_MAX, formBonus, WEEKLY_BASE_FLAT). Scriptet mäter bara
 * om D033/D036:s slutsatser står kvar när två mätförgiftande buggar är fixade:
 *
 *   1. `3914a5e6` — socialMedia-ryktesticken är nu grindad på topp-3-placering.
 *      OBS: väg B-scriptet (ah2-basekonomi-intakt-matning-2026-08-28.ts) kör
 *      med createNewGame-defaults, där `socialMedia: false`
 *      (setupManagedClub.ts:296-305). Ticken kunde alltså aldrig fyra i den
 *      mätningen — verifierat empiriskt: körning på 96deea39 (före fixen) och
 *      på HEAD (efter) ger BIT-IDENTISKA tal. Fixen ändrar inte väg B.
 *
 *   2. `06b86b29` — `autoResolvePendingEvents(game, rand)` i stress/fixtures.ts.
 *      DETTA är den ändring som faktiskt biter här: D033/D036 mättes med
 *      `game.pendingEvents` aldrig dränerad, så patronens ankomstevent
 *      (`patron_emerge_<säsong>`, patronEvents.ts:248, grindat bakom ett
 *      spelarval) besvarades ALDRIG och `game.patron` kunde aldrig bli aktiv.
 *      Patronens årsbidrag (seasonEndProcessor.ts:306-320) fanns alltså inte
 *      i någon siffra D033 vilar på.
 *
 * TRE LÄGEN, samma script, så patroneffekten kan isoleras:
 *   (utan flagga)  — exakt föregångarens beteende (pendingEvents orörda).
 *   --patron       — BARA patron-events besvaras (choices[0], det bejakande).
 *                    Samma policy som anspråk 4:s eget lokala
 *                    `autoResolvePatronEvents`. DETTA är mätinstrumentet för
 *                    D033/D037-frågan: det släpper in patronen och INGET annat.
 *   --events       — hela `autoResolvePendingEvents` ur stress/fixtures.ts.
 *
 * VARNING OM `--events` (mätt 2026-08-30, se domtillägget): helpern är INTE
 * ekonomiskt neutral och duger inte som instrument för en ekonomimätning.
 * `transferBidReceived` (eventFactories.ts:119) har INGET `noOp`-val — dess
 * avslag heter `rejectTransfer` — så policyns fallback "första valet" blir
 * ACCEPTERA BUDET, varje gång. Följden är två fel samtidigt:
 *   (a) transfersummor sprutar in i `club.finances` och blåser upp precis
 *       det netto/omgång D033 mäter (kontroll 6438 → 12945 kr/omgång),
 *   (b) truppen dräneras utan ersättning tills den underskrider 11 spelare,
 *       varpå `autoSelectLineup` bailar, den managerade matchen aldrig
 *       simuleras och säsongen ALDRIG tar slut — verifierad deadlock på
 *       DOMINANT seed=100 säsong 5 (truppen 12 → 10, matchday låst på 23,
 *       `fixture_2030_r19_club_vastanfors_vs_club_halleforsnas` evigt
 *       `scheduled`). Läget behålls i scriptet som dokumentation av fyndet.
 *
 * TVÅ NETTOMÅTT (föregångaren hade bara det första):
 *   netto/omgång        — summan av per-omgångs-deltan i `club.finances`, räknad
 *                         BARA när `result.roundPlayed != null`. Det är D033:s
 *                         mått, återgivet oförändrat för jämförbarhet.
 *   SÄSONGSTOTAL        — `club.finances` vid säsongsslut minus vid säsongsstart.
 *                         Fångar ÄVEN det som landar på säsongsövergången, där
 *                         `roundPlayed` är null — bland annat patronens
 *                         årsbidrag. Utan detta mått är patronens pengar
 *                         osynliga per konstruktion.
 *
 * Kör: node_modules/.bin/vite-node scripts/remat-ah2-basekonomi-2026-08-30.ts <etikett> [--events]
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import * as fixtures from './stress/fixtures'
import { resolveEvent } from '../src/domain/services/events/eventResolver'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { GameEvent } from '../src/domain/entities/GameEvent'
import type { CommunityActivities } from '../src/domain/entities/SaveGame'

// ── Konstruktionen — återanvänd RAKT AV ur ah2-basekonomi-intakt-matning-2026-08-28.ts
const MAIN_SEASONS = 5
const POOL_SEASONS = 3
const DOMINANCE_BOOST = 10

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

type EventMode = 'none' | 'patron' | 'all'
const EVENT_MODE: EventMode = process.argv.includes('--events') ? 'all'
  : process.argv.includes('--patron') ? 'patron'
  : 'none'
const USE_EVENTS = EVENT_MODE !== 'none'

/**
 * Kör `autoResolvePendingEvents` ur stress/fixtures.ts när den finns (HEAD,
 * efter `06b86b29`). Fallbacken är en bit-identisk lokal kopia av samma policy
 * — den behövs bara för att SAMMA script ska gå att köra i en worktree på ett
 * äldre commit (jämförelsebaslinjen), inte som en egen mätpolicy.
 */
const resolvePendingEvents: (g: SaveGame, rand: () => number) => SaveGame =
  (fixtures as unknown as Record<string, unknown>).autoResolvePendingEvents as
    | ((g: SaveGame, rand: () => number) => SaveGame)
    | undefined
  ?? ((game: SaveGame, rand: () => number): SaveGame => {
    let g = game
    for (const e of (game.pendingEvents ?? [])) {
      g = resolveEvent(g, e.id, pickChoice(e), rand, false)
    }
    return g
  })

/** Patron-only: exakt anspråk 4:s ursprungliga lokala policy. */
function resolvePatronEventsOnly(game: SaveGame, rand: () => number): SaveGame {
  let g = game
  for (const e of (game.pendingEvents ?? [])) {
    if ((e.type === 'patronEvent' || e.type === 'patronWithdrawal') && e.choices.length > 0) {
      g = resolveEvent(g, e.id, e.choices[0].id, rand, false)
    }
  }
  return g
}

function drainEvents(game: SaveGame, rand: () => number): SaveGame {
  return EVENT_MODE === 'all' ? resolvePendingEvents(game, rand) : resolvePatronEventsOnly(game, rand)
}

function pickChoice(event: GameEvent): string {
  if (event.type === 'patronEvent' || event.type === 'patronWithdrawal' || event.type === 'patronInfluence') {
    return event.choices[0]?.id ?? ''
  }
  const noOp = event.choices.find(c => c.effect.type === 'noOp')
  return (noOp ?? event.choices[0])?.id ?? ''
}

interface SeasonAgg {
  season: number
  finalPosition: number | null
  netTotal: number          // D033:s mått — bara omgångar med roundPlayed
  rounds: number
  netPerRound: number
  seasonTotal: number       // finances(slut) − finances(start), inkl. säsongsövergången
  reputation: number
  patronActive: boolean
  patronArrivals: number
  patronWithdrawals: number
  patronContribution: number
}

interface RunResult {
  seasonAggs: SeasonAgg[]
  crashed: boolean
  allRoundDeltas: number[]
}

function makeGame(clubId: string, boost: number, seed: number, forceActivities?: CommunityActivities): SaveGame {
  const game = createNewGame({ managerName: `REMAT-${clubId}`, clubId, seed })
  let g: SaveGame = { ...game, pendingScreen: null }
  if (boost !== 0) {
    g = {
      ...g,
      players: g.players.map(p =>
        p.clubId === g.managedClubId ? { ...p, currentAbility: Math.min(99, p.currentAbility + boost) } : p,
      ),
    }
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
  let prevPatronActive = !!game.patron?.isActive

  for (let season = 1; season <= seasons; season++) {
    let seasonDone = false
    let guard = 0
    let netTotal = 0
    let rounds = 0
    let patronArrivals = 0
    let patronWithdrawals = 0
    const seasonStartFinances = game.clubs.find(c => c.id === clubId)!.finances

    while (!seasonDone) {
      guard++
      // Icke-fatal: `--events`-läget kan DEADLOCKA (trupp < 11 → autoSelectLineup
      // bailar → managerad match simuleras aldrig → säsongen tar aldrig slut).
      // Vi vill se hur ofta det händer, inte krascha hela mätningen på det.
      if (guard > 400) {
        const squad = game.players.filter(p => p.clubId === clubId).length
        console.log(`  [${label} seed=${seed}] säsong ${season}: DEADLOCK (matchday låst på ${game.currentMatchday}, trupp=${squad}) — hoppar seed`)
        return { seasonAggs, allRoundDeltas, crashed: true }
      }

      game = autoSelectLineup(game)
      if (forceActivities) game = { ...game, communityActivities: forceActivities }
      const before = game.clubs.find(c => c.id === clubId)!.finances

      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game

      if (USE_EVENTS) {
        const eventSeed = stepSeed
        let er = 0
        game = drainEvents(game, () => {
          er += 1
          return ((eventSeed * 9301 + er * 49297) % 233280) / 233280
        })
        const patronNow = !!game.patron?.isActive
        if (patronNow && !prevPatronActive) patronArrivals += 1
        if (!patronNow && prevPatronActive) patronWithdrawals += 1
        prevPatronActive = patronNow
      }

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
    const club = game.clubs.find(c => c.id === clubId)!
    seasonAggs.push({
      season,
      finalPosition: thisSummary?.finalPosition ?? null,
      netTotal,
      rounds,
      netPerRound: rounds > 0 ? netTotal / rounds : 0,
      seasonTotal: club.finances - seasonStartFinances,
      reputation: club.reputation,
      patronActive: !!game.patron?.isActive,
      patronArrivals,
      patronWithdrawals,
      patronContribution: game.patron?.isActive ? (game.patron.contribution ?? 0) : 0,
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

interface PoolResult {
  pooledAvg: number
  totalRounds: number
  perSeedAvg: number[]
  aggs: SeasonAgg[]
}

function runPool(
  label: string,
  clubId: string,
  boost: number,
  seeds: number[],
  seasons: number,
  forceActivities?: CommunityActivities,
): PoolResult {
  const perSeedAvg: number[] = []
  const allDeltas: number[] = []
  const aggs: SeasonAgg[] = []
  for (const seed of seeds) {
    const r = runClub(label, clubId, boost, seed, seasons, forceActivities)
    perSeedAvg.push(avg(r.allRoundDeltas))
    allDeltas.push(...r.allRoundDeltas)
    aggs.push(...r.seasonAggs)
  }
  return { pooledAvg: avg(allDeltas), totalRounds: allDeltas.length, perSeedAvg, aggs }
}

function patronLine(aggs: SeasonAgg[]): string {
  const n = aggs.length
  const active = aggs.filter(a => a.patronActive).length
  const arrivals = aggs.reduce((s, a) => s + a.patronArrivals, 0)
  const withdrawals = aggs.reduce((s, a) => s + a.patronWithdrawals, 0)
  const contribs = aggs.filter(a => a.patronContribution > 0).map(a => a.patronContribution)
  return `patron aktiv ${active}/${n} säsonger (ankomster ${arrivals}, uttåg ${withdrawals})` +
    (contribs.length ? `, bidrag snitt ${Math.round(avg(contribs))} kr/säsong` : ', bidrag 0')
}

function repLine(aggs: SeasonAgg[]): string {
  const reps = aggs.map(a => a.reputation)
  return `rykte snitt ${Math.round(avg(reps))} (min ${Math.min(...reps)}, max ${Math.max(...reps)}), ` +
    `andel säsonger rykte ≥80: ${Math.round(100 * reps.filter(r => r >= 80).length / reps.length)}%`
}

function printMainSeed(label: string, result: RunResult): void {
  console.log(`\n=== ${label} (huvudseed, säsong-för-säsong) ===`)
  if (result.crashed) console.log('  (avbröts — se ovan)')
  for (const s of result.seasonAggs) {
    console.log(
      `  säsong ${s.season}: plac=${s.finalPosition ?? '?'} rykte=${s.reputation} rundor=${s.rounds} ` +
      `netto/omg=${Math.round(s.netPerRound)} säsongstotal=${Math.round(s.seasonTotal)} ` +
      `patron=${s.patronActive ? 'ja' : 'nej'}(+${s.patronArrivals}/−${s.patronWithdrawals}) bidrag=${s.patronContribution}`,
    )
  }
  console.log(`  --- Huvudseed snitt netto/omgång (${result.allRoundDeltas.length} rundor): ${Math.round(avg(result.allRoundDeltas))}`)
}

function main(): void {
  const label = process.argv[2] ?? 'ONAMNGIVEN'
  console.log(`\n########## OMMÄTNING VÄG B — ${label} ##########`)
  console.log(`pendingEvents-dränering: ${USE_EVENTS ? 'PÅ (autoResolvePendingEvents)' : 'AV (som D033/D036)'}`)

  const controlMain = runClub('KONTROLL', CONTROL_CLUB, 0, CONTROL_SEED, MAIN_SEASONS)
  printMainSeed(`KONTROLL (${CONTROL_CLUB}, seed=${CONTROL_SEED})`, controlMain)
  const controlPool = runPool('KONTROLL-POOL', CONTROL_CLUB, 0, CONTROL_POOL_SEEDS, POOL_SEASONS)
  console.log(`  Pool (${CONTROL_POOL_SEEDS.length} seeds × ${POOL_SEASONS} säsonger, ${controlPool.totalRounds} rundor):`)
  console.log(`    per-seed snitt: ${controlPool.perSeedAvg.map(v => Math.round(v)).join(', ')}`)
  console.log(`    POOLAT SNITT netto/omgång: ${Math.round(controlPool.pooledAvg)}`)
  console.log(`    säsongstotal (inkl. säsongsövergång) snitt: ${Math.round(avg(controlPool.aggs.map(a => a.seasonTotal)))} kr/säsong`)
  console.log(`    ${repLine(controlPool.aggs)}`)
  console.log(`    ${patronLine(controlPool.aggs)}`)

  const dominantMain = runClub('DOMINANT', DOMINANT_CLUB, DOMINANCE_BOOST, DOMINANT_SEED, MAIN_SEASONS)
  printMainSeed(`DOMINANT (${DOMINANT_CLUB}, seed=${DOMINANT_SEED}, boost=+${DOMINANCE_BOOST})`, dominantMain)
  const dominantPool = runPool('DOMINANT-POOL', DOMINANT_CLUB, DOMINANCE_BOOST, DOMINANT_POOL_SEEDS, POOL_SEASONS)
  console.log(`  Pool (${DOMINANT_POOL_SEEDS.length} seeds × ${POOL_SEASONS} säsonger, ${dominantPool.totalRounds} rundor):`)
  console.log(`    per-seed snitt: ${dominantPool.perSeedAvg.map(v => Math.round(v)).join(', ')}`)
  console.log(`    POOLAT SNITT netto/omgång: ${Math.round(dominantPool.pooledAvg)}`)
  console.log(`    säsongstotal (inkl. säsongsövergång) snitt: ${Math.round(avg(dominantPool.aggs.map(a => a.seasonTotal)))} kr/säsong`)
  console.log(`    ${repLine(dominantPool.aggs)}`)
  console.log(`    ${patronLine(dominantPool.aggs)}`)

  const herosMain = runClub('HEROS', HEROS_CLUB, 0, HEROS_SEED, 1, DYRASTE_TIER)
  printMainSeed(`HEROS (${HEROS_CLUB}, seed=${HEROS_SEED}, dyraste tier)`, herosMain)
  const herosPool = runPool('HEROS-POOL', HEROS_CLUB, 0, HEROS_POOL_SEEDS, 1, DYRASTE_TIER)
  console.log(`  Pool (${HEROS_POOL_SEEDS.length} seeds × 1 säsong, ${herosPool.totalRounds} rundor):`)
  console.log(`    per-seed snitt: ${herosPool.perSeedAvg.map(v => Math.round(v)).join(', ')}`)
  console.log(`    POOLAT SNITT netto/omgång: ${Math.round(herosPool.pooledAvg)}`)
  console.log(`    ${repLine(herosPool.aggs)}`)
  console.log(`    ${patronLine(herosPool.aggs)}`)

  console.log(`\n########## SAMMANFATTNING — ${label} ##########`)
  console.log(`Kriterium 1 (kontroll ≈ 0, poolat): ${Math.round(controlPool.pooledAvg)} kr/omgång`)
  const kvot = controlPool.pooledAvg !== 0 ? dominantPool.pooledAvg / Math.abs(controlPool.pooledAvg) : NaN
  console.log(`Kriterium 3 (dominant ≤ ~3× kontroll): dominant=${Math.round(dominantPool.pooledAvg)}, kontroll=${Math.round(controlPool.pooledAvg)}, kvot=${Number.isFinite(kvot) ? kvot.toFixed(2) : 'n/a'}, ABSOLUT premie=${Math.round(dominantPool.pooledAvg - controlPool.pooledAvg)}`)
  console.log(`Kriterium 4 (Heros back): ${Math.round(herosPool.pooledAvg)} kr/omgång — ${herosPool.pooledAvg < 0 ? 'BACK (OK)' : 'PLUS (BRYTER KRITERIUM 4)'}`)
  console.log(`\nKriterium 2 (uppgångsfönster) — dominant huvudseed säsong-för-säsong:`)
  for (const s of dominantMain.seasonAggs) {
    console.log(`  säsong ${s.season} (plac ${s.finalPosition}): ${Math.round(s.netPerRound)} kr/omgång`)
  }
  console.log(`  kontrollens poolade steady-state: ${Math.round(controlPool.pooledAvg)} kr/omgång`)
}

main()
