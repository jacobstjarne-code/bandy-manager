import { describe, it, expect } from 'vitest'
import { shouldShowTruppenChapter } from '../SeasonSummaryScreen'

/**
 * Å11-residual (SLUTTEST_KO.md, 6.4 post 21, 2026-08-20) — DS-regel 12:
 * "Truppen"-kapitlets rubrik ska inte rendera ovanför tomrum när BÅDA
 * korten under den (Säsongens bästa + Svenska Cupen) gatas bort.
 */
describe('shouldShowTruppenChapter', () => {
  it('döljs när varken award-data eller cup-resultat finns', () => {
    expect(shouldShowTruppenChapter({ cupResult: null })).toBe(false)
  })

  it('döljs när cupResult är eliminated (samma gate som cup-kortet självt)', () => {
    expect(shouldShowTruppenChapter({ cupResult: 'eliminated' })).toBe(false)
  })

  it('visas om enbart en award-post finns', () => {
    expect(shouldShowTruppenChapter({ topScorer: { name: 'Erik Sundqvist', goals: 12, assists: 3 }, cupResult: null })).toBe(true)
  })

  it('visas om enbart cupResult finns (icke-eliminated)', () => {
    expect(shouldShowTruppenChapter({ cupResult: 'finalist' })).toBe(true)
  })
})
