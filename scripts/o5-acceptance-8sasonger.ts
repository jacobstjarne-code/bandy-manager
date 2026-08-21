/**
 * O5 acceptanstest (Jacobs order 2026-08-23, före O1): åtta säsonger med en
 * framgångsrik klubb (Västanfors, ChallengeTop, rykte 78 — samma referens som
 * DOM_FRAMGANGSEKONOMIN_2026-08-17.md:s ursprungsaudit: "Kassa 420 tkr →
 * 11,0 mkr") med alla tre O5-krafterna aktiva. Domens kriterium: år åtta ska
 * det finnas minst ETT ekonomiskt val där båda alternativen svider.
 *
 * Instrumenterar:
 * 1) Kassans kurva år 1-8, monoton eller inte.
 * 2) Går kassan NÅGONSIN under det billigaste tillgängliga (icke-byggda,
 *    icke-låsta) anläggningsnodens kostnad — samma mekaniska mätmetod
 *    RAPPORTERA-svaret (DOM_FRAMGANGSEKONOMIN_HEROS_2026-08-23.md) föreslog.
 * 3) Anläggningsdrift som andel av bruttosäsongsintäkt, år 3 mot år 8
 *    (ackumulerat live ur financeLog-deltat varje omgång — INTE
 *    rekonstruerat i efterhand, loggen är kapad vid 50 poster och skulle
 *    redan ha tappat tidiga säsonger vid år 8).
 * 4) investSurplus — triggas den, och vad blir dess utfall (met/failed i
 *    boardObjectiveHistory) när spelaren inte gör något särskilt för att
 *    tömma kassan (autoplay-harnesset bygger inget, förlänger inget — det
 *    ÄR "spelaren ignorerar det").
 *
 * Kör: node_modules/.bin/vite-node scripts/o5-acceptance-8sasonger.ts
 */

import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import { getFacilityNodeViews, isFacilityTreeFull, FACILITY_NODE_DEFS } from '../src/domain/services/facilityService'
import { calcRoundIncome, evaluateFinanceStatus } from '../src/domain/services/economyService'
import type { SaveGame } from '../src/domain/entities/SaveGame'

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

// Representativ bruttosäsongsintäkt: calcRoundIncome (samma funktion spelet
// faktiskt använder), snittat över hemma/borta vid klubbens FAKTISKA
// rykte/trupp/standing detta ögonblick, gånger 22 ligaomgångar. Oberoende av
// financeLog (som är kapad vid 50 poster — kan inte rekonstrueras i
// efterhand vid säsong 8, se rotorsak i filhuvudet).
function estimateGrossSeasonIncome(game: SaveGame): number {
  const club = game.clubs.find(c => c.id === CLUB_ID)
  if (!club) return 0
  const players = game.players.filter(p => p.clubId === CLUB_ID)
  const standing = game.standings.find(s => s.clubId === CLUB_ID) ?? null
  let total = 0
  for (let round = 1; round <= 22; round++) {
    const isHome = round % 2 === 0
    const b = calcRoundIncome({
      club, players, sponsors: game.sponsors ?? [], communityActivities: game.communityActivities,
      fanMood: game.fanMood ?? 55, isHomeMatch: isHome, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing, rand: () => 0.5,
      communityStanding: game.communityStanding, isFirstRound: round === 1,
    })
    total += b.weeklyBase + b.sponsorIncome + b.matchRevenue + b.communityMatchIncome + b.communityRoundIncome + b.volunteerIncome + b.kommunBidrag
  }
  return total
}

// Deterministisk anläggningsdrift för en given byggnadslista — exakt, inte
// beroende av loggen (upkeep är ett fast, känt belopp per byggd nod).
function facilityUpkeepFor(builtNodeIds: string[]): number {
  return builtNodeIds.reduce((sum, id) => sum + (FACILITY_NODE_DEFS.find(d => d.id === id)?.upkeepCost ?? 0), 0)
}

const CLUB_ID = 'club_vastanfors'
const SEEDS = 20
const SEASONS = 8

interface SeasonSample {
  season: number
  endFinances: number
  grossIncome: number
  facilityUpkeepPaid: number
  minFinancesVsCheapestAvailable: { finances: number; cheapest: number } | null  // set on first round where finances < cheapest available node cost
  treeFullByEnd: boolean
  investSurplusOffered: boolean
  investSurplusResult: 'met' | 'failed' | null
  fired: boolean
  finalPositionAtEnd: number | null
  wins: number
  draws: number
  losses: number
}

interface RunResult {
  seed: number
  samples: SeasonSample[]
  firedSeason: number | null
  firedReason: FiredReason
  crashed: boolean
  crashMsg: string | null
}

