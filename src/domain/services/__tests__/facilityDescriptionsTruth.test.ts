import { describe, expect, it } from 'vitest'
import { FACILITY_DESC } from '../../data/facilityDescriptions'
import { KLUBBPARM_CHAPTERS } from '../../data/klubbparmContent'

describe('facility copy state contract', () => {
  it('does not promise undeclared facility effects', () => {
    expect(FACILITY_DESC.matchhall).toBe(
      'Tak över isen — bandy året runt. Träningstid året om.',
    )
    expect(FACILITY_DESC.stralkastare).toBe(
      'Bättre ljus på arenan. Kvällsmatcher syns bättre.',
    )
    expect(FACILITY_DESC.traningshall).toBe(
      'Inomhushall för ungdomslaget. De kan träna hela vintern.',
    )

    const renderedFacilityCopy = Object.values(FACILITY_DESC).join(' ')
    expect(renderedFacilityCopy).not.toContain('tv-avtal')
    expect(renderedFacilityCopy).not.toContain('klacken glesnar')
    expect(renderedFacilityCopy).not.toContain('sponsorerna betalar mer')
    expect(renderedFacilityCopy).not.toContain('stannar hellre kvar')
  })

  it('keeps the club handbook free from the same undeclared promises', () => {
    const economy = KLUBBPARM_CHAPTERS.find((chapter) => chapter.id === 'ekonomi')
    expect(economy).toBeDefined()

    const handbookCopy = economy?.content.paragraphs.join(' ')
    expect(handbookCopy).toContain(
      'Allt kostar mer än pengar. Vad du bygger säger lika mycket om klubben som vad du köper till laget.',
    )
    expect(handbookCopy).not.toContain('tv-avtal')
    expect(handbookCopy).not.toContain('klacken glesnar')
  })
})
