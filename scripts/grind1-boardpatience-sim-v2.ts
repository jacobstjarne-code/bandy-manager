/**
 * Grind 1-verifiering v2 (U1 andra halvan, Jacobs dom 2026-08-22, efter
 * Skutskär-auditen mot 52009671): avskedsfrekvens för Skutskär (den
 * faktiska playtest-klubben, AvoidBottom, rykte 52) och Heros (det kända
 * överdrivna-avsked-fallet, rykte 45) med de nya boardPatience-vikterna —
 * löpande omgångsterm + förlustsvit + fyra objektivtillstånd + kontinuerlig,
 * förväntans-medveten säsongsslutterm (boardService.ts).
 *
 * Fixar en verklig klassificeringsbugg i v1 (grind1-boardpatience-sim.ts):
 * firedReason hade ENDAST två grenar (boardPatience<=15 / consecutiveFailures>=3)
 * — en tredje, HELT OBEROENDE avskedsväg (postRoundFlagsProcessor.ts:s
 * per-omgångs konkurskoll, finances < -2 000 000, körs VARJE omgång, hela
 * säsongen) maskerades tyst som "consecutiveFailures>=3". Se rapport:
 * docs/GRIND1_BOARDPATIENCE_OCH_BATCHSTACK_ANALYS_2026-08-21.md.
 *
 * Kör: node_modules/.bin/vite-node scripts/grind1-boardpatience-sim-v2.ts
 */

import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { evaluateFinanceStatus } from '../src/domain/services/economyService'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const CLUBS = ['club_skutskar', 'club_heros'] as const
const RUNS_PER_CLUB = 100
const SEASONS = 3

type FiredReason = 'boardPatience<=15' | 'consecutiveFailures>=3' | 'bankruptcy' | 'licenseDenial' | null

interface RunResult {
  clubId: string
  seed: number
  fired: boolean
  firedSeason: number | null
  firedReason: FiredReason
  patienceTrajectory: number[]     // boardPatience efter varje avslutad säsong
  positionTrajectory: number[]     // slutplacering per säsong
  failuresTrajectory: number[]     // consecutiveFailures efter varje säsong
  financesTrajectory: number[]     // finances efter varje avslutad säsong
  maxLosingStreakSeen: number[]    // högsta consecutiveLosses nått, per säsong
  crashed: boolean
  crashMsg: string | null
}

function classifyFiredReason(game: SaveGame): FiredReason {
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (managedClub) {
    const finStatus = evaluateFinanceStatus(managedClub.finances)
    if (finStatus.status === 'game-over') return 'bankruptcy'
  }
  if ((game.boardPatience ?? 70) <= 15) return 'boardPatience<=15'
  if ((game.consecutiveFailures ?? 0) >= 3) return 'consecutiveFailures>=3'
  // Fired via seasonEndProcessor.ts:957 (checkLicenseStatus, 4 säsonger
  // negativt nettoresultat) eller ett tillstånd de tre kända grenarna
  // inte täcker — flaggat separat istf att gissa fel klass.
  return 'licenseDenial'
}

