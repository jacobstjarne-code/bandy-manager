/**
 * Jacobs fynd (2026-08-26, mecenatrundan punkt 4): patronens
 * `newClubEra !== 'survival'`-villkor (roundProcessor.ts:1356) kan stänga
 * ute Heros permanent — "motsäger hela Survive-premissen" om Heros
 * strukturellt aldrig lämnar 'survival'-eran. Mäter, gissar inte: kör Heros
 * genom samma 20 seeds × 4 säsonger som h4-alla-tolv-avskedsfrekvens.ts
 * (identisk harness), loggar calculateClubEra() + bestFinish + cs vid VARJE
 * säsongsslut.
 *
 * Kör: node_modules/.bin/vite-node scripts/heros-era-diagnos-2026-08-26.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen, autoBuildCheapestAffordableFacility } from './stress/fixtures'
import { calculateClubEra } from '../src/domain/services/clubEraService'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const CLUB_ID = 'club_heros'
const SEEDS = 20
const SEASONS = 4

interface SeasonSnapshot {
  season: number
  era: string
  bestFinish: number
  seasonCount: number
  cs: number
}

function runOne(seed: number): { seed: number; snapshots: SeasonSnapshot[]; crashed: boolean; crashMsg: string | null; fired: boolean } {
  let game: SaveGame = createNewGame({ managerName: `HerosEra-${seed}`, clubId: CLUB_ID, seed })
  game = { ...game, pendingScreen: null }
  const snapshots: SeasonSnapshot[] = []

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

      snapshots.push({
        season,
        era: calculateClubEra(game),
        bestFinish: game.trainerArc?.bestFinish ?? -1,
        seasonCount: game.trainerArc?.seasonCount ?? -1,
        cs: game.communityStanding ?? -1,
      })

      if (game.managerFired) {
        return { seed, snapshots, crashed: false, crashMsg: null, fired: true }
      }

      const resolved = autoResolvePendingScreen(game)
      game = resolved.game
    }
  } catch (e) {
    return { seed, snapshots, crashed: true, crashMsg: e instanceof Error ? e.message : String(e), fired: false }
  }
  return { seed, snapshots, crashed: false, crashMsg: null, fired: false }
}

function main(): void {
  console.log(`\n=== Heros era-diagnos, ${SEEDS} seeds × ${SEASONS} säsonger (2026-08-26) ===\n`)
  let everLeftSurvival = 0
  let neverLeftSurvival = 0
  for (let i = 0; i < SEEDS; i++) {
    const { seed, snapshots, crashed, crashMsg, fired } = runOne(90_000 + i)
    if (crashed) { console.log(`seed=${seed}: KRASCH — ${crashMsg}`); continue }
    const leftSurvival = snapshots.some(s => s.era !== 'survival')
    if (leftSurvival) everLeftSurvival++
    else neverLeftSurvival++
    console.log(`seed=${seed}${fired ? ' (SPARKAD)' : ''}: ${snapshots.map(s => `S${s.season}[era=${s.era},bestFinish=${s.bestFinish},cs=${s.cs}]`).join(' ')}`)
  }
  console.log(`\n=== Lämnade 'survival' minst en säsong: ${everLeftSurvival}/${SEEDS} · Aldrig: ${neverLeftSurvival}/${SEEDS} ===\n`)
}

main()
