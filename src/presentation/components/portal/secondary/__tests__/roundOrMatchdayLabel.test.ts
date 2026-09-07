import { describe, it, expect } from 'vitest'
import { roundOrMatchdayLabel } from '../EfterklangThreadModal'

/**
 * berattaren-en-kronologi (2026-09-07, Opus dom): Efterklangs trådvy visar
 * ofta anniversary-poster som spänner flera säsonger bakåt. Innan
 * currentChronology.ts blev säsongssäker (game.fixtures nollställs varje
 * rollover, det kunde inte datera annat än innevarande säsong) hade det
 * här testet fallit tillbaka till "MATCHDAG N" för varje äldre säsong.
 */
describe('roundOrMatchdayLabel — Efterklang-tråd flera säsonger bakåt', () => {
  it('en post från en ÄLDRE säsong (inte innevarande) får rätt omgångsetikett, inte en gissning', () => {
    // Säsong 1, matchdag 9 = omgång 5 (verklig kalender: cup 1-4, liga 5-26).
    // Efterklangens tråd kan visa denna trots att spelet är flera säsonger
    // senare — funktionen tar bara (matchday, season), ingen "nu"-referens.
    expect(roundOrMatchdayLabel(9, 1)).toBe('OMG 5')
  })

  it('en cupmatchdag (1-4) i en gammal säsong är fortfarande MATCHDAG, aldrig en gissad omgång', () => {
    expect(roundOrMatchdayLabel(2, 1)).toBe('MATCHDAG 2')
  })

  it('samma matchdagsnummer ger olika omgångsetikett i olika säsonger om kalendrarna skiljer sig inte — men samma väg används oavsett säsong', () => {
    expect(roundOrMatchdayLabel(5, 1)).toBe('OMG 1')
    expect(roundOrMatchdayLabel(5, 4)).toBe('OMG 1')
  })
})
