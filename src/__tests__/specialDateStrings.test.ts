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
  it('böjer ett derby i neutrum', () => {
    expect(FINALDAG_COMMENTARY_PLAYING.join(' ')).toContain('inte ens ett derby')
    expect(FINALDAG_COMMENTARY_PLAYING.join(' ')).not.toContain('inte ens en derby')
  })
})
