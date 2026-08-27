/**
 * Jacobs order (2026-08-26): "Rapportera vad bestFinish faktiskt mäter innan
 * något ändras" — Heros (kanoniskt sämst i ligan, W012) visade bestFinish
 * 1-4 redan säsong 1 i era-diagnosen. Misstanke, kodläst: `updateTrainerArc`
 * (trainerArcService.ts:35, `pos = standing?.position`) körs VARJE OMGÅNG
 * (roundProcessor.ts:888), inte bara vid säsongsslut — så `bestFinish`
 * fångar den BÄSTA LIVE-placeringen NÅGONSIN, inklusive tidiga omgångar
 * (1-3 spelade matcher) när tabellen är brusig och nästan olikvärdig från
 * ren tur. Verifierar genom att logga position VARJE omgång för en Heros-
 * säsong, inte bara slutresultatet.
 *
 * Kör: node_modules/.bin/vite-node scripts/heros-bestfinish-diagnos-2026-08-26.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen, autoBuildCheapestAffordableFacility } from './stress/fixtures'

const CLUB_ID = 'club_heros'
const SEED = 90_000

function main(): void {
  let game = createNewGame({ managerName: 'HerosBestFinish', clubId: CLUB_ID, seed: SEED })
  game = { ...game, pendingScreen: null }
  let stepSeed = SEED * 100_000 + 1_000

  console.log(`\n=== Heros bestFinish, omgång för omgång, säsong 1 (seed=${SEED}) ===\n`)

  let lastBestFinish = 12
  let guardRounds = 0
  let seasonDone = false
  while (!seasonDone) {
    guardRounds++
    if (guardRounds > 200) { console.log('guard tripped'); break }

    game = autoSelectLineup(game)
    game = autoBuildCheapestAffordableFacility(game)
    const result = advanceToNextEvent(game, stepSeed++)
    game = result.game

    const standing = game.standings.find(s => s.clubId === CLUB_ID)
    const bestFinish = game.trainerArc?.bestFinish ?? -1
    const played = standing?.played ?? -1
    if (bestFinish !== lastBestFinish) {
      console.log(`  omgång, spelade=${played}: position=${standing?.position}, poäng=${standing?.points}, bestFinish ${lastBestFinish} → ${bestFinish} ${bestFinish <= 6 ? '**** FOTFÄSTE-TRÖSKELN NÅDD ****' : ''}`)
      lastBestFinish = bestFinish
    }

    if (result.seasonEnded || game.managerFired) seasonDone = true
    else {
      const resolved = autoResolvePendingScreen(game)
      if (resolved.unresolvable) { console.log(`unresolvable: ${resolved.screenType}`); break }
      game = resolved.game
    }
  }

  const finalStanding = game.standings.find(s => s.clubId === CLUB_ID)
  console.log(`\nSlutresultat säsong 1: position=${finalStanding?.position}, poäng=${finalStanding?.points}, spelade=${finalStanding?.played}`)
  console.log(`Slutgiltig bestFinish: ${game.trainerArc?.bestFinish}`)
  console.log('\n=== SLUT ===\n')
}

main()
