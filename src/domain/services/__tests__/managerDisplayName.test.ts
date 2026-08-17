import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { getManagerDisplayName, getManagerInitials } from '../managerProfileService'

// AUDIT (2026-08-17): rotorsaksfix — enordsnamn fick tidigare ett slumpat
// efternamn hängt på sig i vissa vyer (BurnoutMark, TranareTab,
// resolveContractExtension) eftersom de läste managerProfile.lastName, en
// fallback-genererad text från generateManagerProfile, istället för att läsa
// vad spelaren faktiskt skrev in. getManagerDisplayName(game) är nu den enda
// källan alla ytor läser: alltid exakt game.managerName, aldrig padding.
describe('getManagerDisplayName', () => {
  it('enordsnamn — visas exakt som inmatat, INGET fabricerat efternamn tillagt', () => {
    const game = createNewGame({ managerName: 'Säsongstest', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    expect(getManagerDisplayName(game)).toBe('Säsongstest')
    // Regression guard: managerProfile.lastName är en SLUMPAD fallback-sträng
    // (se generateManagerProfile/COACH_LAST_NAMES) — displayName ska aldrig
    // innehålla den.
    expect(getManagerDisplayName(game)).not.toContain(game.managerProfile!.lastName)
  })

  it('tvåordsnamn — bevaras precis som inmatat', () => {
    const game = createNewGame({ managerName: 'Jacob Stjärne', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    expect(getManagerDisplayName(game)).toBe('Jacob Stjärne')
  })

  it('flerordsnamn — allt bevaras, ingen del tappas', () => {
    const game = createNewGame({ managerName: 'Jacob Anders Stjärne', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    expect(getManagerDisplayName(game)).toBe('Jacob Anders Stjärne')
  })

  it('trimmar omgivande whitespace', () => {
    const game = createNewGame({ managerName: '  Säsongstest  ', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    expect(getManagerDisplayName(game)).toBe('Säsongstest')
  })
})

describe('getManagerInitials', () => {
  it('enordsnamn — två första bokstäverna, inte en fabricerad andra bokstav', () => {
    expect(getManagerInitials('Säsongstest')).toBe('SÄ')
  })

  it('tvåordsnamn — första bokstaven i vardera ordet', () => {
    expect(getManagerInitials('Jacob Stjärne')).toBe('JS')
  })

  it('flerordsnamn — bara de två första orden räknas', () => {
    expect(getManagerInitials('Jacob Anders Stjärne')).toBe('JA')
  })

  it('enstaka bokstav som namn — klarar sig utan krasch', () => {
    expect(getManagerInitials('J')).toBe('J')
  })

  it('extra whitespace mellan ord påverkar inte resultatet', () => {
    expect(getManagerInitials('  Jacob   Stjärne  ')).toBe('JS')
  })

  it('tomt namn — returnerar tom sträng utan att krascha', () => {
    expect(getManagerInitials('')).toBe('')
    expect(getManagerInitials('   ')).toBe('')
  })
})
