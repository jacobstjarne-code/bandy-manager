import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { BoardObjectivesList } from '../BoardObjectivesList'
import type { BoardObjective } from '../../../../../domain/entities/Community'

// 5.1 fynd 5 (SLUTTEST_KO.md, 2026-08-19): hideProgress-prop döljer
// framstegsblocket ("Framsteg X/Y" + stapel, eller ekonomiska balansraden)
// utan att röra Portal/ArrivalScene:s befintliga bruk (default false).
// @testing-library/react är inte installerat i projektet — renderToStaticMarkup
// (react-dom/server) räcker för att verifiera faktiskt renderad HTML.

function makeObj(overrides: Partial<BoardObjective>): BoardObjective {
  return {
    id: 'test', type: 'sporting', label: 'Nå slutspel', description: '',
    ownerId: 'Test Testsson', ownerPersonality: 'traditionalist',
    targetValue: 6, currentValue: 3, measureFn: 'topHalf',
    status: 'active', assignedSeason: 1,
    successReward: '', failureConsequence: '', carryOver: false,
    ...overrides,
  }
}

describe('BoardObjectivesList — hideProgress', () => {
  it('default (false): framstegsblocket renderas', () => {
    const html = renderToStaticMarkup(<BoardObjectivesList objectives={[makeObj({})]} />)
    expect(html).toContain('Framsteg')
    expect(html).toContain('Nå slutspel')
  })

  it('hideProgress=true: framstegsblocket döljs, etikett/ägare kvar', () => {
    const html = renderToStaticMarkup(<BoardObjectivesList objectives={[makeObj({})]} hideProgress />)
    expect(html).not.toContain('Framsteg')
    expect(html).toContain('Nå slutspel')
  })

  it('hideProgress=true döljer även den ekonomiska balansraden', () => {
    const balanceObj = makeObj({ type: 'economic', measureFn: 'balanceBudget', currentValue: 50000, targetValue: 100000, label: 'Balansera budgeten' })
    const shown = renderToStaticMarkup(<BoardObjectivesList objectives={[balanceObj]} />)
    const hidden = renderToStaticMarkup(<BoardObjectivesList objectives={[balanceObj]} hideProgress />)
    expect(shown).toContain('av mål')
    expect(hidden).not.toContain('av mål')
    expect(hidden).toContain('Balansera budgeten')
  })
})
