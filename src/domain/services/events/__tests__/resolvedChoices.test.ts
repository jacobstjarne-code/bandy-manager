/**
 * PÅSTÅENDEKARTAN (2026-08-24) — den nedskrivna sanningen "vad valde
 * spelaren". DecisionCard.tsx:s "Du valde: X" fanns tidigare bara i
 * GranskaScreen.tsx:s flyktiga useState, nollställd vid remount.
 * game.resolvedChoices skrivs nu i eventResolver.ts:s resolveEvent() på
 * alla FEM exit-punkter — detta testet driver var och en av dem via den
 * RIKTIGA resolveEvent, inte en spegling.
 */
import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { Sponsor, SaveGame } from '../../../entities/SaveGame'
import type { GameEvent } from '../../../entities/GameEvent'

function baseGame(): SaveGame {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

function makeSponsor(overrides: Partial<Sponsor> = {}): Sponsor {
  return {
    id: 'sponsor_new', name: 'Nykomlingen AB', category: 'Bygg',
    weeklyIncome: 800, contractRounds: 10, signedRound: 1,
    ...overrides,
  }
}

describe('resolveEvent — resolvedChoices skrivs på alla fem exit-punkter', () => {
  it('kanonisk väg (vanligt event via effect-switchen): eventId/choiceId/label skrivs', () => {
    let game = baseGame()
    const event: GameEvent = {
      id: 'event_canonical', type: 'communityEvent', title: 't', body: 'b',
      choices: [{ id: 'ack', label: 'Notera det', effect: { type: 'noOp' } }],
      resolved: false,
    }
    game = { ...game, pendingEvents: [event] }
    game = resolveEvent(game, 'event_canonical', 'ack')

    const entry = game.resolvedChoices?.find(c => c.eventId === 'event_canonical')
    expect(entry).toEqual({ eventId: 'event_canonical', choiceId: 'ack', label: 'Notera det' })
  })

  it('sponsorOffer — accept-grenen (specialfall 1/4): skrivs innan den egna early-returnen', () => {
    let game = baseGame()
    const offer = makeSponsor()
    game = {
      ...game,
      sponsors: [], riskySponsorContract: undefined,
      pendingEvents: [{
        id: 'event_sponsor_accept', type: 'sponsorOffer', title: 't', body: 'b',
        choices: [
          { id: 'accept', label: 'Acceptera sponsorn', effect: { type: 'acceptSponsor', sponsorData: JSON.stringify(offer) } },
          { id: 'reject', label: 'Avslå', effect: { type: 'noOp' } },
        ],
        resolved: false, sponsorData: JSON.stringify(offer),
      }],
    }
    game = resolveEvent(game, 'event_sponsor_accept', 'accept', () => 0.5)

    const entry = game.resolvedChoices?.find(c => c.eventId === 'event_sponsor_accept')
    expect(entry).toEqual({ eventId: 'event_sponsor_accept', choiceId: 'accept', label: 'Acceptera sponsorn' })
  })

  it('sponsorOffer — reject-grenen (specialfall 2/4)', () => {
    let game = baseGame()
    const offer = makeSponsor()
    game = {
      ...game,
      sponsors: [],
      pendingEvents: [{
        id: 'event_sponsor_reject', type: 'sponsorOffer', title: 't', body: 'b',
        choices: [
          { id: 'accept', label: 'Acceptera', effect: { type: 'acceptSponsor', sponsorData: JSON.stringify(offer) } },
          { id: 'reject', label: 'Tacka nej', effect: { type: 'noOp' } },
        ],
        resolved: false, sponsorData: JSON.stringify(offer),
      }],
    }
    game = resolveEvent(game, 'event_sponsor_reject', 'reject')

    const entry = game.resolvedChoices?.find(c => c.eventId === 'event_sponsor_reject')
    expect(entry).toEqual({ eventId: 'event_sponsor_reject', choiceId: 'reject', label: 'Tacka nej' })
  })

  it('riskySponsorOffer — accept-grenen, lyckad JSON-parse (specialfall 3/4)', () => {
    let game = baseGame()
    const offer = makeSponsor({ id: 'sponsor_risky' })
    game = {
      ...game,
      sponsors: [],
      pendingEvents: [{
        id: 'event_risky_accept', type: 'riskySponsorOffer', title: 't', body: 'b',
        choices: [
          { id: 'accept', label: 'Ta risken', effect: { type: 'acceptSponsor', sponsorData: JSON.stringify(offer) } },
          { id: 'reject', label: 'Avböj', effect: { type: 'noOp' } },
        ],
        resolved: false,
      }],
    }
    game = resolveEvent(game, 'event_risky_accept', 'accept')

    const entry = game.resolvedChoices?.find(c => c.eventId === 'event_risky_accept')
    expect(entry).toEqual({ eventId: 'event_risky_accept', choiceId: 'accept', label: 'Ta risken' })
  })

  it('riskySponsorOffer — reject-grenen, faller till den avslutande early-returnen (specialfall 4/4)', () => {
    let game = baseGame()
    const offer = makeSponsor({ id: 'sponsor_risky2' })
    game = {
      ...game,
      sponsors: [],
      pendingEvents: [{
        id: 'event_risky_reject', type: 'riskySponsorOffer', title: 't', body: 'b',
        choices: [
          { id: 'accept', label: 'Ta risken', effect: { type: 'acceptSponsor', sponsorData: JSON.stringify(offer) } },
          { id: 'reject', label: 'Nej tack', effect: { type: 'noOp' } },
        ],
        resolved: false,
      }],
    }
    game = resolveEvent(game, 'event_risky_reject', 'reject')

    const entry = game.resolvedChoices?.find(c => c.eventId === 'event_risky_reject')
    expect(entry).toEqual({ eventId: 'event_risky_reject', choiceId: 'reject', label: 'Nej tack' })
  })

  it('capas till senaste 200, precis som resolvedEventIds', () => {
    let game = baseGame()
    game = {
      ...game,
      resolvedChoices: Array.from({ length: 200 }, (_, i) => ({ eventId: `old_${i}`, choiceId: 'x', label: 'x' })),
      pendingEvents: [{
        id: 'event_overflow', type: 'communityEvent', title: 't', body: 'b',
        choices: [{ id: 'ack', label: 'Notera', effect: { type: 'noOp' } }],
        resolved: false,
      }],
    }
    game = resolveEvent(game, 'event_overflow', 'ack')

    expect(game.resolvedChoices).toHaveLength(200)
    expect(game.resolvedChoices!.some(c => c.eventId === 'old_0')).toBe(false)
    expect(game.resolvedChoices!.some(c => c.eventId === 'event_overflow')).toBe(true)
  })

  it('choices.length===0 (auto-resolverat atmosfäriskt event, inget riktigt val): skriver INGEN resolvedChoices-post', () => {
    let game = baseGame()
    game = {
      ...game,
      pendingEvents: [{
        id: 'event_no_choices', type: 'communityEvent', title: 't', body: 'b',
        choices: [], resolved: false,
      }],
    }
    const before = game.resolvedChoices ?? []
    game = resolveEvent(game, 'event_no_choices', 'irrelevant')

    expect(game.resolvedChoices ?? []).toEqual(before)
  })
})
