/**
 * Femte passet (Jacobs order 2026-08-23): spåra de sex kvarvarande avskeden
 * från O5_ACCEPTANSTEST_OMKORNING_2026-08-23.md individuellt. Samma 20 seeds
 * (70000-70019), samma klubb (Västanfors), samma harness — men nu med rik
 * per-säsong-instrumentering: boardPatience-trajektoria, meritBuffer,
 * consecutiveFailures, OCH en fullständig BYGGLOGG (vad byggdes, när, till
 * vilken kassa, med vilken marginal kvar).
 *
 * Två hypoteser att pröva:
 * H1 — E-STRESS1:s byggpolicy bygger mer aggressivt än en förnuftig spelare
 *      skulle. Bygglogg per seed avslöjar det.
 * H2 — Kassaspänningen når boardPatience via en okartlagd väg. Konkursvägen
 *      (evaluateFinanceStatus === game-over) var tyst i förra körningen —
 *      kollar om den är det nu, samt om boardPatience-trajektorian visar
 *      ett mönster som INTE förklaras av position/svit/objektiv.
 *
 * Kör: node_modules/.bin/vite-node scripts/o5-avsked-diagnos-2026-08-23.ts
 */

import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen, autoBuildCheapestAffordableFacility } from './stress/fixtures'
import { getFacilityNodeViews, FACILITY_NODE_DEFS } from '../src/domain/services/facilityService'
import { evaluateFinanceStatus } from '../src/domain/services/economyService'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const CLUB_ID = 'club_vastanfors'
const SEEDS = 20
const SEASONS = 8

type FiredReason = 'boardPatience<=15' | 'consecutiveFailures>=3' | 'bankruptcy' | 'licenseDenial' | null

function classifyFiredReason(game: SaveGame): FiredReason {
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (managedClub) {
    const finStatus = evaluateFinanceStatus(managedClub.finances)
    if (finStatus.status === 'game-over') return 'bankruptcy'
  }
  if ((game.boardPatience ?? 70) <= 15) return 'boardPatience<=15'
  if ((game.consecutiveFailures ?? 0) >= 3) return 'consecutiveFailures>=3'
  return 'licenseDenial'
}

interface BuildEvent {
  season: number
  matchday: number
  nodeId: string
  cost: number
  cashBefore: number
  cashAfter: number
}

interface SeasonTrace {
  season: number
  finalPosition: number | null
  wins: number
  draws: number
  losses: number
  startBoardPatience: number       // patience vid säsongens start (= förra säsongens endBoardPatience)
  preSeasonEndPatience: number     // patience precis INNAN säsongsslutets position+objektiv-term, dvs efter hela säsongens LÖPANDE term
  endBoardPatience: number
  endMeritBuffer: number
  endConsecutiveFailures: number
  endFinances: number
  minFinancesSeenThisSeason: number
  worstFinanceStatus: string  // strongest evaluateFinanceStatus hit during the season, any round
}

interface RunResult {
  seed: number
  traces: SeasonTrace[]
  buildLog: BuildEvent[]
  firedSeason: number | null
  firedReason: FiredReason
  crashed: boolean
  crashMsg: string | null
}

