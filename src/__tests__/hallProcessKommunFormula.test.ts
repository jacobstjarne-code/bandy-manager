/**
 * B1 §5 fix — kontinuerlig kommunandels-formel.
 * Låser att (a) generosity påverkar utfallet och (b) klippkanten vid relation 70 är borta.
 */
import { describe, it, expect } from 'vitest'
import { calcMaxKommunAndel } from '../domain/services/events/hallProcessService'

const infra = (overrides: { generosity?: number; relationship?: number; standing?: number } = {}) =>
  calcMaxKommunAndel(
    { agenda: 'infrastructure', generosity: overrides.generosity ?? 60, relationship: overrides.relationship ?? 60 },
    overrides.standing ?? 50,
  )

const savings = (overrides: { generosity?: number; relationship?: number; standing?: number } = {}) =>
  calcMaxKommunAndel(
    { agenda: 'savings', generosity: overrides.generosity ?? 60, relationship: overrides.relationship ?? 60 },
    overrides.standing ?? 50,
  )

describe('calcMaxKommunAndel — kontinuerlig form (B1 §5)', () => {
  it('generosity 90 ger högre andel än generosity 30, allt annat lika', () => {
    expect(infra({ generosity: 90 })).toBeGreaterThan(infra({ generosity: 30 }))
    expect(savings({ generosity: 90 })).toBeGreaterThan(savings({ generosity: 30 }))
  })

  it('ingen klippkant vid relation 70 — skillnad per punkt < 0.005', () => {
    const at70 = infra({ relationship: 70 })
    const at71 = infra({ relationship: 71 })
    expect(at71 - at70).toBeLessThan(0.005)
    // Gammal formel: +0.15 vid 71. Ny: kontinuerlig (ca 0.00015 per punkt).
  })

  it('clampar vid 0.50 uppåt (idealpolitiker)', () => {
    const ideal = calcMaxKommunAndel(
      { agenda: 'infrastructure', generosity: 90, relationship: 90 },
      80,
    )
    expect(ideal).toBe(0.50)
  })

  it('aldrig under 0.10 — golvet håller (extremt fientlig kombination)', () => {
    const hostile = calcMaxKommunAndel(
      { agenda: 'savings', generosity: 0, relationship: 0 },
      0,
    )
    expect(hostile).toBeGreaterThanOrEqual(0.10)
    expect(hostile).toBeLessThanOrEqual(0.15)  // fortfarande i nedre spannet
  })

  it('agenda-ordning: infrastructure > youth > savings (allt annat lika)', () => {
    const rel = { relationship: 50 }
    const infraVal  = calcMaxKommunAndel({ agenda: 'infrastructure', ...rel }, 50)
    const youthVal  = calcMaxKommunAndel({ agenda: 'youth', ...rel }, 50)
    const savingsVal = calcMaxKommunAndel({ agenda: 'savings', ...rel }, 50)
    expect(infraVal).toBeGreaterThan(youthVal)
    expect(youthVal).toBeGreaterThan(savingsVal)
  })

  it('resultat är monotont stigande med relation (inga lokala dipp)', () => {
    const vals = [0, 20, 40, 60, 70, 71, 80, 100].map(r =>
      infra({ relationship: r }),
    )
    for (let i = 1; i < vals.length; i++) {
      expect(vals[i]).toBeGreaterThanOrEqual(vals[i - 1])
    }
  })
})
