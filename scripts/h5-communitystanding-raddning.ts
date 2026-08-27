/**
 * H5 — testar Jacobs kausala kedja direkt (2026-08-25, RAPPORT_MATCHINTAKT_
 * VIKT_OCH_COMMUNITYSTANDING_2026-08-25.md): "en klubb som sköter orten
 * överlever, en som ignorerar den går under." Standardstresskriptet
 * (h4-alla-tolv-avskedsfrekvens.ts) rör aldrig communityStanding — den
 * ligger kvar på default 50 genom en hel AI-spelad karriär, vilket aldrig
 * kan bevisa den kausala kedjan. Detta skriptet TVINGAR communityStanding
 * till ett fast värde (hög/låg) vid varje säsongsövergång och mäter
 * licensnekan-driven avskedsfrekvens för de fyra klubbar vars ekonomi
 * redan visat sig skör (rep <55 — RAPPORT_LICENSNEKAN_MEKANIK_OCH_
 * RADDNINGSBARHET_2026-08-25.md).
 *
 * Kör: node_modules/.bin/vite-node scripts/h5-communitystanding-raddning.ts
 */

import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen, autoBuildCheapestAffordableFacility } from './stress/fixtures'
import { evaluateFinanceStatus } from '../src/domain/services/economyService'
import type { SaveGame } from '../src/domain/entities/SaveGame'

type FiredReason = 'boardPatience<=15' | 'consecutiveFailures>=3' | 'bankruptcy' | 'licenseDenial' | 'unknown' | null

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

function runOne(clubId: string, seed: number, communityStanding: number): RunResult {
  let game: SaveGame = createNewGame({ managerName: `H5-${seed}`, clubId, seed })
  game = { ...game, pendingScreen: null, communityStanding }

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
        game = { ...game, communityStanding }  // pinnad — kontrollerat experiment
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

      game = { ...game, communityStanding }

      if (game.managerFired) {
        firedSeason = season
        firedReason = classifyFiredReason(game, clubId)
        break
      }

      const resolved = autoResolvePendingScreen(game)
      game = { ...resolved.game, communityStanding }
    }
  } catch (e) {
    return { clubId, seed, firedSeason, firedReason, crashed: true, crashMsg: e instanceof Error ? e.message : String(e) }
  }

  return { clubId, seed, firedSeason, firedReason, crashed: false, crashMsg: null }
}

function main(): void {
  const FRAGILE_CLUBS = ['club_heros', 'club_rogle', 'club_slottsbron', 'club_skutskar']
  const SCENARIOS: Array<{ label: string; standing: number }> = [
    { label: 'LÅG (15) — ignorerar orten', standing: 15 },
    { label: 'HÖG (90) — sköter orten', standing: 90 },
  ]

  console.log(`\n=== H5 — communityStanding som räddningsspak, fyra sköra klubbar, ${SEASONS} säsonger × ${SEEDS} seeds (2026-08-25) ===\n`)

  for (const clubId of FRAGILE_CLUBS) {
    console.log(`--- ${clubId} ---`)
    for (const scenario of SCENARIOS) {
      const results: RunResult[] = []
      for (let i = 0; i < SEEDS; i++) {
        results.push(runOne(clubId, 90_000 + i, scenario.standing))
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

      console.log(`  ${scenario.label.padEnd(28)}: avsked ${fired.length}/${valid.length} (${pct}%)  orsaker: ${reasonStr}${crashed.length > 0 ? `  KRASCH=${crashed.length}` : ''}`)
      for (const c of crashed) {
        console.log(`      KRASCH seed=${c.seed}: ${c.crashMsg}`)
      }
    }
  }

  console.log('\n=== SLUT ===\n')
}

main()
