import { describe, expect, it } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'

/**
 * liggare-ny-board-verdict (docs/rapport/RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md §3):
 * styrelsens säsongsdom skrivs nu som en board_verdict-post vid varje
 * säsongsslut, med samma sanning som den frusna SeasonSummary.boardTruth —
 * en kanon, inte en parallell.
 */
describe('handleSeasonEnd — board_verdict-post', () => {
  it('skriver en board_verdict-post vars fält matchar samma säsongs frusna boardTruth', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, season: 2025, seed: 1 })
    const result = handleSeasonEnd(game, 1).game

    const entry = result.eventLedger?.find(e => e.type === 'board_verdict' && e.season === game.currentSeason)
    expect(entry).toBeDefined()
    expect(entry?.clubId).toBe(game.managedClubId)
    expect(entry?.subject).toEqual({ kind: 'club', id: game.managedClubId })

    const frozenTruth = result.seasonSummaries?.find(s => s.season === game.currentSeason)?.boardTruth
    expect(frozenTruth).toBeDefined()
    expect(entry?.boardVerdict?.verdict).toBe(frozenTruth?.outcome.verdict)
    expect(entry?.boardVerdict?.patienceBand).toBe(frozenTruth?.relationship.zone)
  })

  it('objectiveStatus är "met" när det inte finns några boardObjectives (inget att missa)', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, season: 2025, seed: 1 })
    const result = handleSeasonEnd({ ...game, boardObjectives: [] }, 1).game
    const entry = result.eventLedger?.find(e => e.type === 'board_verdict' && e.season === game.currentSeason)
    expect(entry?.boardVerdict?.objectiveStatus).toBe('met')
  })

  it('significance höjs till 60 bara när både denna OCH förra säsongens verdict var "failed"', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, season: 2025, seed: 1 })
    const priorFailed = {
      type: 'board_verdict' as const,
      semanticKey: `board_verdict_${game.managedClubId}_s2024`,
      season: 2024, matchday: 22, clubId: game.managedClubId,
      subject: { kind: 'club' as const, id: game.managedClubId },
      significance: 45,
      boardVerdict: { verdict: 'failed' as const, objectiveStatus: 'failed' as const, patienceBand: 'ultimatum' as const },
    }
    const withPriorFailure = handleSeasonEnd({ ...game, eventLedger: [priorFailed] }, 1).game
    const entryWithHistory = withPriorFailure.eventLedger?.find(e => e.type === 'board_verdict' && e.season === game.currentSeason)
    // Significance är 60 bara OM denna säsongs verdict också landade på 'failed' — annars 45 trots historiken.
    const expectedSignificance = entryWithHistory?.boardVerdict?.verdict === 'failed' ? 60 : 45
    expect(entryWithHistory?.significance).toBe(expectedSignificance)

    const withoutHistory = handleSeasonEnd(game, 1).game
    const entryWithoutHistory = withoutHistory.eventLedger?.find(e => e.type === 'board_verdict' && e.season === game.currentSeason)
    expect(entryWithoutHistory?.significance).toBe(45)
  })
})
