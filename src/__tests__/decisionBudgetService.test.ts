/**
 * decisionBudgetService — tester för tryQueueDecision och promoteFromQueue
 *
 * Verifierar:
 * 1. tryQueueDecision lägger i pendingEvents när budget tillgänglig
 * 2. tryQueueDecision lägger i deferredDecisions när budget full
 * 3. deferredDecisions capas vid 10 (äldsta droppas)
 * 4. promoteFromQueue lyfter första från kön till pendingEvents
 */

import { describe, it, expect } from 'vitest'
import {
  tryQueueDecision,
  promoteFromQueue,
  MAX_DEFERRED_DECISIONS,
} from '../domain/services/decisionBudgetService'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { GameEvent } from '../domain/entities/GameEvent'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEvent(id: string): GameEvent {
  return {
    id,
    type: 'community_goodwill',
    title: `Event ${id}`,
    body: 'Test event',
    date: '2026-10-01',
    choices: [],
  } as unknown as GameEvent
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    managerName: 'Tränare',
    managedClubId: 'club_a',
    currentDate: '2026-10-15',
    currentSeason: 2,
    currentMatchday: 5,
    clubs: [],
    players: [],
    league: { id: 'l1', name: 'Test', clubs: [] } as never,
    fixtures: [],
    standings: [],
    inbox: [],
    transferState: {} as never,
    youthIntakeHistory: [],
    matchWeathers: [],
    managedClubTraining: 'balanced' as never,
    trainingHistory: [],
    playoffBracket: null,
    cupBracket: null,
    pendingEvents: [],
    deferredDecisions: [],
    transferBids: [],
    handledContractPlayerIds: [],
    sponsors: [],
    activeTalentSearch: null,
    talentSearchResults: [],
    mentorships: [],
    loanDeals: [],
    academyLevel: 'none' as never,
    scoutReports: {},
    activeScoutAssignment: null,
    scoutBudget: 0,
    seasonSummaries: [],
    version: '1.0',
    lastSavedAt: '2026-10-15T00:00:00',
    ...overrides,
  } as SaveGame
}

// ── Tester ───────────────────────────────────────────────────────────────────

describe('tryQueueDecision', () => {
  it('lägger event i pendingEvents när budget är tillgänglig (0 aktiva av 2)', () => {
    const game = makeGame({ pendingEvents: [], deferredDecisions: [] })
    const event = makeEvent('evt1')
    const result = tryQueueDecision(game, event)
    expect(result.pendingEvents).toContainEqual(event)
    expect(result.deferredDecisions).toHaveLength(0)
  })

  it('lägger event i pendingEvents när 1 aktiv av max 2', () => {
    const existing = makeEvent('existing')
    const game = makeGame({
      pendingEvents: [{ ...existing, resolved: false }] as never,
      deferredDecisions: [],
    })
    const event = makeEvent('evt2')
    const result = tryQueueDecision(game, event)
    expect(result.pendingEvents).toHaveLength(2)
    expect(result.deferredDecisions).toHaveLength(0)
  })

  it('lägger event i deferredDecisions när budget är full (2 aktiva)', () => {
    const game = makeGame({
      pendingEvents: [
        { ...makeEvent('a'), resolved: false },
        { ...makeEvent('b'), resolved: false },
      ] as never,
      deferredDecisions: [],
    })
    const event = makeEvent('evt3')
    const result = tryQueueDecision(game, event)
    expect(result.pendingEvents).toHaveLength(2)
    expect(result.deferredDecisions).toContainEqual({ ...event, deferredAt: game.currentMatchday ?? 1 })
  })

  it('lägger event i deferredDecisions i säsong 1 omg 1 om 1 aktiv', () => {
    const game = makeGame({
      currentSeason: 1,
      currentMatchday: 1,
      pendingEvents: [{ ...makeEvent('existing'), resolved: false }] as never,
      deferredDecisions: [],
    })
    const event = makeEvent('evt4')
    const result = tryQueueDecision(game, event)
    expect(result.pendingEvents).toHaveLength(1)
    expect(result.deferredDecisions).toContainEqual({ ...event, deferredAt: 1 })
  })
})

describe('tryQueueDecision — cap vid 10', () => {
  it('cappar deferredDecisions vid MAX_DEFERRED_DECISIONS och droppar äldsta', () => {
    const existingDeferred = Array.from({ length: MAX_DEFERRED_DECISIONS }, (_, i) =>
      makeEvent(`old_${i}`)
    )
    const game = makeGame({
      pendingEvents: [
        { ...makeEvent('a'), resolved: false },
        { ...makeEvent('b'), resolved: false },
      ] as never,
      deferredDecisions: existingDeferred,
    })
    const newEvent = makeEvent('newest')
    const result = tryQueueDecision(game, newEvent)
    expect(result.deferredDecisions).toHaveLength(MAX_DEFERRED_DECISIONS)
    // Äldsta droppat — 'old_0' ska inte finnas
    expect(result.deferredDecisions.map(e => e.id)).not.toContain('old_0')
    // Nyaste ska finnas
    expect(result.deferredDecisions.map(e => e.id)).toContain('newest')
  })
})

describe('promoteFromQueue', () => {
  it('returnerar game oförändrat om deferredDecisions är tom', () => {
    const game = makeGame({ deferredDecisions: [] })
    const result = promoteFromQueue(game)
    expect(result).toBe(game)
  })

  it('lyfter första deferred-event till pendingEvents', () => {
    const deferred1 = makeEvent('deferred1')
    const deferred2 = makeEvent('deferred2')
    const game = makeGame({
      pendingEvents: [],
      deferredDecisions: [deferred1, deferred2],
    })
    const result = promoteFromQueue(game)
    expect(result.pendingEvents).toContainEqual(deferred1)
    expect(result.deferredDecisions).toHaveLength(1)
    expect(result.deferredDecisions[0].id).toBe('deferred2')
  })

  it('bevarar befintliga pendingEvents vid promote', () => {
    const existing = makeEvent('existing')
    const deferred = makeEvent('deferred')
    const game = makeGame({
      pendingEvents: [{ ...existing, resolved: false }] as never,
      deferredDecisions: [deferred],
    })
    const result = promoteFromQueue(game)
    expect(result.pendingEvents).toHaveLength(2)
    expect(result.deferredDecisions).toHaveLength(0)
  })
})
