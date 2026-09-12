import { describe, expect, it } from 'vitest'
import { commentary } from '../../data/matchCommentary'
import { pickGoalCommentary } from '../matchUtils'

describe('pickGoalCommentary — sena mål är matchlägessanna', () => {
  it('använder inte matchen-lever-poolen när ett ledande lag utökar', () => {
    const history = new Map<string[], string[]>()
    const result = pickGoalCommentary(6, 3, () => 0, history, 86)
    expect(commentary.goalLate).not.toContain(result)
  })

  it('behåller den sena poolen för ett sent kvitteringsmål', () => {
    const history = new Map<string[], string[]>()
    const result = pickGoalCommentary(4, 4, () => 0, history, 86)
    expect(commentary.goalLate).toContain(result)
  })
})
