/**
 * Tests for attentionRouter (A2/A3) and eventQueueService (B2).
 * Verifierar att getCurrentAttention prioriterar korrekt:
 *   screen > scene > event > idle
 */
import { describe, it, expect } from 'vitest'
import { getCurrentAttention } from '../domain/services/attentionRouter'
import { getNextEvent, getQueueStats } from '../domain/services/eventQueueService'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { GameEvent } from '../domain/entities/GameEvent'
import { PendingScreen } from '../domain/enums'

// ─── Minimal SaveGame factory ──────────────────────────────────────────────
function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    managerName: 'Test',
    managedClubId: 'club_forsbacka',
    currentDate: '2026-10-15',
    currentSeason: 1,
    currentMatchday: 1,
    clubs: [],
    players: [],
    league: {} as never,
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
    rivalryHistory: {},
    nemesisTracker: {},
    storylines: [],
    clubLegends: [],
    previousMarketValues: {},
    financeLog: [],
    pendingFollowUps: [],
    mecenater: [],
    facilityProjects: [],
    boardObjectives: [],
    boardObjectiveHistory: [],
    version: '0.2.0',
    lastSavedAt: '2026-10-15T00:00:00Z',
    ...overrides,
  } as SaveGame
}

// ─── Event factory ─────────────────────────────────────────────────────────
function makeEvent(id: string, overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id,
    type: 'communityEvent',
    title: `Event ${id}`,
    body: 'Test body',
    choices: [],
    resolved: false,
    ...overrides,
  }
}

// ─── getCurrentAttention — prioritetsordning ───────────────────────────────
describe('getCurrentAttention', () => {
  it('returnerar idle när inget pågår', () => {
    const game = makeGame()
    expect(getCurrentAttention(game)).toEqual({ kind: 'idle' })
  })

  it('returnerar screen när pendingScreen är satt', () => {
    const game = makeGame({
      pendingScreen: PendingScreen.BoardMeeting,
    })
    const result = getCurrentAttention(game)
    expect(result.kind).toBe('screen')
    if (result.kind === 'screen') {
      expect(result.screen).toBe(PendingScreen.BoardMeeting)
    }
  })

  it('returnerar scene när pendingScene är satt och pendingScreen är null', () => {
    const game = makeGame({
      pendingScene: { sceneId: 'sunday_training', triggeredAt: '2026-10-15' },
    })
    const result = getCurrentAttention(game)
    expect(result.kind).toBe('scene')
    if (result.kind === 'scene') {
      expect(result.sceneId).toBe('sunday_training')
    }
  })

  it('screen tar prioritet över scene', () => {
    const game = makeGame({
      pendingScreen: PendingScreen.BoardMeeting,
      pendingScene: { sceneId: 'sunday_training', triggeredAt: '2026-10-15' },
    })
    expect(getCurrentAttention(game).kind).toBe('screen')
  })

  it('A3: scene tar prioritet över events — EventOverlay ska inte visas', () => {
    const events = Array.from({ length: 5 }, (_, i) => makeEvent(`e${i}`))
    const game = makeGame({
      pendingScene: { sceneId: 'sunday_training', triggeredAt: '2026-10-15' },
      pendingEvents: events,
    })
    const result = getCurrentAttention(game)
    // Scen ska ha prio — EventOverlay visas inte när kind === 'scene'
    expect(result.kind).toBe('scene')
  })

  it('returnerar event när pendingEvents finns och inget annat pågår', () => {
    const events = [makeEvent('e1', { type: 'communityEvent' })]
    const game = makeGame({ pendingEvents: events })
    const result = getCurrentAttention(game)
    expect(result.kind).toBe('event')
    if (result.kind === 'event') {
      expect(result.event.id).toBe('e1')
    }
  })

  it('ignorerar resolved events', () => {
    const events = [makeEvent('e1', { resolved: true })]
    const game = makeGame({ pendingEvents: events })
    expect(getCurrentAttention(game).kind).toBe('idle')
  })
})

// ─── getNextEvent — sortering ──────────────────────────────────────────────
describe('getNextEvent', () => {
  it('tom kö ger null', () => {
    const game = makeGame()
    expect(getNextEvent(game)).toBeNull()
  })

  it('kritisk event visas före låg-prio events', () => {
    const events = [
      makeEvent('atm1', { type: 'communityEvent', priority: 'low' }),
      makeEvent('atm2', { type: 'supporterEvent', priority: 'low' }),
      makeEvent('crit', { type: 'pressConference', priority: 'critical' }),
    ]
    const game = makeGame({ pendingEvents: events })
    const next = getNextEvent(game)
    expect(next?.id).toBe('crit')
  })

  it('FIFO inom samma prio — första i arrayen visas först', () => {
    const events = [
      makeEvent('first', { type: 'communityEvent', priority: 'low' }),
      makeEvent('second', { type: 'communityEvent', priority: 'low' }),
      makeEvent('third', { type: 'communityEvent', priority: 'low' }),
    ]
    const game = makeGame({ pendingEvents: events })
    const next = getNextEvent(game)
    expect(next?.id).toBe('first')
  })

  it('hoppar över resolved events', () => {
    const events = [
      makeEvent('e1', { resolved: true }),
      makeEvent('e2', { resolved: false }),
    ]
    const game = makeGame({ pendingEvents: events })
    const next = getNextEvent(game)
    expect(next?.id).toBe('e2')
  })

  it('returnerar null om alla events är resolved', () => {
    const events = [makeEvent('e1', { resolved: true })]
    const game = makeGame({ pendingEvents: events })
    expect(getNextEvent(game)).toBeNull()
  })
})

// ─── getQueueStats ─────────────────────────────────────────────────────────
describe('getQueueStats', () => {
  it('tom kö ger nollor', () => {
    const game = makeGame()
    const stats = getQueueStats(game)
    expect(stats.total).toBe(0)
    expect(stats.critical).toBe(0)
  })

  it('summerar korrekt per prioritets-nivå', () => {
    const events = [
      makeEvent('c1', { priority: 'critical' }),
      makeEvent('h1', { priority: 'high' }),
      makeEvent('n1', { priority: 'normal' }),
      makeEvent('l1', { priority: 'low' }),
      makeEvent('l2', { priority: 'low' }),
    ]
    const game = makeGame({ pendingEvents: events })
    const stats = getQueueStats(game)
    expect(stats.total).toBe(5)
    expect(stats.critical).toBe(1)
    expect(stats.high).toBe(1)
    expect(stats.normal).toBe(1)
    expect(stats.low).toBe(2)
  })

  it('exkluderar resolved events', () => {
    const events = [
      makeEvent('e1', { priority: 'critical', resolved: false }),
      makeEvent('e2', { priority: 'critical', resolved: true }),
    ]
    const game = makeGame({ pendingEvents: events })
    const stats = getQueueStats(game)
    expect(stats.total).toBe(1)
    expect(stats.critical).toBe(1)
  })
})
