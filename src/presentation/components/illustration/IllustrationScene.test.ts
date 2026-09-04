import { describe, expect, it } from 'vitest'
import { getClubIntroIllustrationAssetName, getClubIntroIllustrationSrc } from './IllustrationScene'

describe('getClubIntroIllustrationSrc', () => {
  it.each([
    ['club_forsbacka', 'intro-forsbacka'],
    ['club_gagnef', 'intro-gagnef'],
    ['club_karlsborg', 'intro-karlsborg'],
    ['club_malilla', 'intro-malilla'],
    ['club_rogle', 'intro-rogle'],
    ['club_slottsbron', 'intro-slottsbron'],
    ['club_soderfors', 'intro-soderfors'],
  ])('maps %s to its club illustration', (clubId, assetName) => {
    expect(getClubIntroIllustrationSrc(clubId)).toBe(`/assets/illustrations/${assetName}.jpg`)
  })

  it('keeps the generic intro for clubs without a delivered illustration', () => {
    expect(getClubIntroIllustrationSrc('club_edsbyn')).toBe('/assets/illustrations/intro.jpg')
    expect(getClubIntroIllustrationAssetName('club_edsbyn')).toBeUndefined()
  })
})
