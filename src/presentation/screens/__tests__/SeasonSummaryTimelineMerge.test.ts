import { describe, expect, it } from 'vitest'
import { mergeYearbookTimelineItems } from '../SeasonSummaryScreen'

describe('årsbokens sammanslagna tidslinje', () => {
  it('visar inte samma rubrik två gånger när matchmoment och storyline saknar gemensamt id', () => {
    const headline = '💔 Derby-förlust mot Heros'
    const merged = mergeYearbookTimelineItems(
      [{ round: 4, icon: '😶', headline, body: '', storylineCandidate: false }],
      [{ round: 99, icon: '📖', headline, body: '', storylineId: 'storyline_derby_heros' }],
      7,
    )
    expect(merged.filter(item => item.headline === headline)).toHaveLength(1)
  })
})
