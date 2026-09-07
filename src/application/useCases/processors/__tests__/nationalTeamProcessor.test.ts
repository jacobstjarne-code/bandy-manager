import { describe, expect, it } from 'vitest'
import type { Player } from '../../../../domain/entities/Player'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { LANDSLAGS_CA_TROSKEL } from '../../../../domain/services/nationalTeamService'
import { processNationalTeamRound } from '../nationalTeamProcessor'

function player(overrides: Partial<Player> = {}): Player {
  return {
    id: 'near-miss',
    firstName: 'Erik',
    lastName: 'Jansson',
    clubId: 'managed',
    currentAbility: LANDSLAGS_CA_TROSKEL - 1,
    form: 70,
    morale: 70,
    isInjured: false,
    suspensionGamesRemaining: 0,
    ...overrides,
  } as Player
}

function game(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    managedClubId: 'managed',
    currentSeason: 2,
    currentDate: '2027-01-15',
    inbox: [],
    players: [player()],
    seasonCalendar: [{ matchday: 14, isLandslagsuppehall: true }],
    ...overrides,
  } as unknown as SaveGame
}

describe('nationalTeamProcessor', () => {
  it('bevarar snubben som state och låter den synliga texten namnge samma spelare', () => {
    const save = game()
    const result = processNationalTeamRound(save, save.players, 14, false, false)

    expect(result.lastSnub).toEqual({ playerId: 'near-miss', season: 2, round: 14 })
    expect(result.players[0].morale).toBe(65)
    expect(result.players[0].form).toBe(67)
    expect(result.inboxItems).toHaveLength(1)
    expect(result.inboxItems[0].body).toContain('Erik Jansson')
  })

  it('avslutar ett passerat läger och sätter det tidsbegränsade hemkomstekot', () => {
    const calledUp = player({ id: 'called-up', currentAbility: LANDSLAGS_CA_TROSKEL + 2 })
    const save = game({
      players: [calledUp],
      activeNationalTeamCamp: { startRound: 14, endRound: 15, playerIds: ['called-up'] },
      seasonCalendar: [],
    })

    const result = processNationalTeamRound(save, save.players, 16, false, false)

    expect(result.activeCamp).toBeUndefined()
    expect(result.players[0].morale).toBe(76)
    expect(result.pendingReturn?.text).toBeTruthy()
    expect(result.returnExpires).toBe(17)
  })
})
