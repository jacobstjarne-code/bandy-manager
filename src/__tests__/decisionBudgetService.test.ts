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
  canAddDecision,
  getActiveDecisionCount,
  getThrottledActiveDecisionCount,
  partitionInterruptBudget,
  MAX_DEFERRED_DECISIONS,
} from '../domain/services/decisionBudgetService'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { GameEvent, GameEventType } from '../domain/entities/GameEvent'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEvent(id: string): GameEvent {
  return {
    id,
    type: 'community_goodwill',
    title: `Event ${id}`,
    body: 'Test event',
    date: '2026-10-01',
    choices: [{ id: 'c1', text: 'Ja' }],
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

  it('lägger event i pendingEvents när 1 aktiv av max 3', () => {
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

  it('lägger event i deferredDecisions när budget är full (3 aktiva)', () => {
    const game = makeGame({
      pendingEvents: [
        { ...makeEvent('a'), resolved: false },
        { ...makeEvent('b'), resolved: false },
        { ...makeEvent('c'), resolved: false },
      ] as never,
      deferredDecisions: [],
    })
    const event = makeEvent('evt3')
    const result = tryQueueDecision(game, event)
    expect(result.pendingEvents).toHaveLength(3)
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
        { ...makeEvent('c'), resolved: false },
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

// ── HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md) ─────────────────────
// "Måste-nivån är UNDANTAGEN throttlen — den surfar alltid som det primära
// kortet, throttlas aldrig bakom 3-taket, defereras aldrig."

function makeTypedEvent(id: string, type: GameEventType): GameEvent {
  return {
    id,
    type,
    title: `Event ${id}`,
    body: 'Test event',
    choices: [{ id: 'c1', label: 'Ja', effect: { type: 'noOp' } }],
    resolved: false,
  }
}

function fullBudgetGame(): SaveGame {
  return makeGame({
    pendingEvents: [
      makeTypedEvent('a', 'sponsorOffer'),
      makeTypedEvent('b', 'mecenatEvent'),
      makeTypedEvent('c', 'kommunMote'),
    ],
    deferredDecisions: [],
  })
}

describe('HIGH 11 — måste-nivån undantagen throttlen', () => {
  it('canAddDecision: månad nekas vid fullt tak, måste släpps alltid igenom', () => {
    const game = fullBudgetGame()
    expect(canAddDecision(game, 5)).toBe(false)
    expect(canAddDecision(game, 5, 'month')).toBe(false)
    expect(canAddDecision(game, 5, 'must')).toBe(true)
  })

  it('canAddDecision: måste passerar även säsong 1 omgång 1 (tak = 1)', () => {
    const game = makeGame({
      currentSeason: 1,
      currentMatchday: 1,
      seasonSummaries: [],
      pendingEvents: [makeTypedEvent('a', 'sponsorOffer')],
    })
    expect(canAddDecision(game, 1)).toBe(false)
    expect(canAddDecision(game, 1, 'must')).toBe(true)
  })

  it('tryQueueDecision: ett kontraktskrav blir AKTIVT trots fullt tak — aldrig deferrerat', () => {
    const game = fullBudgetGame()
    const must = makeTypedEvent('contract', 'contractRequest')
    const result = tryQueueDecision(game, must)
    expect(result.pendingEvents.map(e => e.id)).toContain('contract')
    expect(result.deferredDecisions).toHaveLength(0)
  })

  it('tryQueueDecision: ett licenskrav blir AKTIVT trots fullt tak', () => {
    const result = tryQueueDecision(fullBudgetGame(), makeTypedEvent('lic', 'licenseHandlingsplan'))
    expect(result.pendingEvents.map(e => e.id)).toContain('lic')
    expect(result.deferredDecisions).toHaveLength(0)
  })

  it('tryQueueDecision: ett månadsbeslut deferreras fortfarande vid fullt tak (throttlen står kvar)', () => {
    const result = tryQueueDecision(fullBudgetGame(), makeTypedEvent('sponsor', 'sponsorOffer'))
    expect(result.pendingEvents).toHaveLength(3)
    expect(result.deferredDecisions.map(e => e.id)).toContain('sponsor')
  })

  it('måste räknas inte mot budgeten — ett aktivt kontraktskrav blockerar inte nya månadsbeslut', () => {
    const game = makeGame({
      pendingEvents: [
        makeTypedEvent('must1', 'contractRequest'),
        makeTypedEvent('must2', 'licenseHandlingsplan'),
        makeTypedEvent('a', 'sponsorOffer'),
      ],
    })
    // Spelaren SER tre beslut (UI-räknaren är oförändrad) ...
    expect(getActiveDecisionCount(game)).toBe(3)
    // ... men bara ett av dem tär på budgeten.
    expect(getThrottledActiveDecisionCount(game)).toBe(1)
    expect(canAddDecision(game, 5)).toBe(true)
  })
})

// KLARGÖRANDE 2026-08-30/31 (doktrinfilen): bakgrundsnivån är undantagen
// throttlen av samma skäl som måste, fast åt andra hållet — den tar aldrig
// en dashboard-yta och ska därför inte kunna TRÄNGA UNDAN en synlig
// månads-yta. Mätt i HIGH 11-simuleringen: bakgrundshändelser nådde 3
// samtidiga (hela taket) och kunde svälta ut månadskön inom en säsong.
describe('HIGH 11-följdfix (2026-08-31) — bakgrundsnivån undantagen throttlen', () => {
  it('canAddDecision: bakgrund passerar alltid, oavsett tak', () => {
    const game = fullBudgetGame()
    expect(canAddDecision(game, 5, 'background')).toBe(true)
  })

  it('bakgrund räknas inte mot budgeten — tre aktiva bakgrundsevent blockerar inte ett nytt månadsbeslut', () => {
    const game = makeGame({
      pendingEvents: [
        makeTypedEvent('bg1', 'communityEvent'),
        makeTypedEvent('bg2', 'fanLetter'),
        makeTypedEvent('bg3', 'opponentQuote'),
        makeTypedEvent('a', 'sponsorOffer'),
      ],
    })
    // Spelaren SER fyra beslut (UI-räknaren är oförändrad) ...
    expect(getActiveDecisionCount(game)).toBe(4)
    // ... men bara ett av dem (månadsbeslutet) tär på budgeten.
    expect(getThrottledActiveDecisionCount(game)).toBe(1)
    expect(canAddDecision(game, 5)).toBe(true)
  })

  it('partitionInterruptBudget: bakgrund surfar alltid, tränger aldrig undan ett månadsbeslut och defereras aldrig', () => {
    const pending = [
      makeTypedEvent('bg1', 'communityEvent'),
      makeTypedEvent('bg2', 'fanLetter'),
      makeTypedEvent('bg3', 'opponentQuote'),
      ...['a', 'b', 'c', 'd'].map(id => makeTypedEvent(id, 'sponsorOffer')),
    ]
    const { surface, deferred } = partitionInterruptBudget(pending, 5)
    // Alla tre bakgrundsevent surfar, plus de tre första månadsplatserna.
    expect(surface.map(e => e.id)).toEqual(['bg1', 'bg2', 'bg3', 'a', 'b', 'c'])
    // Bara den fjärde MÅNADS-posten trängs undan — inget bakgrundsevent.
    expect(deferred.map(e => e.id)).toEqual(['d'])
  })
})

describe('partitionInterruptBudget — KF3-avbrottsbudgeten (roundProcessors faktiska mekanism)', () => {
  it('cappar månadsbeslut vid 3 och deferrerar resten', () => {
    const pending = ['a', 'b', 'c', 'd', 'e'].map(id => makeTypedEvent(id, 'sponsorOffer'))
    const { surface, deferred } = partitionInterruptBudget(pending, 5)
    expect(surface.map(e => e.id)).toEqual(['a', 'b', 'c'])
    expect(deferred.map(e => e.id)).toEqual(['d', 'e'])
  })

  it('måste surfar FÖRST och trängs aldrig undan — även när taket redan är fyllt', () => {
    const pending = [
      ...['a', 'b', 'c', 'd'].map(id => makeTypedEvent(id, 'sponsorOffer')),
      makeTypedEvent('must', 'contractRequest'),
    ]
    const { surface, deferred } = partitionInterruptBudget(pending, 5)
    expect(surface[0].id).toBe('must')
    expect(surface.map(e => e.id)).toEqual(['must', 'a', 'b', 'c'])
    expect(deferred.map(e => e.id)).toEqual(['d'])
  })

  it('två samtidiga måsten surfar båda, utöver de tre månadsplatserna', () => {
    const pending = [
      makeTypedEvent('m1', 'contractRequest'),
      makeTypedEvent('m2', 'licenseHandlingsplan'),
      ...['a', 'b', 'c'].map(id => makeTypedEvent(id, 'sponsorOffer')),
    ]
    const { surface, deferred } = partitionInterruptBudget(pending, 5)
    expect(surface).toHaveLength(5)
    expect(deferred).toHaveLength(0)
  })

  it('event utan val passerar oräknade (banden)', () => {
    const ambient = { ...makeTypedEvent('amb', 'seasonGoalHalfway'), choices: [] }
    const pending = [ambient, ...['a', 'b', 'c', 'd'].map(id => makeTypedEvent(id, 'sponsorOffer'))]
    const { nonActionable, surface, deferred } = partitionInterruptBudget(pending, 5)
    expect(nonActionable.map(e => e.id)).toEqual(['amb'])
    expect(surface).toHaveLength(3)
    expect(deferred).toHaveLength(1)
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
