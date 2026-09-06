import { describe, expect, it } from 'vitest'
import { PlayerArchetype } from '../../enums'
import { mulberry32 } from '../../utils/random'
import {
  calculateArchetypeWeightedAbility,
  generatePlayerAttributes,
  PLAYER_ATTRIBUTE_KEYS,
} from '../playerAttributeGenerator'

const ARCHETYPES = Object.values(PlayerArchetype)

describe('generatePlayerAttributes', () => {
  it.each(ARCHETYPES)('round-trippar CA för %s', archetype => {
    for (const currentAbility of [10, 20, 35, 50, 70, 90]) {
      const attributes = generatePlayerAttributes({
        currentAbility,
        archetype,
        rng: { next: mulberry32(currentAbility * 100 + ARCHETYPES.indexOf(archetype)) },
      })

      expect(calculateArchetypeWeightedAbility(attributes, archetype)).toBeCloseTo(currentAbility, 0)
      for (const attribute of PLAYER_ATTRIBUTE_KEYS) {
        expect(attributes[attribute]).toBeGreaterThanOrEqual(1)
        expect(attributes[attribute]).toBeLessThanOrEqual(99)
      }
    }
  })

  it('är deterministisk för samma frö', () => {
    const first = generatePlayerAttributes({
      currentAbility: 42,
      archetype: PlayerArchetype.Playmaker,
      rng: { next: mulberry32(1234) },
    })
    const second = generatePlayerAttributes({
      currentAbility: 42,
      archetype: PlayerArchetype.Playmaker,
      rng: { next: mulberry32(1234) },
    })

    expect(second).toEqual(first)
  })

  it('behåller arketypens utvecklingsprofil', () => {
    const playmaker = generatePlayerAttributes({
      currentAbility: 50,
      archetype: PlayerArchetype.Playmaker,
      rng: { next: () => 0.5 },
    })

    expect(playmaker.passing).toBeGreaterThan(playmaker.shooting)
    expect(playmaker.vision).toBeGreaterThan(playmaker.defending)
    expect(playmaker.goalkeeping).toBeLessThan(playmaker.ballControl)
  })
})
