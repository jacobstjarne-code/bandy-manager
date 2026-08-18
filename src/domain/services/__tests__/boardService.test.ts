import { describe, it, expect } from 'vitest'
import { evaluateBoard, generateBoardMessage, generateSeasonVerdict, seasonReputationDelta, computeBoardPatienceUpdate } from '../boardService'
import { ClubExpectation } from '../../enums'
import type { StandingRow } from '../../entities/SaveGame'

function makeStanding(position: number): StandingRow {
  return { clubId: 'c1', played: 10, wins: 5, draws: 1, losses: 4, goalsFor: 20, goalsAgainst: 18, goalDifference: 2, points: 16, position }
}

const TOTAL = 12
const TOTAL_ROUNDS = 22

describe('evaluateBoard', () => {
  describe('WinLeague', () => {
    it('delighted at top 2', () => {
      expect(evaluateBoard(ClubExpectation.WinLeague, makeStanding(1), TOTAL, 14, TOTAL_ROUNDS).satisfaction).toBe('delighted')
      expect(evaluateBoard(ClubExpectation.WinLeague, makeStanding(2), TOTAL, 14, TOTAL_ROUNDS).satisfaction).toBe('delighted')
    })
    it('satisfied at position 3-4 late season', () => {
      expect(evaluateBoard(ClubExpectation.WinLeague, makeStanding(4), TOTAL, 20, TOTAL_ROUNDS).satisfaction).toBe('satisfied')
    })
    it('concerned at 5-6 late season', () => {
      expect(evaluateBoard(ClubExpectation.WinLeague, makeStanding(6), TOTAL, 20, TOTAL_ROUNDS).satisfaction).toBe('concerned')
    })
    it('unhappy deep in table late season', () => {
      expect(evaluateBoard(ClubExpectation.WinLeague, makeStanding(9), TOTAL, 20, TOTAL_ROUNDS).satisfaction).toBe('unhappy')
    })
    it('more lenient early season', () => {
      // Position 6 early should not be unhappy yet
      const early = evaluateBoard(ClubExpectation.WinLeague, makeStanding(6), TOTAL, 5, TOTAL_ROUNDS).satisfaction
      expect(early).not.toBe('unhappy')
    })
  })

  describe('ChallengeTop', () => {
    it('delighted top 3', () => {
      expect(evaluateBoard(ClubExpectation.ChallengeTop, makeStanding(3), TOTAL, 14, TOTAL_ROUNDS).satisfaction).toBe('delighted')
    })
    it('satisfied at 4-6', () => {
      expect(evaluateBoard(ClubExpectation.ChallengeTop, makeStanding(5), TOTAL, 14, TOTAL_ROUNDS).satisfaction).toBe('satisfied')
    })
    it('unhappy at bottom late season', () => {
      expect(evaluateBoard(ClubExpectation.ChallengeTop, makeStanding(11), TOTAL, 20, TOTAL_ROUNDS).satisfaction).toBe('unhappy')
    })
  })

  describe('MidTable', () => {
    it('delighted in mid range 4-8', () => {
      expect(evaluateBoard(ClubExpectation.MidTable, makeStanding(6), TOTAL, 14, TOTAL_ROUNDS).satisfaction).toBe('delighted')
    })
    it('satisfied slightly outside mid range', () => {
      expect(evaluateBoard(ClubExpectation.MidTable, makeStanding(9), TOTAL, 14, TOTAL_ROUNDS).satisfaction).toBe('satisfied')
    })
  })

  describe('AvoidBottom', () => {
    it('delighted well clear of bottom', () => {
      expect(evaluateBoard(ClubExpectation.AvoidBottom, makeStanding(5), TOTAL, 14, TOTAL_ROUNDS).satisfaction).toBe('delighted')
    })
    it('unhappy at very bottom late season', () => {
      expect(evaluateBoard(ClubExpectation.AvoidBottom, makeStanding(12), TOTAL, 20, TOTAL_ROUNDS).satisfaction).toBe('unhappy')
    })
    // U1 (SLUTTEST_KO.md, 2026-08-17): RELEGATION_ZONE_SIZE=2 — plats 11 (näst
    // sist av 12) ska läsa som 'unhappy', inte bara 'concerned'. Tidigare var
    // bara den absolut sista platsen 'unhappy', vilket var kärnan i U1-fyndet
    // (en klubb kunde ligga näst sist utan att styrelsen brydde sig).
    it('näst sist (i den faktiska nedflyttningszonen) är också unhappy, inte bara concerned', () => {
      expect(evaluateBoard(ClubExpectation.AvoidBottom, makeStanding(11), TOTAL, 20, TOTAL_ROUNDS).satisfaction).toBe('unhappy')
    })
  })
})

