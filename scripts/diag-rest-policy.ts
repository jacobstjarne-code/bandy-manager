/**
 * diag-rest-policy.ts — KÖRORDER 2026-09-18 §3, uppföljning.
 *
 * VARFÖR: §3-svepet visade att Lätt och Recovery inte vinner i något
 * sammanhang (−10 moral, ~0 poäng), vilket bryter §0:s andra grindregel. Men
 * svepet håller ETT läge konstant hela säsongen på en frisk trupp, och vila är
 * per definition ett SVARSLÄGE på en sliten trupp. Det är samma felanvändning
 * Fable redan konstaterat för periodiseringen ("ett konstant svep mäter fel
 * sak för en spak som är schemalagd per design").
 *
 * Jacobs beslut 2026-09-18: mät villkorat, och använd den tröskel spelaren
 * FAKTISKT ser — inte en teoretisk. Den enda yta där spelet självt märker en
 * spelare som sliten är laguttagningen (LineupStep: `Sliten`-taggen vid
 * fitness < FATIGUE_AVAILABILITY_FLOOR), så det är triggern här.
 *
 * Jämför tre policyer över samma seeds:
 *   normal      — konstant Normal (baslinjen)
 *   light       — konstant Lätt (det svepet redan mätt)
 *   conditional — Lätt när minst en i startelvan ligger under golvet, annars Normal
 *
 * Kör: node_modules/.bin/vite-node scripts/diag-rest-policy.ts [seeds] [seasons]
 */
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import {
  createHeadlessGame, autoSelectLineup, autoResolvePendingScreen,
  autoResolvePendingEvents, autoBuildCheapestAffordableFacility,
} from './stress/fixtures'
import { TrainingType, TrainingIntensity } from '../src/domain/enums'
import { FATIGUE_AVAILABILITY_FLOOR } from '../src/domain/services/squadEvaluator'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const seedCount = Number(process.argv[2] ?? 24)
const seasons = Number(process.argv[3] ?? 2)

type Policy = 'normal' | 'light' | 'conditional'
const NORMAL = { type: TrainingType.Physical, intensity: TrainingIntensity.Normal }
const LIGHT = { type: TrainingType.Physical, intensity: TrainingIntensity.Light }

interface Row { points: number; gd: number; morale: number; injuries: number; lightRounds: number; rounds: number; fired: boolean }

function run(seed: number, policy: Policy): Row[] {
  let game: SaveGame = createHeadlessGame(seed)
  const out: Row[] = []
  let step = seed * 100_000 + 7000

  for (let season = 1; season <= seasons; season++) {
    let moraleSum = 0, moraleN = 0, injuries = 0, lightRounds = 0, rounds = 0
    let injured = new Set<string>()
    let done = false
    // Ställningen nollställs vid säsongsrullningen — håll sista sedda tabell.
    let lastStandings = game.standings ?? []
    let lightThisRound = false

    for (let guard = 0; guard < 200 && !done; guard++) {
      game = autoSelectLineup(game)

      let focus = NORMAL
      if (policy === 'light') focus = LIGHT
      else if (policy === 'conditional') {
        const ids = game.managedClubPendingLineup?.startingPlayerIds ?? []
        const tired = ids
          .map(id => game.players.find(p => p.id === id))
          .filter(p => p !== undefined && p.fitness < FATIGUE_AVAILABILITY_FLOOR)
        if (tired.length > 0) focus = LIGHT
      }
      lightThisRound = focus === LIGHT
      game = { ...game, managedClubTraining: focus }

      game = autoBuildCheapestAffordableFacility(game)
      game = autoResolvePendingEvents(game, Math.random)
      const r = advanceToNextEvent(game, step++)
      game = r.game

      if (r.roundPlayed !== null) {
        rounds++
        if (lightThisRound) lightRounds++
        if (game.standings?.length) lastStandings = game.standings
        const mine = game.players.filter(p => p.clubId === game.managedClubId)
        moraleSum += mine.reduce((a, p) => a + p.morale, 0); moraleN += mine.length
        const now = new Set(mine.filter(p => p.isInjured).map(p => p.id))
        for (const id of now) if (!injured.has(id)) injuries++
        injured = now
      }
      if (r.seasonEnded || game.managerFired) done = true
      game = autoResolvePendingScreen(game).game
    }

    const row = lastStandings.find(s => s.clubId === game.managedClubId)
    out.push({
      points: row?.points ?? 0,
      gd: row?.goalDifference ?? 0,
      morale: moraleN ? moraleSum / moraleN : 0,
      injuries, lightRounds, rounds,
      fired: !!game.managerFired,
    })
    if (game.managerFired) break
  }
  return out
}

const results: Record<Policy, Row[]> = { normal: [], light: [], conditional: [] }
for (let seed = 0; seed < seedCount; seed++) {
  for (const p of ['normal', 'light', 'conditional'] as Policy[]) results[p].push(...run(seed, p))
}

const mean = (a: number[]) => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0
const base = results.normal

console.log(`\n=== VILOPOLICY (§3, uppföljning) — ${seedCount} seeds × ${seasons} säsonger ===`)
console.log(`trigger: minst en i startelvan under FATIGUE_AVAILABILITY_FLOOR (${FATIGUE_AVAILABILITY_FLOOR})\n`)
console.log('policy        poäng    Δmot normal   målsk.   moral   skador   lätta omgångar')
for (const p of ['normal', 'light', 'conditional'] as Policy[]) {
  const r = results[p]
  const dP = mean(r.map(x => x.points)) - mean(base.map(x => x.points))
  const lightShare = mean(r.map(x => x.rounds ? x.lightRounds / x.rounds * 100 : 0))
  console.log(
    `${p.padEnd(12)} ${mean(r.map(x => x.points)).toFixed(1).padStart(5)}   ` +
    `${((dP >= 0 ? '+' : '') + dP.toFixed(2)).padStart(8)}      ` +
    `${mean(r.map(x => x.gd)).toFixed(1).padStart(5)}   ` +
    `${mean(r.map(x => x.morale)).toFixed(1).padStart(5)}   ` +
    `${mean(r.map(x => x.injuries)).toFixed(1).padStart(5)}    ${lightShare.toFixed(0)} %`,
  )
}
console.log('')
