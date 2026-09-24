import { SM_FINAL_VENUE, CUP_FINAL_VENUE, FINALDAG_COMMENTARY_PLAYING } from '../domain/data/specialDateStrings'

describe('SM_FINAL_VENUE', () => {
  it('är Studenternas IP, Uppsala', () => {
    expect(SM_FINAL_VENUE.arenaName).toBe('Studenternas IP')
    expect(SM_FINAL_VENUE.city).toBe('Uppsala')
  })
})

describe('CUP_FINAL_VENUE', () => {
  it('är Sävstaås IP, Bollnäs', () => {
    expect(CUP_FINAL_VENUE.arenaName).toBe('Sävstaås IP')
    expect(CUP_FINAL_VENUE.city).toBe('Bollnäs')
  })
})

describe('FINALDAG_COMMENTARY_PLAYING', () => {
  // BETATEST_TEXTDOM C2.10: meningen om derbyt är struken ur finalraden.
  // Genusvakten står kvar så "en derby" aldrig kommer tillbaka.
  it('böjer aldrig derby i utrum', () => {
    expect(FINALDAG_COMMENTARY_PLAYING.join(' ')).not.toMatch(/\ben derby\b/)
    expect(FINALDAG_COMMENTARY_PLAYING.join(' ')).toContain('Ingen match den här säsongen har betytt lika mycket.')
  })
})
