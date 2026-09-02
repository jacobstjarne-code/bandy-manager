import { describe, expect, it } from 'vitest'
import type { GameEvent } from '../../../../domain/entities/GameEvent'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { handleSeasonEnd } from '../../../../application/useCases/seasonEndProcessor'
import { CLUB_TEMPLATES } from '../../../../domain/services/worldGenerator'
import { resolveEvent } from '../../../../domain/services/events/eventResolver'
import {
  getRetirementCeremonyDisplayData,
  getRetirementCeremonyFarewellText,
} from '../CeremonyRetirement'

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

  it('visar det redan citerade avskedet exakt en gång och döljer valfrågan', () => {
    const body = '"Den här klubben är mitt hjärta." — Karl Lindström Vill du erbjuda en roll i föreningen?'
    expect(getRetirementCeremonyFarewellText(body)).toBe(
      '"Den här klubben är mitt hjärta." — Karl Lindström',
    )
  })

  it('namnger bara en kvarvarande lärling och lovar inget ospårat framtidsutfall', () => {
    const base = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const managed = base.players.filter(player => player.clubId === base.managedClubId)
    const [candidate, departedProtégé, activeProtégé] = managed
    const game = {
      ...base,
      currentMatchday: 22,
      mentorshipHistory: [
        { seniorPlayerId: candidate.id, youthPlayerId: departedProtégé.id, startRound: 1, outcome: 'ended' as const },
        { seniorPlayerId: candidate.id, youthPlayerId: activeProtégé.id, startRound: 2, outcome: 'graduated' as const },
      ],
      players: base.players.map(player => {
        if (player.id === candidate.id) {
          return {
            ...player,
            age: 45,
            currentAbility: 15,
            potentialAbility: Math.max(player.potentialAbility, 15),
            careerStats: { totalGames: 143, totalGoals: 58, totalAssists: 41, seasonsPlayed: 7 },
          }
        }
        if (player.id === departedProtégé.id) return { ...player, clubId: CLUB_TEMPLATES[1].id }
        return player
      }),
    }

    const rolled = handleSeasonEnd(game, 1).game
    const event = rolled.pendingEvents.find(item =>
      item.type === 'retirementCeremony' && item.relatedPlayerId === candidate.id
    )

    expect(event).toBeDefined()
    expect(event?.body).toContain(
      `Fostrade ${activeProtégé.firstName} ${activeProtégé.lastName}, ${activeProtégé.age + 1} år.`,
    )
    expect(event?.body).not.toContain(departedProtégé.lastName)
    expect(event?.body).not.toContain('stafettpinnen')
  })

  it.each([
    ['youth_coach', 'youth_coach'],
    ['scout', 'scout'],
    ['farewell', 'farewell'],
  ] as const)('applicerar %s-valet genom den riktiga eventresolven', (choiceId, expectedRole) => {
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
            careerStats: { totalGames: 143, totalGoals: 58, totalAssists: 41, seasonsPlayed: 7 },
          }
        : player),
    }
    const rolled = handleSeasonEnd(game, 1).game
    const event = rolled.pendingEvents.find(item =>
      item.type === 'retirementCeremony' && item.relatedPlayerId === candidate.id
    )!
    const youthQualityBefore = rolled.clubs.find(club => club.id === rolled.managedClubId)?.youthQuality ?? 50
    const scoutBudgetBefore = rolled.scoutBudget ?? 10

    const resolved = resolveEvent(rolled, event.id, choiceId, () => 0.5, true)
    const legend = resolved.clubLegends?.find(item => item.playerId === candidate.id)
    const managedClub = resolved.clubs.find(club => club.id === resolved.managedClubId)

    expect(legend?.role).toBe(expectedRole)
    expect(resolved.pendingEvents.some(item => item.id === event.id)).toBe(false)
    expect(managedClub?.youthQuality).toBe(
      choiceId === 'youth_coach' ? Math.min(100, youthQualityBefore + 5) : youthQualityBefore,
    )
    expect(resolved.scoutBudget).toBe(
      choiceId === 'scout' ? Math.min(30, scoutBudgetBefore + 3) : scoutBudgetBefore,
    )
  })
})
