/**
 * KÖRORDER 2026-09-18 §5.2 — sponsorgrindens två nya spärrar.
 *
 * ROT: grinden var enbart "activeSponsors < maxSponsors och inget öppet
 * erbjudande". Ett nej kunde därför följas av ett nytt erbjudande redan nästa
 * omgång — avslaget kostade ingenting, och erbjudandena blev bakgrundsbrus i
 * stället för beslut. Cooldownen ger nejet en varaktighet; säsongstaket gör
 * att en klubb med lediga platser inte möts av ett obegränsat flöde.
 */
import { describe, it, expect } from 'vitest'
import {
  buildSponsorOfferEvent,
  generatePostAdvanceEvents,
  SPONSOR_DECLINE_COOLDOWN_ROUNDS,
  SPONSOR_OFFERS_PER_SEASON,
} from '../postAdvanceEvents'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { mulberry32 } from '../../../utils/random'
import type { Sponsor, SaveGame } from '../../../entities/SaveGame'

function baseGame(): SaveGame {
  const template = CLUB_TEMPLATES[0]
  return { ...createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 }), sponsors: [] }
}

function makeSponsor(): Sponsor {
  return {
    id: 'sponsor_new', name: 'Nykomlingen AB', category: 'Bygg',
    weeklyIncome: 800, contractRounds: 10, signedRound: 1,
  }
}

/** Kör grinden för ett antal omgångar och räkna hur många erbjudanden den släpper igenom. */
function offersOver(game: SaveGame, rounds: number): number {
  let n = 0
  for (let round = 1; round <= rounds; round++) {
    const events = generatePostAdvanceEvents(game, [], round, mulberry32(round * 31 + 7))
    n += events.filter(e => e.type === 'sponsorOffer').length
  }
  return n
}

describe('§5.2 — ett avslag håller i fyra omgångar', () => {
  it('avslag sätter cooldownen till currentMatchday + 4', () => {
    const game = baseGame()
    const offer = makeSponsor()
    const event = buildSponsorOfferEvent(offer, [], 'Testklubben', 6)
    const withEvent: SaveGame = {
      ...game,
      currentMatchday: 7,
      pendingEvents: [{ ...event, sponsorData: JSON.stringify(offer) }],
    }

    const after = resolveEvent(withEvent, event.id, 'reject')
    expect(after.sponsorOfferCooldownUntilRound).toBe(7 + SPONSOR_DECLINE_COOLDOWN_ROUNDS)
  })

  it('ett JA sätter ingen cooldown — priset ligger på nejet, inte på valet', () => {
    const game = baseGame()
    const offer = makeSponsor()
    const event = buildSponsorOfferEvent(offer, [], 'Testklubben', 6)
    const withEvent: SaveGame = {
      ...game,
      currentMatchday: 7,
      pendingEvents: [{ ...event, sponsorData: JSON.stringify(offer) }],
    }

    const after = resolveEvent(withEvent, event.id, 'accept')
    expect(after.sponsorOfferCooldownUntilRound).toBeUndefined()
  })

  it('grinden släpper inget erbjudande medan cooldownen löper, men öppnar när den gått ut', () => {
    const game = baseGame()
    const cooled: SaveGame = { ...game, sponsorOfferCooldownUntilRound: 10 }
    // Omgång 1–9 ligger under cooldownen.
    expect(offersOver(cooled, 9)).toBe(0)
    // Omgång 10 och framåt är öppna igen (cooldownen är exklusiv).
    const openAgain: SaveGame = { ...game, sponsorOfferCooldownUntilRound: 1 }
    expect(offersOver(openAgain, 12)).toBeGreaterThan(0)
  })
})

describe('§5.2 — säsongstaket', () => {
  it('grinden är stängd när taket är nått', () => {
    const game = baseGame()
    const capped: SaveGame = { ...game, sponsorOffersThisSeason: SPONSOR_OFFERS_PER_SEASON }
    expect(offersOver(capped, 12)).toBe(0)
  })

  it('en under taket är fortfarande öppen', () => {
    const game = baseGame()
    const justUnder: SaveGame = { ...game, sponsorOffersThisSeason: SPONSOR_OFFERS_PER_SEASON - 1 }
    expect(offersOver(justUnder, 12)).toBeGreaterThan(0)
  })
})
