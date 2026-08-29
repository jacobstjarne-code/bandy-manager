/**
 * A-H4 (TRIAGE_AUDIT_2026-08-29.md, HIGH 4): wiring-test för
 * SeasonSummary.boardTruth. Verifierar att seasonEndProcessor.ts fryser
 * EXAKT samma boardPatience/consecutiveFailures/managerFired-värden i
 * boardTruth som den skriver till game.boardPatience/consecutiveFailures/
 * managerFired för nästa säsong — de kan inte drifta isär eftersom
 * buildSeasonBoardTruth (boardService.ts) anropas med samma variabler,
 * inte en omräkning. Detta är den strukturella garantin auditen efterlyste:
 * "årsboken och Game Over ska aldrig kunna säga emot varandra om samma
 * säsong" — bevisat här genom att jämföra boardTruth mot de fält som
 * FAKTISKT sparas till nästa säsongs game-state, inte mot en förnyad
 * beräkning.
 *
 * Fixture-mönstret (createNewGame + boardPatience-override) är samma som
 * surviveTierFiringExemption.test.ts använder.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'
import { computeSeasonVerdictRating } from '../../../domain/services/boardService'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { ClubExpectation } from '../../../domain/enums'

function makeBase(expectation: ClubExpectation, boardPatience: number): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 7 })
  return {
    ...game,
    clubs: game.clubs.map(c => c.id === game.managedClubId ? { ...c, boardExpectation: expectation } : c),
    seasonStartBoardExpectation: expectation,
    boardPatience,
  }
}

describe('SeasonSummary.boardTruth — fryst i samma svep som game.boardPatience/managerFired, aldrig omderiverad', () => {
  it('AvoidBottom, djupt negativ boardPatience → managerFired i game OCH i boardTruth, med SAMMA patience/failures-värden', () => {
    const game = makeBase(ClubExpectation.AvoidBottom, -500)
    const result = handleSeasonEnd(game, 1)
    const summary = result.game.seasonSummaries!.at(-1)!

    expect(result.game.managerFired).toBe(true)
    expect(summary.boardTruth).toBeDefined()
    // Den frysta relationen ska vara EXAKT samma tal som det som faktiskt
    // sparas till nästa säsongs game-state — inte en ny, oberoende
    // uträkning som råkar stämma.
    expect(summary.boardTruth!.relationship.boardPatienceAfter).toBe(result.game.boardPatience)
    expect(summary.boardTruth!.relationship.consecutiveFailuresAfter).toBe(result.game.consecutiveFailures)
    expect(summary.boardTruth!.relationship.managerFired).toBe(true)
    expect(summary.boardTruth!.relationship.firedReason).toBeDefined()
  })

  it('Survive, djupt negativ boardPatience → INTE sparkad (avskedsundantag), boardTruth speglar det korrekt', () => {
    const game = makeBase(ClubExpectation.Survive, -500)
    const result = handleSeasonEnd(game, 1)
    const summary = result.game.seasonSummaries!.at(-1)!

    expect(result.game.managerFired).not.toBe(true)
    expect(summary.boardTruth!.relationship.managerFired).toBe(false)
    expect(summary.boardTruth!.relationship.firedReason).toBeUndefined()
    // Relationen (zon) kan fortfarande vara sur även utan avsked — de två
    // är inte samma fråga.
    expect(summary.boardTruth!.relationship.boardPatienceAfter).toBe(result.game.boardPatience)
  })

  it('boardTruth.outcome speglar EXAKT samma dom som årsbokens egna expectationVerdict/finalPosition-fält — ingen andra källa', () => {
    const game = makeBase(ClubExpectation.MidTable, 70)
    const result = handleSeasonEnd(game, 3)
    const summary = result.game.seasonSummaries!.at(-1)!
    const totalTeams = result.game.clubs.length

    expect(summary.boardTruth!.outcome.finalPosition).toBe(summary.finalPosition)
    expect(summary.boardTruth!.outcome.verdict).toBe(summary.expectationVerdict)
    expect(summary.boardTruth!.outcome.rating).toBe(
      computeSeasonVerdictRating(summary.boardExpectation, summary.finalPosition, totalTeams)
    )
  })
})
