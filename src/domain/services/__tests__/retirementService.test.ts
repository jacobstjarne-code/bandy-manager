import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import {
  generateRetirementData,
  isRetiringClubLegendEligible,
  recordCompletedCaptainSeason,
} from '../retirementService'
import type { CareerMilestone } from '../../entities/Player'

const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 5 })

describe('kaptenshistorik och legendkriterium', () => {
  it('räknar bara den hanterade klubbens faktiska kapten och ackumulerar säsonger', () => {
    const captain = base.players.find(p => p.clubId === base.managedClubId)!
    const first = recordCompletedCaptainSeason(captain, captain.id, base.managedClubId)
    const second = recordCompletedCaptainSeason(first, captain.id, base.managedClubId)
    const afterLeaving = recordCompletedCaptainSeason(
      { ...second, clubId: 'club_other' },
      captain.id,
      base.managedClubId,
    )

    expect(first.wasCaptainSeasons).toBe(1)
    expect(second.wasCaptainSeasons).toBe(2)
    expect(afterLeaving.wasCaptainSeasons).toBe(2)
  })

  it('en ledare kvalificerar via två verkliga kaptenssäsonger, inte bara tid i klubben', () => {
    const player = base.players.find(p => p.clubId === base.managedClubId)!
    const ledare = {
      ...player,
      trait: 'ledare' as const,
      careerStats: { ...player.careerStats, totalGames: 20, seasonsPlayed: 2 },
    }

    expect(isRetiringClubLegendEligible({ ...ledare, wasCaptainSeasons: 1 })).toBe(false)
    expect(isRetiringClubLegendEligible({ ...ledare, wasCaptainSeasons: 2 })).toBe(true)
  })
})

/**
 * PÅSTÅENDEKARTAN SANNINGEN-SAKNAS-fix (2026-08-25): bestMoment ska
 * föredra en riktig hattrick-milstolpe (med motståndarnamn) framför den
 * slumpade mallpoolen när en sådan finns.
 */
describe('generateRetirementData — bestMoment föredrar en riktig hattrick-milstolpe', () => {
  it('använder milstolpens description (med motståndarnamn) när en hattrick-milstolpe finns', () => {
    const player = base.players.find(p => p.clubId === base.managedClubId)!
    const milestone: CareerMilestone = {
      type: 'hatTrick', season: 2025, round: 10,
      description: `${player.firstName} ${player.lastName} satte 3 mål mot Slottsbron`,
    }
    const withMilestone = {
      ...player,
      careerStats: { ...player.careerStats, totalGames: 50, totalGoals: 20, seasonsPlayed: 3 },
      careerMilestones: [milestone],
    }
    const data = generateRetirementData(withMilestone, base.managedClubId)
    expect(data.bestMoment).toBe(milestone.description)
    expect(data.bestMoment).toContain('Slottsbron')
  })

  it('väljer den SENASTE hattrick-milstolpen när flera finns', () => {
    const player = base.players.find(p => p.clubId === base.managedClubId)!
    const older: CareerMilestone = { type: 'hatTrick', season: 2023, round: 5, description: 'gammalt hattrick mot Rogle' }
    const newer: CareerMilestone = { type: 'hatTrick', season: 2025, round: 8, description: 'nytt hattrick mot Halleforsnas' }
    const withMilestones = {
      ...player,
      careerStats: { ...player.careerStats, totalGames: 50, totalGoals: 20, seasonsPlayed: 3 },
      careerMilestones: [older, newer],
    }
    const data = generateRetirementData(withMilestones, base.managedClubId)
    expect(data.bestMoment).toBe(newer.description)
  })

  it('faller tillbaka på mallpoolen utan en riktig hattrick-milstolpe', () => {
    const player = base.players.find(p => p.clubId === base.managedClubId)!
    const withoutMilestone = {
      ...player,
      careerStats: { ...player.careerStats, totalGames: 50, totalGoals: 20, seasonsPlayed: 3 },
      careerMilestones: [],
    }
    const data = generateRetirementData(withoutMilestone, base.managedClubId)
    expect(data.bestMoment).toBeDefined()
    expect(data.bestMoment).not.toContain('undefined')
  })
})
