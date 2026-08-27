/**
 * H4 Heros (Jacobs order 2026-08-25): avskedsfrekvens för Heros med
 * ClubExpectation.Survive, 20 seeds × 4 säsonger. Jacobs kriterium:
 * "Målet är inte noll — en klubb som ändå kollapsar ska kunna kosta
 * jobbet — men det ska gå att spela en hel karriär där."
 *
 * Metod och instrumentering speglar scripts/o5-acceptance-8sasonger.ts
 * (samma harness-mönster: autoSelectLineup/autoBuildCheapestAffordableFacility/
 * advanceToNextEvent-loop, samma FiredReason-klassificering) men förenklad
 * till bara avskeds- och vinstfrekvens — H4 frågar inte om ekonomin.
 *
 * Kör: node_modules/.bin/vite-node scripts/h4-heros-avskedsfrekvens.ts
 */

import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen, autoBuildCheapestAffordableFacility } from './stress/fixtures'
import { evaluateFinanceStatus } from '../src/domain/services/economyService'
import type { SaveGame } from '../src/domain/entities/SaveGame'

type FiredReason = 'boardPatience<=15' | 'consecutiveFailures>=3' | 'bankruptcy' | 'licenseDenial' | null

function classifyFiredReason(game: SaveGame): FiredReason {
  const managedClub = game.clubs.find(c => c.id === CLUB_ID)
  if (managedClub) {
    const finStatus = evaluateFinanceStatus(managedClub.finances)
    if (finStatus.status === 'game-over') return 'bankruptcy'
  }
  if ((game.boardPatience ?? 70) <= 15) return 'boardPatience<=15'
  if ((game.consecutiveFailures ?? 0) >= 3) return 'consecutiveFailures>=3'
  return 'licenseDenial'
}

const CLUB_ID = 'club_heros'
const SEEDS = 20
const SEASONS = 4

interface SeasonSample {
  season: number
  finalPosition: number | null
  wins: number
  draws: number
  losses: number
  fired: boolean
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
  let game: SaveGame = createNewGame({ managerName: `H4Heros-${seed}`, clubId: CLUB_ID, seed })
  game = { ...game, pendingScreen: null }

  const samples: SeasonSample[] = []
  let firedSeason: number | null = null
  let firedReason: FiredReason = null

  try {
    for (let season = 1; season <= SEASONS; season++) {
      let stepSeed = seed * 100_000 + season * 1_000
      let seasonDone = false
      let guardRounds = 0
      let wins = 0, draws = 0, losses = 0
      const seenFixtures = new Set<string>()

      while (!seasonDone) {
        guardRounds++
        if (guardRounds > 2000) throw new Error(`season ${season} never ended — round guard tripped`)

        game = autoSelectLineup(game)
        game = autoBuildCheapestAffordableFacility(game)
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

        if (result.seasonEnded || game.managerFired) {
          seasonDone = true
        } else {
          const resolved = autoResolvePendingScreen(game)
          if (resolved.unresolvable) throw new Error(`unresolvable pendingScreen: ${resolved.screenType}`)
          game = resolved.game
        }
      }

      const lastSummary = game.seasonSummaries?.[game.seasonSummaries.length - 1]
      samples.push({
        season,
        finalPosition: lastSummary?.finalPosition ?? null,
        wins, draws, losses,
        fired: !!game.managerFired,
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
    results.push(runOne(80_000 + i))
  }

  const crashed = results.filter(r => r.crashed)
  const valid = results.filter(r => !r.crashed)

  console.log(`\n=== H4 Heros — avskedsfrekvens, ${SEASONS} säsonger × ${SEEDS} seeds (2026-08-25) ===\n`)
  console.log(`Giltiga körningar: ${valid.length}/${SEEDS}, kraschade: ${crashed.length}`)
  for (const r of crashed) console.log(`  KRASCH seed=${r.seed}: ${r.crashMsg}`)

  const fired = valid.filter(r => r.firedSeason !== null)
  console.log(`\nAvsked: ${fired.length}/${valid.length} (${Math.round(fired.length / valid.length * 100)}%)`)
  for (const r of fired) {
    console.log(`  seed=${r.seed}: sparkad säsong ${r.firedSeason}, orsak=${r.firedReason}`)
  }

  const fullCareer = valid.filter(r => r.firedSeason === null)
  console.log(`\nHela ${SEASONS}-säsongskarriären spelbar: ${fullCareer.length}/${valid.length} (${Math.round(fullCareer.length / valid.length * 100)}%)`)

  console.log('\n--- Vinstandel per säsong (median, av spelade matcher) ---')
  for (let season = 1; season <= SEASONS; season++) {
    const rows = valid.map(r => r.samples.find(s => s.season === season)).filter((s): s is SeasonSample => s !== undefined)
    if (rows.length === 0) { console.log(`  Säsong ${season}: inga sampel`); continue }
    const winRates = rows.map(s => {
      const played = s.wins + s.draws + s.losses
      return played > 0 ? s.wins / played : 0
    }).sort((a, b) => a - b)
    const median = winRates[Math.floor(winRates.length / 2)]
    console.log(`  Säsong ${season}: median vinstandel=${Math.round(median * 100)}% (n=${rows.length})`)
  }

  console.log('\n--- Slutplacering per säsong (median) ---')
  for (let season = 1; season <= SEASONS; season++) {
    const positions = valid.map(r => r.samples.find(s => s.season === season)?.finalPosition).filter((p): p is number => p !== null && p !== undefined).sort((a, b) => a - b)
    if (positions.length === 0) { console.log(`  Säsong ${season}: inga sampel`); continue }
    const median = positions[Math.floor(positions.length / 2)]
    console.log(`  Säsong ${season}: median plats=${median} (n=${positions.length})`)
  }

  console.log('\n=== SLUT ===\n')
}

main()
