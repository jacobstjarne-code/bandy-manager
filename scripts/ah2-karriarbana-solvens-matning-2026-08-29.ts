/**
 * KARRIÄRBANA-SOLVENSMÄTNING — D033 öppen fråga, uppföljning 2026-08-29.
 *
 * DOM_AH2_BASEKONOMI_INTAKT_2026-08-28.md (väg B) mätte kontrollklubbens
 * (club_malilla, ingen boost) steady-state netto/omgång som -4988 kr,
 * en SÄSONGS-genomsnitt, inte en flerårig bana. Uppgiften här: avgör om
 * -4988/omgång faktiskt spiraliserar mot insolvens över en REALISTISK
 * KARRIÄRLÄNGD (10+ säsonger), eller om banan stabiliserar sig / återhämtar
 * sig (rykte växer, andra intäkter kompenserar, etc).
 *
 * Samma kontroll-konstruktion som ah2-basekonomi-intakt-matning-2026-08-28.ts
 * (och anspark1-budgettryck-matning-2026-08-28.ts): club_malilla, ORÖRD
 * trupp, huvudseed=2, robusthetspool-seeds [3..12] — återanvänt rakt av,
 * ingen ny gissning om vilken klubb/seed som representerar "mittenlag".
 *
 * evaluateFinanceStatus-trösklar (economyService.ts:73-78), operationell
 * INSOLVENS-definition för denna mätning:
 *   warning        < -500 000 kr
 *   license-denial < -1 000 000 kr
 *   game-over      < -2 000 000 kr  (triggar managerFired automatiskt,
 *                                     postRoundFlagsProcessor.ts:37-38)
 *
 * INSOLVENT = banan korsar in i 'warning' eller sämre VID SÄSONG 10 (och
 * stannar där/förvärras, inte en tillfällig dipp som återhämtar sig), ELLER
 * managerFired utlöses av ekonomi någon gång under de 10+ säsongerna.
 * SOLVENT = banan ligger kvar över tröskeln, eller oscillerar kring ett
 * stabilt (även negativt) band, eller trend är platt/återhämtande.
 *
 * club_malilla startfinances = 380 000 kr (worldGenerator.ts:252).
 *
 * Kör: node_modules/.bin/vite-node scripts/ah2-karriarbana-solvens-matning-2026-08-29.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import { evaluateFinanceStatus } from '../src/domain/services/economyService'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const SEASONS = 12 // 10+ krävt, 2 säsongers marginal för att se trenden fortsätta/vika av
const CONTROL_CLUB = 'club_malilla'
const CONTROL_SEED = 2
const CONTROL_POOL_SEEDS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

interface RoundPoint {
  season: number
  round: number
  matchday: number
  financesBefore: number
  delta: number
  financesAfter: number
  status: string
}

interface SeasonAgg {
  season: number
  startFinances: number
  endFinances: number
  netTotal: number
  rounds: number
  netPerRound: number
  finalPosition: number | null
  reputation: number
  worstStatus: string
  financeWarningFired: boolean
}

interface RunResult {
  seasonAggs: SeasonAgg[]
  roundPoints: RoundPoint[]
  managerFiredSeason: number | null // första säsong där managerFired hade blivit sann (rapporterat även om ignorerat)
  firedForFinanceReason: boolean | null // true=finansiell game-over, false=fotboll/styrelse, null=aldrig
  crashed: boolean
}

function statusRank(s: string): number {
  return s === 'game-over' ? 3 : s === 'license-denial' ? 2 : s === 'warning' ? 1 : 0
}

function worseStatus(a: string, b: string): string {
  return statusRank(b) > statusRank(a) ? b : a
}

function makeGame(clubId: string, seed: number): SaveGame {
  const game = createNewGame({ managerName: `KARRIAR-${clubId}`, clubId, seed })
  return { ...game, pendingScreen: null }
}

function runClub(
  label: string,
  clubId: string,
  seed: number,
  seasons: number,
  keepRoundPoints: boolean,
  ignoreFootballFiring: boolean,
): RunResult {
  let game = makeGame(clubId, seed)
  const seasonAggs: SeasonAgg[] = []
  const roundPoints: RoundPoint[] = []
  let stepSeed = seed * 1000
  let managerFiredSeason: number | null = null
  let firedForFinanceReason: boolean | null = null

  for (let season = 1; season <= seasons; season++) {
    let seasonDone = false
    let guard = 0
    let netTotal = 0
    let rounds = 0
    let round = 0
    const startFinances = game.clubs.find(c => c.id === clubId)!.finances
    let worstStatus = 'healthy'

    while (!seasonDone) {
      guard++
      if (guard > 2000) throw new Error(`${label} seed=${seed} säsong ${season}: round guard tripped`)

      game = autoSelectLineup(game)
      const before = game.clubs.find(c => c.id === clubId)!.finances

      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game

      if (result.roundPlayed != null) {
        const after = game.clubs.find(c => c.id === clubId)!.finances
        const delta = after - before
        netTotal += delta
        rounds += 1
        round += 1
        const status = evaluateFinanceStatus(after).status
        worstStatus = worseStatus(worstStatus, status)
        if (keepRoundPoints) {
          roundPoints.push({ season, round, matchday: result.roundPlayed, financesBefore: before, delta, financesAfter: after, status })
        }
      }

      if (result.seasonEnded || game.managerFired) {
        seasonDone = true
      } else {
        const resolved = autoResolvePendingScreen(game)
        if (resolved.unresolvable) {
          console.log(`  [${label} seed=${seed}] säsong ${season}: unresolvable pendingScreen (${resolved.screenType}) — avbryter`)
          return { seasonAggs, roundPoints, managerFiredSeason, firedForFinanceReason, crashed: true }
        }
        game = resolved.game
      }
    }

    const endFinances = game.clubs.find(c => c.id === clubId)!.finances
    const summaries = game.seasonSummaries ?? []
    const thisSummary = summaries[summaries.length - 1]
    const reputation = game.clubs.find(c => c.id === clubId)!.reputation

    seasonAggs.push({
      season,
      startFinances,
      endFinances,
      netTotal,
      rounds,
      netPerRound: rounds > 0 ? netTotal / rounds : 0,
      finalPosition: thisSummary?.finalPosition ?? null,
      reputation,
      worstStatus,
      financeWarningFired: !!game.financeWarningGivenThisSeason,
    })

    if (game.managerFired) {
      // Var det finansiellt (game-over, finances < -2M) eller fotboll/styrelse
      // (boardPatience/consecutiveFailures/licensnekan)? evaluateFinanceStatus
      // på slutfinanserna avgör — game-over-tröskeln är entydig.
      const isFinanceFiring = evaluateFinanceStatus(endFinances).status === 'game-over'
      if (managerFiredSeason === null) {
        managerFiredSeason = season
        firedForFinanceReason = isFinanceFiring
      }
      if (isFinanceFiring || !ignoreFootballFiring) {
        console.log(
          `  [${label} seed=${seed}] AVSKEDAD efter säsong ${season} (${isFinanceFiring ? 'FINANSIELLT, game-over' : 'fotboll/styrelse'}) — stoppar (${seasons - season} säsonger saknas)`,
        )
        break
      } else {
        // Mätmetodik: vi ignorerar fotbolls-/styrelseavsked här för att kunna
        // observera den FINANSIELLA banan över hela karriärlängden (uppgiftens
        // fråga). Detta ändrar INGEN produktionskod — bara mätscriptets loop.
        // Rapporteras separat: verklig spelupplevelse skulle ha stoppat här.
        console.log(`  [${label} seed=${seed}] hade avskedats efter säsong ${season} (fotboll/styrelse) — IGNORERAT för att fortsätta mäta finansbanan`)
        game = { ...game, managerFired: false, financeWarningGivenThisSeason: false }
      }
    }
  }

  return { seasonAggs, roundPoints, managerFiredSeason, firedForFinanceReason, crashed: false }
}

function fmtKr(n: number): string {
  return Math.round(n).toLocaleString('sv-SE')
}

function printSeasonTable(label: string, aggs: SeasonAgg[]): void {
  console.log(`\n=== ${label} — säsong-för-säsong ===`)
  console.log('Säsong | startFinances | slutFinances | netto-totalt | netto/omgång | rykte | plac | värsta status')
  for (const s of aggs) {
    console.log(
      `${String(s.season).padStart(6)} | ${fmtKr(s.startFinances).padStart(13)} | ${fmtKr(s.endFinances).padStart(12)} | ` +
      `${fmtKr(s.netTotal).padStart(12)} | ${fmtKr(s.netPerRound).padStart(12)} | ${String(s.reputation).padStart(5)} | ` +
      `${String(s.finalPosition ?? '-').padStart(4)} | ${s.worstStatus}${s.financeWarningFired ? ' (varning skickad)' : ''}`,
    )
  }
}

function main(): void {
  console.log('\n============================================================')
  console.log('KARRIÄRBANA-SOLVENSMÄTNING — D033 uppföljning 2026-08-29')
  console.log(`Kontroll: ${CONTROL_CLUB}, ${SEASONS} säsonger, huvudseed=${CONTROL_SEED} + robusthetspool [${CONTROL_POOL_SEEDS.join(',')}]`)
  console.log('============================================================')

  console.log(
    '\nMÄTMETODIK: fotbolls-/styrelseavsked (boardPatience/consecutiveFailures/licensnekan)\n' +
    'IGNORERAS i denna körning så att den FINANSIELLA banan kan observeras över hela\n' +
    `${SEASONS}-säsongersspannet (uppgiftens fråga). Ett FINANSIELLT game-over (finances\n` +
    '< -2M) stoppar körningen på riktigt — det är den verkliga insolvens-signalen.\n' +
    'Var/om fotbollsavsked HADE inträffat loggas separat nedan (relevant sidofynd,\n' +
    'inte del av D033s frågeställning).',
  )

  // ── Huvudseed, round-level trajectory ────────────────────────────────────
  const main = runClub('HUVUDSEED', CONTROL_CLUB, CONTROL_SEED, SEASONS, true, true)
  printSeasonTable(`HUVUDSEED (seed=${CONTROL_SEED})`, main.seasonAggs)

  console.log(`\n--- Statuströsklar korsade (huvudseed, round-level) ---`)
  let lastStatus = 'healthy'
  for (const p of main.roundPoints) {
    if (p.status !== lastStatus) {
      console.log(`  S${p.season} r${p.round} (matchday ${p.matchday}): status ${lastStatus} → ${p.status} (finances=${fmtKr(p.financesAfter)})`)
      lastStatus = p.status
    }
  }
  if (main.managerFiredSeason) {
    console.log(`  managerFired = true, utlöst efter säsong ${main.managerFiredSeason}`)
  } else {
    console.log(`  managerFired aldrig utlöst över ${main.seasonAggs.length} säsonger`)
  }

  // ── Robusthetspool ────────────────────────────────────────────────────────
  console.log(`\n\n=== ROBUSTHETSPOOL (${CONTROL_POOL_SEEDS.length} extra seeds, ${SEASONS} säsonger var) ===`)
  const poolResults: RunResult[] = []
  for (const seed of CONTROL_POOL_SEEDS) {
    const r = runClub(`POOL-seed${seed}`, CONTROL_CLUB, seed, SEASONS, false, true)
    poolResults.push(r)
    printSeasonTable(`POOL seed=${seed}`, r.seasonAggs)
    if (r.managerFiredSeason) {
      console.log(`  >>> ${r.firedForFinanceReason ? 'FINANSIELLT game-over' : 'skulle avskedats (fotboll/styrelse), ignorerat'} — första gången: säsong ${r.managerFiredSeason} <<<`)
    }
  }

  // ── Sammanfattning: säsong-10-status över hela poolen (huvud + pool) ────────
  console.log('\n\n========== SAMMANFATTNING ==========')
  const allRuns = [main, ...poolResults]
  const financeFiredRuns = allRuns.filter(r => r.firedForFinanceReason === true)
  const footballWouldHaveFiredRuns = allRuns.filter(r => r.firedForFinanceReason === false)
  console.log(`Antal körningar (huvud+pool): ${allRuns.length}`)
  console.log(`Antal med FINANSIELLT game-over (< -2M) inom ${SEASONS} säsonger: ${financeFiredRuns.length}`)
  console.log(`Antal som (ignorerat) hade fått fotbolls-/styrelseavsked inom ${SEASONS} säsonger: ${footballWouldHaveFiredRuns.length}/${allRuns.length} — sidofynd, se filhuvud`)
  for (const r of footballWouldHaveFiredRuns) {
    console.log(`  → hade avskedats (fotboll/styrelse) första gången säsong ${r.managerFiredSeason}`)
  }

  console.log(`\nSäsong-${SEASONS}-slutfinances per körning (eller sista uppnådda säsong om avskedad tidigare):`)
  for (let i = 0; i < allRuns.length; i++) {
    const r = allRuns[i]
    const seedLabel = i === 0 ? `HUVUDSEED=${CONTROL_SEED}` : `POOL=${CONTROL_POOL_SEEDS[i - 1]}`
    const lastAgg = r.seasonAggs[r.seasonAggs.length - 1]
    if (!lastAgg) {
      console.log(`  ${seedLabel}: ingen säsong avslutad (crashade tidigt)`)
      continue
    }
    const status = evaluateFinanceStatus(lastAgg.endFinances).status
    console.log(`  ${seedLabel}: säsong ${lastAgg.season} slutfinances=${fmtKr(lastAgg.endFinances)} (status=${status})${r.managerFiredSeason ? ' [AVSKEDAD]' : ''}`)
  }

  // ── Trend-analys: är banan accelererande neråt, platt, eller återhämtande? ──
  console.log('\n--- Trend: startFinances säsong 1 vs säsong 5 vs sista säsongen (per körning) ---')
  for (let i = 0; i < allRuns.length; i++) {
    const r = allRuns[i]
    const seedLabel = i === 0 ? `HUVUDSEED=${CONTROL_SEED}` : `POOL=${CONTROL_POOL_SEEDS[i - 1]}`
    const a = r.seasonAggs
    if (a.length === 0) continue
    const s1 = a[0].startFinances
    const s5 = a.length >= 5 ? a[4].startFinances : null
    const sLast = a[a.length - 1].startFinances
    const sLastEnd = a[a.length - 1].endFinances
    console.log(`  ${seedLabel}: S1-start=${fmtKr(s1)}  S5-start=${s5 !== null ? fmtKr(s5) : 'n/a'}  S${a.length}-start=${fmtKr(sLast)}  S${a.length}-slut=${fmtKr(sLastEnd)}`)
  }

  const worstOverall = allRuns.reduce((worst, r) => {
    const lastAgg = r.seasonAggs[r.seasonAggs.length - 1]
    if (!lastAgg) return worst
    return Math.min(worst, lastAgg.endFinances)
  }, Infinity)
  const bestOverall = allRuns.reduce((best, r) => {
    const lastAgg = r.seasonAggs[r.seasonAggs.length - 1]
    if (!lastAgg) return best
    return Math.max(best, lastAgg.endFinances)
  }, -Infinity)
  console.log(`\nSpridning vid sista uppnådda säsong: sämst=${fmtKr(worstOverall)}  bäst=${fmtKr(bestOverall)}`)

  console.log('\n=== SLUT ===\n')
}

main()
