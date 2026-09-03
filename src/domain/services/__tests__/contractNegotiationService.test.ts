import { describe, expect, it } from 'vitest'
import { evaluateContractOffer, getContractSalaryRange, getRequiredContractSalary } from '../contractNegotiationService'

const player = {
  currentAbility: 72,
  form: 70,
  potentialAbility: 76,
  transferPersonality: 'default' as const,
}

describe('contractNegotiationService', () => {
  it('visar ett spann i stället för den exakta acceptgränsen', () => {
    expect(getContractSalaryRange(12_500)).toEqual({ min: 12_000, max: 14_000 })
  })

  it('gör ett kort kontrakt dyrare och tre års trygghet billigare', () => {
    expect(getRequiredContractSalary(player, 12_000, 1)).toBeGreaterThan(getRequiredContractSalary(player, 12_000, 2))
    expect(getRequiredContractSalary(player, 12_000, 3)).toBeLessThan(getRequiredContractSalary(player, 12_000, 2))
  })

  it('avvisar under kravet och lämnar ett motkrav', () => {
    expect(evaluateContractOffer(player, 12_000, 10_000, 2, () => 0.99)).toEqual({
      accepted: false,
      counterSalary: 12_000,
    })
  })

  it('accepterar ett tydligt premiumbud utan dolt tärningsslag', () => {
    expect(evaluateContractOffer(player, 12_000, 14_000, 2, () => 0)).toEqual({ accepted: true })
  })
})
