import { describe, it, expect } from 'vitest'
import {
  pickFunctionaryStreakLine,
  FUNCTIONARY_LOSING_STREAK_LINES,
  FUNCTIONARY_WINNING_STREAK_LINES,
} from '../functionaryStreakText'

describe('functionaryStreakText — B4 (2026-07-20)', () => {
  it('båda poolerna har sex rader', () => {
    expect(FUNCTIONARY_LOSING_STREAK_LINES).toHaveLength(6)
    expect(FUNCTIONARY_WINNING_STREAK_LINES).toHaveLength(6)
  })

  it('pickFunctionaryStreakLine är deterministisk för samma indata', () => {
    const a = pickFunctionaryStreakLine('club_x', 12, 'losing_streak')
    const b = pickFunctionaryStreakLine('club_x', 12, 'losing_streak')
    expect(a).toBe(b)
    expect(FUNCTIONARY_LOSING_STREAK_LINES).toContain(a)
  })

  it('läser rätt pool per svit-tecken', () => {
    const losing = pickFunctionaryStreakLine('club_x', 5, 'losing_streak')
    const winning = pickFunctionaryStreakLine('club_x', 5, 'winning_streak')
    expect(FUNCTIONARY_LOSING_STREAK_LINES).toContain(losing)
    expect(FUNCTIONARY_WINNING_STREAK_LINES).toContain(winning)
  })
})
