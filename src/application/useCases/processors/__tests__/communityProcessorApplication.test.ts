import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import {
  applyCommunityRoundResult,
  type CommunityProcessorResult,
} from '../communityProcessor'

function makeResult(
  overrides: Partial<CommunityProcessorResult> = {},
): CommunityProcessorResult {
  return {
    csBoost: 2,
    klackMoodDelta: 0,
    inboxItems: [],
    updatedFacilityState: undefined,
    facilityBonusTotal: 0,
    facilityCapacityBonus: 0,
    completedNodeId: null,
    updatedVolunteers: [],
    updatedVolunteerMorale: {},
    updatedCommunityActivitiesSince: {},
    ...overrides,
  }
}

describe('applyCommunityRoundResult — ARCH-001 community completion', () => {
  it('applies pulse drift, facility gains, kommunstöd and the durable completion entry together', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 17 })
    const managedBefore = game.clubs.find(club => club.id === game.managedClubId)!
    const otherBefore = game.clubs.find(club => club.id !== game.managedClubId)!
    const result = applyCommunityRoundResult(
      { ...game, communityStanding: 40 },
      game.clubs,
      makeResult({
        facilityBonusTotal: 7,
        facilityCapacityBonus: 125,
        completedNodeId: 'kiosk',
      }),
      25_000,
      9,
    )

    const managedAfter = result.clubs.find(club => club.id === game.managedClubId)!
    const otherAfter = result.clubs.find(club => club.id === otherBefore.id)!
    expect(result.csBoost).toBeCloseTo(2.6, 8)
    expect(managedAfter.facilities).toBe(Math.min(100, managedBefore.facilities + 7))
    expect(managedAfter.arenaCapacity).toBe(
      (managedBefore.arenaCapacity ?? Math.round(managedBefore.reputation * 7 + 150)) + 125,
    )
    expect(managedAfter.finances).toBe(managedBefore.finances + 25_000)
    expect(otherAfter).toEqual(otherBefore)
    expect(result.ledgerEntries).toEqual([
      expect.objectContaining({
        type: 'facility_built',
        season: game.currentSeason,
        matchday: 9,
        subject: { kind: 'club', id: game.managedClubId },
      }),
    ])
  })

  it('closes the hall trial only when the completed node is the match hall', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 17 })
    const facilityState = {
      builtNodeIds: ['matchhall'],
      hallTrial: {
        stage: 'bygge' as const,
        support: 80,
        startedSeason: game.currentSeason,
        stageStartedRound: 4,
      },
    }
    const result = applyCommunityRoundResult(
      game,
      game.clubs,
      makeResult({ updatedFacilityState: facilityState, completedNodeId: 'matchhall' }),
      0,
      12,
    )

    expect(result.facilityState?.hallTrial).toMatchObject({
      stage: 'klar',
      completedSeason: game.currentSeason,
    })
    expect(result.clubs.find(club => club.id === game.managedClubId)?.hasIndoorArena).toBe(true)
  })

  it('does not mutate hall state, club finances or ledger when nothing completed or paid', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 17 })
    const result = applyCommunityRoundResult(game, game.clubs, makeResult(), 0, 5)

    expect(result.clubs).toBe(game.clubs)
    expect(result.facilityState).toBeUndefined()
    expect(result.ledgerEntries).toEqual([])
  })
})
