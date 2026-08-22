/**
 * High 2 (Skutskär-auditen, 2026-08-22, Jacobs dom) — hårt villkor: en
 * spelare under SPELKLARHET_FITNESS_FLOOR (22) kan aldrig få en good/neutral
 * "startade trött"-rad, oavsett matchbetyg. Ingen fjärde riktning.
 */
import { describe, it, expect } from 'vitest'
import { getStartedTiredDirection } from '../presentation/screens/granska/helpers'

describe('getStartedTiredDirection', () => {
  it('under golvet (22) tvingar bad även vid toppbetyg', () => {
    expect(getStartedTiredDirection('15', 9, 'good')).toBe('bad')
  })

  it('precis på golvet räknas som spelklar, inte under', () => {
    expect(getStartedTiredDirection('22', 9, 'good')).toBe('good')
  })

  it('precis under golvet är bad', () => {
    expect(getStartedTiredDirection('21', 9, 'good')).toBe('bad')
  })

  it('över golvet med högt betyg → good', () => {
    expect(getStartedTiredDirection('60', 8, 'neutral')).toBe('good')
  })

  it('över golvet med lågt betyg → bad', () => {
    expect(getStartedTiredDirection('60', 3, 'neutral')).toBe('bad')
  })

  it('över golvet med mellanbetyg → neutral', () => {
    expect(getStartedTiredDirection('60', 6, 'good')).toBe('neutral')
  })

  it('inget betyg tillgängligt → faller tillbaka på kvittoDir', () => {
    expect(getStartedTiredDirection('60', undefined, 'bad')).toBe('bad')
    expect(getStartedTiredDirection('60', undefined, 'good')).toBe('good')
  })

  it('otolkbar kondition (icke-numerisk) hoppar över golv-kollen, faller tillbaka på betyg', () => {
    expect(getStartedTiredDirection('okänd', 8, 'neutral')).toBe('good')
  })
})
