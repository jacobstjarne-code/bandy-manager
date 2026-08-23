/**
 * O11, tre domar (Jacobs dom 2026-08-24, contentContract.ts):
 * - playerUnhappy: pivotal bara när irreversibel (spelaren kan faktiskt
 *   lämna) — whyNow satt bara med en aktiv inkommande transferbid.
 * - mecenatEvent: åtta undertyper delar inte en whyNow-rad — bara 90+
 *   styrelsehot (generateSilentShoutEvent) sätter whyNow, de andra sju inte.
 * - economicStress: INTE pivotal, avsiktligt (ingen kodändring att testa —
 *   se contentContract.ts:s notes).
 */
import { describe, it, expect } from 'vitest'
import { unhappyPlayerEvent } from '../events/eventFactories'
import { generateSilentShoutEvent, generateMecenatIntroEvent } from '../mecenatService'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import { getEffectiveWhyNowLine } from '../../data/contentContract'
import type { SaveGame } from '../../entities/SaveGame'
import type { Mecenat } from '../../entities/Mecenat'

function makeGame(): SaveGame {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

function makeMecenat(overrides: Partial<Mecenat> = {}): Mecenat {
  return {
    id: 'mec1', name: 'Björn Lindqvist', gender: 'male', business: 'Lindqvist AB',
    businessType: 'it_miljonär', wealth: 50, personality: 'kalkylator', influence: 15,
    happiness: 70, goodwill: 60, contribution: 100000, totalContributed: 0, demands: [],
    socialExpectations: [], isActive: true, arrivedSeason: 1, silentShout: 90,
    ...overrides,
  }
}

describe('playerUnhappy — whyNow bara med aktiv inkommande bud', () => {
  it('ingen bud: whyNow osatt, eventet nedgraderas till normal', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const gameNoBids = { ...game, transferBids: [] }
    const event = unhappyPlayerEvent(gameNoBids, playerId)

    expect(event.whyNow).toBeUndefined()
    expect(getEffectiveWhyNowLine(event)).toBeNull()
  })

  it('aktiv inkommande bud på spelaren: whyNowPerson satt, "väntar på besked"', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const player = game.players.find(p => p.id === playerId)!
    const gameWithBid = {
      ...game,
      transferBids: [{
        id: 'bid1', playerId, buyingClubId: 'club_other', sellingClubId: game.managedClubId,
        offerAmount: 500000, offeredSalary: 20000, contractYears: 3,
        direction: 'incoming' as const, status: 'pending' as const, createdRound: 1, expiresRound: 5,
      }],
    }
    const event = unhappyPlayerEvent(gameWithBid, playerId)

    expect(event.whyNow?.whyNowPerson).toBe(player.firstName)
    expect(getEffectiveWhyNowLine(event)).toBe(`${player.firstName} väntar på besked.`)
  })

  it('bud på en ANNAN spelare påverkar inte denna spelares whyNow', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const otherPlayerId = club.squadPlayerIds[1]
    const gameWithBid = {
      ...game,
      transferBids: [{
        id: 'bid1', playerId: otherPlayerId, buyingClubId: 'club_other', sellingClubId: game.managedClubId,
        offerAmount: 500000, offeredSalary: 20000, contractYears: 3,
        direction: 'incoming' as const, status: 'pending' as const, createdRound: 1, expiresRound: 5,
      }],
    }
    const event = unhappyPlayerEvent(gameWithBid, playerId)

    expect(event.whyNow).toBeUndefined()
  })

  it('utgående bud (direction=outgoing) räknas inte — spelaren kan inte lämna av det', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const gameWithBid = {
      ...game,
      transferBids: [{
        id: 'bid1', playerId, buyingClubId: game.managedClubId, sellingClubId: 'club_other',
        offerAmount: 500000, offeredSalary: 20000, contractYears: 3,
        direction: 'outgoing' as const, status: 'pending' as const, createdRound: 1, expiresRound: 5,
      }],
    }
    const event = unhappyPlayerEvent(gameWithBid, playerId)

    expect(event.whyNow).toBeUndefined()
  })
})

describe('mecenatEvent — whyNow bara på 90+ styrelsehot-grenen', () => {
  it('90+ silentShout: whyNowPerson = mecenatens namn', () => {
    const mec = makeMecenat({ silentShout: 95 })
    const event = generateSilentShoutEvent(mec, undefined, () => 0.01)

    expect(event).not.toBeNull()
    expect(event!.whyNow?.whyNowPerson).toBe('Björn Lindqvist')
    expect(getEffectiveWhyNowLine(event!)).toBe('Björn Lindqvist väntar på besked.')
  })

  it('övriga silentShout-trösklar (30-89) sätter inte whyNow', () => {
    const mediaMec = makeMecenat({ silentShout: 35 })
    const mediaEvent = generateSilentShoutEvent(mediaMec, undefined, () => 0.01)
    expect(mediaEvent?.whyNow).toBeUndefined()

    const tacticMec = makeMecenat({ silentShout: 75 })
    const tacticEvent = generateSilentShoutEvent(tacticMec, undefined, () => 0.01)
    expect(tacticEvent?.whyNow).toBeUndefined()
  })

  it('intro-eventet (annan undertyp) sätter inte whyNow', () => {
    const mec = makeMecenat()
    const event = generateMecenatIntroEvent(mec)
    expect(event.whyNow).toBeUndefined()
  })
})
