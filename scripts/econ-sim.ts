/**
 * Ekonomi- och bygdens-puls-simulering.
 *
 * Kör med:
 *   node_modules/.bin/vite-node scripts/econ-sim.ts [--seeds=5] [--seasons=3]
 *
 * Mäter per säsong och seed:
 * - Startkapital (omgång 1)
 * - Slutkapital (säsongsslut)
 * - Max/min kapital under säsongen
 * - Andel omgångar med negativt netto
 * - Bygdens puls start, slut, volatilitet, takeffekt (>=95), bottennos (<=20)
 */

import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { FixtureStatus } from '../src/domain/enums'
import { createHeadlessGame, autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import type { SaveGame } from '../src/domain/entities/SaveGame'

function parseArgs(): { seeds: number; seasons: number } {
  const args = process.argv.slice(2)
  let seeds = 5
  let seasons = 3
  for (const arg of args) {
    if (arg.startsWith('--seeds='))   seeds   = parseInt(arg.split('=')[1], 10)
    if (arg.startsWith('--seasons=')) seasons = parseInt(arg.split('=')[1], 10)
  }
  return { seeds, seasons }
}

function getManagedFinances(game: SaveGame): number {
  return game.clubs.find(c => c.id === game.managedClubId)?.finances ?? 0
}

function stdev(arr: number[]): number {
  if (arr.length < 2) return 0
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length)
}

interface RoundSnapshot {
  round: number
  finances: number
  netThisRound: number
  communityStanding: number
}

interface SeasonResult {
  seed: number
  season: number
  clubName: string
  rep: number
  startFinances: number
  endFinances: number
  maxFinances: number
  minFinances: number
  netSeason: number
  roundsNegativeNet: number
  totalRounds: number
  pulseStart: number
  pulseEnd: number
  pulseMax: number
  pulseMin: number
  pulseCeilRounds: number   // >= 95
  pulseFloorRounds: number  // <= 20
  pulseStdev: number
}

