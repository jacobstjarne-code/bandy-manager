import { describe, expect, it } from 'vitest'
import type { SaveGame } from '../../entities/SaveGame'
import { checkReputationMilestones } from '../reputationMilestoneService'

function makeGame(position: number, communityStanding: number): SaveGame {
  return {
    managedClubId: 'managed',
    currentSeason: 2027,
    communityStanding,
    clubs: [{ id: 'managed', reputation: 50, youthQuality: 50 }],
    standings: [{ clubId: 'managed', position }],
    players: [],
    // Isolera de två ryktemilstolparna från den äldre grannklubbs-systern.
    resolvedEventIds: ['rep_neighbor_2027'],
  } as unknown as SaveGame
}

describe('reputationMilestoneService — communityStanding-ramper', () => {
  it('topplacering skalar ryktesbonusen +1→+3 utan den gamla 60/61-klippan', () => {
    expect(checkReputationMilestones(makeGame(3, 55))).toEqual([])
    expect(checkReputationMilestones(makeGame(3, 56))[0]?.effect).toEqual({ type: 'reputation', amount: 1 })
    expect(checkReputationMilestones(makeGame(3, 70))[0]?.effect).toEqual({ type: 'reputation', amount: 2 })
    expect(checkReputationMilestones(makeGame(3, 90))[0]?.effect).toEqual({ type: 'reputation', amount: 3 })
  })

  it('bottenplacering speglar samma ramp och skalar ryktesfallet −1→−3', () => {
    expect(checkReputationMilestones(makeGame(10, 45))).toEqual([])
    expect(checkReputationMilestones(makeGame(10, 44))[0]?.effect).toEqual({ type: 'reputation', amount: -1 })
    expect(checkReputationMilestones(makeGame(10, 30))[0]?.effect).toEqual({ type: 'reputation', amount: -2 })
    expect(checkReputationMilestones(makeGame(10, 10))[0]?.effect).toEqual({ type: 'reputation', amount: -3 })
  })

  it('tabellpositionen är fortfarande den sportsliga grinden', () => {
    expect(checkReputationMilestones(makeGame(4, 90))).toEqual([])
    expect(checkReputationMilestones(makeGame(9, 10))).toEqual([])
  })
})