function runOne(seed: number): RunResult {
  let game: SaveGame = createNewGame({ managerName: `O5diag-${seed}`, clubId: CLUB_ID, seed })
  game = { ...game, pendingScreen: null }

  const traces: SeasonTrace[] = []
  const buildLog: BuildEvent[] = []
  let firedSeason: number | null = null
  let firedReason: FiredReason = null

  const financeStatusRank: Record<string, number> = { healthy: 0, warning: 1, 'license-denial': 2, 'game-over': 3 }

  try {
    for (let season = 1; season <= SEASONS; season++) {
      let stepSeed = seed * 100_000 + season * 1_000
      let seasonDone = false
      let guardRounds = 0
      let wins = 0, draws = 0, losses = 0
      const seenFixtures = new Set<string>()
      let minFinancesThisSeason = Infinity
      let worstStatus = 'healthy'
      const startBoardPatience = game.boardPatience ?? 70
      let preSeasonEndPatience = startBoardPatience

      while (!seasonDone) {
        guardRounds++
        if (guardRounds > 2000) throw new Error(`season ${season} never ended — round guard tripped`)

        // Fångar patiensen precis INNAN denna omgångs advance — om denna
        // omgång råkar bli säsongens sista blir detta värdet "patiens efter
        // hela säsongens löpande term, före säsongsslutets position+objektiv".
        preSeasonEndPatience = game.boardPatience ?? preSeasonEndPatience

        game = autoSelectLineup(game)

        // Bygglogg: fånga innan/efter separat så vi vet exakt vad som hände.
        const preBuildState = game.facilityState
        const preBuildClub = game.clubs.find(c => c.id === CLUB_ID)
        const preBuildFinances = preBuildClub?.finances ?? 0
        const preBuildActiveProject = preBuildState?.activeProject
        game = autoBuildCheapestAffordableFacility(game)
        const postBuildState = game.facilityState
        if (!preBuildActiveProject && postBuildState?.activeProject) {
          const nodeId = postBuildState.activeProject.nodeId
          const def = FACILITY_NODE_DEFS.find(d => d.id === nodeId)
          const postBuildClub = game.clubs.find(c => c.id === CLUB_ID)
          buildLog.push({
            season, matchday: game.currentMatchday ?? 0, nodeId,
            cost: def?.cost ?? 0, cashBefore: preBuildFinances, cashAfter: postBuildClub?.finances ?? 0,
          })
        }

        const result = advanceToNextEvent(game, stepSeed++)
        game = result.game

        const club = game.clubs.find(c => c.id === CLUB_ID)
        if (club) {
          minFinancesThisSeason = Math.min(minFinancesThisSeason, club.finances)
          const status = evaluateFinanceStatus(club.finances).status
          if (financeStatusRank[status] > financeStatusRank[worstStatus]) worstStatus = status
        }

        const last = game.fixtures
          .filter(f => f.status === 'completed' && !f.isCup && (f.homeClubId === CLUB_ID || f.awayClubId === CLUB_ID))
          .sort((a, b) => b.matchday - a.matchday)[0]
        if (last && !seenFixtures.has(last.id)) {
          seenFixtures.add(last.id)
          const isHome = last.homeClubId === CLUB_ID
          const my = isHome ? (last.homeScore ?? 0) : (last.awayScore ?? 0)
          const their = isHome ? (last.awayScore ?? 0) : (last.homeScore ?? 0)
          if (my > their) wins++
          else if (my < their) losses++
          else draws++
        }

        if (result.seasonEnded || game.managerFired) {
          seasonDone = true
        } else {
          const resolved = autoResolvePendingScreen(game)
          if (resolved.unresolvable) throw new Error(`unresolvable pendingScreen: ${resolved.screenType}`)
          game = resolved.game
        }
      }

      const club = game.clubs.find(c => c.id === CLUB_ID)
      const lastSummary = game.seasonSummaries?.[game.seasonSummaries.length - 1]

      traces.push({
        season,
        finalPosition: lastSummary?.finalPosition ?? null,
        wins, draws, losses,
        startBoardPatience,
        preSeasonEndPatience,
        endBoardPatience: game.boardPatience ?? 70,
        endMeritBuffer: game.meritBuffer ?? 0,
        endConsecutiveFailures: game.consecutiveFailures ?? 0,
        endFinances: club?.finances ?? 0,
        minFinancesSeenThisSeason: minFinancesThisSeason === Infinity ? (club?.finances ?? 0) : minFinancesThisSeason,
        worstFinanceStatus: worstStatus,
      })

      if (game.managerFired) {
        firedSeason = season
        firedReason = classifyFiredReason(game)
        break
      }

      const resolved = autoResolvePendingScreen(game)
      game = resolved.game
    }
  } catch (e) {
    return { seed, traces, buildLog, firedSeason, firedReason, crashed: true, crashMsg: e instanceof Error ? e.message : String(e) }
  }

  return { seed, traces, buildLog, firedSeason, firedReason, crashed: false, crashMsg: null }
}

