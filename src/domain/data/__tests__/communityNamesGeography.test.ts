import { describe, expect, it } from 'vitest'
import { CLUB_TEMPLATES } from '../../services/worldGenerator'
import { getLocalPaperNames, LOCAL_PAPER_NAMES_BY_REGION } from '../communityNames'

describe('lokalpressens geografi', () => {
  it('har ett regionalt urval för varje spelbar klubb', () => {
    for (const club of CLUB_TEMPLATES) {
      expect(LOCAL_PAPER_NAMES_BY_REGION[club.region], club.name).toBeDefined()
      expect(getLocalPaperNames(club.region).length, club.name).toBeGreaterThan(0)
    }
  })

  it('blandar inte Norrbotten och Västerbotten', () => {
    expect(getLocalPaperNames('Norrbotten')).not.toContain('Norra Västerbotten')
    expect(getLocalPaperNames('Västerbotten')).toContain('Norra Västerbotten')
  })

  it('väljer inte ur hela landet för en okänd region', () => {
    expect(getLocalPaperNames('okänd region')).toEqual(['Lokaltidningen'])
  })
})
