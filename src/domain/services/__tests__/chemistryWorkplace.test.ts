import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import { calculatePairChemistry } from '../chemistryService'

describe('calculatePairChemistry — canonical arbetsgivare', () => {
  const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
  const [baseA, baseB] = game.players.filter(p => p.clubId === game.managedClubId)
  const common = { age: 27, isFullTimePro: false, loyaltyScore: 5 }

  it('ger arbetsplatskemi för olika yrken hos samma lokala arbetsgivare', () => {
    const a = { ...baseA, ...common, dayJob: { title: 'Lärare', flexibility: 70, weeklyIncome: 1000 } }
    const b = { ...baseB, ...common, dayJob: { title: 'Ekonom', flexibility: 70, weeklyIncome: 1000 } }

    const chemistry = calculatePairChemistry(a, b, 0)

    expect(chemistry.strength).toBe(0.25)
    expect(chemistry.reasons).toEqual([`Arbetskamrater på Sandvikens kommun`])
  })

  it('ger ingen arbetsplatsbonus för yrken hos olika arbetsgivare', () => {
    const a = { ...baseA, ...common, dayJob: { title: 'Lärare', flexibility: 70, weeklyIncome: 1000 } }
    const b = { ...baseB, ...common, dayJob: { title: 'Mekaniker', flexibility: 70, weeklyIncome: 1000 } }

    const chemistry = calculatePairChemistry(a, b, 0)

    expect(chemistry.strength).toBe(0)
    expect(chemistry.reasons).toEqual([])
  })
})
