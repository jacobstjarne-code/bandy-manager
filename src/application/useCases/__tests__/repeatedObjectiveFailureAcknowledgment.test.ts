/**
 * sluttest-objektivminne-text (TEXT LÅST 2026-09-03, Opus): mekaniken har
 * spårat upprepade missade objektiv sedan styrelseobjektiv-tier-domen
 * (2026-08-25, se meritBufferPartialProtection.test.ts), men ingen text
 * erkände temat för spelaren förrän nu. Styrelsens säsongsreplik
 * (boardAssessment.seasonAcknowledgment) ska bära meningen ordagrant när
 * NÅGOT objektiv denna säsong var en upprepad miss — annars stå oförändrad.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { BoardObjective } from '../../../domain/entities/Community'

const REPEAT_TEXT = 'Styrelsen minns. Samma mål missades förra säsongen också, och ordföranden behövde inte slå upp det.'

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

describe('seasonEndProcessor — styrelsen erkänner ett upprepat missat objektiv', () => {
  it('en UPPREPAD miss lägger till minnesmeningen i seasonAcknowledgment', () => {
    const game = makeBase()
    game.boardObjectiveHistory = [
      { season: 2024, objectiveId: 'balanceBudget', result: 'failed' },
    ]

    const result = handleSeasonEnd(game, 1)

    expect(result.game.boardAssessment?.seasonAcknowledgment).toContain(REPEAT_TEXT)
  })

  it('en FÄRSK miss (ingen historik) lämnar seasonAcknowledgment oförändrad', () => {
    const game = makeBase()
    game.boardObjectiveHistory = []

    const result = handleSeasonEnd(game, 1)

    expect(result.game.boardAssessment?.seasonAcknowledgment).not.toContain(REPEAT_TEXT)
  })

  it('ett MÖTT objektiv (aldrig missat) lämnar seasonAcknowledgment oförändrad även med gammal misslyckande-historik för ETT ANNAT objektiv-id', () => {
    const game = makeBase()
    game.boardObjectives = [{ ...FAILING_BALANCE_BUDGET, targetValue: 0, currentValue: 0, measureFn: 'balanceBudget' }]
    // Historik för ett annat objektiv-id ska inte trigga meningen för balanceBudget.
    game.boardObjectiveHistory = [
      { season: 2024, objectiveId: 'someOtherObjective', result: 'failed' },
    ]
    game.clubs = game.clubs.map(c => c.id === game.managedClubId ? { ...c, finances: 500000 } : c)

    const result = handleSeasonEnd(game, 1)

    expect(result.game.boardAssessment?.seasonAcknowledgment).not.toContain(REPEAT_TEXT)
  })
})