describe('generateBoardMessage', () => {
  const satisfactions = ['delighted', 'satisfied', 'concerned', 'unhappy'] as const
  for (const s of satisfactions) {
    it(`returns non-empty title+body for ${s}`, () => {
      const { title, body } = generateBoardMessage({ satisfaction: s, message: '' }, 'Test BK', 14)
      expect(title.length).toBeGreaterThan(0)
      expect(body.length).toBeGreaterThan(0)
    })
  }
})

describe('generateSeasonVerdict', () => {
  it('rating 5 for WinLeague champion', () => {
    expect(generateSeasonVerdict(ClubExpectation.WinLeague, 1, TOTAL).rating).toBe(5)
  })
  it('rating 1 for WinLeague finishing last', () => {
    expect(generateSeasonVerdict(ClubExpectation.WinLeague, TOTAL, TOTAL).rating).toBe(1)
  })
  it('rating 4 for ChallengeTop at position 3', () => {
    expect(generateSeasonVerdict(ClubExpectation.ChallengeTop, 3, TOTAL).rating).toBe(4)
  })
  it('rating 1 for AvoidBottom finishing last', () => {
    expect(generateSeasonVerdict(ClubExpectation.AvoidBottom, TOTAL, TOTAL).rating).toBe(1)
  })
  it('all verdicts have non-empty title and body', () => {
    for (let pos = 1; pos <= TOTAL; pos++) {
      const v = generateSeasonVerdict(ClubExpectation.MidTable, pos, TOTAL)
      expect(v.title.length).toBeGreaterThan(0)
      expect(v.body.length).toBeGreaterThan(0)
      expect([1, 2, 3, 4, 5]).toContain(v.rating)
    }
  })
})

describe('computeBoardPatienceUpdate — U1 (SLUTTEST_KO.md, 2026-08-17)', () => {
  const TOTAL = 12  // RELEGATION_ZONE_SIZE=2 → zon = plats 11-12, varningszon = plats 9-10

  it('nedflyttningszonen (plats 11-12): -20 patience, failures+1', () => {
    expect(computeBoardPatienceUpdate(11, TOTAL, 70, 0)).toEqual({ newBoardPatience: 50, newConsecutiveFailures: 1 })
    expect(computeBoardPatienceUpdate(12, TOTAL, 70, 2)).toEqual({ newBoardPatience: 50, newConsecutiveFailures: 3 })
  })

  it('varningszonen (plats 9-10): -5 patience, failures nollställs — INTE den gamla botten-tre-gissningen som gav noll effekt här', () => {
    expect(computeBoardPatienceUpdate(9, TOTAL, 70, 2)).toEqual({ newBoardPatience: 65, newConsecutiveFailures: 0 })
    expect(computeBoardPatienceUpdate(10, TOTAL, 70, 2)).toEqual({ newBoardPatience: 65, newConsecutiveFailures: 0 })
  })

  it('mid-table (plats 5-8): ingen patience-förändring, failures nollställs', () => {
    expect(computeBoardPatienceUpdate(6, TOTAL, 70, 3)).toEqual({ newBoardPatience: 70, newConsecutiveFailures: 0 })
  })

  it('topp (plats 1-2): +20 patience', () => {
    expect(computeBoardPatienceUpdate(1, TOTAL, 70, 0).newBoardPatience).toBe(90)
  })

  it('topp tre (men inte topp två): +15 patience', () => {
    expect(computeBoardPatienceUpdate(3, TOTAL, 70, 0).newBoardPatience).toBe(85)
  })

  it('patience clampas till [0, 100]', () => {
    expect(computeBoardPatienceUpdate(1, TOTAL, 95, 0).newBoardPatience).toBe(100)
    expect(computeBoardPatienceUpdate(12, TOTAL, 10, 0).newBoardPatience).toBe(0)
  })
})

describe('seasonReputationDelta — U6 (SLUTTEST_KO.md, 2026-08-17) / D028', () => {
  it('exakt formeln från D028', () => {
    expect(seasonReputationDelta(1)).toBe(-6)
    expect(seasonReputationDelta(2)).toBe(-3)
    expect(seasonReputationDelta(3)).toBe(0)
    expect(seasonReputationDelta(4)).toBe(2)
    expect(seasonReputationDelta(5)).toBe(4)
  })

  it('understiger skandalstraffet i magnitud (proportion mot befintligt mönster)', () => {
    const SCANDAL_MIN_PENALTY = 5  // scandalService.ts: fundraiser_vanished/coach_meltdown, −8 till −5
    expect(Math.abs(seasonReputationDelta(1))).toBeLessThan(SCANDAL_MIN_PENALTY + 3)
  })

  it('bara rating 4-5 ger positivt delta, bara 1-2 ger negativt, 3 är neutralt', () => {
    expect(seasonReputationDelta(3)).toBe(0)
    expect(seasonReputationDelta(1)).toBeLessThan(0)
    expect(seasonReputationDelta(2)).toBeLessThan(0)
    expect(seasonReputationDelta(4)).toBeGreaterThan(0)
    expect(seasonReputationDelta(5)).toBeGreaterThan(0)
  })
})
