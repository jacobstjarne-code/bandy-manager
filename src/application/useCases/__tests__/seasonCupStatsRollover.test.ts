import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { advanceToNextEvent } from '../roundProcessor'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { autoSelectLineup, autoResolvePendingScreen } from '../../../../scripts/stress/fixtures'

/**
 * Grind 0 (SLUTTEST_KO.md, 2026-08-21) — "sanningen", första verkliga fyndet.
 * `player.seasonCupStats` saknade sin nollställning i seasonEndProcessor.ts:s
 * rollover-mappning (seasonStats/liga återställdes, seasonCupStats ärvdes
 * oförändrad via spreaden) — cupstatistik ackumulerade tyst över alla
 * säsonger istället för att nollställas, exakt tvärtom mot vad
 * saveGameMigration.ts:498 redan dokumenterade som avsett beteende.
 * Upptäckt genom en riktig flersäsongskörning (scripts/grind0-truth-sim.ts),
 * inte genom isolerad unit-testning av rollover-funktionen — bekräftar
 * varför Grind 0 uttryckligen kräver en KÖRNING, inte bara ett test av
 * en enskild funktion.
 */
describe('seasonCupStats rollover', () => {
  it('nollställs vid säsongsslut för spelare som spelat cupmatcher, precis som seasonStats', () => {
    let game: SaveGame = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    game = { ...game, pendingScreen: null }

    let stepSeed = 500_000
    let guard = 0
    let seasonEnded = false
    let playedCupBefore: string[] = []

    while (!seasonEnded && guard++ < 200) {
      const beforePlayers = game.players
      game = autoSelectLineup(game)
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game

      if (result.seasonEnded) {
        seasonEnded = true
        // beforePlayers = state right before the rollover-triggering call —
        // capture who had nonzero cup stats going into this call.
        playedCupBefore = beforePlayers.filter(p => (p.seasonCupStats?.gamesPlayed ?? 0) > 0).map(p => p.id)
        break
      }
      const resolved = autoResolvePendingScreen(game)
      if (resolved.unresolvable) throw new Error(`unresolvable pendingScreen: ${resolved.screenType}`)
      game = resolved.game
    }

    expect(seasonEnded, 'säsongen borde ha avslutats inom 200 rundor').toBe(true)
    expect(playedCupBefore.length, 'minst en spelare borde ha spelat en cupmatch under säsong 1 (annars testar detta test ingenting)').toBeGreaterThan(0)

    for (const id of playedCupBefore) {
      const p = game.players.find(pl => pl.id === id)
      expect(p?.seasonCupStats?.gamesPlayed ?? 0, `${id}: seasonCupStats.gamesPlayed ska vara 0 direkt efter rollover`).toBe(0)
      expect(p?.seasonCupStats?.goals ?? 0, `${id}: seasonCupStats.goals ska vara 0 direkt efter rollover`).toBe(0)
    }
  })
})
