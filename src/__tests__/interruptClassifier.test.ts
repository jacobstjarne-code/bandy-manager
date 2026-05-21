import { describe, it, expect } from 'vitest'
import {
  classifyInterrupt,
  countPendingInterrupts,
  type InterruptItem,
} from '../domain/services/interruptClassifier'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { GameEvent } from '../domain/entities/GameEvent'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeMinimalGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    currentSeason: 1,
    currentMatchday: 5,
    currentDate: '2026-01-01',
    managedClubId: 'club_a',
    clubs: [],
    players: [],
    fixtures: [],
    inbox: [],
    pendingEvents: [],
    deferredDecisions: [],
    phaseMarksSeen: [],
    seenAnslag: [],
    ...overrides,
  } as unknown as SaveGame
}

function makeEvent(overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 'ev1',
    type: 'communityEvent',
    title: 'Test',
    body: 'body',
    choices: [],
    resolved: false,
    ...overrides,
  }
}

// ── classifyInterrupt ─────────────────────────────────────────────────────────

describe('classifyInterrupt', () => {
  it('weekly_decision → actionable', () => {
    const item: InterruptItem = { category: 'weekly_decision' }
    expect(classifyInterrupt(item)).toBe('actionable')
  })

  it('event with choices → actionable', () => {
    const item: InterruptItem = { category: 'event', hasChoices: true }
    expect(classifyInterrupt(item)).toBe('actionable')
  })

  it('event without choices → informational', () => {
    const item: InterruptItem = { category: 'event', hasChoices: false }
    expect(classifyInterrupt(item)).toBe('informational')
  })

  it('event with hasChoices undefined → informational', () => {
    const item: InterruptItem = { category: 'event' }
    expect(classifyInterrupt(item)).toBe('informational')
  })

  it('anslag → informational', () => {
    const item: InterruptItem = { category: 'anslag' }
    expect(classifyInterrupt(item)).toBe('informational')
  })

  it('phase_mark → informational', () => {
    const item: InterruptItem = { category: 'phase_mark' }
    expect(classifyInterrupt(item)).toBe('informational')
  })

  it('scene with sceneChoices → actionable', () => {
    const item: InterruptItem = { category: 'scene', sceneChoices: ['choice_a', 'choice_b'] }
    expect(classifyInterrupt(item)).toBe('actionable')
  })

  it('scene without sceneChoices → informational', () => {
    const item: InterruptItem = { category: 'scene', sceneChoices: [] }
    expect(classifyInterrupt(item)).toBe('informational')
  })

  it('scene with sceneChoices undefined → informational', () => {
    const item: InterruptItem = { category: 'scene' }
    expect(classifyInterrupt(item)).toBe('informational')
  })
})

// ── countPendingInterrupts ────────────────────────────────────────────────────

