import { describe, expect, it } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handlePlayoffStart } from '../playoffTransition'
import {
  generateFinalEvent,
  generateQuarterFinalEvent,
  generateSemiFinalEvent,
} from '../../../domain/services/playoffNarrativeService'
import { resolveEvent } from '../../../domain/services/events/eventResolver'
import { getDecisionMode, getDecisionTier } from '../../../domain/services/decisionTierService'
import { getDefaultRolloverChoice } from '../../../domain/services/deferredRolloverService'
import { FixtureStatus } from '../../../domain/enums'
import type { SaveGame } from '../../../domain/entities/SaveGame'

function playedWinningSeason(): SaveGame {
  const base = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 7 })
  return {
    ...base,
    pendingScreen: null,
    fixtures: base.fixtures.map(f => {
      if (f.isCup || f.isKnockout) return { ...f, status: FixtureStatus.Completed, homeScore: 1, awayScore: 0 }
      if (f.homeClubId === base.managedClubId) return { ...f, status: FixtureStatus.Completed, homeScore: 5, awayScore: 0 }
      if (f.awayClubId === base.managedClubId) return { ...f, status: FixtureStatus.Completed, homeScore: 0, awayScore: 5 }
      return { ...f, status: FixtureStatus.Completed, homeScore: 0, awayScore: 0 }
    }),
  }
}

describe('playoffEvent — O11:s text/state-kontrakt', () => {
  it('alla tre faser är notiser med ett rent kvitteringsval, inte falska dilemman', () => {
    const game = playedWinningSeason()
    const events = [
      generateQuarterFinalEvent(game),
      generateSemiFinalEvent(game),
      generateFinalEvent(game),
    ]

    expect(getDecisionTier('playoffEvent')).toBe('month')
    expect(getDecisionMode('playoffEvent')).toBe('notis')
    for (const event of events) {
      expect(event.choices).toHaveLength(1)
      expect(event.choices[0]).toMatchObject({ id: 'ack', effect: { type: 'noOp' } })
      // Ett obesvarat slutspelsögonblick ska inte auto-kvitteras åt spelaren.
      expect(getDefaultRolloverChoice(event)).toBeNull()
    }
  })

  it('kvittering ändrar ingen trupp-, klubb- eller relationsstate', () => {
    const game = playedWinningSeason()
    const event = generateQuarterFinalEvent(game)
    const prepared = { ...game, pendingEvents: [event] }
    const resolved = resolveEvent(prepared, event.id, 'ack', undefined, true)

    expect(resolved.players).toEqual(prepared.players)
    expect(resolved.clubs).toEqual(prepared.clubs)
    expect(resolved.communityStanding).toBe(prepared.communityStanding)
    expect(resolved.fanMood).toBe(prepared.fanMood)
    expect(resolved.patron).toEqual(prepared.patron)
    expect(resolved.pendingEvents).toEqual([])
    expect(resolved.resolvedChoices?.at(-1)).toMatchObject({
      eventId: event.id,
      eventType: 'playoffEvent',
      choiceId: 'ack',
      madeByPlayer: true,
    })
  })

  it('skapar inte ett andra QF-kort om samma canonical kort redan är defererat', () => {
    const game = playedWinningSeason()
    const deferred = generateQuarterFinalEvent(game)
    const result = handlePlayoffStart({ ...game, deferredDecisions: [deferred] }).game
    const all = [...(result.pendingEvents ?? []), ...(result.deferredDecisions ?? [])]
      .filter(e => e.id === deferred.id)

    expect(all).toHaveLength(1)
    expect(result.pendingEvents?.some(e => e.id === deferred.id)).toBe(false)
  })
})
