/**
 * deferredRolloverService — HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md),
 * §"Rollover — aldrig tyst".
 *
 * Domen: varje obesvarat beslut i kön vid säsongsbytet får ANTINGEN ett
 * tillämpat default-utfall + EN inboxrad, ELLER en uttrycklig utrinning.
 * Aldrig noll rader. Slutläget (tom kö, inget läckage till säsong N+1) är
 * detsamma som före — det skyddas separat av
 * application/useCases/__tests__/seasonRolloverStaleEvents.test.ts.
 */

import { describe, it, expect } from 'vitest'
import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent, GameEventType } from '../../entities/GameEvent'
import { GAME_EVENT_TYPE_IDS } from '../../data/contentContract'
import { InboxItemType } from '../../enums'
import {
  resolveDeferredAtRollover,
  getDefaultRolloverChoice,
  getRolloverPolicy,
  ROLLOVER_POLICY_BY_TYPE,
} from '../deferredRolloverService'

function evt(id: string, type: GameEventType, choices: GameEvent['choices']): GameEvent {
  return { id, type, title: `Titel ${id}`, body: 'B', choices, resolved: false }
}

function game(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    currentSeason: 2027,
    currentMatchday: 0,
    currentDate: '2027-10-01',
    clubs: [],
    players: [],
    fixtures: [],
    inbox: [],
    pendingEvents: [],
    deferredDecisions: [],
    resolvedEventIds: [],
    resolvedChoices: [],
    transferBids: [],
    ...overrides,
  } as unknown as SaveGame
}

describe('ROLLOVER_POLICY_BY_TYPE — täckning', () => {
  it('deklarerar ett default-utfall (eller uttrycklig utrinning) för varje GameEventType', () => {
    for (const id of GAME_EVENT_TYPE_IDS) {
      expect(['decline', 'rejectBid', 'acknowledge', 'expire'], `policy saknas för ${id}`)
        .toContain(ROLLOVER_POLICY_BY_TYPE[id as GameEventType])
    }
  })
})

describe('getDefaultRolloverChoice', () => {
  it("'decline' plockar eventets noOp-val — håll ställningen", () => {
    const e = evt('a', 'sponsorOffer', [
      { id: 'accept', label: 'Tacka ja', effect: { type: 'acceptSponsor' } },
      { id: 'decline', label: 'Tacka nej', effect: { type: 'noOp' } },
    ])
    expect(getDefaultRolloverChoice(e)?.id).toBe('decline')
  })

  it("'decline' utan noOp-val ger null (ingen tyst väg ut → utrinning)", () => {
    const e = evt('a', 'sponsorOffer', [
      { id: 'accept', label: 'Tacka ja', effect: { type: 'acceptSponsor' } },
    ])
    expect(getDefaultRolloverChoice(e)).toBeNull()
  })

  it("transferBidReceived får 'rejectBid' — aldrig choices[0], som är ACCEPT", () => {
    expect(getRolloverPolicy('transferBidReceived')).toBe('rejectBid')
    const e = evt('bid', 'transferBidReceived', [
      { id: 'accept', label: 'Acceptera', effect: { type: 'acceptTransfer' } },
      { id: 'reject', label: 'Avslå', effect: { type: 'rejectTransfer' } },
    ])
    expect(getDefaultRolloverChoice(e)?.id).toBe('reject')
  })

  it("'expire'-typer får aldrig ett tyst utfall, ens när ett noOp-val finns", () => {
    expect(getRolloverPolicy('criticalEconomy')).toBe('expire')
    const e = evt('kris', 'criticalEconomy', [
      { id: 'wait', label: 'Avvakta', effect: { type: 'noOp' } },
    ])
    expect(getDefaultRolloverChoice(e)).toBeNull()
  })

  it('event utan val ger null', () => {
    expect(getDefaultRolloverChoice(evt('a', 'sponsorOffer', []))).toBeNull()
  })
})