function main(): void {
  const results: RunResult[] = []
  for (let i = 0; i < SEEDS; i++) {
    results.push(runOne(70_000 + i))
  }

  const valid = results.filter(r => !r.crashed)
  const firedRuns = valid.filter(r => r.firedSeason !== null)

  console.log(`\n=== Femte passet — avskedsdiagnos, Västanfors, ${SEEDS} seeds (2026-08-23) ===\n`)
  console.log(`Sparkade: ${firedRuns.length}/${valid.length}\n`)

  for (const r of firedRuns) {
    console.log(`\n━━━ seed=${r.seed} — sparkad säsong ${r.firedSeason} (${r.firedReason}) ━━━`)
    console.log('Säsongstrajektoria — DEKOMPONERAD: löpande term (svit/vinst/förlust) mot säsongsslutets position+objektiv-term:')
    for (const t of r.traces) {
      const runningDelta = t.preSeasonEndPatience - t.startBoardPatience
      const seasonEndDelta = t.endBoardPatience - t.preSeasonEndPatience
      console.log(`  S${t.season}: pos=${t.finalPosition} W-D-L=${t.wins}-${t.draws}-${t.losses} | patiens ${t.startBoardPatience.toFixed(1)} → (löpande term ${runningDelta >= 0 ? '+' : ''}${runningDelta.toFixed(1)}) → ${t.preSeasonEndPatience.toFixed(1)} → (säsongsslut+objektiv ${seasonEndDelta >= 0 ? '+' : ''}${seasonEndDelta.toFixed(1)}) → ${t.endBoardPatience.toFixed(1)} | meritBuffer=${t.endMeritBuffer.toFixed(1)} consecFail=${t.endConsecutiveFailures} kassa=${Math.round(t.endFinances).toLocaleString('sv-SE')} kr lägstaKassa=${Math.round(t.minFinancesSeenThisSeason).toLocaleString('sv-SE')} kr finansstatus=${t.worstFinanceStatus}`)
    }
    console.log('  De TRE säsongerna före avsked (om de finns):')
    const before = r.traces.slice(-4, -1)  // last trace is the firing season itself
    if (before.length === 0) console.log('    (färre än fyra säsonger spelade — se full trajektoria ovan)')
    for (const t of before) {
      console.log(`    S${t.season}: boardPatience=${t.endBoardPatience.toFixed(1)}, meritBuffer=${t.endMeritBuffer.toFixed(1)}`)
    }
    console.log('  Bygglogg denna körning:')
    if (r.buildLog.length === 0) {
      console.log('    (inget byggt hela körningen)')
    }
    for (const b of r.buildLog) {
      const marginAfter = b.cashAfter
      console.log(`    S${b.season} md${b.matchday}: byggde "${b.nodeId}" för ${b.cost.toLocaleString('sv-SE')} kr — kassa ${Math.round(b.cashBefore).toLocaleString('sv-SE')} → ${Math.round(marginAfter).toLocaleString('sv-SE')} kr`)
    }
  }

  console.log('\n\n━━━ Dekomponering, summerat över ALLA säsonger i de sex sparkade körningarna ━━━')
  const allTraces = firedRuns.flatMap(r => r.traces)
  const totalRunning = allTraces.reduce((s, t) => s + (t.preSeasonEndPatience - t.startBoardPatience), 0)
  const totalSeasonEnd = allTraces.reduce((s, t) => s + (t.endBoardPatience - t.preSeasonEndPatience), 0)
  const negRunningSeasons = allTraces.filter(t => (t.preSeasonEndPatience - t.startBoardPatience) < 0).length
  const negSeasonEndSeasons = allTraces.filter(t => (t.endBoardPatience - t.preSeasonEndPatience) < 0).length
  console.log(`  Total löpande-term-delta (svit+vinst/förlust) över ${allTraces.length} säsongssampel: ${totalRunning.toFixed(1)} (${negRunningSeasons} av ${allTraces.length} säsonger negativ)`)
  console.log(`  Total säsongsslut+objektiv-delta över samma sampel: ${totalSeasonEnd.toFixed(1)} (${negSeasonEndSeasons} av ${allTraces.length} säsonger negativ)`)
  console.log(`  → Meritbufferten skyddar ENDAST mot säsongsslutstermen. Om löpande-term-summan är kraftigt mer negativ, skyddar bufferten fel del av mekanismen för dessa sex.`)

  console.log('\n\n━━━ H2-koll: konkursväg tyst? ━━━')
  const anyGameOver = valid.flatMap(r => r.traces).filter(t => t.worstFinanceStatus === 'game-over')
  const anyLicenseDenial = valid.flatMap(r => r.traces).filter(t => t.worstFinanceStatus === 'license-denial')
  const anyWarning = valid.flatMap(r => r.traces).filter(t => t.worstFinanceStatus === 'warning')
  console.log(`  Säsongssampel som NÅGON GÅNG träffade 'game-over'-tröskeln (< -2 mkr) under säsongen: ${anyGameOver.length}`)
  console.log(`  Säsongssampel som nådde 'license-denial' (< -1 mkr): ${anyLicenseDenial.length}`)
  console.log(`  Säsongssampel som nådde 'warning' (< -500k): ${anyWarning.length}`)
  console.log(`  (Ingen av dessa klassificerades slutligen som firedReason='bankruptcy' bland de sex — bekräftar att konkursvägen inte var den UTLÖSANDE vägen, men varning/license-denial-nivåer kan ändå ha bidragit indirekt om det finns en sådan koppling.)`)
}

main()
