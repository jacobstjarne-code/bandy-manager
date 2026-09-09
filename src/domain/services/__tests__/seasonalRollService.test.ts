import { describe, expect, it } from 'vitest'
import { seasonalUnitRoll, type SeasonalRollContext } from '../seasonalRollService'

const base: SeasonalRollContext = {
  id: 'save-fallback',
  worldSeed: 1729,
  managedClubId: 'club_forsbacka',
  currentSeason: 2028,
}

describe('seasonalUnitRoll', () => {
  it('är stabilt för samma save, klubb, säsong, nyckel och namnrymd', () => {
    const first = seasonalUnitRoll(base, 'supporter_letter', 'o1')
    expect(seasonalUnitRoll(base, 'supporter_letter', 'o1')).toBe(first)
    expect(first).toBeGreaterThanOrEqual(0)
    expect(first).toBeLessThan(1)
  })

  it('skiljer producenternas namnrymder utan att de behöver egna seedmotorer', () => {
    expect(seasonalUnitRoll(base, 'patron', 'emergence')).not.toBe(
      seasonalUnitRoll(base, 'patron', 'o1'),
    )
  })

  it('använder save-id när äldre saves saknar worldSeed', () => {
    const legacy = { ...base, worldSeed: undefined }
    expect(seasonalUnitRoll(legacy, 'facility_community', 'o1')).toBe(
      seasonalUnitRoll(legacy, 'facility_community', 'o1'),
    )
    expect(seasonalUnitRoll(legacy, 'facility_community', 'o1')).not.toBe(
      seasonalUnitRoll({ ...legacy, id: 'annan-save' }, 'facility_community', 'o1'),
    )
  })
})
