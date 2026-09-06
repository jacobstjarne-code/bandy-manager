import { describe, expect, it } from 'vitest'
import { careerBreakSeasonLine } from '../careerBreakText'
import { generateTeamPhotoSvg } from '../../../presentation/utils/teamPhotoGenerator'

describe('absolute season labels', () => {
  it('uses the bandy-year span after a firing', () => {
    const text = careerBreakSeasonLine(
      { season: 2028, formerClubPosition: 7, championClubId: 'champ', championClubName: 'Mästarna' },
      { formerClubName: 'Test BK' } as never,
    )

    expect(text).toBe('Säsong 2028/29: Test BK på plats 7. Mästarna vann.')
  })

  it('uses the short bandy-year span in the generated team photo', () => {
    const svg = generateTeamPhotoSvg({ name: 'Test BK', arenaName: 'Testvallen' } as never, [], 2028)

    expect(svg).toContain('SÄSONG 2028/29')
    expect(svg).not.toContain('2028/2029')
  })
})
