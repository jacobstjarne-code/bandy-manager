import { describe, expect, it } from 'vitest'
import { shouldBeInteractive } from '../cornerInteractionService'

describe('shouldBeInteractive', () => {
  it('gör matchens första hörna interaktiv i full-läge oavsett slump', () => {
    expect(shouldBeInteractive(5, 0, 0, true, 0, 0, () => 0.99)).toBe(true)
  })

  it('slumpar rutinmässiga senare hörnor inom interaktionstaket', () => {
    expect(shouldBeInteractive(15, 0, 0, true, 1, 1, () => 0.99)).toBe(false)
    expect(shouldBeInteractive(15, 0, 0, true, 1, 1, () => 0.10)).toBe(true)
  })
})
