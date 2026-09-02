import { describe, expect, it } from 'vitest'
import { FACILITY_NODE_DEFS } from '../facilityNodes'
import type { FacilityMechanicalHook } from '../../entities/Community'

describe('A-GRIND — deklarerade facility-effekter', () => {
  it('klassificerar varje synlig konsekvens explicit', () => {
    const consequences = FACILITY_NODE_DEFS.flatMap(def => def.consequences)

    expect(consequences).toHaveLength(28)
    expect(consequences.every(consequence => consequence.kind !== undefined)).toBe(true)
  })

  it('använder bara den slutna mängden verifierbara mekanikhooks', () => {
    const expectedHooks = new Set<FacilityMechanicalHook>([
      'construction_cost',
      'capacity_bonus',
      'facilities_training_bonus',
      'kiosk_sales_bonus',
    ])
    const hooks = FACILITY_NODE_DEFS.flatMap(def =>
      def.consequences.flatMap(consequence => consequence.kind === 'mechanical' ? [consequence.hook] : []),
    )

    expect(new Set(hooks)).toEqual(expectedHooks)
  })

  it('binder kostnadsraden till nodens faktiska listpris för alla vanliga noder', () => {
    for (const def of FACILITY_NODE_DEFS.filter(node => !node.isHall)) {
      const costClaims = def.consequences.filter(
        consequence => consequence.kind === 'mechanical' && consequence.hook === 'construction_cost',
      )
      expect(costClaims, def.id).toHaveLength(1)
      expect(costClaims[0].label, def.id).toBe(`Kassa −${Math.round(def.cost / 1000)} tkr`)
    }
  })

  it('kräver rätt noddata bakom kapacitets-, tränings- och kioskhooks', () => {
    for (const def of FACILITY_NODE_DEFS) {
      for (const consequence of def.consequences) {
        if (consequence.kind !== 'mechanical') continue
        if (consequence.hook === 'capacity_bonus') expect(def.capacityBonus, def.id).toBeGreaterThan(0)
        if (consequence.hook === 'facilities_training_bonus') expect(def.facilitiesBonus, def.id).toBeGreaterThan(0)
        if (consequence.hook === 'kiosk_sales_bonus') expect(def.id).toBe('kiosk')
      }
    }
  })
})
