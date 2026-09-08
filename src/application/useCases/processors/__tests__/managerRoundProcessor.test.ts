import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { processManagerRoundState } from '../managerRoundProcessor'

function createContext() {
  const game = createNewGame({
    managerName: 'Test',
    clubId: 'club_forsbacka',
    season: 2025,
    seed: 42,
  })

  return {
    previousGame: game,
    game,
    justCompletedManagedFixture: null,
    nextMatchday: 2,
    newClubEra: game.currentEra ?? ('survival' as const),
    burnoutCeilingQueuedThisRound: false,
    skipSideEffects: false,
  }
}

describe('managerRoundProcessor', () => {
  it('lämnar spelet orört under andra passet för samma match', () => {
    const context = { ...createContext(), skipSideEffects: true }

    expect(processManagerRoundState(context)).toBe(context.game)
  })

  it('samlar beslutsbörda och trupppuls i efterrundsjournalen', () => {
    const context = createContext()
    const fatigueCount = context.game.fatigueHistory?.length ?? 0
    const pulseCount = context.game.teamFitnessHistory?.length ?? 0

    const result = processManagerRoundState(context)

    expect(result.fatigueHistory).toHaveLength(fatigueCount + 1)
    expect(result.teamFitnessHistory).toHaveLength(pulseCount + 1)
    expect(result.teamFitnessHistory?.at(-1)?.matchday).toBe(context.nextMatchday)
  })

  it('stämplar burnout-takets val när eventet köas samma omgång', () => {
    const context = createContext()
    context.game = {
      ...context.game,
      managerProfile: {
        ...context.game.managerProfile!,
        burnoutScore: 100,
        burnoutCeilingChoiceOffered: false,
      },
    }

    const result = processManagerRoundState({
      ...context,
      burnoutCeilingQueuedThisRound: true,
    })

    expect(result.managerProfile?.burnoutCeilingChoiceOffered).toBe(true)
  })
})
