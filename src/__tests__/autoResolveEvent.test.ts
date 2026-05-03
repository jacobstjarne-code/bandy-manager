import { describe, it, expect } from 'vitest'
import { createNewGame } from '../application/useCases/createNewGame'
import { resolveEvent } from '../domain/services/events/eventResolver'
import { generateSilentMatchReport } from '../domain/services/silentMatchReportService'
import type { GameEvent } from '../domain/entities/GameEvent'

function makeNoChoiceEvent(type: GameEvent['type']): GameEvent {
  return {
    id: `test_${type}_auto`,
    type,
    title: 'Auto event',
    body: 'Auto body',
    choices: [],
    resolved: false,
    priority: 'low',
  }
}

describe('auto-resolve for no-choice events', () => {
  it('removes a fanLetter event from pendingEvents when resolved with any choiceId', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const evt = makeNoChoiceEvent('fanLetter')
    const gameWithEvent = { ...game, pendingEvents: [...(game.pendingEvents ?? []), evt] }

    expect(gameWithEvent.pendingEvents.some(e => e.id === evt.id)).toBe(true)

    const resolved = resolveEvent(gameWithEvent, evt.id, 'auto')
    expect(resolved.pendingEvents.some(e => e.id === evt.id)).toBe(false)
  })

  it('removes an opponentQuote event from pendingEvents when resolved', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const evt = makeNoChoiceEvent('opponentQuote')
    const gameWithEvent = { ...game, pendingEvents: [...(game.pendingEvents ?? []), evt] }

    const resolved = resolveEvent(gameWithEvent, evt.id, 'auto')
    expect(resolved.pendingEvents.some(e => e.id === evt.id)).toBe(false)
  })

  it('does not remove events that have choices (regular events unchanged)', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const evt: GameEvent = {
      id: 'test_regular',
      type: 'patronEvent',
      title: 'Patron event',
      body: 'Body',
      choices: [{ id: 'yes', label: 'Ja', effect: { type: 'noOp' } }],
      resolved: false,
    }
    const gameWithEvent = { ...game, pendingEvents: [...(game.pendingEvents ?? []), evt] }

    // Calling with wrong choiceId on event with choices — should return game unchanged
    const result = resolveEvent(gameWithEvent, evt.id, 'nonexistent_choice')
    expect(result.pendingEvents.some(e => e.id === evt.id)).toBe(true)
  })

  it('generateSilentMatchReport is not part of pendingEvents (isolation check)', () => {
    // Verify that the existing generateSilentMatchReport function is still importable
    // and does NOT create pendingEvents — it's only used in GranskaScreen directly
    expect(typeof generateSilentMatchReport).toBe('function')

    // The function generates a string report, not a GameEvent
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const fixture = game.fixtures[0]
    if (fixture) {
      const homeClub = game.clubs.find(c => c.id === fixture.homeClubId)
      const awayClub = game.clubs.find(c => c.id === fixture.awayClubId)
      const report = generateSilentMatchReport(fixture, homeClub?.name ?? '', awayClub?.name ?? '', game.managedClubId)
      // It returns a string, not an object with event shape
      expect(typeof report).toBe('string')
    }
  })
})
