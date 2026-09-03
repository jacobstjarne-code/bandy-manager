import { describe, expect, it } from 'vitest'
import { PAUSSNACK, SENT_VAL } from '../matchLiveText'

describe('matchLiveText — fastställd matchsvenska', () => {
  it('använder rätt uttryck i sent matchval', () => {
    expect(SENT_VAL.question).toBe('Gå för vinsten, eller stäng igen?')
  })

  it('skickar laget upp på motståndarens planhalva i paussnacket', () => {
    expect(PAUSSNACK.behind[0].line).toBe('Upp på deras halva direkt, det här vänder vi.')
  })
})
