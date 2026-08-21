import { describe, it, expect } from 'vitest'
import { evaluateBoard, generateBoardMessage, generateSeasonVerdict, seasonReputationDelta, computeBoardPatienceUpdate, updateRunningBoardPatience } from '../boardService'
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

describe('computeBoardPatienceUpdate — U1 andra halvan (Jacobs dom 2026-08-22, efter Skutskär-auditen)', () => {
  const TOTAL = 12  // RELEGATION_ZONE_SIZE=2 → zon = plats 11-12
  const AB = ClubExpectation.AvoidBottom  // ankare 9, slope above=2/below=4

  it('nedflyttningszonen (plats 11-12): newConsecutiveFailures oförändrad logik (+1 per säsong i zonen)', () => {
    expect(computeBoardPatienceUpdate(11, TOTAL, 70, 0, AB)).toEqual({ newBoardPatience: 62, newConsecutiveFailures: 1 })
    expect(computeBoardPatienceUpdate(12, TOTAL, 70, 2, AB)).toEqual({ newBoardPatience: 58, newConsecutiveFailures: 3 })
  })

  it('varningszonen (plats 9-10): kontinuerlig, inte längre en fast -5', () => {
    expect(computeBoardPatienceUpdate(9, TOTAL, 70, 2, AB)).toEqual({ newBoardPatience: 70, newConsecutiveFailures: 0 })   // pos == ankare → delta 0
    expect(computeBoardPatienceUpdate(10, TOTAL, 70, 2, AB)).toEqual({ newBoardPatience: 66, newConsecutiveFailures: 0 })  // 1 under ankaret × below(4)
  })

  it('DÖDZONEN ÄR BORTA — plats 6 (tidigare noll effekt) rör nu siffran, AvoidBottom-klubb belönas för att slå ankaret', () => {
    // gap = ankare(9) − pos(6) = 3, delta = above(2) × 3 = +6 — INTE längre 0
    expect(computeBoardPatienceUpdate(6, TOTAL, 70, 3, AB)).toEqual({ newBoardPatience: 76, newConsecutiveFailures: 0 })
  })

  it('topp (plats 1): kontinuerlig above-lutning, inte en fast +20', () => {
    // gap = 9−1 = 8, delta = 2×8 = 16
    expect(computeBoardPatienceUpdate(1, TOTAL, 70, 0, AB).newBoardPatience).toBe(86)
  })

  it('plats 3: gap=6, delta=2×6=12', () => {
    expect(computeBoardPatienceUpdate(3, TOTAL, 70, 0, AB).newBoardPatience).toBe(82)
  })

  it('patience clampas till [0, 100]', () => {
    expect(computeBoardPatienceUpdate(1, TOTAL, 95, 0, AB).newBoardPatience).toBe(100)
    expect(computeBoardPatienceUpdate(12, TOTAL, 10, 0, AB).newBoardPatience).toBe(0)
  })

  it('boardExpectation-medveten: samma plats 8 läses olika för AvoidBottom vs ChallengeTop', () => {
    // AvoidBottom (ankare 9): gap=1, delta=above(2)×1=+2
    expect(computeBoardPatienceUpdate(8, TOTAL, 70, 0, ClubExpectation.AvoidBottom).newBoardPatience).toBe(72)
    // ChallengeTop (ankare 4): gap=4−8=−4, delta=below(4)×−4=−16
    expect(computeBoardPatienceUpdate(8, TOTAL, 70, 0, ClubExpectation.ChallengeTop).newBoardPatience).toBe(54)
  })

  it('WinLeague: ankare 1, above=0 (går inte att slå), below=5', () => {
    expect(computeBoardPatienceUpdate(1, TOTAL, 70, 0, ClubExpectation.WinLeague).newBoardPatience).toBe(70)
    // gap = 1−2 = −1, delta = 5×−1 = −5
    expect(computeBoardPatienceUpdate(2, TOTAL, 70, 0, ClubExpectation.WinLeague).newBoardPatience).toBe(65)
  })
})

