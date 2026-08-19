/**
 * Grind 1-verifiering (SLUTTEST_KO.md): kan en svår klubb, spelad normalt
 * (bästa tillgängliga elva varje omgång, inga tankade beslut), falla mot
 * avskedströskeln (boardPatience <= 15 eller consecutiveFailures >= 3)
 * inom tre säsonger — och hur ofta?
 *
 * Riktad variant av scripts/stress-test.ts: samma motor (createNewGame,
 * autoSelectLineup, advanceToNextEvent, autoResolvePendingScreen), men
 * clubId låst till de två klubbar U1:s difficulty-modell klassar 'hard'
 * (club_slottsbron rep 48, club_heros rep 45 — se offerSelectionService.ts
 * computeDifficultyScore), seed varierad över N körningar.
 *
 * Kör: node_modules/.bin/vite-node scripts/grind1-boardpatience-sim.ts
 */

import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const HARD_CLUBS = ['club_slottsbron', 'club_heros']
const RUNS_PER_CLUB = 25
const SEASONS = 3

interface RunResult {
  clubId: string
  seed: number
  fired: boolean
  firedSeason: number | null
  firedReason: string | null
  patienceTrajectory: number[]   // boardPatience efter varje avslutad säsong
  positionTrajectory: number[]   // slutplacering per säsong
  failuresTrajectory: number[]   // consecutiveFailures efter varje säsong
  crashed: boolean
  crashMsg: string | null
}

function runOne(clubId: string, seed: number): RunResult {
  let game: SaveGame = createNewGame({ managerName: `Grind1-${seed}`, clubId, seed })
  game = { ...game, pendingScreen: null }

  const patienceTrajectory: number[] = []
  const positionTrajectory: number[] = []
  const failuresTrajectory: number[] = []
  let fired = false
  let firedSeason: number | null = null
  let firedReason: string | null = null

  try {
    for (let season = 1; season <= SEASONS; season++) {
      let stepSeed = seed * 100_000 + season * 1_000
      let seasonDone = false
      let guardRounds = 0

      while (!seasonDone) {
        guardRounds++
        if (guardRounds > 2000) throw new Error(`season ${season} never ended — round guard tripped`)

        game = autoSelectLineup(game)
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

      const standing = (game.standings ?? []).find(s => s.clubId === clubId)
      positionTrajectory.push(standing?.position ?? -1)
      patienceTrajectory.push(game.boardPatience ?? 70)
      failuresTrajectory.push(game.consecutiveFailures ?? 0)

      if (game.managerFired) {
        fired = true
        firedSeason = season
        firedReason = (game.boardPatience ?? 70) <= 15 ? 'boardPatience<=15' : 'consecutiveFailures>=3'
        break
      }

      // Nästa säsong kräver att pendingScreen (board_meeting/pre_season etc)
      // klareras precis som mellan omgångar.
      const resolved = autoResolvePendingScreen(game)
      game = resolved.game
    }
  } catch (e) {
    return {
      clubId, seed, fired, firedSeason, firedReason,
      patienceTrajectory, positionTrajectory, failuresTrajectory,
      crashed: true, crashMsg: e instanceof Error ? e.message : String(e),
    }
  }

  return {
    clubId, seed, fired, firedSeason, firedReason,
    patienceTrajectory, positionTrajectory, failuresTrajectory,
    crashed: false, crashMsg: null,
  }
}

function main(): void {
  const allResults: RunResult[] = []

  for (const clubId of HARD_CLUBS) {
    for (let i = 0; i < RUNS_PER_CLUB; i++) {
      // Seed-rymden separerad per klubb så ingen krock, och skild från
      // stress-test.ts:s egna seed 0..N (annat syfte, andra klubbar).
      const seed = clubId === 'club_slottsbron' ? 10_000 + i : 20_000 + i
      allResults.push(runOne(clubId, seed))
    }
  }

  console.log('\n=== Grind 1 — boardPatience mot avskedströskeln, svåra klubbar, normalt spel ===\n')

  for (const clubId of HARD_CLUBS) {
    const clubResults = allResults.filter(r => r.clubId === clubId)
    const crashed = clubResults.filter(r => r.crashed)
    const valid = clubResults.filter(r => !r.crashed)
    const fired = valid.filter(r => r.fired)

    console.log(`--- ${clubId} (${valid.length} giltiga körningar, ${crashed.length} kraschade) ---`)
    console.log(`Sparkad inom ${SEASONS} säsonger: ${fired.length}/${valid.length} (${((fired.length / Math.max(1, valid.length)) * 100).toFixed(0)}%)`)

    for (const r of fired) {
      console.log(`  seed=${r.seed}: sparkad säsong ${r.firedSeason} (${r.firedReason}) — placeringar ${r.positionTrajectory.join(',')} — patience ${r.patienceTrajectory.join(',')}`)
    }

    const minPatienceSeen = Math.min(...valid.flatMap(r => r.patienceTrajectory))
    const patienceAtS3 = valid.filter(r => r.patienceTrajectory.length >= 3).map(r => r.patienceTrajectory[2])
    console.log(`Lägsta boardPatience observerad (någon säsong): ${minPatienceSeen}`)
    if (patienceAtS3.length > 0) {
      const avg3 = patienceAtS3.reduce((a, b) => a + b, 0) / patienceAtS3.length
      console.log(`Snitt boardPatience efter säsong 3 (ej sparkade räknas också): ${avg3.toFixed(1)}`)
    }

    for (const r of crashed) {
      console.log(`  KRASCH seed=${r.seed}: ${r.crashMsg}`)
    }
    console.log()
  }

  const totalFired = allResults.filter(r => !r.crashed && r.fired).length
  const totalValid = allResults.filter(r => !r.crashed).length
  console.log(`=== TOTALT: ${totalFired}/${totalValid} svåra klubbar sparkade inom ${SEASONS} säsonger vid normalt spel ===\n`)
}

main()
