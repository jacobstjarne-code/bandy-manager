/**
 * sluttest-grind1-heros-ekonomi — mät-gejtat (GO 2026-09-08, Jacob): efter att
 * mecenat/patron blivit säsongsseedade (876ed4dd, DOM_MECENAT_PATRON_
 * MODELLFORM_2026-09-08.md), mät Heros ekonomi specifikt på upgraded+VIP-
 * tiern igen — den cs-skalade patronen/mecenaten kan lyfta klubben över
 * den tidigare uppmätta −3299/säsong (RAPPORT_ASKADAREKONOMIN_HEROS_HOGCS_
 * OCH_BYGGKORT_2026-08-27.md, "Kandidat 2 SHIPPAD").
 *
 * Skillnad mot de gamla askadarekonomin-*-skripten: de körde en FRISTÅENDE
 * återimplementerad kiosk/VIP-formel offline mot uppmätt attendance. Detta
 * skriptet kör den RIKTIGA produktionsvägen (roundProcessor/economyService,
 * inklusive den nya mecenat/patron-modellen) och läser club.finances direkt
 * — det mäter vad som FAKTISKT skulle hända för en spelare, inte en isolerad
 * kioskformel.
 *
 * Kör: node_modules/.bin/vite-node scripts/heros-ekonomi-2026-09-09.ts [seeds] [seasons]
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const SEEDS = Number(process.argv[2] ?? 10)
const SEASONS = Number(process.argv[3] ?? 3)
const HEROS_ID = 'club_heros'

interface SeasonSnapshot {
  season: number
  finances: number
  crashed: boolean
  managerFired: boolean
}

function forceKioskTier(game: SaveGame, tier: 'none' | 'upgraded'): SaveGame {
  return {
    ...game,
    communityActivities: {
      ...(game.communityActivities ?? { kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false }),
      kiosk: tier,
      vipTent: tier === 'upgraded',
    },
  }
}

/** Kör N säsonger med EN kiosktier hela vägen, samma seed. Returnerar finances vid varje säsongsslut. */
function runSeasons(seed: number, seasons: number, tier: 'none' | 'upgraded'): SeasonSnapshot[] {
  let game: SaveGame = createNewGame({ managerName: `Heros-Ekonomi-${seed}-${tier}`, clubId: HEROS_ID, seed })
  game = { ...game, pendingScreen: null }
  game = forceKioskTier(game, tier)

  const snapshots: SeasonSnapshot[] = []
  let stepSeed = seed * 100_000 + 1_000

  for (let season = 1; season <= seasons; season++) {
    let crashed = false
    let managerFired = false

    try {
      let seasonDone = false
      let guardRounds = 0
      while (!seasonDone) {
        guardRounds++
        if (guardRounds > 2000) throw new Error('season never ended — round guard tripped')

        game = autoSelectLineup(game)
        game = forceKioskTier(game, tier) // håll tiern fast hela säsongen — auto-build/annat får inte rucka på den
        const result = advanceToNextEvent(game, stepSeed++)
        game = result.game

        if (game.managerFired) { managerFired = true; seasonDone = true }
        else if (result.seasonEnded) { seasonDone = true }
        else {
          const resolved = autoResolvePendingScreen(game)
          if (resolved.unresolvable) throw new Error(`unresolvable pendingScreen: ${resolved.screenType}`)
          game = resolved.game
        }
      }
    } catch (e) {
      crashed = true
      console.error(`seed=${seed} tier=${tier} säsong=${season}: crash — ${e instanceof Error ? e.message : e}`)
    }

    const club = game.clubs.find(c => c.id === HEROS_ID)
    snapshots.push({ season, finances: club?.finances ?? 0, crashed, managerFired })
    if (crashed || managerFired) break
  }

  return snapshots
}

function main(): void {
  console.log(`\n=== Heros: marginalvärdet av upgraded+VIP-kiosk, EFTER mecenat/patron-ombygget (876ed4dd) ===`)
  console.log(`Metod: samma seed körs två gånger (kiosk 'none' vs 'upgraded'+VIP), skillnaden i finances-utveckling ISOLERAR kioskbeslutets bidrag — samma metod-mål som RAPPORT_ASKADAREKONOMIN_HEROS_HOGCS_OCH_BYGGKORT_2026-08-27.md, men mot den RIKTIGA produktionsvägen (roundProcessor/economyService/mecenat/patron), inte en offline-återimplementerad formel.`)
  console.log(`Seeds: ${SEEDS}, säsonger/seed: ${SEASONS}\n`)

  const deltasBySeason: number[][] = Array.from({ length: SEASONS }, () => [])

  for (let s = 0; s < SEEDS; s++) {
    const seed = 1_000_000 + s * 7919
    const noneRun = runSeasons(seed, SEASONS, 'none')
    const upgradedRun = runSeasons(seed, SEASONS, 'upgraded')

    const n = Math.min(noneRun.length, upgradedRun.length)
    for (let i = 0; i < n; i++) {
      const a = noneRun[i]
      const b = upgradedRun[i]
      if (a.crashed || b.crashed) continue
      const delta = b.finances - a.finances
      deltasBySeason[i].push(delta)
      console.log(`  seed=${seed} säsong=${a.season}: none=${a.finances} upgraded+VIP=${b.finances}  Δ=${delta >= 0 ? '+' : ''}${delta}`)
    }
  }

  console.log(`\n=== SAMMANFATTNING (marginalvärdet av upgraded+VIP-kiosk, per säsong) ===`)
  let allDeltas: number[] = []
  deltasBySeason.forEach((deltas, i) => {
    if (deltas.length === 0) return
    const avg = deltas.reduce((s, d) => s + d, 0) / deltas.length
    const positive = deltas.filter(d => d >= 0).length
    console.log(`Säsong ${i + 1}: snitt Δ=${avg >= 0 ? '+' : ''}${avg.toFixed(0)} kr  (${positive}/${deltas.length} positiva)`)
    allDeltas = allDeltas.concat(deltas)
  })
  const overallAvg = allDeltas.length > 0 ? allDeltas.reduce((s, d) => s + d, 0) / allDeltas.length : NaN
  console.log(`\nSamtliga säsonger, snitt Δ: ${overallAvg >= 0 ? '+' : ''}${overallAvg.toFixed(0)} kr (n=${allDeltas.length})`)
  console.log(`Jämförelse: RAPPORT_ASKADAREKONOMIN_HEROS_HOGCS_OCH_BYGGKORT_2026-08-27.md mätte −3299 kr/säsong (isolerad kioskformel, EN säsong, FÖRE mecenat/patron-ombygget).`)
  console.log('=== SLUT ===\n')
}

main()
