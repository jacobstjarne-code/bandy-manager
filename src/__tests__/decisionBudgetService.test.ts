/**
 * decisionBudgetService — tester för tryQueueDecision och promoteFromQueue
 *
 * Verifierar:
 * 1. tryQueueDecision lägger i pendingEvents när budget tillgänglig
 * 2. tryQueueDecision lägger i deferredDecisions när budget full
 * 3. deferredDecisions är ocappad — inget beslut tappas
 * 4. promoteFromQueue lyfter första från kön till pendingEvents
 */

import { describe, it, expect } from 'vitest'
import {
  tryQueueDecision,
  promoteFromQueue,
  canAddDecision,
  getActiveDecisionCount,
  getThrottledActiveDecisionCount,
  getWaitingDecisionCount,
  applyDecisionBudget,
  partitionInterruptBudget,
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

describe('legacy queue identity repair', () => {
  it('does not promote an old copy of an already resolved event', () => {
    const result = promoteFromQueue(makeGame({
      resolvedEventIds: ['supporter_conflict_2030'],
      deferredDecisions: [makeEvent('supporter_conflict_2030'), makeEvent('next')],
    }))
    expect(result.pendingEvents?.map(event => event.id)).toEqual(['next'])
    expect(result.deferredDecisions).toEqual([])
  })

  it('keeps one copy per id across both queues without merging distinct events', () => {
    const result = applyDecisionBudget(makeGame({
      pendingEvents: [makeEvent('same'), makeEvent('different')],
      deferredDecisions: [makeEvent('same'), makeEvent('same')],
    }), 5)
    expect(result.pendingEvents?.map(event => event.id)).toEqual(['same', 'different'])
    expect(result.deferredDecisions).toEqual([])
  })
})

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

  it('använder samma trebudget i säsong 1 omgång 1', () => {
    const game = makeGame({
      currentSeason: 1,
      currentMatchday: 1,
      pendingEvents: [{ ...makeEvent('existing'), resolved: false }] as never,
      deferredDecisions: [],
    })
    const event = makeEvent('evt4')
    const result = tryQueueDecision(game, event)
    expect(result.pendingEvents).toHaveLength(2)
    expect(result.deferredDecisions).toHaveLength(0)
  })
})

