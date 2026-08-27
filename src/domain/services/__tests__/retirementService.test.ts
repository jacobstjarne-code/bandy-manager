import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { getFarewellMatchPlayer, generateRetirementData } from '../retirementService'
import type { ActiveArc } from '../../entities/Narrative'
import type { CareerMilestone } from '../../entities/Player'

const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 5 })

describe('getFarewellMatchPlayer — pool 2 (delad gate-signal med coffeeRoomService)', () => {
  it('returnerar null utan aktiv veteran_farewell-arc', () => {
    expect(getFarewellMatchPlayer(base, base.fixtures[0])).toBeNull()
  })

  it('returnerar spelaren när nextFixture ÄR den sista hemmamatchen i säsongen', () => {
    const player = base.players.find(p => p.clubId === base.managedClubId)!
    const lastHomeFixture = base.fixtures
      .filter(f => f.season === base.currentSeason && !f.isCup && f.homeClubId === base.managedClubId)
      .sort((a, b) => b.matchday - a.matchday)[0]

    const arc: ActiveArc = {
      id: 'arc_test', type: 'veteran_farewell', playerId: player.id,
      startedMatchday: 1, phase: 'peak', expiresMatchday: 22,
    }
    const game = { ...base, activeArcs: [arc] }

    const result = getFarewellMatchPlayer(game, lastHomeFixture)
    expect(result?.id).toBe(player.id)
  })

  it('returnerar null om nextFixture INTE är den sista hemmamatchen', () => {
    const player = base.players.find(p => p.clubId === base.managedClubId)!
    const homeFixtures = base.fixtures
      .filter(f => f.season === base.currentSeason && !f.isCup && f.homeClubId === base.managedClubId)
      .sort((a, b) => a.matchday - b.matchday)
    const notLastHome = homeFixtures[0]

    const arc: ActiveArc = {
      id: 'arc_test', type: 'veteran_farewell', playerId: player.id,
      startedMatchday: 1, phase: 'peak', expiresMatchday: 22,
    }
    const game = { ...base, activeArcs: [arc] }

    expect(getFarewellMatchPlayer(game, notLastHome)).toBeNull()
  })

  it('returnerar null utan nextFixture (säsongsslut)', () => {
    const player = base.players.find(p => p.clubId === base.managedClubId)!
    const arc: ActiveArc = {
      id: 'arc_test', type: 'veteran_farewell', playerId: player.id,
      startedMatchday: 1, phase: 'peak', expiresMatchday: 22,
    }
    const game = { ...base, activeArcs: [arc] }
    expect(getFarewellMatchPlayer(game, null)).toBeNull()
    expect(getFarewellMatchPlayer(game, undefined)).toBeNull()
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
