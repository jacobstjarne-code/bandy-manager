/**
 * H4 Heros — "stopp på skalan" (Jacobs order 2026-08-25): den föreslagna
 * expectation-skalan för updateRunningBoardPatience var en linje genom
 * TVÅ mätpunkter (Skutskär 50%, Heros 100%) plus fyra gissningar. Jacobs
 * ord: "Skalan ska härledas ur den, inte ur min intuition." Detta skriptet
 * mäter avskedsfrekvens för ALLA TOLV klubbar, 20 seeds × 4 säsonger,
 * MED NUVARANDE KOD (dvs. med den redan applicerade men ej ännu omkalibrerade
 * RUNNING_LOSS_EXPECTATION_MULTIPLIER-skalan i boardService.ts) — så att
 * skalan kan omdömas mot tolv datapunkter, inte två.
 *
 * Metod identisk med h4-heros-avskedsfrekvens.ts (samma harness-mönster),
 * bara parametriserad över samtliga CLUB_TEMPLATES-id:n.
 *
 * Kör: node_modules/.bin/vite-node scripts/h4-alla-tolv-avskedsfrekvens.ts
 */

import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen, autoBuildCheapestAffordableFacility } from './stress/fixtures'
import { evaluateFinanceStatus } from '../src/domain/services/economyService'
import { CLUB_TEMPLATES } from '../src/domain/services/worldGenerator'
import type { SaveGame } from '../src/domain/entities/SaveGame'

type FiredReason = 'boardPatience<=15' | 'consecutiveFailures>=3' | 'bankruptcy' | 'licenseDenial' | 'unknown' | null

/**
 * H4 Survive-fixet (2026-08-25) gjorde denna klassificerare potentiellt
 * missvisande: boardPatience/consecutiveFailures FORTSÄTTER räknas som
 * siffror för alla tiers, bara deras TRIGGER-verkan är avstängd för Survive.
 * Den gamla elimination-ordningen (boardPatience-siffra före licensstatus)
 * kunde alltså rapportera "boardPatience<=15" för en Survive-klubb även när
 * den FAKTISKA orsaken (per seasonEndProcessor.ts:s egen kod) var
 * licensnekan. Fix: kolla game.licenseStatus DIREKT (facit, inte gissning)
 * före boardPatience-siffran. bankruptcy oförändrad (också facit-baserad,
 * evaluateFinanceStatus). 'unknown' = inget av de fyra kända facit matchade
 * — ska aldrig hända om seasonEndProcessor.ts:s egna managerFired-vägar är
 * fullständigt listade ovan; om den syns är det ett tecken på en femte,
 * oidentifierad väg.
 */
function classifyFiredReason(game: SaveGame, clubId: string): FiredReason {
  const managedClub = game.clubs.find(c => c.id === clubId)
  if (managedClub) {
    const finStatus = evaluateFinanceStatus(managedClub.finances)
    if (finStatus.status === 'game-over') return 'bankruptcy'
  }
  if (game.licenseStatus === 'license_denied') return 'licenseDenial'
  if ((game.boardPatience ?? 70) <= 15) return 'boardPatience<=15'
  if ((game.consecutiveFailures ?? 0) >= 3) return 'consecutiveFailures>=3'
  return 'unknown'
}

const SEEDS = 20
const SEASONS = 4

interface RunResult {
  clubId: string
  seed: number
  firedSeason: number | null
  firedReason: FiredReason
  crashed: boolean
  crashMsg: string | null
}

function runOne(clubId: string, seed: number): RunResult {
  let game: SaveGame = createNewGame({ managerName: `H4All-${seed}`, clubId, seed })
  game = { ...game, pendingScreen: null }

  let firedSeason: number | null = null
  let firedReason: FiredReason = null

  try {
    for (let season = 1; season <= SEASONS; season++) {
      let stepSeed = seed * 100_000 + season * 1_000
      let seasonDone = false
      let guardRounds = 0

      while (!seasonDone) {
        guardRounds++
        if (guardRounds > 2000) throw new Error(`season ${season} never ended — round guard tripped`)

        game = autoSelectLineup(game)
        game = autoBuildCheapestAffordableFacility(game)
        const result = advanceToNextEvent(game, stepSeed++)
        game = result.game

        if (result.seasonEnded || game.managerFired) {
          seasonDone = true
        } else {
          const resolved = autoResolvePendingScreen(game)
          if (resolved.unresolvable) throw new Error(`unresolvable pendingScreen: ${resolved.screenType}`)
          game = resolved.game
        }
      }

      if (game.managerFired) {
        firedSeason = season
        firedReason = classifyFiredReason(game, clubId)
        break
      }

      const resolved = autoResolvePendingScreen(game)
      game = resolved.game
    }
  } catch (e) {
    return { clubId, seed, firedSeason, firedReason, crashed: true, crashMsg: e instanceof Error ? e.message : String(e) }
  }

  return { clubId, seed, firedSeason, firedReason, crashed: false, crashMsg: null }
}

function main(): void {
  console.log(`\n=== H4 — avskedsfrekvens, ALLA TOLV klubbar, ${SEASONS} säsonger × ${SEEDS} seeds (2026-08-25) ===\n`)

  for (const template of CLUB_TEMPLATES) {
    const results: RunResult[] = []
    for (let i = 0; i < SEEDS; i++) {
      results.push(runOne(template.id, 90_000 + i))
    }
    const crashed = results.filter(r => r.crashed)
    const valid = results.filter(r => !r.crashed)
    const fired = valid.filter(r => r.firedSeason !== null)
    const pct = valid.length > 0 ? Math.round(fired.length / valid.length * 100) : -1

    const reasonCounts: Record<string, number> = {}
    for (const r of fired) {
      const key = r.firedReason ?? 'okänd'
      reasonCounts[key] = (reasonCounts[key] ?? 0) + 1
    }
    const reasonStr = Object.entries(reasonCounts).map(([k, v]) => `${k}=${v}`).join(', ') || '—'

    const bySeason: Record<number, number> = {}
    for (const r of fired) {
      if (r.firedSeason !== null) bySeason[r.firedSeason] = (bySeason[r.firedSeason] ?? 0) + 1
    }
    const seasonStr = Object.entries(bySeason).sort((a, b) => Number(a[0]) - Number(b[0])).map(([s, n]) => `S${s}=${n}`).join(', ') || '—'

    console.log(`${template.name.padEnd(16)} (${template.id.padEnd(18)}, rep=${String(template.reputation).padStart(3)}, ${template.boardExpectation}): avsked ${fired.length}/${valid.length} (${pct}%)  orsaker: ${reasonStr}  säsong: ${seasonStr}${crashed.length > 0 ? `  KRASCH=${crashed.length}` : ''}`)
    for (const c of crashed) {
      console.log(`    KRASCH seed=${c.seed}: ${c.crashMsg}`)
    }
  }

  console.log('\n=== SLUT ===\n')
}

main()
