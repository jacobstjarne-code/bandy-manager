/**
 * PÅSTÅENDEKARTAN (2026-08-24), Jacobs prioritet 5 — BoardMeetingScenens
 * hela ton (A/B/C) läste tidigare fulfillmentPct (förra säsongens
 * boardObjectives-måluppfyllelse), en FJÄRDE oberoende formel för styrelsens
 * nöjdhet efter sex kalibreringspass på att ena de tre andra
 * (evaluateBoard, getBoardPatienceZone, growFanbase-fyndet). Nu kopplad till
 * boardPatience via getBoardPatienceZone, samma 50-tröskel som redan är
 * kalibrerad på andra ställen.
 */
import { describe, it, expect } from 'vitest'
import { resolveBoardMeetingState } from '../boardMeetingStateResolver'
import { createNewGame } from '../../useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import type { SaveGame } from '../../../domain/entities/SaveGame'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  return { ...game, ...overrides }
}

describe('resolveBoardMeetingState — kopplad till boardPatience (PÅSTÅENDEKARTAN)', () => {
  it('säsong 2 (första mötet): alltid A, oavsett boardPatience', () => {
    const game = makeGame({ seasonSummaries: [{ season: 1 } as never], boardPatience: 10 })
    expect(resolveBoardMeetingState(game).state).toBe('A')
  })

  it('säsong 3+, boardPatience >= 50 (stabilt): B, trots att fulfillmentPct skulle sagt C (0%, allt misslyckat)', () => {
    const game = makeGame({
      seasonSummaries: [{ season: 1 } as never, { season: 2 } as never],
      currentSeason: 3,
      boardPatience: 70,
      boardObjectiveHistory: [
        { season: 2, objectiveId: 'o1', result: 'failed', ownerReaction: 'x' },
        { season: 2, objectiveId: 'o2', result: 'failed', ownerReaction: 'y' },
      ],
    })
    const data = resolveBoardMeetingState(game)
    expect(data.fulfillmentPct).toBe(0)
    expect(data.state).toBe('B')
  })

  it('säsong 3+, boardPatience < 50 (under press/ultimatum): C, trots att fulfillmentPct skulle sagt B (100%, allt uppfyllt)', () => {
    const game = makeGame({
      seasonSummaries: [{ season: 1 } as never, { season: 2 } as never],
      currentSeason: 3,
      boardPatience: 20,
      boardObjectiveHistory: [
        { season: 2, objectiveId: 'o1', result: 'met', ownerReaction: 'x' },
        { season: 2, objectiveId: 'o2', result: 'met', ownerReaction: 'y' },
      ],
    })
    const data = resolveBoardMeetingState(game)
    expect(data.fulfillmentPct).toBe(100)
    expect(data.state).toBe('C')
  })

  it('säsong 3+, ingen historik för förra säsongen: faller tillbaka på A (fulfillmentPct === -1)', () => {
    const game = makeGame({
      seasonSummaries: [{ season: 1 } as never, { season: 2 } as never],
      currentSeason: 3,
      boardPatience: 70,
      boardObjectiveHistory: [],
    })
    const data = resolveBoardMeetingState(game)
    expect(data.fulfillmentPct).toBe(-1)
    expect(data.state).toBe('A')
  })
})
