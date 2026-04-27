import { SM_FINAL_VENUE, CUP_FINAL_VENUE } from '../domain/data/specialDateStrings'

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
