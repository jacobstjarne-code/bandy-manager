/**
 * M8 (oberoende speltest- och produktaudit, 5c9a7a8, 2026-08-24):
 * "Historik visar migrerade, semantiskt falska narrativ som sanning.
 * Exempel: 2:a plats sägs uppfylla krav att vinna serien; 1:a plats sägs
 * överträffa krav att vinna."
 *
 * Roten (bekräftad via git-arkeologi, commit 6f1d36a1, 2026-08-17, "A5"):
 * seasonSummaryService.ts hade tidigare en EGEN tröskeltabell för
 * WinLeague — möt-tröskel=2 (2:a plats "möter" kravet att vinna ligan) och
 * överträffa-tröskel=1 (1:a plats läses som "överträffar" kravet, fast 1:a
 * plats ÄR exakt det som begärdes). A5 enade detta med boardService.ts:s
 * computeSeasonVerdictRating/expectationVerdictFromRating — men bara för
 * NYA säsonger. En SeasonSummary skapad FÖRE 6f1d36a1 behöll den gamla,
 * bevisligen felaktiga domen frusen i expectationVerdict och i
 * narrativeSummary-textens första mening för alltid, utan denna migrering.
 */
import { describe, it, expect } from 'vitest'
import { migrateSaveGame } from '../saveGameMigration'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { ClubExpectation } from '../../../domain/enums'

function makeLegacySaveWithSummary(overrides: Record<string, unknown>) {
  const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
  const raw = JSON.parse(JSON.stringify(game)) as Record<string, unknown>
  raw.seasonSummaries = [{
    id: 'legacy_s1',
    season: 1,
    clubId: game.managedClubId,
    clubName: 'Testklubben',
    boardExpectation: ClubExpectation.WinLeague,
    finalPosition: 2,
    playoffResult: null,
    narrativeSummary: 'En solid säsong för Testklubben. 2:a plats uppfyller styrelsens krav på att vinna ligan.',
    expectationVerdict: 'met',       // den gamla, bevisligen felaktiga domen för en 2:a plats
    metExpectation: true,
    ...overrides,
  }]
  return raw
}

describe('migrateSaveGame — M8: rättar en frusen felaktig dom från före A5 (6f1d36a1)', () => {
  it('2:a plats med WinLeague-förväntan: gamla domen "met" rättas till "failed", legacy-flagga sätts', () => {
    const raw = makeLegacySaveWithSummary({})
    const migrated = migrateSaveGame(raw)
    const summary = migrated.seasonSummaries.find(s => s.id === 'legacy_s1')!

    expect(summary.expectationVerdict).toBe('failed')
    expect(summary.metExpectation).toBe(false)
    expect(summary.legacyVerdictWasCorrected).toBe(true)
    expect(summary.verdictSentence).toContain('besvikelse')
    // Den arkiverade originaltexten rörs ALDRIG — HistoryScreen.tsx visar
    // båda, rättelsen bredvid originalet, aldrig genom att skriva över det.
    expect(summary.narrativeSummary).toBe('En solid säsong för Testklubben. 2:a plats uppfyller styrelsens krav på att vinna ligan.')
  })

  it('1:a plats (icke-mästare, t.ex. utslagen tidigt i slutspel) med WinLeague-förväntan: gamla domen "exceeded" rättas till "met"', () => {
    const raw = makeLegacySaveWithSummary({
      finalPosition: 1,
      expectationVerdict: 'exceeded',  // gamla buggen: 1:a plats lästes som "överträffade"
      narrativeSummary: 'Testklubben överträffade alla förväntningar och slutade på 1:a plats.',
    })
    const migrated = migrateSaveGame(raw)
    const summary = migrated.seasonSummaries.find(s => s.id === 'legacy_s1')!

    expect(summary.expectationVerdict).toBe('met')
    expect(summary.legacyVerdictWasCorrected).toBe(true)
    expect(summary.verdictSentence).toContain('uppfyller')
  })

  it('en redan KORREKT dom (t.ex. genererad efter A5) rörs inte — ingen legacy-flagga, ingen verdictSentence tillagd', () => {
    const raw = makeLegacySaveWithSummary({
      finalPosition: 1,
      expectationVerdict: 'met',   // redan rätt för 1:a plats + WinLeague
      metExpectation: true,
    })
    const migrated = migrateSaveGame(raw)
    const summary = migrated.seasonSummaries.find(s => s.id === 'legacy_s1')!

    expect(summary.legacyVerdictWasCorrected).toBeUndefined()
    expect(summary.verdictSentence).toBeUndefined()
    expect(summary.expectationVerdict).toBe('met')
  })

  it('en mästarsäsong (isChampion) rörs inte ens om den gamla domen råkar avvika, eftersom champion alltid ger "exceeded"', () => {
    const raw = makeLegacySaveWithSummary({
      finalPosition: 1,
      playoffResult: 'champion',
      expectationVerdict: 'exceeded',
    })
    const migrated = migrateSaveGame(raw)
    const summary = migrated.seasonSummaries.find(s => s.id === 'legacy_s1')!
    expect(summary.legacyVerdictWasCorrected).toBeUndefined()
  })
})
