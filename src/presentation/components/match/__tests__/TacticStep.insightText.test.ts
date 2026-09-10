import { describe, expect, it } from 'vitest'
import { compactStrengthLabel, compactWeaknessLabel } from '../TacticStep'

describe('TacticStep — kompakt motståndarrad', () => {
  it('skriver lagdelar som substantiv efter styrka/svaghet', () => {
    expect(compactStrengthLabel('Bra målvakt')).toBe('målvakten')
    expect(compactWeaknessLabel('Svagt mittfält')).toBe('mittfältet')
  })

  it('översätter den gamla felaktiga halvlinje-etiketten i pågående saves', () => {
    expect(compactStrengthLabel('Stark halvlinje')).toBe('mittfältet')
    expect(compactWeaknessLabel('Svag halvlinje')).toBe('mittfältet')
  })
})
