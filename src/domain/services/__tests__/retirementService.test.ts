import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { getFarewellMatchPlayer } from '../retirementService'
import type { ActiveArc } from '../../entities/Narrative'

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
