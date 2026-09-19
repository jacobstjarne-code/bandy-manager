import { describe, expect, it } from 'vitest'
import { createCommentaryHistory, pickCommentary, shareCommentaryMemory, snapshotCommentaryMemory } from '../matchCommentary'
import { mulberry32 } from '../../utils/random'

describe('commentary selection without gameplay RNG drift', () => {
  it('excludes recent lines even when randomness always chooses the same index', () => {
    const history = createCommentaryHistory()
    const pool = ['one', 'two', 'three', 'four']
    expect(new Set(Array.from({ length: 4 }, () => pickCommentary(pool, () => 0, history))).size).toBe(4)
  })

  it('recognizes freshly filtered arrays and carries memory through JSON/half-time', () => {
    let history = createCommentaryHistory()
    const pool = ['one', 'two', 'three', 'four']
    const first = pickCommentary(pool.filter(Boolean), () => 0, history)
    history = createCommentaryHistory(JSON.parse(JSON.stringify(snapshotCommentaryMemory(history))))
    expect(pickCommentary(pool.filter(Boolean), () => 0, history)).not.toBe(first)
  })

  it('shares display memory with event-only selection without sharing gameplay draws', () => {
    const main = createCommentaryHistory(), events = createCommentaryHistory()
    shareCommentaryMemory(main, events)
    const pool = ['one', 'two']
    expect(pickCommentary(pool, () => 0, main)).toBe('one')
    expect(pickCommentary(pool, () => 0, events)).toBe('two')
  })

  it('never emits an ineligible line, including single-line eligible pools', () => {
    const history = createCommentaryHistory()
    for (let i = 0; i < 10; i++) expect(pickCommentary(['false', 'true'], () => 0, history, ['true'])).toBe('true')
  })

  it('consumes exactly the historical RNG schedule despite constrained selection', () => {
    const pool = ['one', 'two', 'three', 'four', 'five']
    const actual = mulberry32(917), legacy = mulberry32(917)
    const history = createCommentaryHistory()
    let seen: string[] = []
    for (let i = 0; i < 100; i++) {
      let pick: string, attempts = 0
      do { pick = pool[Math.floor(legacy() * pool.length)]; attempts++ }
      while (seen.slice(-3).includes(pick) && attempts < pool.length)
      seen = [...seen, pick].slice(-4)
      pickCommentary(pool, actual, history, ['two', 'four'])
      expect(actual()).toBe(legacy())
    }
  })
})
