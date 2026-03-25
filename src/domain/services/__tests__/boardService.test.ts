import { describe, it, expect } from 'vitest'
import { evaluateBoard, generateBoardMessage, generateSeasonVerdict } from '../boardService'
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
