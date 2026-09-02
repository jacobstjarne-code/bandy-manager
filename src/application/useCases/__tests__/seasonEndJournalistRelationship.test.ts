import { describe, expect, it } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'

describe('seasonEndProcessor — canonical journalistrelation', () => {
  it('utgår från journalist.relationship och dual-write:ar legacyfältet', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const result = handleSeasonEnd({
      ...game,
      journalist: { ...game.journalist!, relationship: 67 },
      journalistRelationship: 12,
    }, 123).game

    expect(result.journalist?.relationship).toBe(67)
    expect(result.journalistRelationship).toBe(67)
  })

  it('skriver en grävande artikels relationsfall till både canonical och legacy state', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const result = handleSeasonEnd({
      ...game,
      clubs: game.clubs.map(club => club.id === game.managedClubId ? { ...club, finances: -100_000 } : club),
      journalist: { ...game.journalist!, relationship: 24 },
      journalistRelationship: 80,
    }, 123).game

    expect(result.journalist?.relationship).toBe(19)
    expect(result.journalistRelationship).toBe(19)
  })
})
