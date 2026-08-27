/**
 * Styrelseobjektiv-tier-domen (2026-08-25): meritbufferten skyddade tidigare
 * INTE alls mot ett upprepat missat objektiv (0% — hela kostnaden gick
 * oskyddad rakt på patiensen). Jacobs korrigering: en upprepning ska
 * fortfarande kosta MER än en färsk miss, men inte förbigå krediten helt —
 * bufferten ska absorbera hälften (REPEATED_FAILURE_BUFFER_PROTECTION i
 * seasonEndProcessor.ts), inte noll.
 *
 * Testet isolerar objektivkostnadens effekt från tabellplaceringens genom
 * att sätta meritBuffer mycket högt (999) — då absorberas HELA den
 * positionsdrivna delen oavsett var klubben faktiskt hamnar, och den enda
 * skillnaden mellan "fresh" och "repeat" som når boardPatience är den
 * oskyddade halvan av objektivkostnaden.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { BoardObjective } from '../../../domain/entities/Community'

function makeBase(): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)!
  return {
    ...game,
    clubs: game.clubs.map(c => c.id === managedClub.id ? { ...c, finances: -200000 } : c),
    boardPatience: 50,
    meritBuffer: 999,
    boardObjectives: [FAILING_BALANCE_BUDGET],
  }
}

const FAILING_BALANCE_BUDGET: BoardObjective = {
  id: 'balanceBudget', type: 'economic',
  label: 'Håll ekonomin i balans', description: 'test',
  ownerId: 'Test Kassör', ownerPersonality: 'ekonom',
  targetValue: 0, currentValue: 0, measureFn: 'balanceBudget',
  status: 'active', assignedSeason: 2025,
  successReward: 'ok', failureConsequence: 'inte ok', carryOver: true,
}

describe('seasonEndProcessor — meritbufferns partiella skydd vid upprepad objektivmiss (2026-08-25)', () => {
  it('en FÄRSK miss (ingen historik) lämnar boardPatience oförändrad när bufferten är gott om plats', () => {
    const game = makeBase()
    game.boardObjectiveHistory = []

    const result = handleSeasonEnd(game, 1)

    expect(result.game.boardPatience).toBe(50)
  })

  it('en UPPREPAD miss (samma objectiveId misslyckades senast också) sänker boardPatience med exakt halva kostnaden — inte hela, inte noll', () => {
    const game = makeBase()
    game.boardObjectiveHistory = [
      { season: 2024, objectiveId: 'balanceBudget', result: 'failed' },
    ]

    const result = handleSeasonEnd(game, 1)

    // cost för 'failed' är -5 (OBJECTIVE_PATIENCE_COST i seasonEndProcessor.ts).
    // REPEATED_FAILURE_BUFFER_PROTECTION = 0.5 → unprotectedObjectiveDelta = -2.5,
    // bufferEligibleObjectiveDelta = -2.5 (fullt absorberad av den 999-stora bufferten,
    // så positionstermen och den skyddade halvan når aldrig patiensen).
    expect(result.game.boardPatience).toBe(47.5)
  })

  it('en upprepad miss kostar MER än en färsk miss, men inte hela kostnaden (regression mot det gamla 0%-skyddet)', () => {
    const freshGame = makeBase()
    freshGame.boardObjectiveHistory = []
    const freshResult = handleSeasonEnd(freshGame, 1)

    const repeatGame = makeBase()
    repeatGame.boardObjectiveHistory = [
      { season: 2024, objectiveId: 'balanceBudget', result: 'failed' },
    ]
    const repeatResult = handleSeasonEnd(repeatGame, 1)

    expect(repeatResult.game.boardPatience).toBeLessThan(freshResult.game.boardPatience!)
    // Gamla beteendet (0% skydd) hade gett 50 - 5 = 45. Nya ska ligga MELLAN
    // det gamla golvet och den färska missens 50 — beviset på att skyddet är
    // partiellt, inte borttaget.
    expect(repeatResult.game.boardPatience).toBeGreaterThan(45)
  })
})
