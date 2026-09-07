import { describe, expect, it } from 'vitest'
import type { Fixture } from '../../../../domain/entities/Fixture'
import type { Player } from '../../../../domain/entities/Player'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { TrainingIntensity, TrainingType } from '../../../../domain/enums'
import { processManagedDevelopment } from '../developmentProcessor'

function player(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    clubId: 'managed',
    age: 22,
    currentAbility: 50,
    potentialAbility: 80,
    developmentRate: 75,
    discipline: 60,
    form: 70,
    isInjured: false,
    ...overrides,
  } as Player
}

function game(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    managedClubId: 'managed',
    chemistryStats: {},
    managedClubTraining: {
      type: TrainingType.Physical,
      intensity: TrainingIntensity.Hard,
    },
    mentorships: [],
    leadershipActions: [],
    ...overrides,
  } as unknown as SaveGame
}

describe('developmentProcessor', () => {
  it('bokför 90 gemensamma minuter för varje par i startelvan', () => {
    const players = [player('p1'), player('p2')]
    const fixture = {
      homeClubId: 'managed',
      awayClubId: 'away',
      homeLineup: {
        startingPlayerIds: ['p1', 'p2'],
        benchPlayerIds: [],
      },
      report: { playerRatings: { p1: 7, p2: 7 } },
    } as Fixture

    const result = processManagedDevelopment(game(), players, [fixture], 8)

    expect(result.chemistryStats['p1|p2']).toBe(90)
  })

  it('låter burnout-sänkningen styra effektiv intensitet utan att ändra inställningen', () => {
    const veteran = player('veteran', { age: 33 })
    const save = game({ burnoutTrainingSlowdownUntilRound: 8 })

    const result = processManagedDevelopment(save, [veteran], [], 8)

    expect(result.players[0].currentAbility).toBe(49.9)
    expect(save.managedClubTraining?.intensity).toBe(TrainingIntensity.Hard)
  })
})
