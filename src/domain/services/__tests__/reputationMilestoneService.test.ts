import { describe, expect, it } from 'vitest'
import type { SaveGame } from '../../entities/SaveGame'
import { checkReputationMilestones } from '../reputationMilestoneService'
import { ClubExpectation } from '../../enums'

// sluttest-be-blind-repmilestone (2026-09-03): checkReputationMilestones
// läser nu boardExpectation. MidTable (ankare 6) satt här reproducerar de
// gamla fasta pos<=3/pos>=10-trösklarna ordagrant, så testerna nedan
// behöver ingen egen ändring.
function makeGame(position: number, communityStanding: number, expectation: ClubExpectation = ClubExpectation.MidTable): SaveGame {
  return {
    managedClubId: 'managed',
    currentSeason: 2027,
    communityStanding,
    clubs: [{ id: 'managed', reputation: 50, youthQuality: 50, boardExpectation: expectation }],
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

  it('samma plats 3 ger mediauppmärksamhet för Survive men inte för WinLeague — grinden är nu förväntansrelativ', () => {
    expect(checkReputationMilestones(makeGame(3, 90, ClubExpectation.Survive))[0]?.trigger).toBe('mediaAttention')
    expect(checkReputationMilestones(makeGame(3, 90, ClubExpectation.WinLeague))).toEqual([])
  })
})
