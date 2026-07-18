import { describe, it, expect } from 'vitest'
import { generateInjuryInboxItem } from '../matchInjuryService'
import type { MatchInjuryEvent } from '../matchInjuryService'
import { LONGTERM_ARC_LINES } from '../../data/injuryDoctorText'
import { PlayerPosition, PlayerArchetype } from '../../enums'
import type { Player } from '../../entities/Player'

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player_test_1',
    firstName: 'Erik',
    lastName: 'Karlsson',
    age: 24,
    nationality: 'svenska',
    clubId: 'club_test',
    isHomegrown: true,
    position: PlayerPosition.Forward,
    archetype: PlayerArchetype.Finisher,
    salary: 8000,
    contractUntilSeason: 2028,
    marketValue: 150000,
    morale: 70,
    form: 65,
    fitness: 80,
    sharpness: 70,
    currentAbility: 62,
    potentialAbility: 75,
    developmentRate: 55,
    injuryProneness: 25,
    discipline: 72,
    attributes: {
      skating: 60, acceleration: 65, stamina: 58, ballControl: 56,
      passing: 50, shooting: 72, dribbling: 55, vision: 48,
      decisions: 60, workRate: 55, positioning: 64, defending: 35,
      cornerSkill: 40, goalkeeping: 18,
    },
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    seasonStats: {
      gamesPlayed: 10, goals: 5, assists: 3, cornerGoals: 1, penaltyGoals: 0,
      yellowCards: 1, redCards: 0, suspensions: 0, averageRating: 6.8, minutesPlayed: 900,
    },
    careerStats: { totalGames: 50, totalGoals: 20, totalAssists: 15, seasonsPlayed: 3 },
    ...overrides,
  }
}

function makeEvent(overrides: Partial<MatchInjuryEvent> = {}): MatchInjuryEvent {
  return {
    playerId: 'player_test_1',
    type: 'fall_pa_is',
    minute: 34,
    weeksOut: 3,
    requiresSubstitution: true,
    description: 'test',
    ...overrides,
  }
}

describe('generateInjuryInboxItem — pool 1e (langtid-bågen)', () => {
  it('skenan (langtid-severity) body kommer ur LONGTERM_ARC_LINES, inte INJURY_INBOX_BODY', () => {
    const player = makePlayer()
    const event = makeEvent({ type: 'skenan', weeksOut: 35 })
    const item = generateInjuryInboxItem(player, event, 2025, 10)

    const spelare = `${player.firstName} ${player.lastName}`
    const possibleBodies = LONGTERM_ARC_LINES.map(line => line.replace(/\{spelare\}/g, spelare))
    expect(possibleBodies).toContain(item.body)
  })

  it('övriga skadetyper behåller sin befintliga, oförändrade diagnostext', () => {
    const player = makePlayer()
    const event = makeEvent({ type: 'fall_pa_is', weeksOut: 3 })
    const item = generateInjuryInboxItem(player, event, 2025, 10)
    expect(item.body).toContain('Röntgen visar en spricka i handleden')
  })

  it('fromRole faller tillbaka till "Medicinsk stab" utan doctor, bär doktorns namn med', () => {
    const player = makePlayer()
    const event = makeEvent()
    const withoutDoctor = generateInjuryInboxItem(player, event, 2025, 10)
    expect(withoutDoctor.fromRole).toBe('Medicinsk stab')

    const withDoctor = generateInjuryInboxItem(player, event, 2025, 10, { name: 'Henrik', style: 'torr' })
    expect(withDoctor.fromRole).toBe('Henrik')
  })
})
