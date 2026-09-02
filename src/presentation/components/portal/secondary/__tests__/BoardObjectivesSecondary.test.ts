import { describe, expect, it } from 'vitest'
import type { BoardObjective } from '../../../../../domain/entities/Community'
import { getSecondaryBoardObjectives } from '../BoardObjectivesSecondary'

function makeObjective(id: string, status: BoardObjective['status']): BoardObjective {
  return {
    id,
    type: 'sporting',
    label: id,
    description: '',
    ownerId: 'Test Testsson',
    ownerPersonality: 'traditionalist',
    targetValue: 6,
    currentValue: 3,
    measureFn: 'topHalf',
    status,
    assignedSeason: 1,
    successReward: '',
    failureConsequence: '',
    carryOver: false,
  }
}

describe('BoardObjectivesSecondary', () => {
  it('låter varningskortet ensamt äga mål i riskläge', () => {
    const objectives = [
      makeObjective('risk', 'at_risk'),
      makeObjective('aktivt', 'active'),
      makeObjective('missat', 'failed'),
    ]

    expect(getSecondaryBoardObjectives(objectives).map(o => o.id)).toEqual(['aktivt', 'missat'])
  })

  it('blir tomt när varningsmålet är det enda öppna målet', () => {
    expect(getSecondaryBoardObjectives([makeObjective('risk', 'at_risk')])).toEqual([])
  })
})