function runOne(seed: number): RunResult {
  let game: SaveGame = createNewGame({ managerName: `O5accept-${seed}`, clubId: CLUB_ID, seed })
  game = { ...game, pendingScreen: null }

  const samples: SeasonSample[] = []
  let firedSeason: number | null = null
  let firedReason: FiredReason = null

  try {
    for (let season = 1; season <= SEASONS; season++) {
      // game.currentSeason är ett kalenderårtal (2026, 2027, ...), INTE
      // loopens 1-8-index — boardObjectiveHistory nycklas på det verkliga
      // årtalet, så det måste fångas HÄR (före årets övergång) för att
      // historik-uppslaget nedan ska matcha något alls.
      const realSeasonNumber = game.currentSeason
      let stepSeed = seed * 100_000 + season * 1_000
      let seasonDone = false
      let guardRounds = 0
      let unaffordableHit: { finances: number; cheapest: number } | null = null
      let investSurplusOffered = (game.boardObjectives ?? []).some(o => o.id === 'investSurplus')
      let wins = 0, draws = 0, losses = 0
      const seenFixtures = new Set<string>()

      while (!seasonDone) {
        guardRounds++
        if (guardRounds > 2000) throw new Error(`season ${season} never ended — round guard tripped`)

        game = autoSelectLineup(game)
        const result = advanceToNextEvent(game, stepSeed++)
        game = result.game

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

        if (!investSurplusOffered) {
          investSurplusOffered = (game.boardObjectives ?? []).some(o => o.id === 'investSurplus')
        }

        // Överkomlighetskoll: kassan mot billigaste TILLGÄNGLIGA (icke byggda/låsta) nod.
        if (!unaffordableHit) {
          const club = game.clubs.find(c => c.id === CLUB_ID)
          if (club && game.facilityState) {
            const views = getFacilityNodeViews(game.facilityState, game.currentMatchday ?? 0)
            const availableCosts = views.filter(v => v.status === 'available').map(v => v.def.cost)
            if (availableCosts.length > 0) {
              const cheapest = Math.min(...availableCosts)
              if (club.finances < cheapest) {
                unaffordableHit = { finances: club.finances, cheapest }
              }
            }
          }
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
      const treeFull = game.facilityState ? isFacilityTreeFull(game.facilityState) : false
      const investSurplusHistoryEntry = (game.boardObjectiveHistory ?? [])
        .filter(h => h.objectiveId === 'investSurplus' && h.season === realSeasonNumber)[0]
      const lastSummary = game.seasonSummaries?.[game.seasonSummaries.length - 1]

      samples.push({
        season,
        endFinances: club?.finances ?? 0,
        grossIncome: estimateGrossSeasonIncome(game),
        facilityUpkeepPaid: facilityUpkeepFor(game.facilityState?.builtNodeIds ?? []),
        minFinancesVsCheapestAvailable: unaffordableHit,
        treeFullByEnd: treeFull,
        investSurplusOffered,
        investSurplusResult: investSurplusHistoryEntry ? investSurplusHistoryEntry.result : null,
        fired: !!game.managerFired,
        finalPositionAtEnd: lastSummary?.finalPosition ?? null,
        wins, draws, losses,
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
    return { seed, samples, firedSeason, firedReason, crashed: true, crashMsg: e instanceof Error ? e.message : String(e) }
  }

  return { seed, samples, firedSeason, firedReason, crashed: false, crashMsg: null }
}

function main(): void {
  const results: RunResult[] = []
  for (let i = 0; i < SEEDS; i++) {
    results.push(runOne(70_000 + i))
  }

  const crashed = results.filter(r => r.crashed)
  const valid = results.filter(r => !r.crashed)

  console.log(`\n=== O5 acceptanstest — Västanfors, ${SEASONS} säsonger × ${SEEDS} seeds (2026-08-23) ===\n`)
  console.log(`Giltiga körningar: ${valid.length}/${SEEDS}, kraschade: ${crashed.length}`)
  for (const r of crashed) console.log(`  KRASCH seed=${r.seed}: ${r.crashMsg}`)

  console.log('\n--- 1) Kassans kurva år 1-8 (median över seeds, per säsong) ---')
  for (let season = 1; season <= SEASONS; season++) {
    const vals = valid.map(r => r.samples.find(s => s.season === season)?.endFinances).filter((v): v is number => v !== undefined).sort((a, b) => a - b)
    if (vals.length === 0) { console.log(`  Säsong ${season}: inga sampel (alla körningar slutade tidigare — se avsked nedan)`); continue }
    const median = vals[Math.floor(vals.length / 2)]
    console.log(`  Säsong ${season}: median=${Math.round(median).toLocaleString('sv-SE')} kr  (min=${Math.round(vals[0]).toLocaleString('sv-SE')}, max=${Math.round(vals[vals.length - 1]).toLocaleString('sv-SE')}, n=${vals.length})`)
  }

  console.log('\n--- Monotonicitet: hur många seeds har en kassa som NÅGON GÅNG minskar säsong-till-säsong? ---')
  let nonMonotonic = 0
  for (const r of valid) {
    const seq = r.samples.map(s => s.endFinances)
    for (let i = 1; i < seq.length; i++) {
      if (seq[i] < seq[i - 1]) { nonMonotonic++; break }
    }
  }
  console.log(`  ${nonMonotonic}/${valid.length} seeds har minst en säsong där kassan minskade mot föregående säsong`)

  console.log('\n--- 2) Kassan NÅGONSIN under billigaste tillgängliga nods kostnad? ---')
  const affordabilityHits = valid.flatMap(r => r.samples.filter(s => s.minFinancesVsCheapestAvailable !== null).map(s => ({ seed: r.seed, ...s })))
  console.log(`  ${affordabilityHits.length} säsongssampel (av ${valid.reduce((n, r) => n + r.samples.length, 0)} totalt) hade minst en omgång där kassan < billigaste tillgängliga nod`)
  for (const hit of affordabilityHits.slice(0, 10)) {
    console.log(`    seed=${hit.seed} säsong=${hit.season}: kassa=${Math.round(hit.minFinancesVsCheapestAvailable!.finances).toLocaleString('sv-SE')} kr, billigaste=${hit.minFinancesVsCheapestAvailable!.cheapest.toLocaleString('sv-SE')} kr`)
  }

  console.log('\n--- 3) Anläggningsdrift som andel av bruttoäsongsintäkt, år 3 vs år 8 ---')
  for (const season of [3, 8]) {
    const rows = valid.map(r => r.samples.find(s => s.season === season)).filter((s): s is SeasonSample => s !== undefined && s.grossIncome > 0)
    if (rows.length === 0) { console.log(`  Säsong ${season}: inga sampel`); continue }
    const ratios = rows.map(s => s.facilityUpkeepPaid / s.grossIncome)
    const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length
    const avgUpkeep = rows.reduce((a, s) => a + s.facilityUpkeepPaid, 0) / rows.length
    const avgIncome = rows.reduce((a, s) => a + s.grossIncome, 0) / rows.length
    const treeFullCount = rows.filter(s => s.treeFullByEnd).length
    console.log(`  Säsong ${season}: snitt drift=${Math.round(avgUpkeep).toLocaleString('sv-SE')} kr, snitt bruttointäkt=${Math.round(avgIncome).toLocaleString('sv-SE')} kr, andel=${(avgRatio * 100).toFixed(1)}% (n=${rows.length}, trädet fullt i ${treeFullCount}/${rows.length})`)
  }

  console.log('\n--- 4) investSurplus — hur ofta erbjuds den, och utfall ---')
  const allSamples = valid.flatMap(r => r.samples)
  const offeredCount = allSamples.filter(s => s.investSurplusOffered).length
  console.log(`  Erbjuden i ${offeredCount}/${allSamples.length} säsongssampel`)
  const resultCounts: Record<string, number> = {}
  for (const s of allSamples.filter(s => s.investSurplusOffered)) {
    const key = s.investSurplusResult ?? 'okänt/ej avgjort'
    resultCounts[key] = (resultCounts[key] ?? 0) + 1
  }
  console.log(`  Utfallsfördelning (bara säsonger den erbjöds): ${JSON.stringify(resultCounts)}`)

  console.log('\n--- SIDOFYND: avsked — Västanfors är ligans LÄTT-referens (rykte 78, ChallengeTop) ---')
  const firedRuns = valid.filter(r => r.firedSeason !== null)
  console.log(`  Sparkad inom ${SEASONS} säsonger: ${firedRuns.length}/${valid.length}`)
  const reasonCounts: Record<string, number> = {}
  for (const r of firedRuns) { const k = r.firedReason ?? 'okänd'; reasonCounts[k] = (reasonCounts[k] ?? 0) + 1 }
  console.log(`  Avskedsorsak-fördelning: ${JSON.stringify(reasonCounts)}`)
  for (const r of firedRuns) {
    const positions = r.samples.map(s => s.finalPositionAtEnd ?? '?').join(',')
    const wdl = r.samples.map(s => `${s.wins}-${s.draws}-${s.losses}`).join(' | ')
    console.log(`    seed=${r.seed}: sparkad säsong ${r.firedSeason} (${r.firedReason}) — placeringar ${positions} — W-D-L per säsong: ${wdl}`)
  }

  console.log('\n--- Rådata år 8 (varje seed som nådde dit) ---')
  for (const r of valid) {
    const s8 = r.samples.find(s => s.season === 8)
    if (!s8) { console.log(`  seed=${r.seed}: sparkad säsong ${r.firedSeason} (${r.firedReason}), nådde inte säsong 8`); continue }
    console.log(`  seed=${r.seed}: kassa=${Math.round(s8.endFinances).toLocaleString('sv-SE')} kr, bruttointäkt=${Math.round(s8.grossIncome).toLocaleString('sv-SE')} kr, drift=${Math.round(s8.facilityUpkeepPaid).toLocaleString('sv-SE')} kr, placering=${s8.finalPositionAtEnd}, W-D-L=${s8.wins}-${s8.draws}-${s8.losses}, trädet fullt=${s8.treeFullByEnd}, ekonomiskt tvång=${s8.minFinancesVsCheapestAvailable !== null}, investSurplus=${s8.investSurplusOffered ? s8.investSurplusResult ?? 'ej avgjord' : 'ej erbjuden'}`)
  }
}

main()
