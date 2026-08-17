// A5 (LANGSPEL 10 säsonger, 2026-08-17) — regressionstest för
// årsbokens styrelseformulering (SeasonSummaryScreen/seasonSummaryService)
// mot exakt de två rapporterade buggarna:
//   År 7: "2:a plats uppfyller styrelsens krav på att vinna ligan"
//   År 8: "Förstaplatsen överträffade alla förväntningar" (fast WinLeague VAR kravet)
//
// Rotorsak var att seasonSummaryService.ts underhöll en EGEN, oberoende
// met/exceeded-tröskeltabell, skild från den som redan styrde styrelse-
// betyget i inboxen (generateSeasonVerdict i boardService.ts). De två
// tabellerna kunde disagreea — samma mönster som growFanbase-etikett-
// fyndet i SLUTTEST-audition (2026-08-08, §4c): två källor som beskriver
// samma spelkoncept, som drivit isär över tid.
//
// Fixen: EN källa (computeSeasonVerdictRating + expectationVerdictFromRating
// i boardService.ts). Båda testas här dels som rena funktioner (tabelltest,
// alla fyra ClubExpectation-typer × representativa placeringar × mästare-
// status), dels end-to-end genom generateSeasonSummary så att den faktiska
// meningen i narrativeSummary verifieras, inte bara det interna verdict-
// fältet.
//
// OBS boardPatience (seasonEndProcessor.ts) är INTE den andra källan här —
// den är en tredje, oberoende mekanik som bara läser rå tabellplacering
// (topThird/bottomThird) och aldrig club.boardExpectation, så den kan inte
// vara "samma utvärdering" som en per-klubb-formulering om ett specifikt
// styrelsekrav. Den faktiska dubbleringen var mellan boardService.ts
// (styrelsebetyget, redan skickat till spelaren i inboxen) och
// seasonSummaryService.ts (årsbokens narrativ) — se rapport.

import { describe, it, expect } from 'vitest'
import {
  computeSeasonVerdictRating,
  expectationVerdictFromRating,
  generateSeasonVerdict,
} from '../boardService'
import { generateSeasonSummary } from '../seasonSummaryService'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { ClubExpectation } from '../../enums'
import type { SaveGame } from '../../entities/SaveGame'
import type { StandingRow } from '../../entities/Standing'

const TOTAL = 12
const EXPECTATIONS = [
  ClubExpectation.AvoidBottom,
  ClubExpectation.MidTable,
  ClubExpectation.ChallengeTop,
  ClubExpectation.WinLeague,
] as const
const POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

// ── Pure-function table test ────────────────────────────────────────────

describe('computeSeasonVerdictRating × expectationVerdictFromRating (table)', () => {
  for (const expectation of EXPECTATIONS) {
    for (const position of POSITIONS) {
      for (const isChampion of [false, true]) {
        it(`${expectation} pos=${position} champion=${isChampion} — rating and verdict never contradict`, () => {
          const rating = computeSeasonVerdictRating(expectation, position, TOTAL)
          const verdict = expectationVerdictFromRating(expectation, rating, isChampion)

          // Champion always reads as "board is more than pleased", regardless
          // of raw table finish (a playoff title can happen from any
          // qualifying position).
          if (isChampion) {
            expect(verdict).toBe('exceeded')
            return
          }

          // The inbox "Styrelsebetyg" card and the yearbook must be reading
          // literally the same rating number — regression guard against the
          // switch being re-inlined/re-duplicated in generateSeasonVerdict.
          expect(generateSeasonVerdict(expectation, position, TOTAL).rating).toBe(rating)

          // Rating/verdict must never point in opposite directions.
          if (rating === 5) expect(verdict).not.toBe('failed')
          if (rating === 1) expect(verdict).not.toBe('exceeded')

          // WinLeague is the binary case ("vinna ligan" = position 1, not a
          // range). This is the exact bug: position 2 must never read as
          // 'met' or 'exceeded', and position 1 must never read as
          // 'exceeded' (nothing beats table-winning via position alone —
          // only becoming playoff champion, handled by isChampion above).
          if (expectation === ClubExpectation.WinLeague) {
            if (position === 1) {
              expect(verdict).toBe('met')
            } else {
              expect(verdict).toBe('failed')
            }
          }
        })
      }
    }
  }

  // The two originally reported cases, named explicitly so a future
  // regression fails loudly instead of getting lost in the table.
  it('REGRESSION Year 7: WinLeague, 2nd place, no championship — must be failed, not met', () => {
    const rating = computeSeasonVerdictRating(ClubExpectation.WinLeague, 2, TOTAL)
    expect(expectationVerdictFromRating(ClubExpectation.WinLeague, rating, false)).toBe('failed')
  })

  it('REGRESSION Year 8: WinLeague, 1st place, no championship — must be met, not exceeded', () => {
    const rating = computeSeasonVerdictRating(ClubExpectation.WinLeague, 1, TOTAL)
    expect(expectationVerdictFromRating(ClubExpectation.WinLeague, rating, false)).toBe('met')
  })
})

