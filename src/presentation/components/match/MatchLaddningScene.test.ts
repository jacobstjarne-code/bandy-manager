import { describe, expect, it } from 'vitest'
import { getMatchLaddningIllustration, MATCH_LADDNING_OCCASION_ASSET } from './MatchLaddningScene'

describe('MATCH_LADDNING_OCCASION_ASSET', () => {
  it('uses the dedicated new year illustration for the new year scene', () => {
    expect(MATCH_LADDNING_OCCASION_ASSET.nyar).toBe('nyar')
  })
})

describe('getMatchLaddningIllustration', () => {
  it('uses the opponent club intro for identity-led premiere, cup and derby scenes', () => {
    expect(getMatchLaddningIllustration('premiar', 'club_forsbacka').assetSrc)
      .toBe('/assets/illustrations/intro-forsbacka.webp')
    expect(getMatchLaddningIllustration('cup', 'club_malilla').assetSrc)
      .toBe('/assets/illustrations/intro-malilla.webp')
    expect(getMatchLaddningIllustration('derby', 'club_forsbacka').assetSrc)
      .toBe('/assets/illustrations/intro-forsbacka.webp')
  })

  it('keeps the dedicated seasonal art for annandagen, final and new year', () => {
    expect(getMatchLaddningIllustration('annandagen', 'club_malilla').assetSrc)
      .toBe('/assets/illustrations/annandagen.webp')
    expect(getMatchLaddningIllustration('final', 'club_malilla').assetSrc)
      .toBe('/assets/illustrations/final.webp')
    expect(getMatchLaddningIllustration('nyar', 'club_malilla').assetSrc)
      .toBe('/assets/illustrations/nyar.webp')
  })
})
