import { describe, expect, it } from 'vitest'
import type { GameEvent } from '../../../../domain/entities/GameEvent'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { handleSeasonEnd } from '../../../../application/useCases/seasonEndProcessor'
import { CLUB_TEMPLATES } from '../../../../domain/services/worldGenerator'
import { getRetirementCeremonyDisplayData } from '../CeremonyRetirement'

describe('retirementCeremony — frusen statistik efter spelarens pension', () => {
  it('läser legend-snapshotten när den pensionerade spelaren redan tagits ur players', () => {
    const game = {
      players: [],
      clubLegends: [{
        playerId: 'legend-1',
        name: 'K. Lindström',
        position: 'Forward',
        seasons: 7,
        totalGames: 143,
        totalGoals: 58,
        totalAssists: 41,
        titles: [],
        retiredSeason: 2027,
      }],
    } as SaveGame
    const event = {
      id: 'retirement_ceremony_legend-1_2027',
      type: 'retirementCeremony',
      title: 'Pensionsceremoni',
      body: 'Avsked.',
      relatedPlayerId: 'legend-1',
      sender: { name: 'Karl Lindström', role: 'Avgående spelare' },
      choices: [],
      resolved: false,
    } as GameEvent

    expect(getRetirementCeremonyDisplayData(game, event)).toEqual({
      playerName: 'Karl Lindström',
      seasons: 7,
      games: 143,
      goals: 58,
    })
  })

  it('fryser totalGames i legenden innan den pensionerade spelaren tas bort', () => {
    const base = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const candidate = base.players.find(player => player.clubId === base.managedClubId)!
    const game = {
      ...base,
      currentMatchday: 22,
      players: base.players.map(player => player.id === candidate.id
        ? {
            ...player,
            age: 45,
            currentAbility: 15,
            potentialAbility: Math.max(player.potentialAbility, 15),
            careerStats: {
              totalGames: 143,
              totalGoals: 58,
              totalAssists: 41,
              seasonsPlayed: 7,
            },
          }
        : player),
    }

    const rolled = handleSeasonEnd(game, 1).game
    const event = rolled.pendingEvents.find(item =>
      item.type === 'retirementCeremony' && item.relatedPlayerId === candidate.id
    )
    const legend = rolled.clubLegends?.find(item => item.playerId === candidate.id)

    expect(event).toBeDefined()
    expect(rolled.players.some(player => player.id === candidate.id)).toBe(false)
    expect(legend?.totalGames).toBe(143)
    expect(getRetirementCeremonyDisplayData(rolled, event!)).toMatchObject({
      games: 143,
      goals: 58,
    })
  })
})
