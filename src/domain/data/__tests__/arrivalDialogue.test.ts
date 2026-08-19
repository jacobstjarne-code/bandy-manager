import { describe, it, expect } from 'vitest'
import { getTreasurerLine } from '../arrivalDialogue'

describe('getTreasurerLine — 2.6 (SLUTTEST_KO.md, 2026-08-19)', () => {
  it('noll kontrakt', () => {
    expect(getTreasurerLine(0)).toBe('"Kontrakten är trygga ett år till. Det är mer än vi brukar kunna säga."')
  })

  it('exakt ett kontrakt', () => {
    expect(getTreasurerLine(1)).toBe('"Ett kontrakt löper ut i vår. Ta det samtalet innan någon annan gör det."')
  })

  it('två eller fler, ordet stavas ut upp till tio', () => {
    expect(getTreasurerLine(2)).toBe('"Två kontrakt löper ut. Snacka med dom tidigt."')
    expect(getTreasurerLine(3)).toBe('"Tre kontrakt löper ut. Snacka med dom tidigt."')
    expect(getTreasurerLine(10)).toBe('"Tio kontrakt löper ut. Snacka med dom tidigt."')
  })

  it('över tio faller tillbaka på siffran', () => {
    expect(getTreasurerLine(11)).toBe('"11 kontrakt löper ut. Snacka med dom tidigt."')
  })
})
