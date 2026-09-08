import { describe, expect, it } from 'vitest'
import type { GameEvent } from '../../../../domain/entities/GameEvent'
import type { Patron } from '../../../../domain/entities/Community'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { createNewGame } from '../../createNewGame'
import { processPatronCommunityEvents } from '../eventProcessor'

function establishedGame(): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 17 })
  return {
    ...game,
    communityStanding: 70,
    patron: undefined,
    patronWithdrawnSeason: undefined,
    trainerArc: {
      current: 'grind',
      history: [],
      seasonCount: 1,
      bestFinish: 4,
      titlesWon: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      boardWarningGiven: false,
    },
  }
}

function activePatron(): Patron {
  return {
    id: 'patron_test_testsson',
    name: 'Test Testsson',
    business: 'AB Test',
    influence: 50,
    happiness: 80,
    contribution: 200_000,
    isActive: true,
    introducedSeason: 2026,
    hasBeenWarned: false,
    goodwill: 80,
    totalContributed: 0,
    demands: [],
  }
}

describe('eventProcessor — patron community threshold', () => {
  it('queues one emergence event for an established club above the threshold', () => {
    const game = establishedGame()
    const result = processPatronCommunityEvents(game, undefined, undefined, 8, () => 0, [])

    expect(result.gameEvents).toHaveLength(1)
    expect(result.gameEvents[0]).toMatchObject({
      id: `patron_emerge_${game.currentSeason}`,
      type: 'patronEvent',
    })
    expect(result.updatedPatron).toBeUndefined()
    expect(result.ledgerEntries).toEqual([])
  })

  it('deduplicates emergence against events already generated this round', () => {
    const game = establishedGame()
    const queued = [{
      id: `patron_emerge_${game.currentSeason}`,
      type: 'patronEvent',
      title: 'Redan köad',
      body: 'Redan köad',
      choices: [],
      resolved: false,
    }] as GameEvent[]

    const result = processPatronCommunityEvents(game, undefined, undefined, 8, () => 0, queued)

    expect(result.gameEvents).toEqual([])
  })

  it('withdraws an introduced patron below the threshold and records the canonical event', () => {
    const base = establishedGame()
    const patron = activePatron()
    const game = { ...base, communityStanding: 40, patron }
    const result = processPatronCommunityEvents(game, patron, undefined, 8, () => 0, [])

    expect(result.updatedPatron).toEqual({ ...patron, isActive: false })
    expect(result.patronWithdrawnSeason).toBe(game.currentSeason)
    expect(result.gameEvents).toContainEqual(expect.objectContaining({
      id: `patron_cs_eviction_${game.currentSeason}`,
      type: 'patronWithdrawal',
    }))
    expect(result.ledgerEntries).toEqual([expect.objectContaining({
      type: 'patron_withdrawal',
      semanticKey: `patron_cs_eviction_${game.currentSeason}`,
      subject: { kind: 'patron', id: patron.id },
      significance: 95,
    })])
  })
})