function runOne(clubId: string, seed: number): RunResult {
  let game: SaveGame = createNewGame({ managerName: `Grind1v2-${seed}`, clubId, seed })
  game = { ...game, pendingScreen: null }

  const patienceTrajectory: number[] = []
  const positionTrajectory: number[] = []
  const failuresTrajectory: number[] = []
  const financesTrajectory: number[] = []
  const maxLosingStreakSeen: number[] = []
  let fired = false
  let firedSeason: number | null = null
  let firedReason: FiredReason = null

  try {
    for (let season = 1; season <= SEASONS; season++) {
      let stepSeed = seed * 100_000 + season * 1_000
      let seasonDone = false
      let guardRounds = 0
      let seasonMaxStreak = 0

      while (!seasonDone) {
        guardRounds++
        if (guardRounds > 2000) throw new Error(`season ${season} never ended — round guard tripped`)

        game = autoSelectLineup(game)
        const result = advanceToNextEvent(game, stepSeed++)
        game = result.game
        seasonMaxStreak = Math.max(seasonMaxStreak, game.trainerArc?.consecutiveLosses ?? 0)

        if (result.seasonEnded || game.managerFired) {
          seasonDone = true
        } else {
          const resolved = autoResolvePendingScreen(game)
          if (resolved.unresolvable) throw new Error(`unresolvable pendingScreen: ${resolved.screenType}`)
          game = resolved.game
        }
      }

      const standing = (game.standings ?? []).find(s => s.clubId === clubId)
      const managedClub = game.clubs.find(c => c.id === clubId)
      positionTrajectory.push(standing?.position ?? -1)
      patienceTrajectory.push(game.boardPatience ?? 70)
      failuresTrajectory.push(game.consecutiveFailures ?? 0)
      financesTrajectory.push(managedClub?.finances ?? 0)
      maxLosingStreakSeen.push(seasonMaxStreak)

      if (game.managerFired) {
        fired = true
        firedSeason = season
        firedReason = classifyFiredReason(game)
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
      patienceTrajectory, positionTrajectory, failuresTrajectory, financesTrajectory, maxLosingStreakSeen,
      crashed: true, crashMsg: e instanceof Error ? e.message : String(e),
    }
  }

  return {
    clubId, seed, fired, firedSeason, firedReason,
    patienceTrajectory, positionTrajectory, failuresTrajectory, financesTrajectory, maxLosingStreakSeen,
    crashed: false, crashMsg: null,
  }
}

function main(): void {
  const allResults: RunResult[] = []

  for (const clubId of CLUBS) {
    for (let i = 0; i < RUNS_PER_CLUB; i++) {
      // Seed-rymden separerad per klubb, skild från v1:s 10_000/20_000-rymd
      // och stress-test.ts:s egen 0..N.
      const seed = clubId === 'club_skutskar' ? 30_000 + i : 40_000 + i
      allResults.push(runOne(clubId, seed))
    }
  }

  console.log('\n=== Grind 1 v2 — boardPatience mot avskedströskeln, U1 andra halvan (Jacobs dom 2026-08-22) ===\n')
  console.log(`${RUNS_PER_CLUB} seedade körningar × ${SEASONS} säsonger = ${RUNS_PER_CLUB * SEASONS} säsongs-sampel per klubb.\n`)

  for (const clubId of CLUBS) {
    const clubResults = allResults.filter(r => r.clubId === clubId)
    const crashed = clubResults.filter(r => r.crashed)
    const valid = clubResults.filter(r => !r.crashed)
    const fired = valid.filter(r => r.fired)

    console.log(`--- ${clubId} (${valid.length} giltiga körningar, ${crashed.length} kraschade) ---`)
    console.log(`Sparkad inom ${SEASONS} säsonger: ${fired.length}/${valid.length} (${((fired.length / Math.max(1, valid.length)) * 100).toFixed(1)}%)`)

    // Fördelning av avskedsorsak — INTE bara boardPatience/consecutiveFailures.
    const reasonCounts: Record<string, number> = {}
    for (const r of fired) {
      const reason = r.firedReason ?? 'okänd'
      reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1
    }
    console.log('Avskedsorsak-fördelning:', JSON.stringify(reasonCounts))

    // Fördelning av vilken SÄSONG avskedet skedde
    const seasonCounts: Record<number, number> = {}
    for (const r of fired) {
      if (r.firedSeason != null) seasonCounts[r.firedSeason] = (seasonCounts[r.firedSeason] ?? 0) + 1
    }
    console.log('Avsked per säsong:', JSON.stringify(seasonCounts))

    const minPatienceSeen = Math.min(...valid.flatMap(r => r.patienceTrajectory))
    const maxPatienceSeen = Math.max(...valid.flatMap(r => r.patienceTrajectory))
    const allPatience = valid.flatMap(r => r.patienceTrajectory)
    const avgPatience = allPatience.reduce((a, b) => a + b, 0) / allPatience.length
    console.log(`boardPatience: min=${minPatienceSeen.toFixed(1)} max=${maxPatienceSeen.toFixed(1)} snitt=${avgPatience.toFixed(1)} (över alla säsongs-sampel)`)

    // Histogram i band om 10, så "icke-noll men rimlig" går att se som en
    // spridning, inte en punktskattning.
    const bands = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    const hist: number[] = new Array(bands.length - 1).fill(0)
    for (const p of allPatience) {
      for (let b = 0; b < bands.length - 1; b++) {
        if (p >= bands[b] && p < bands[b + 1]) { hist[b]++; break }
        if (b === bands.length - 2 && p === 100) hist[b]++
      }
    }
    console.log('Patience-histogram (band om 10):', bands.slice(0, -1).map((b, i) => `${b}-${b + 9}:${hist[i]}`).join(' '))

    const finances = valid.flatMap(r => r.financesTrajectory)
    console.log(`Klubbkassa: min=${Math.min(...finances).toFixed(0)} snitt=${(finances.reduce((a, b) => a + b, 0) / finances.length).toFixed(0)}`)

    for (const r of fired) {
      console.log(`  seed=${r.seed}: sparkad säsong ${r.firedSeason} (${r.firedReason}) — placeringar ${r.positionTrajectory.join(',')} — patience ${r.patienceTrajectory.map(p => p.toFixed(1)).join(',')} — max förlustsvit/säsong ${r.maxLosingStreakSeen.join(',')} — kassa ${r.financesTrajectory.map(f => Math.round(f)).join(',')}`)
    }

    for (const r of crashed) {
      console.log(`  KRASCH seed=${r.seed}: ${r.crashMsg}`)
    }
    console.log()
  }

  const totalFired = allResults.filter(r => !r.crashed && r.fired).length
  const totalValid = allResults.filter(r => !r.crashed).length
  console.log(`=== TOTALT: ${totalFired}/${totalValid} sparkade inom ${SEASONS} säsonger vid normalt spel ===\n`)
}

main()
