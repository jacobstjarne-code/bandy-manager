import { describe, expect, it } from 'vitest'
import { pickCountdownText, type UpptaktSubState } from '../upptaktCopy'

describe('upptaktens nedräkning — singular', () => {
  it.each(['sakrat', 'farozon', 'bottenstrid'] as UpptaktSubState[])(
    '%s läcker aldrig "1 omgångar" eller "1 matcher"',
    state => {
      for (let seed = 0; seed < 100; seed++) {
        const text = pickCountdownText(state, 1, seed, new Set())
        expect(text).not.toMatch(/1 (?:omgångar|matcher|sista matcherna)/)
      }
    },
  )
})