describe('countPendingInterrupts', () => {
  it('returns zero counts for empty game', () => {
    const game = makeMinimalGame({
      seenAnslag: ['league_start', 'league_midwinter', 'league_halfway', 'playoff_qualification', 'playoff_start', 'season_done', 'pre_season', 'post_season', 'playoff_r1', 'playoff_r2', 'playoff_r3', 'playoff_r4', 'cup_r1', 'cup_r2', 'cup_r3', 'cup_r4', 'season_kickoff'],
    })
    const result = countPendingInterrupts(game)
    expect(result.event.total).toBe(0)
    expect(result.weekly_decision.total).toBe(0)
    expect(result.scene.total).toBe(0)
  })

  it('counts pending event with choices as actionable', () => {
    const game = makeMinimalGame({
      pendingEvents: [
        makeEvent({ choices: [{ id: 'a', label: 'Ja', effect: { type: 'noOp' } }], resolved: false }),
      ],
    })
    const result = countPendingInterrupts(game)
    expect(result.event.total).toBe(1)
    expect(result.event.actionable).toBe(1)
    expect(result.event.informational).toBe(0)
  })

  it('counts pending event without choices as informational', () => {
    const game = makeMinimalGame({
      pendingEvents: [
        makeEvent({ choices: [], resolved: false }),
      ],
    })
    const result = countPendingInterrupts(game)
    expect(result.event.total).toBe(1)
    expect(result.event.actionable).toBe(0)
    expect(result.event.informational).toBe(1)
  })

  it('does not count resolved events', () => {
    const game = makeMinimalGame({
      pendingEvents: [
        makeEvent({ choices: [], resolved: true }),
      ],
    })
    const result = countPendingInterrupts(game)
    expect(result.event.total).toBe(0)
  })

  it('counts weekly_decision as actionable', () => {
    const game = makeMinimalGame({
      pendingWeeklyDecision: {
        id: 'wd1',
        category: 'training',
        question: 'Hur tränar vi?',
        choiceA: { label: 'Hårt', effect: { type: 'teamBoostMorale', value: 5 } },
        choiceB: { label: 'Lugnt', effect: { type: 'teamBoostMorale', value: 2 } },
        generatedMatchday: 5,
        expiresMatchday: 8,
      } as never,
    })
    const result = countPendingInterrupts(game)
    expect(result.weekly_decision.total).toBe(1)
    expect(result.weekly_decision.actionable).toBe(1)
  })

  it('counts pending scene as actionable when no prior choice', () => {
    const game = makeMinimalGame({
      pendingScene: { sceneId: 'sunday_training' as never, triggeredAt: 5, data: {} },
      sceneChoices: {},
    })
    const result = countPendingInterrupts(game)
    expect(result.scene.total).toBe(1)
    expect(result.scene.actionable).toBe(1)
  })

  it('counts mixed 8-item queue with correct breakdown', () => {
    // 3 events with choices, 2 without, 1 weekly_decision, 1 scene, 1 anslag (pending)
    const game = makeMinimalGame({
      pendingEvents: [
        makeEvent({ id: 'e1', choices: [{ id: 'a', label: 'Ja', effect: { type: 'noOp' } }], resolved: false }),
        makeEvent({ id: 'e2', choices: [{ id: 'a', label: 'Ja', effect: { type: 'noOp' } }], resolved: false }),
        makeEvent({ id: 'e3', choices: [{ id: 'a', label: 'Ja', effect: { type: 'noOp' } }], resolved: false }),
        makeEvent({ id: 'e4', choices: [], resolved: false }),
        makeEvent({ id: 'e5', choices: [], resolved: false }),
      ],
      pendingWeeklyDecision: {
        id: 'wd1', category: 'training', question: 'Hur?',
        choiceA: { label: 'A', effect: { type: 'noOp' } },
        choiceB: { label: 'B', effect: { type: 'noOp' } },
        generatedMatchday: 5, expiresMatchday: 8,
      } as never,
      pendingScene: { sceneId: 'sunday_training' as never, triggeredAt: 5, data: {} },
      sceneChoices: {},
      // seenAnslag empty → computeNextAnslag may return 1 anslag
      seenAnslag: [],
    })
    const result = countPendingInterrupts(game)

    // Events: 5 total, 3 actionable, 2 informational
    expect(result.event.total).toBe(5)
    expect(result.event.actionable).toBe(3)
    expect(result.event.informational).toBe(2)

    // Weekly decision: 1 actionable
    expect(result.weekly_decision.total).toBe(1)
    expect(result.weekly_decision.actionable).toBe(1)

    // Scene: 1 actionable
    expect(result.scene.total).toBe(1)
    expect(result.scene.actionable).toBe(1)
  })

  it('does not mutate game state (pure function)', () => {
    const game = makeMinimalGame({
      pendingEvents: [makeEvent({ resolved: false })],
    })
    const before = JSON.stringify(game)
    countPendingInterrupts(game)
    expect(JSON.stringify(game)).toBe(before)
  })
})