describe('tryQueueDecision — inget tappas', () => {
  it('bevarar hela kön även när fler än tio beslut väntar', () => {
    const existingDeferred = Array.from({ length: 10 }, (_, i) =>
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
    const allIds = [...result.pendingEvents, ...result.deferredDecisions].map(e => e.id)
    expect(allIds).toHaveLength(14)
    expect(allIds).toContain('old_0')
    expect(allIds).toContain('newest')
  })
})

// Latest ratification of KF3 (2026-09-08): tier does not redefine actionable;
// deadlineRound is the sole reason an event may exceed the cap.

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

describe('KF3 — en gemensam actionable-budget', () => {
  it('canAddDecision nekar alla tiers vid fullt tak', () => {
    const game = fullBudgetGame()
    expect(canAddDecision(game, 5)).toBe(false)
    expect(canAddDecision(game, 5, 'month')).toBe(false)
    expect(canAddDecision(game, 5, 'must')).toBe(false)
  })

  it('använder trebudgeten även i säsong 1 omgång 1', () => {
    const game = makeGame({
      currentSeason: 1,
      currentMatchday: 1,
      seasonSummaries: [],
      pendingEvents: [makeTypedEvent('a', 'sponsorOffer')],
    })
    expect(canAddDecision(game, 1)).toBe(true)
    expect(canAddDecision(game, 1, 'must')).toBe(true)
  })

  it('tryQueueDecision: ett imminent kontraktskrav surfar och skjuter undan en flexibel post', () => {
    const game = fullBudgetGame()
    const must = { ...makeTypedEvent('contract', 'contractRequest'), deadlineRound: 6 }
    const result = tryQueueDecision(game, must)
    expect(result.pendingEvents.map(e => e.id)).toContain('contract')
    expect(result.deferredDecisions).toHaveLength(1)
  })

  it('tryQueueDecision: ett imminent licenskrav skyddas av deadline, inte av tier', () => {
    const result = tryQueueDecision(fullBudgetGame(), {
      ...makeTypedEvent('lic', 'licenseHandlingsplan'),
      deadlineRound: 6,
    })
    expect(result.pendingEvents.map(e => e.id)).toContain('lic')
    expect(result.deferredDecisions).toHaveLength(1)
  })

  it('tryQueueDecision: ett månadsbeslut deferreras fortfarande vid fullt tak (throttlen står kvar)', () => {
    const result = tryQueueDecision(fullBudgetGame(), makeTypedEvent('sponsor', 'sponsorOffer'))
    expect(result.pendingEvents).toHaveLength(3)
    expect(result.deferredDecisions.map(e => e.id)).toContain('sponsor')
  })

  it('alla event med val räknas oavsett tier', () => {
    const game = makeGame({
      pendingEvents: [
        makeTypedEvent('must1', 'contractRequest'),
        makeTypedEvent('must2', 'licenseHandlingsplan'),
        makeTypedEvent('a', 'sponsorOffer'),
      ],
    })
    expect(getActiveDecisionCount(game)).toBe(3)
    expect(getThrottledActiveDecisionCount(game)).toBe(3)
    expect(canAddDecision(game, 5)).toBe(false)
  })
})

// Background remains a presentation tier. An event in it with choices is still
// an actionable interruption and therefore uses the same queue.
describe('KF3 — event med val är actionable även i background-tier', () => {
  it('canAddDecision nekar background vid fullt tak', () => {
    const game = fullBudgetGame()
    expect(canAddDecision(game, 5, 'background')).toBe(false)
  })

  it('bakgrund med val räknas mot budgeten', () => {
    const game = makeGame({
      pendingEvents: [
        makeTypedEvent('bg1', 'communityEvent'),
        makeTypedEvent('bg2', 'fanLetter'),
        makeTypedEvent('bg3', 'opponentQuote'),
        makeTypedEvent('a', 'sponsorOffer'),
      ],
    })
    expect(getActiveDecisionCount(game)).toBe(4)
    expect(getThrottledActiveDecisionCount(game)).toBe(4)
    expect(canAddDecision(game, 5)).toBe(false)
  })

  it('partitionInterruptBudget använder samma FIFO för background med val', () => {
    const pending = [
      makeTypedEvent('bg1', 'communityEvent'),
      makeTypedEvent('bg2', 'fanLetter'),
      makeTypedEvent('bg3', 'opponentQuote'),
      ...['a', 'b', 'c', 'd'].map(id => makeTypedEvent(id, 'sponsorOffer')),
    ]
    const { surface, deferred } = partitionInterruptBudget(pending, 5)
    expect(surface.map(e => e.id)).toEqual(['bg1', 'bg2', 'bg3'])
    expect(deferred.map(e => e.id)).toEqual(['a', 'b', 'c', 'd'])
  })
})

describe('partitionInterruptBudget — KF3-avbrottsbudgeten (roundProcessors faktiska mekanism)', () => {
  it('5 actionable med en imminent ger 3 surfade och 2 deferrade; de 2 surfar nästa omgång', () => {
    const events = [
      makeTypedEvent('later_1', 'sponsorOffer'),
      { ...makeTypedEvent('imminent', 'contractRequest'), deadlineRound: 6 },
      { ...makeTypedEvent('sooner_1', 'sponsorOffer'), deadlineRound: 9 },
      { ...makeTypedEvent('sooner_2', 'sponsorOffer'), deadlineRound: 10 },
      makeTypedEvent('later_2', 'sponsorOffer'),
    ]
    const first = applyDecisionBudget(makeGame({ pendingEvents: events }), 5)

    expect(first.pendingEvents.map(event => event.id)).toEqual(['imminent', 'sooner_1', 'sooner_2'])
    expect(first.deferredDecisions.map(event => event.id)).toEqual(['later_1', 'later_2'])

    const next = applyDecisionBudget({
      ...first,
      currentMatchday: 6,
      pendingEvents: [],
    }, 6)
    expect(next.pendingEvents.map(event => event.id)).toEqual(['later_1', 'later_2'])
    expect(next.deferredDecisions).toHaveLength(0)
  })

  it('imminenta beslut deferreras aldrig även när de överskrider trebudgeten', () => {
    const pending = ['a', 'b', 'c', 'd'].map(id => ({
      ...makeTypedEvent(id, 'contractRequest'),
      deadlineRound: 6,
    }))
    const { surface, deferred } = partitionInterruptBudget(pending, 5)
    expect(surface.map(event => event.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(deferred).toHaveLength(0)
  })

  it('weekly decision reserverar en av tre platser', () => {
    const game = makeGame({
      pendingEvents: ['a', 'b', 'c'].map(id => makeTypedEvent(id, 'sponsorOffer')),
      pendingWeeklyDecision: { id: 'weekly' } as never,
    })
    const result = applyDecisionBudget(game, 5)
    expect(result.pendingEvents.map(event => event.id)).toEqual(['a', 'b'])
    expect(result.deferredDecisions.map(event => event.id)).toEqual(['c'])
    expect(getWaitingDecisionCount(result)).toBe(1)
  })

  it('räknar retained weekly som väntande när tre imminenta redan fyller budgeten', () => {
    const game = makeGame({
      pendingEvents: ['a', 'b', 'c'].map(id => ({
        ...makeTypedEvent(id, 'contractRequest'),
        deadlineRound: 6,
      })),
      pendingWeeklyDecision: { id: 'weekly' } as never,
    })
    const result = applyDecisionBudget(game, 5)
    expect(result.pendingEvents).toHaveLength(3)
    expect(result.pendingWeeklyDecision).toEqual({ id: 'weekly' })
    expect(getWaitingDecisionCount(result)).toBe(1)
  })

  it('cappar månadsbeslut vid 3 och deferrerar resten', () => {
    const pending = ['a', 'b', 'c', 'd', 'e'].map(id => makeTypedEvent(id, 'sponsorOffer'))
    const { surface, deferred } = partitionInterruptBudget(pending, 5)
    expect(surface.map(e => e.id)).toEqual(['a', 'b', 'c'])
    expect(deferred.map(e => e.id)).toEqual(['d', 'e'])
  })

  it('imminent deadline surfar först och skjuter undan flexibel post', () => {
    const pending = [
      ...['a', 'b', 'c', 'd'].map(id => makeTypedEvent(id, 'sponsorOffer')),
      { ...makeTypedEvent('must', 'contractRequest'), deadlineRound: 6 },
    ]
    const { surface, deferred } = partitionInterruptBudget(pending, 5)
    expect(surface[0].id).toBe('must')
    expect(surface.map(e => e.id)).toEqual(['must', 'a', 'b'])
    expect(deferred.map(e => e.id)).toEqual(['c', 'd'])
  })

  it('två samtidiga imminenta surfar inom samma trebudget', () => {
    const pending = [
      { ...makeTypedEvent('m1', 'contractRequest'), deadlineRound: 6 },
      { ...makeTypedEvent('m2', 'licenseHandlingsplan'), deadlineRound: 6 },
      ...['a', 'b', 'c'].map(id => makeTypedEvent(id, 'sponsorOffer')),
    ]
    const { surface, deferred } = partitionInterruptBudget(pending, 5)
    expect(surface.map(e => e.id)).toEqual(['m1', 'm2', 'a'])
    expect(deferred.map(e => e.id)).toEqual(['b', 'c'])
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

// SPEC_DECISIONBUDGET_ALDERSVIKTNING_2026-09-10 §1 — svält-eskalering.
describe('partitionInterruptBudget — åldersviktning (anti-svält)', () => {
  it('deadline-löst event uppskjutet ≥3 omgångar surfar före ett färskare deadline-löst event', () => {
    // currentMatchday 5: 'fresh' väntat 1 omgång (ej svälten), 'old' väntat 3
    // (svälten). 'fresh' står FÖRE 'old' i input — utan åldersviktning hade
    // stabil sortering (ingen deadline på någondera → tie) behållit den
    // ordningen. Svält-eskaleringen ska vända den.
    const pending = [
      { ...makeTypedEvent('fresh', 'sponsorOffer'), deferredAt: 4 },
      { ...makeTypedEvent('old', 'sponsorOffer'), deferredAt: 2 },
    ]
    const { surface } = partitionInterruptBudget(pending, 5)
    expect(surface.map(e => e.id)).toEqual(['old', 'fresh'])
  })

  it('imminent deadline surfar fortfarande före ett svältande event (deadline-skyddet körs före)', () => {
    const pending = [
      { ...makeTypedEvent('starved', 'sponsorOffer'), deferredAt: 1 }, // ålder 4, svälten
      { ...makeTypedEvent('imminent', 'contractRequest'), deadlineRound: 6 },
    ]
    const { surface } = partitionInterruptBudget(pending, 5)
    expect(surface.map(e => e.id)).toEqual(['imminent', 'starved'])
  })

  it('FIFO-stabilitet bevarad när två svältande event har samma nyckel', () => {
    const pending = [
      { ...makeTypedEvent('a', 'sponsorOffer'), deferredAt: 1 },
      { ...makeTypedEvent('b', 'sponsorOffer'), deferredAt: 1 },
    ]
    const { surface } = partitionInterruptBudget(pending, 5)
    expect(surface.map(e => e.id)).toEqual(['a', 'b'])
  })

  it('ett nytt event utan deferredAt får ålder 0 — svälter inte förrän det faktiskt väntat', () => {
    const pending = [
      { ...makeTypedEvent('brand_new', 'sponsorOffer') }, // ingen deferredAt
      { ...makeTypedEvent('waited_long', 'sponsorOffer'), deferredAt: 2 }, // ålder 3, svälten
    ]
    const { surface } = partitionInterruptBudget(pending, 5)
    expect(surface.map(e => e.id)).toEqual(['waited_long', 'brand_new'])
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
    expect(result.pendingEvents).toContainEqual(deferred2)
    expect(result.deferredDecisions).toHaveLength(0)
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
