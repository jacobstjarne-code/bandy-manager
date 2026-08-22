import { describe, it, expect } from 'vitest'
import { generatePostAdvanceEvents } from '../postAdvanceEvents'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { SaveGame } from '../../../entities/SaveGame'
import type { GameEvent } from '../../../entities/GameEvent'

/**
 * Medium 1 (Skutskär-auditen, docs/incoming/bandy-manager-skutskaer-audit-52009671-2026-08-20.md):
 * två sponsorerbjudanden ("Bygg AB Nordin", "Skrot & Metall Nordin") kunde
 * ligga direkt efter varandra — activeSponsors räknade bara ACCEPTERADE
 * avtal, ett obesvarat erbjudande spärrade inte ett nytt.
 */

function makeGame(): SaveGame {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

function pendingSponsorOffer(): GameEvent {
  return {
    id: 'event_sponsor_existing',
    type: 'sponsorOffer',
    title: 't', body: 'b',
    choices: [
      { id: 'accept', label: 'Acceptera', effect: { type: 'acceptSponsor', sponsorData: '{}' } },
      { id: 'reject', label: 'Avslå', effect: { type: 'noOp' } },
    ],
    resolved: false,
  }
}

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

describe('generatePostAdvanceEvents — Medium 1: sponsordedupe', () => {
  it('genererar aldrig ett nytt sponsorOffer-event när ett obesvarat redan ligger i kön', () => {
    const game: SaveGame = { ...makeGame(), pendingEvents: [pendingSponsorOffer()], sponsors: [] }
    for (let i = 0; i < 200; i++) {
      const events = generatePostAdvanceEvents(game, [], 8 + (i % 4), seededRand(i * 7919 + 13))
      expect(events.some(e => e.type === 'sponsorOffer')).toBe(false)
    }
  })

  it('kan fortfarande generera ett sponsorOffer-event när kön är tom', () => {
    const game: SaveGame = { ...makeGame(), pendingEvents: [], sponsors: [] }
    let sawOffer = false
    for (let i = 0; i < 200 && !sawOffer; i++) {
      const events = generatePostAdvanceEvents(game, [], 8 + (i % 4), seededRand(i * 7919 + 13))
      if (events.some(e => e.type === 'sponsorOffer')) sawOffer = true
    }
    expect(sawOffer).toBe(true)
  })

  it('ett REDAN RESOLVAT sponsorOffer-event i pendingEvents spärrar inte ett nytt', () => {
    const resolved = { ...pendingSponsorOffer(), resolved: true }
    const game: SaveGame = { ...makeGame(), pendingEvents: [resolved], sponsors: [] }
    let sawOffer = false
    for (let i = 0; i < 200 && !sawOffer; i++) {
      const events = generatePostAdvanceEvents(game, [], 8 + (i % 4), seededRand(i * 7919 + 13))
      if (events.some(e => e.type === 'sponsorOffer')) sawOffer = true
    }
    expect(sawOffer).toBe(true)
  })
})
