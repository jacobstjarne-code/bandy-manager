import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { GameEvent } from '../../../entities/GameEvent'

/**
 * 4.6 (SLUTTEST_KO.md, 2026-08-17) — "rå nyckel captain_rallied_team".
 * Tre storylines i eventResolver.ts satte description till den råa
 * typnyckeln (t.ex. 'captain_rallied_team') istället för en mening.
 * seasonSummaryService.ts:s arcMoments använder .description som
 * body-text i årsboken — den råa nyckeln var alltså synlig för spelaren.
 */
function makeGame() {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

function pendingWith(effect: unknown): GameEvent {
  return {
    id: 'test_rawkey_event',
    type: 'test',
    title: 't', body: 'b',
    choices: [{ id: 'go', label: 'Go', effect: effect as never }],
    resolved: false,
  }
}

describe('storyline.description är aldrig den råa type-nyckeln', () => {
  it("makeFullTimePro-storylinen (went_fulltime_pro) har en riktig mening som description", () => {
    let game = makeGame()
    const target = game.players.find(p => p.clubId === game.managedClubId)!
    game = { ...game, pendingEvents: [pendingWith({ type: 'makeFullTimePro', targetPlayerId: target.id, value: 20000 })] }
    game = resolveEvent(game, 'test_rawkey_event', 'go')

    const storyline = game.storylines?.find(s => s.type === 'went_fulltime_pro')
    expect(storyline).toBeTruthy()
    expect(storyline!.description).not.toBe('went_fulltime_pro')
    expect(storyline!.description.length).toBeGreaterThan('went_fulltime_pro'.length)
  })
})
