// O1/SPÅR B B4-fixet (2026-08-23, DOM_SPARB_TEXTNIVAER_2026-08-21.md): getStreakState
// ska läsa game.trainerArc — SAMMA consecutiveWins/consecutiveLosses som boardPatience
// mäter — aldrig en egen omräkning ur fixtures. Ingen testfil fanns tidigare för denna
// fil; täcker bara getStreakState, inte hela roundCharacter.ts.
import { describe, it, expect } from 'vitest'
import { getRoundCharacter, getStreakState } from '../roundCharacter'
import type { SaveGame } from '../../entities/SaveGame'
import type { TrainerArc } from '../../entities/Narrative'

function makeArc(overrides: Partial<TrainerArc> = {}): TrainerArc {
  return {
    current: 'grind', history: [], seasonCount: 1, bestFinish: 1, titlesWon: 0,
    consecutiveWins: 0, consecutiveLosses: 0, boardWarningGiven: false,
    ...overrides,
  }
}

function makeGame(trainerArc: TrainerArc | undefined): SaveGame {
  return { managedClubId: 'c1', fixtures: [], trainerArc } as unknown as SaveGame
}

describe('getStreakState', () => {
  it('null om trainerArc saknas', () => {
    expect(getStreakState(makeGame(undefined))).toBeNull()
  })

  it('null under tröskeln 3', () => {
    expect(getStreakState(makeGame(makeArc({ consecutiveWins: 2 })))).toBeNull()
    expect(getStreakState(makeGame(makeArc({ consecutiveLosses: 2 })))).toBeNull()
  })

  it('winning_streak vid consecutiveWins >= 3', () => {
    expect(getStreakState(makeGame(makeArc({ consecutiveWins: 4 }))))
      .toEqual({ length: 4, type: 'winning_streak' })
  })

  it('losing_streak vid consecutiveLosses >= 3', () => {
    expect(getStreakState(makeGame(makeArc({ consecutiveLosses: 5 }))))
      .toEqual({ length: 5, type: 'losing_streak' })
  })

  it('läser trainerArc rakt av — påverkas INTE av game.fixtures (rot till fixet: den gamla versionen räknade om oberoende ur fixtures utan cup-filter)', () => {
    // Fixtures som skulle ge en helt annan (inklusive cup-matcher) svit om
    // funktionen fortfarande räknade om själv — trainerArc är ensam sanning.
    const fixtures = [
      { id: 'f1', status: 'completed', isCup: true, matchday: 3, homeClubId: 'c1', awayClubId: 'c2', homeScore: 0, awayScore: 5 },
      { id: 'f2', status: 'completed', isCup: false, matchday: 2, homeClubId: 'c1', awayClubId: 'c2', homeScore: 3, awayScore: 0 },
      { id: 'f3', status: 'completed', isCup: false, matchday: 1, homeClubId: 'c1', awayClubId: 'c2', homeScore: 3, awayScore: 0 },
    ] as unknown as SaveGame['fixtures']
    const game = { managedClubId: 'c1', fixtures, trainerArc: makeArc({ consecutiveWins: 3 }) } as unknown as SaveGame
    expect(getStreakState(game)).toEqual({ length: 3, type: 'winning_streak' })
  })
})

describe('getRoundCharacter — avgjorda utslagsmatcher', () => {
  it('en straffseger blir inte post_loss', () => {
    const game = {
      managedClubId: 'c1', trainerArc: makeArc(),
      fixtures: [{
        id: 'cup', status: 'completed', isCup: true, isKnockout: true,
        matchday: 5, roundNumber: 4, homeClubId: 'c1', awayClubId: 'c2',
        homeScore: 2, awayScore: 2, penaltyResult: { home: 4, away: 3 },
      }],
    } as unknown as SaveGame
    expect(getRoundCharacter(game)).toBe('standard')
  })
})
