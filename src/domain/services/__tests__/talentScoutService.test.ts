import { describe, expect, it } from 'vitest'
import { generateWorld } from '../worldGenerator'
import { executeTalentSearch, getScoutablePlayers } from '../talentScoutService'

describe('external academy scouting (C-T5)', () => {
  const world = generateWorld(2026, 17)
  const managedClubId = world.clubs[0].id
  const externalClub = world.clubs[1]
  const ownPlayer = world.players.find(player => player.clubId === managedClubId)!
  const externalPlayer = world.players.find(player => player.clubId === externalClub.id)!

  const externalAcademyPlayer = {
    ...externalPlayer,
    id: 'external-academy-prospect',
    age: 17,
    clubId: externalClub.id,
    academyClubId: externalClub.id,
    salary: 900,
  }

  it('includes another club\'s academy player in the direct scouting population', () => {
    const scoutable = getScoutablePlayers(
      [ownPlayer, externalAcademyPlayer],
      managedClubId,
    )

    expect(scoutable.map(player => player.id)).toEqual(['external-academy-prospect'])
  })

  it('can return another club\'s academy player from talent search', () => {
    const result = executeTalentSearch(
      {
        id: 'search-external-academy',
        position: 'any',
        maxAge: 19,
        maxSalary: 2_000,
        roundsRemaining: 0,
      },
      [ownPlayer, externalAcademyPlayer],
      world.clubs,
      managedClubId,
      () => 0,
      2026,
      1,
    )

    expect(result.players.map(player => player.playerId)).toContain('external-academy-prospect')
    expect(result.players.map(player => player.playerId)).not.toContain(ownPlayer.id)
  })
})
