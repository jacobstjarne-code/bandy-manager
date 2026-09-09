import { describe, expect, it } from 'vitest'
import { getSeasonSummaryIllustrationName, isRelegationZoneFinish } from '../SeasonSummaryScreen'

describe('SeasonSummaryScreen — nedflyttningsillustration', () => {
  it('visas bara för de två faktiska bottenplaceringarna i en tolvlagsserie', () => {
    expect(isRelegationZoneFinish(10, 12)).toBe(false)
    expect(isRelegationZoneFinish(11, 12)).toBe(true)
    expect(isRelegationZoneFinish(12, 12)).toBe(true)
  })

  it('följer ligans storlek i stället för ett hårdkodat tabellnummer', () => {
    expect(isRelegationZoneFinish(6, 8)).toBe(false)
    expect(isRelegationZoneFinish(7, 8)).toBe(true)
    expect(isRelegationZoneFinish(8, 8)).toBe(true)
  })

  it('låter nedflyttningsmotivet vinna bara i botten och använder säsongsslut annars', () => {
    expect(getSeasonSummaryIllustrationName(3, 12)).toBe('season-end')
    expect(getSeasonSummaryIllustrationName(11, 12)).toBe('nedflyttning')
  })
})
