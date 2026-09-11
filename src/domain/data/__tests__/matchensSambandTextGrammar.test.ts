import { describe, expect, it } from 'vitest'
import {
  sambandTextA,
  sambandTextC,
  sambandTextD,
  sambandTextF,
  sambandTextG,
  sambandTextISecondHalfChase,
} from '../matchensSambandText'

describe('matchens samband — svensk räkneböjning', () => {
  it('böjer ett insläppt mål och en utvisning i singular', () => {
    expect(sambandTextA(1, 1, 1)).toContain('1 utvisning')
    expect(sambandTextD(8, 1)).toContain('1 insläppt')
    expect(sambandTextF(5, 1)).toBe('Offensiv mentalitet betalade sig: 5 mål, 1 insläppt.')
    expect(sambandTextG(0, 1)).toBe('1 insläppt i undertal.')
    expect(sambandTextISecondHalfChase(2, 1)).toContain('1 insläppt i jakten')
  })

  it('visar det verkliga antalet utvisningar när aggressiva hörnor inte ger mål', () => {
    expect(sambandTextC(0, 4, 2)).toBe('4 hörnor, inget mål. Aggressiviteten gav bara 2 utvisningar.')
  })
})