describe('resolveDeferredAtRollover — aldrig tyst', () => {
  it('post MED deklarerat default-utfall: utfallet tillämpas + EXAKT en inboxrad', () => {
    const deferred = [evt('d1', 'patronEvent', [
      { id: 'go', label: 'Gå på mötet', effect: { type: 'reputation', amount: 3 } },
      { id: 'skip', label: 'Avstå', effect: { type: 'noOp' } },
    ])]
    const result = resolveDeferredAtRollover(game(), deferred, 2026)

    expect(result.outcomes).toHaveLength(1)
    expect(result.outcomes[0]).toMatchObject({ eventId: 'd1', kind: 'resolved', choiceId: 'skip' })
    expect(result.inboxItems).toHaveLength(1)
    expect(result.inboxItems[0].type).toBe(InboxItemType.DecisionRollover)
    // Valet är faktiskt kört genom den riktiga effektmotorn (resolveEvent),
    // inte en parallell tolk — påståendekartan bär spåret.
    expect(result.game.resolvedChoices?.some(c => c.eventId === 'd1' && c.choiceId === 'skip')).toBe(true)
    // Det temporärt injicerade eventet städas bort igen.
    expect((result.game.pendingEvents ?? []).some(e => e.id === 'd1')).toBe(false)
  })

  it('post UTAN deklarerat default-utfall: uttrycklig utrinning + EXAKT en inboxrad', () => {
    const deferred = [evt('d2', 'criticalEconomy', [
      { id: 'wait', label: 'Avvakta', effect: { type: 'noOp' } },
    ])]
    const result = resolveDeferredAtRollover(game(), deferred, 2026)

    expect(result.outcomes).toHaveLength(1)
    expect(result.outcomes[0]).toMatchObject({ eventId: 'd2', kind: 'expired' })
    expect(result.outcomes[0].choiceId).toBeUndefined()
    expect(result.inboxItems).toHaveLength(1)
    expect(result.inboxItems[0].id).toContain('expired')
  })

  it('varje post i kön ger exakt EN rad — ingen försvinner tyst', () => {
    const deferred = [
      evt('d1', 'patronEvent', [{ id: 'skip', label: 'Avstå', effect: { type: 'noOp' } }]),
      evt('d2', 'criticalEconomy', [{ id: 'wait', label: 'Avvakta', effect: { type: 'noOp' } }]),
      evt('d3', 'sponsorOffer', [{ id: 'accept', label: 'Ja', effect: { type: 'acceptSponsor' } }]),
    ]
    const result = resolveDeferredAtRollover(game(), deferred, 2026)
    expect(result.outcomes).toHaveLength(3)
    expect(result.inboxItems).toHaveLength(3)
    expect(result.outcomes.map(o => o.kind)).toEqual(['resolved', 'expired', 'expired'])
    // Inga dubbletter av inbox-id.
    expect(new Set(result.inboxItems.map(i => i.id)).size).toBe(3)
  })

  it('tom kö → inga rader, spelet orört', () => {
    const g = game()
    const result = resolveDeferredAtRollover(g, [], 2026)
    expect(result.outcomes).toEqual([])
    expect(result.inboxItems).toEqual([])
    expect(result.game).toBe(g)
  })

  it('Opus-texten interpolerar titel och valt utfall korrekt (resolved)', () => {
    const deferred = [evt('d1', 'patronEvent', [{ id: 'skip', label: 'Avstå', effect: { type: 'noOp' } }])]
    const result = resolveDeferredAtRollover(game(), deferred, 2026)
    // 2026-08-31: mustDeadlineWarningText.ts/deferredRolloverText.ts levererade —
    // ingen Code-skriven prosa här, bara interpolation av Opus egna mallar
    // (deferredRolloverText.ts:s RESOLVED_VARIANTS[0]).
    expect(result.inboxItems[0].title).toBe('Titel d1 — avgjort')
    expect(result.inboxItems[0].body).toBe(
      'Beslutet blev liggande över säsongsskiftet. Klubben lät det gå åt det håll som krävde minst: Avstå.'
    )
  })

  it('Opus-texten interpolerar titel korrekt (expired, inget outcome-ord)', () => {
    const deferred = [evt('d1', 'criticalEconomy', [{ id: 'wait', label: 'Avvakta', effect: { type: 'noOp' } }])]
    const result = resolveDeferredAtRollover(game(), deferred, 2026)
    expect(result.inboxItems[0].title).toBe('Titel d1 — rann ut')
    expect(result.inboxItems[0].body).toBe(
      'Beslutet blev aldrig behandlat och föll bort när säsongen tog slut. Chansen är borta.'
    )
  })
})