async function main(): Promise<void> {
  const { seeds, seasons } = parseArgs()
  console.log(`\nEkonomi-sim: ${seeds} seeds × ${seasons} säsonger\n`)

  const allResults: SeasonResult[] = []

  for (let seedIdx = 0; seedIdx < seeds; seedIdx++) {
    let game: SaveGame
    try {
      game = createHeadlessGame(seedIdx)
    } catch (e) {
      console.error(`Seed ${seedIdx}: createGame failed: ${e}`)
      continue
    }

    const clubName = game.clubs.find(c => c.id === game.managedClubId)?.name ?? '?'
    const rep = game.clubs.find(c => c.id === game.managedClubId)?.reputation ?? 0
    console.log(`Seed ${seedIdx + 1}: ${clubName} (rep=${rep})`)

    for (let season = 1; season <= seasons; season++) {
      const snapshots: RoundSnapshot[] = []
      let seasonDone = false
      let stepSeed = seedIdx * 100_000 + season * 1_000
      let prevFinances = getManagedFinances(game)
      const seasonStartFinances = prevFinances
      const pulseAtStart = game.communityStanding ?? 50

      let previouslyCompletedIds = new Set<string>(
        game.fixtures.filter(f => f.status === FixtureStatus.Completed).map(f => f.id)
      )

      while (!seasonDone) {
        game = autoSelectLineup(game)
        const screenResult = autoResolvePendingScreen(game)
        game = screenResult.game

        let roundPlayed: number | null = null
        try {
          const result = advanceToNextEvent(game, stepSeed++)
          game = result.game
          roundPlayed = result.roundPlayed

          const curFinances = getManagedFinances(game)
          const netThisRound = curFinances - prevFinances
          prevFinances = curFinances

          if (roundPlayed !== null) {
            snapshots.push({
              round: roundPlayed,
              finances: curFinances,
              netThisRound,
              communityStanding: game.communityStanding ?? 50,
            })
          }

          if (result.seasonEnded || result.game.managerFired) {
            seasonDone = true
          }
        } catch (_e) {
          seasonDone = true
          break
        }
      }

      if (snapshots.length === 0) continue

      const financesArr = snapshots.map(s => s.finances)
      const pulseArr = snapshots.map(s => s.communityStanding)
      const netArr = snapshots.map(s => s.netThisRound)
      const endFinances = financesArr[financesArr.length - 1]
      const pulseEnd = pulseArr[pulseArr.length - 1]

      const result: SeasonResult = {
        seed: seedIdx + 1,
        season,
        clubName,
        rep,
        startFinances: seasonStartFinances,
        endFinances,
        maxFinances: Math.max(...financesArr),
        minFinances: Math.min(...financesArr),
        netSeason: endFinances - seasonStartFinances,
        roundsNegativeNet: netArr.filter(n => n < 0).length,
        totalRounds: snapshots.length,
        pulseStart: pulseAtStart,
        pulseEnd,
        pulseMax: Math.max(...pulseArr),
        pulseMin: Math.min(...pulseArr),
        pulseCeilRounds: pulseArr.filter(p => p >= 95).length,
        pulseFloorRounds: pulseArr.filter(p => p <= 20).length,
        pulseStdev: Math.round(stdev(pulseArr) * 10) / 10,
      }
      allResults.push(result)
    }
  }

  // ── Print results ─────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(110))
  console.log('EKONOMI per säsong')
  console.log('═'.repeat(110))
  console.log(
    'Seed  Ssg  Klubb                     Rep  StartKr      SlutKr       Netto        Max          Min          Neg/tot'
  )
  console.log('─'.repeat(110))

  for (const r of allResults) {
    const fmt = (n: number) => n.toLocaleString('sv-SE').padStart(12)
    const negFrac = `${r.roundsNegativeNet}/${r.totalRounds}`.padStart(7)
    console.log(
      `${String(r.seed).padStart(4)}  ` +
      `${String(r.season).padStart(3)}  ` +
      `${r.clubName.slice(0, 24).padEnd(24)}  ` +
      `${String(r.rep).padStart(3)}` +
      fmt(r.startFinances) +
      fmt(r.endFinances) +
      fmt(r.netSeason) +
      fmt(r.maxFinances) +
      fmt(r.minFinances) +
      `  ${negFrac}`
    )
  }

  console.log('\n' + '═'.repeat(110))
  console.log('BYGDENS PULS per säsong')
  console.log('═'.repeat(110))
  console.log(
    'Seed  Ssg  Klubb                     Rep  PulsStart  PulsSlut  PulsMax  PulsMin  >=95rnd  <=20rnd  Stdev'
  )
  console.log('─'.repeat(110))

  for (const r of allResults) {
    console.log(
      `${String(r.seed).padStart(4)}  ` +
      `${String(r.season).padStart(3)}  ` +
      `${r.clubName.slice(0, 24).padEnd(24)}  ` +
      `${String(r.rep).padStart(3)}` +
      `${String(r.pulseStart).padStart(10)}` +
      `${String(r.pulseEnd).padStart(9)}` +
      `${String(r.pulseMax).padStart(9)}` +
      `${String(r.pulseMin).padStart(9)}` +
      `${String(r.pulseCeilRounds).padStart(9)}` +
      `${String(r.pulseFloorRounds).padStart(9)}` +
      `${String(r.pulseStdev).padStart(7)}`
    )
  }

  // ── Aggregated summary ────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log('AGGREGAT (alla säsonger, alla seeds)')
  console.log('─'.repeat(60))

  const avgNet = allResults.reduce((s, r) => s + r.netSeason, 0) / allResults.length
  const avgEndFunds = allResults.reduce((s, r) => s + r.endFinances, 0) / allResults.length
  const negRoundsTotal = allResults.reduce((s, r) => s + r.roundsNegativeNet, 0)
  const totalRoundsAll = allResults.reduce((s, r) => s + r.totalRounds, 0)
  const avgPulseEnd = allResults.reduce((s, r) => s + r.pulseEnd, 0) / allResults.length
  const pulseAt100 = allResults.filter(r => r.pulseEnd >= 95).length
  const pulseAtFloor = allResults.filter(r => r.pulseMin <= 20).length

  console.log(`Snitt netto/säsong:       ${Math.round(avgNet).toLocaleString('sv-SE')} kr`)
  console.log(`Snitt slutkapital:        ${Math.round(avgEndFunds).toLocaleString('sv-SE')} kr`)
  console.log(`Neg-netto-omgångar:       ${negRoundsTotal}/${totalRoundsAll} (${Math.round(negRoundsTotal/totalRoundsAll*100)}%)`)
  console.log(`Snitt puls säsongsslut:   ${avgPulseEnd.toFixed(1)}`)
  console.log(`Säsonger med puls>=95:    ${pulseAt100}/${allResults.length} (${Math.round(pulseAt100/allResults.length*100)}%)`)
  console.log(`Säsonger med puls<=20:    ${pulseAtFloor}/${allResults.length}`)
}

main().catch(e => { console.error(e); process.exit(1) })