describe('updateRunningBoardPatience — U1 andra halvan, ändring 1+2 (Jacobs dom 2026-08-22)', () => {
  function makeGameWithLastFixture(overrides: { homeScore: number; awayScore: number; fixtureId?: string; boardPatience?: number; boardPatienceLastCountedFixtureId?: string }) {
    return {
      managedClubId: 'club_a',
      boardPatience: overrides.boardPatience ?? 70,
      boardPatienceLastCountedFixtureId: overrides.boardPatienceLastCountedFixtureId,
      fixtures: [{
        id: overrides.fixtureId ?? 'fx1',
        status: 'completed',
        isCup: false,
        roundNumber: 5,
        homeClubId: 'club_a',
        awayClubId: 'club_b',
        homeScore: overrides.homeScore,
        awayScore: overrides.awayScore,
      }],
    } as unknown as Parameters<typeof updateRunningBoardPatience>[0]
  }

  it('vinst: +1.0', () => {
    const game = makeGameWithLastFixture({ homeScore: 2, awayScore: 1 })
    expect(updateRunningBoardPatience(game, 0)).toEqual({ boardPatience: 71, boardPatienceLastCountedFixtureId: 'fx1' })
  })

  it('oavgjort: +0.5', () => {
    const game = makeGameWithLastFixture({ homeScore: 1, awayScore: 1 })
    expect(updateRunningBoardPatience(game, 0)).toEqual({ boardPatience: 70.5, boardPatienceLastCountedFixtureId: 'fx1' })
  })

  it('förlust utan svit: -1.5, inget tillägg', () => {
    const game = makeGameWithLastFixture({ homeScore: 0, awayScore: 1 })
    expect(updateRunningBoardPatience(game, 1)).toEqual({ boardPatience: 68.5, boardPatienceLastCountedFixtureId: 'fx1' })
  })

  it('förlustsvit 3-4: extra -3 ovanpå bas-förlusten', () => {
    const game = makeGameWithLastFixture({ homeScore: 0, awayScore: 1 })
    expect(updateRunningBoardPatience(game, 3).boardPatience).toBe(70 - 1.5 - 3)
  })

  it('förlustsvit ≥5: extra -8 ovanpå bas-förlusten — den bärande signalen', () => {
    const game = makeGameWithLastFixture({ homeScore: 0, awayScore: 1 })
    expect(updateRunningBoardPatience(game, 5).boardPatience).toBe(70 - 1.5 - 8)
  })

  it('TAK (Jacobs koefficientdom 2026-08-23): förlustsvit 6 — tillägget utgår, bara bas-förlusten kvar', () => {
    const game = makeGameWithLastFixture({ homeScore: 0, awayScore: 1 })
    expect(updateRunningBoardPatience(game, 6).boardPatience).toBe(70 - 1.5)
  })

  it('TAK: förlustsvit 16 (verklig längd ur Grind 1 v3-stresstestet) — samma delta som svit 6, ingen ytterligare eskalering', () => {
    const game = makeGameWithLastFixture({ homeScore: 0, awayScore: 1 })
    expect(updateRunningBoardPatience(game, 16).boardPatience).toBe(70 - 1.5)
  })

  it('samma fixture räknas inte två gånger (idempotens, samma mönster som trainerArc.lastCountedFixtureId)', () => {
    const game = makeGameWithLastFixture({ homeScore: 2, awayScore: 1, boardPatienceLastCountedFixtureId: 'fx1' })
    expect(updateRunningBoardPatience(game, 0)).toEqual({ boardPatience: 70, boardPatienceLastCountedFixtureId: 'fx1' })
  })

  it('klämd till [0, 100]', () => {
    const game = makeGameWithLastFixture({ homeScore: 0, awayScore: 1, boardPatience: 1 })
    expect(updateRunningBoardPatience(game, 5).boardPatience).toBe(0)
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
