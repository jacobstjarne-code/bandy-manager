import { describe, expect, it } from 'vitest'
import { MATCH_LADDNING_OCCASION_ASSET } from './MatchLaddningScene'

describe('MATCH_LADDNING_OCCASION_ASSET', () => {
  it('uses the dedicated new year illustration for the new year scene', () => {
    expect(MATCH_LADDNING_OCCASION_ASSET.nyar).toBe('nyar')
  })
})
