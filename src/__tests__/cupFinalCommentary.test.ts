import { describe, it, expect } from 'vitest'
import { commentary } from '../domain/data/matchCommentary'

/**
 * B3 — Cup-tonen Nivå 2: verifierar att cup_final_*-poolerna
 * har rätt strängar med korrekta placeholders.
 */

const EXPECTED_PLACEHOLDERS: Record<string, string[]> = {
  cup_final_kickoff:     ['{team}', '{opponent}'],
  cup_final_goal:        ['{player}', '{score}', '{team}'],
  cup_final_fullTime_win:  ['{team}', '{score}'],
  cup_final_fullTime_loss: ['{team}', '{opponent}', '{score}'],
}

describe('cup_final_* commentary pools', () => {
  it('cup_final_kickoff har 4 strängar', () => {
    expect(commentary.cup_final_kickoff).toHaveLength(4)
  })

  it('cup_final_goal har 4 strängar', () => {
    expect(commentary.cup_final_goal).toHaveLength(4)
  })

  it('cup_final_fullTime_win har 4 strängar', () => {
    expect(commentary.cup_final_fullTime_win).toHaveLength(4)
  })

  it('cup_final_fullTime_loss har 4 strängar', () => {
    expect(commentary.cup_final_fullTime_loss).toHaveLength(4)
  })

  it('cup_final_kickoff delar inga strängar med cup_kickoff (Nivå 1)', () => {
    const l1 = new Set(commentary.cup_kickoff)
    for (const s of commentary.cup_final_kickoff) {
      expect(l1.has(s)).toBe(false)
    }
  })

  it('cup_final_goal delar inga strängar med cup_goal (Nivå 1)', () => {
    const l1 = new Set(commentary.cup_goal)
    for (const s of commentary.cup_final_goal) {
      expect(l1.has(s)).toBe(false)
    }
  })

  it('cup_final_fullTime_win delar inga strängar med final_fullTime_win (SM-final)', () => {
    const sm = new Set((commentary as Record<string, string[]>)['final_fullTime_win'] ?? [])
    for (const s of commentary.cup_final_fullTime_win) {
      expect(sm.has(s)).toBe(false)
    }
  })

  it('cup_final_fullTime_loss delar inga strängar med final_fullTime_loss (SM-final)', () => {
    const sm = new Set((commentary as Record<string, string[]>)['final_fullTime_loss'] ?? [])
    for (const s of commentary.cup_final_fullTime_loss) {
      expect(sm.has(s)).toBe(false)
    }
  })

  it('alla pooler har icke-tomma strängar', () => {
    const pools: (keyof typeof commentary)[] = [
      'cup_final_kickoff',
      'cup_final_goal',
      'cup_final_fullTime_win',
      'cup_final_fullTime_loss',
    ]
    for (const key of pools) {
      for (const s of commentary[key]) {
        expect(s.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('cup_final_goal-strängar innehåller {player} och {score}', () => {
    for (const s of commentary.cup_final_goal) {
      // minst en sträng ska ha {player}
      break
    }
    const withPlayer = commentary.cup_final_goal.some(s => s.includes('{player}'))
    const withScore = commentary.cup_final_goal.some(s => s.includes('{score}'))
    expect(withPlayer).toBe(true)
    expect(withScore).toBe(true)
  })
})
