/**
 * PÅSTÅENDEKARTAN, LÄST-FÖRE-INITIERING (2026-08-26, Jacobs dom): "Före
 * första matchen är ställningen inte okänd — den är obefintlig, och det är
 * två olika saker." Låst text: "Serien har inte börjat." — ingen position,
 * ingen antydan om läge.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { getSituation } from '../situationService'

describe('getSituation — seriepremiär (noll spelade matcher)', () => {
  it('visar den låsta texten, ingen position/poäng nämnd', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const situation = getSituation(game)
    expect(situation.body).toBe('Serien har inte börjat.')
    expect(situation.body).not.toMatch(/plats|poäng|position/i)
  })
})