// ── End-to-end: the actual yearbook sentence ────────────────────────────

function makeGameWithResult(
  expectation: ClubExpectation,
  finalPosition: number,
  opts: { isChampion?: boolean } = {},
): SaveGame {
  let game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })

  const managedIdx = game.clubs.findIndex(c => c.id === game.managedClubId)
  const clubs = [...game.clubs]
  clubs[managedIdx] = { ...clubs[managedIdx], boardExpectation: expectation }

  // Build a full standings table with the managed club pinned at
  // finalPosition and every other club filling the remaining slots in a
  // stable, arbitrary order — generateSeasonSummary only reads the managed
  // club's row plus game.clubs.length (for totalTeams).
  const otherClubIds = clubs.map(c => c.id).filter(id => id !== game.managedClubId)
  const standings: StandingRow[] = []
  let otherIdx = 0
  for (let pos = 1; pos <= clubs.length; pos++) {
    const clubId = pos === finalPosition ? game.managedClubId : otherClubIds[otherIdx++]
    standings.push({
      clubId, played: 22, wins: 0, draws: 0, losses: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0,
      points: (clubs.length - pos) * 2, position: pos,
    })
  }

  game = {
    ...game,
    clubs,
    standings,
    playoffBracket: opts.isChampion
      ? { season: game.currentSeason, status: 'complete' as never, quarterFinals: [], semiFinals: [], final: null, champion: game.managedClubId }
      : undefined,
  }
  return game
}

describe('generateSeasonSummary narrative sentence agrees with expectationVerdict', () => {
  function keywordFor(verdict: 'exceeded' | 'met' | 'failed'): string {
    if (verdict === 'exceeded') return 'överträffade'
    if (verdict === 'met') return 'uppfyller'
    return 'besvikelse'
  }
  function forbiddenKeywordsFor(verdict: 'exceeded' | 'met' | 'failed'): string[] {
    const all = ['överträffade', 'uppfyller', 'besvikelse']
    return all.filter(k => k !== keywordFor(verdict))
  }

  for (const expectation of EXPECTATIONS) {
    for (const position of [1, 2, 3, 6, 9, 12]) {
      it(`${expectation} pos=${position} — sentence keyword matches expectationVerdict`, () => {
        const game = makeGameWithResult(expectation, position)
        const summary = generateSeasonSummary(game)

        expect(summary.narrativeSummary).toContain(keywordFor(summary.expectationVerdict))
        for (const forbidden of forbiddenKeywordsFor(summary.expectationVerdict)) {
          expect(summary.narrativeSummary).not.toContain(forbidden)
        }

        // Cross-check against the pure function directly (same inputs the
        // production code actually uses: finalPosition, totalTeams=12,
        // isChampion=false in this batch).
        const rating = computeSeasonVerdictRating(expectation, position, game.clubs.length)
        const expectedVerdict = expectationVerdictFromRating(expectation, rating, false)
        expect(summary.expectationVerdict).toBe(expectedVerdict)
      })
    }
  }

  it('REGRESSION Year 7: WinLeague 2nd place sentence never says "uppfyller"', () => {
    const game = makeGameWithResult(ClubExpectation.WinLeague, 2)
    const summary = generateSeasonSummary(game)
    expect(summary.expectationVerdict).toBe('failed')
    expect(summary.narrativeSummary).not.toContain('uppfyller')
    expect(summary.narrativeSummary).not.toContain('överträffade')
  })

  it('REGRESSION Year 8: WinLeague 1st place (no playoff title) sentence never says "överträffade"', () => {
    const game = makeGameWithResult(ClubExpectation.WinLeague, 1)
    const summary = generateSeasonSummary(game)
    expect(summary.expectationVerdict).toBe('met')
    expect(summary.narrativeSummary).toContain('uppfyller')
    expect(summary.narrativeSummary).not.toContain('överträffade')
  })

  it('playoff champion always reads as exceeded, regardless of table position', () => {
    const game = makeGameWithResult(ClubExpectation.MidTable, 7, { isChampion: true })
    const summary = generateSeasonSummary(game)
    expect(summary.expectationVerdict).toBe('exceeded')
    // The champion branch produces its own "historisk säsong" sentence,
    // not the exceeded/met/failed templates — just confirm the verdict
    // field (used by the badge) agrees, and the narrative says something
    // championship-flavored.
    expect(summary.narrativeSummary).toContain('historisk')
  })
})
