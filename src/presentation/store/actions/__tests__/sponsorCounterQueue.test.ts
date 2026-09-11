import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import type { GameEvent } from '../../../../domain/entities/GameEvent'
import type { Sponsor } from '../../../../domain/entities/Sponsor'

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}))

const { useGameStore } = await import('../../gameStore')

const offer: Sponsor = {
  id: 'counter-sponsor',
  name: 'Kvarnvik Bygg',
  category: 'Bygg',
  weeklyIncome: 5_000,
  contractRounds: 10,
  signedRound: 0,
  personality: 'local',
}

function decision(id: string, type: GameEvent['type'] = 'community_goodwill'): GameEvent {
  return {
    id,
    type,
    title: id,
    body: id,
    choices: [{ id: 'ok', label: 'Okej', effect: { type: 'noOp' } }],
    resolved: false,
  }
}

function sponsorOffer(): GameEvent {
  return {
    id: 'event_sponsor_counter',
    type: 'sponsorOffer',
    title: 'Ett erbjudande',
    body: 'Kvarnvik Bygg vill prata.',
    sponsorData: JSON.stringify(offer),
    choices: [
      {
        id: 'accept',
        label: 'Acceptera',
        effect: { type: 'acceptSponsor', sponsorData: JSON.stringify(offer) },
      },
      { id: 'reject', label: 'Avstå', effect: { type: 'noOp' } },
    ],
    resolved: false,
  }
}

function gameWithDeferredDecision() {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 42 })
  return {
    ...game,
    pendingScene: undefined,
    pendingWeeklyDecision: undefined,
    pendingEvents: [sponsorOffer()],
    deferredDecisions: [decision('deferred-next')],
  }
}

beforeEach(() => {
  useGameStore.setState({ game: null })
})

describe('gameStore — sponsorers motbud frigör beslutsplatsen direkt', () => {
  it('promoterar nästa uppskjutna beslut när sponsorn accepterar motbudet', () => {
    useGameStore.setState({ game: gameWithDeferredDecision() })

    useGameStore.getState().commitSponsorCounter('event_sponsor_counter', 5_500, 'accepted')

    const game = useGameStore.getState().game!
    expect(game.pendingEvents.map(event => event.id)).toContain('deferred-next')
    expect(game.pendingEvents.map(event => event.id)).not.toContain('event_sponsor_counter')
    expect(game.deferredDecisions).toEqual([])
  })

  it('promoterar nästa uppskjutna beslut när sponsorn lämnar förhandlingen', () => {
    useGameStore.setState({ game: gameWithDeferredDecision() })

    useGameStore.getState().commitSponsorCounter('event_sponsor_counter', 9_000, 'walked_away')

    const game = useGameStore.getState().game!
    expect(game.pendingEvents.map(event => event.id)).toContain('deferred-next')
    expect(game.pendingEvents.map(event => event.id)).not.toContain('event_sponsor_counter')
    expect(game.deferredDecisions).toEqual([])
  })

  it('lämnar kön orörd när sponsorn står fast och beslutet fortfarande är öppet', () => {
    useGameStore.setState({ game: gameWithDeferredDecision() })

    useGameStore.getState().commitSponsorCounter('event_sponsor_counter', 7_000, 'stood_firm')

    const game = useGameStore.getState().game!
    expect(game.pendingEvents.map(event => event.id)).toContain('event_sponsor_counter')
    expect(game.deferredDecisions?.map(event => event.id)).toEqual(['deferred-next'])
  })
})
