import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { advanceToNextEvent } from '../roundProcessor'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { BOARD_SEASON_ACKNOWLEDGMENT_PLACEHOLDER } from '../../../domain/services/boardService'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { autoSelectLineup, autoResolvePendingScreen } from '../../../../scripts/stress/fixtures'

/**
 * Förutsättningsfasen, steg 1 (Jacobs dom 2026-08-25). Bekräftar att
 * seasonEndProcessor.ts faktiskt fyller game.boardAssessment för hanterad
 * klubb efter en riktig, full säsong — samma grind0-disciplin som
 * seasonCupStatsRollover.test.ts (en KÖRNING, inte bara ett unit-test av
 * den isolerade deriveBoardAssessment-funktionen).
 */
describe('game.boardAssessment fylls efter säsongsslut', () => {
  it('bär previousExpectation/newExpectation/direction/seasonAcknowledgment efter en spelad säsong', () => {
    const managedClubId = CLUB_TEMPLATES[0].id
    let game: SaveGame = createNewGame({ managerName: 'Test', clubId: managedClubId, seed: 3 })
    game = { ...game, pendingScreen: null }

    let stepSeed = 700_000
    let guard = 0
    let seasonEnded = false

    while (!seasonEnded && guard++ < 200) {
      game = autoSelectLineup(game)
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game

      if (result.seasonEnded) {
        seasonEnded = true
        break
      }
      const resolved = autoResolvePendingScreen(game)
      if (resolved.unresolvable) throw new Error(`unresolvable pendingScreen: ${resolved.screenType}`)
      game = resolved.game
    }

    expect(seasonEnded, 'säsongen borde ha avslutats inom 200 rundor').toBe(true)
    expect(game.boardAssessment, 'boardAssessment ska vara satt efter säsongsslut').toBeDefined()
    expect(['raised', 'lowered', 'unchanged']).toContain(game.boardAssessment!.direction)
    expect(game.boardAssessment!.seasonAcknowledgment).toBe(BOARD_SEASON_ACKNOWLEDGMENT_PLACEHOLDER)
    if (game.boardAssessment!.direction === 'unchanged') {
      expect(game.boardAssessment!.reasonLine).toBeUndefined()
    } else {
      expect(game.boardAssessment!.reasonLine).toBeTruthy()
    }
  }, 60000)
})
