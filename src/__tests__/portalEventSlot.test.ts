/**
 * Tests för Steg 3 — PortalEventSlot och GameShell-villkor.
 *
 * Testar:
 * - PortalEventSlot renderas inte när attention.kind !== 'event'
 * - Kritisk event → null från PortalEventSlot (lämnar till EventOverlay)
 * - shouldShowEventOverlay i GameShell: renderar inte vid high/normal/low
 * - shouldShowEventOverlay i GameShell: renderar vid critical
 */

import { describe, it, expect } from 'vitest'
import { getCurrentAttention } from '../domain/services/attentionRouter'
import { getEventPriority } from '../domain/entities/GameEvent'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { GameEvent } from '../domain/entities/GameEvent'
import type { EventPriority } from '../domain/entities/GameEvent'
import { PendingScreen } from '../domain/enums'

// ─── Minimal factories (samma mönster som attentionRouter.test.ts) ──────────
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

// ─── Hjälp-funktion som replikerar shouldShowEventOverlay-logiken i GameShell ──
function computeShouldShowOverlay(game: SaveGame, pathname: string): boolean {
  const attention = getCurrentAttention(game)
  const isMatchRoute =
    pathname.includes('/match/live') ||
    pathname === '/game/match' ||
    pathname === '/game/match-result' ||
    pathname === '/game/review'
  const isReviewRoute = pathname === '/game/review'
  const isPressConferenceRoute = pathname.includes('/press-conference')

  if (attention.kind !== 'event') return false
  const priority = attention.event.priority ?? getEventPriority(attention.event.type)
  return priority === 'critical' && !isMatchRoute && !isReviewRoute && !isPressConferenceRoute
}

// ─── Hjälp-funktion som replikerar PortalEventSlot-logiken ─────────────────
function portalSlotShouldRender(game: SaveGame): boolean {
  const attention = getCurrentAttention(game)
  if (attention.kind !== 'event') return false
  const priority = attention.event.priority ?? getEventPriority(attention.event.type)
  return priority !== 'critical'
}

// ─── PortalEventSlot — renderas inte utan event ────────────────────────────
describe('PortalEventSlot — render-logik', () => {
  it('returnerar inte render när attention.kind === idle', () => {
    const game = makeGame()
    expect(portalSlotShouldRender(game)).toBe(false)
  })

  it('returnerar inte render när attention.kind === screen', () => {
    const game = makeGame({ pendingScreen: PendingScreen.PreSeason })
    expect(portalSlotShouldRender(game)).toBe(false)
  })

  it('returnerar inte render när attention.kind === scene', () => {
    const game = makeGame({
      pendingScene: { sceneId: 'sunday_training' as never, triggeredAt: 1, data: {} },
    })
    expect(portalSlotShouldRender(game)).toBe(false)
  })

  it('returnerar inte render för kritisk event (lämnar till EventOverlay)', () => {
    const criticalEvent = makeEvent('e1', {
      type: 'mecenatEvent',  // getEventPriority → critical
      priority: 'critical',
    })
    const game = makeGame({ pendingEvents: [criticalEvent] })
    expect(portalSlotShouldRender(game)).toBe(false)
  })

  it('renderar för high-prioritets event', () => {
    const highEvent = makeEvent('e2', {
      type: 'pressConference',  // getEventPriority → high
    })
    const game = makeGame({ pendingEvents: [highEvent] })
    expect(portalSlotShouldRender(game)).toBe(true)
  })

  it('renderar för normal-prioritets event', () => {
    const normalEvent = makeEvent('e3', {
      type: 'academyEvent',  // getEventPriority → normal
    })
    const game = makeGame({ pendingEvents: [normalEvent] })
    expect(portalSlotShouldRender(game)).toBe(true)
  })

  it('renderar för low-prioritets event (atmosfärisk)', () => {
    const lowEvent = makeEvent('e4', {
      type: 'communityEvent',  // getEventPriority → low
    })
    const game = makeGame({ pendingEvents: [lowEvent] })
    expect(portalSlotShouldRender(game)).toBe(true)
  })
})

// ─── GameShell shouldShowEventOverlay — critical → overlay, annars → ej ──
describe('GameShell shouldShowEventOverlay', () => {
  it('visar overlay för kritisk event på Portal', () => {
    const criticalEvent = makeEvent('e1', { priority: 'critical' })
    const game = makeGame({ pendingEvents: [criticalEvent] })
    expect(computeShouldShowOverlay(game, '/game/dashboard')).toBe(true)
  })

  it('visar INTE overlay för high-prioritets event (går till PortalEventSlot)', () => {
    const highEvent = makeEvent('e2', { priority: 'high' })
    const game = makeGame({ pendingEvents: [highEvent] })
    expect(computeShouldShowOverlay(game, '/game/dashboard')).toBe(false)
  })

  it('visar INTE overlay för normal-prioritets event', () => {
    const normalEvent = makeEvent('e3', { priority: 'normal' })
    const game = makeGame({ pendingEvents: [normalEvent] })
    expect(computeShouldShowOverlay(game, '/game/dashboard')).toBe(false)
  })

  it('visar INTE overlay för low-prioritets event (atmosfärisk)', () => {
    const lowEvent = makeEvent('e4', { priority: 'low' })
    const game = makeGame({ pendingEvents: [lowEvent] })
    expect(computeShouldShowOverlay(game, '/game/dashboard')).toBe(false)
  })

  it('visar INTE overlay under match-route trots kritisk event', () => {
    const criticalEvent = makeEvent('e5', { priority: 'critical' })
    const game = makeGame({ pendingEvents: [criticalEvent] })
    expect(computeShouldShowOverlay(game, '/game/match')).toBe(false)
    expect(computeShouldShowOverlay(game, '/game/match-result')).toBe(false)
    expect(computeShouldShowOverlay(game, '/game/review')).toBe(false)
  })

  it('visar INTE overlay under presskonferens-route', () => {
    const criticalEvent = makeEvent('e6', { priority: 'critical' })
    const game = makeGame({ pendingEvents: [criticalEvent] })
    expect(computeShouldShowOverlay(game, '/game/press-conference')).toBe(false)
  })

  it('returnerar false när inga events finns (idle)', () => {
    const game = makeGame()
    expect(computeShouldShowOverlay(game, '/game/dashboard')).toBe(false)
  })
})
