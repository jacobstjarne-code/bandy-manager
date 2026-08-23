/**
 * O18 fält 2 (SASONGENS_BESLUT_2026-08-23.md, Jacobs dom 2026-08-24) — alla
 * åtta klassificerade (event.type, choiceId)-par, plus rangordningen.
 * Meningarna i assertions är Jacobs egna, klistrade ordagrant.
 */
import { describe, it, expect } from 'vitest'
import { captureSystemDecision, pickSeasonDecision } from '../seasonDecisionCaptureService'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent } from '../../entities/GameEvent'
import type { Mecenat } from '../../entities/Mecenat'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  return { ...game, ...overrides }
}

function makeMecenat(overrides: Partial<Mecenat> = {}): Mecenat {
  return {
    id: 'mec1', name: 'Björn Lindqvist', gender: 'male', business: 'Lindqvist AB',
    businessType: 'it_miljonär', wealth: 50, personality: 'kalkylator', influence: 15,
    happiness: 70, goodwill: 60, contribution: 100000, totalContributed: 0, demands: [],
    socialExpectations: [], isActive: true, arrivedSeason: 1, silentShout: 0,
    ...overrides,
  }
}

describe('captureSystemDecision — sell_star (criticalEconomy, form 1)', () => {
  it('bygger meningen ur spelarens namn och position, ingen pengasumma nämnd', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const player = game.players.find(p => p.id === playerId)!
    const event: GameEvent = {
      id: 'ev1', type: 'criticalEconomy', title: 't', body: 'b',
      choices: [{ id: 'sell_star', label: 'l', effect: { type: 'resolveEconomicCrisis', removePlayerId: playerId } }],
      resolved: false, systemhandelse: true,
    }
    const candidate = captureSystemDecision(game, event, 'sell_star')
    expect(candidate).not.toBeNull()
    expect(candidate!.sentence).toBe(`Du sålde ${player.firstName} ${player.lastName}. Det kostade er ${
      { defender: 'backen', half: 'halvan', midfielder: 'mittfältaren', forward: 'forwarden', goalkeeper: 'målvakten' }[player.position]
    }.`)
    expect(candidate!.sentence).not.toMatch(/kr|tkr/)
    expect(candidate!.systemsAffectedCount).toBe(2)
    expect(candidate!.irreversible).toBe(true)
    expect(candidate!.namedPerson).toBe(`${player.firstName} ${player.lastName}`)
    expect(candidate!.moneyAmount).toBe(350000)
  })

  it('okänd spelare (removePlayerId saknas/matchar ingen): null, ingen krasch', () => {
    const game = makeGame()
    const event: GameEvent = {
      id: 'ev1', type: 'criticalEconomy', title: 't', body: 'b',
      choices: [{ id: 'sell_star', label: 'l', effect: { type: 'resolveEconomicCrisis' } }],
      resolved: false, systemhandelse: true,
    }
    expect(captureSystemDecision(game, event, 'sell_star')).toBeNull()
  })
})

describe('captureSystemDecision — ask_mecenat (criticalEconomy, form 1)', () => {
  it('bygger meningen ur mecenatens namn, ingen pengasumma nämnd', () => {
    const mec = makeMecenat({ id: 'mec1', name: 'Björn Lindqvist' })
    const game = makeGame({ mecenater: [mec] })
    const event: GameEvent = {
      id: 'ev2', type: 'criticalEconomy', title: 't', body: 'b',
      choices: [{ id: 'ask_mecenat', label: 'l', effect: { type: 'resolveEconomicCrisis', targetMecenatId: 'mec1' } }],
      resolved: false, systemhandelse: true,
    }
    const candidate = captureSystemDecision(game, event, 'ask_mecenat')
    expect(candidate!.sentence).toBe('Du bad Björn Lindqvist om hjälp. Det kostade er hans förtroende.')
    expect(candidate!.systemsAffectedCount).toBe(2)
    expect(candidate!.irreversible).toBe(false)
    expect(candidate!.namedPerson).toBe('Björn Lindqvist')
  })
})

describe('captureSystemDecision — take_loan (criticalEconomy, form 1, löpande kostnad)', () => {
  it('bygger meningen utan namngiven person — löpande kostnad räknas ändå som en giltig kandidat', () => {
    const game = makeGame()
    const event: GameEvent = {
      id: 'ev3', type: 'criticalEconomy', title: 't', body: 'b',
      choices: [{ id: 'take_loan', label: 'l', effect: { type: 'resolveEconomicCrisis' } }],
      resolved: false, systemhandelse: true,
    }
    const candidate = captureSystemDecision(game, event, 'take_loan')
    expect(candidate!.sentence).toBe('Du tog lånet. Det kostade er varje månad sedan dess.')
    expect(candidate!.systemsAffectedCount).toBe(1)
    expect(candidate!.irreversible).toBe(false)
    expect(candidate!.namedPerson).toBeUndefined()
    expect(candidate!.moneyAmount).toBe(300000)
  })
})

describe('captureSystemDecision — offer_pro (varsel, form 1)', () => {
  it('räknar den ÅRLIGA löneökningen ur spelarnas lön FÖRE höjningen', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const player = game.players.find(p => p.id === playerId)!
    const newSalary = Math.round(player.salary * 1.5)
    const event: GameEvent = {
      id: 'ev4', type: 'varsel', title: 't', body: 'b',
      choices: [{
        id: 'offer_pro', label: 'l',
        effect: { type: 'multiEffect', subEffects: JSON.stringify([{ targetPlayerId: playerId, value: newSalary }]) },
      }],
      resolved: false, systemhandelse: true,
    }
    const candidate = captureSystemDecision(game, event, 'offer_pro')
    const expectedAnnual = (newSalary - player.salary) * 12
    expect(candidate!.moneyAmount).toBe(expectedAnnual)
    expect(candidate!.sentence).toContain('Du gav hela truppen heltidskontrakt.')
    expect(candidate!.sentence).toContain('i året.')
    expect(candidate!.systemsAffectedCount).toBe(2)
  })
})

describe('captureSystemDecision — detOmojligaValet/sell (form 1, flest system)', () => {
  it('4 system, irreversibelt, namngiven akademispelare', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const player = game.players.find(p => p.id === playerId)!
    const event: GameEvent = {
      id: 'ev5', type: 'detOmojligaValet', title: 't', body: 'b', relatedPlayerId: playerId,
      choices: [
        { id: 'sell', label: 'l', effect: { type: 'multiEffect', subEffects: '[]' } },
        { id: 'keep', label: 'l', effect: { type: 'multiEffect', subEffects: '[]' } },
      ],
      resolved: false, systemhandelse: true,
    }
    const candidate = captureSystemDecision(game, event, 'sell')
    expect(candidate!.sentence).toBe(`Du sålde ${player.firstName} ${player.lastName} innan han hunnit spela klart. Det kostade er akademins bästa år.`)
    expect(candidate!.systemsAffectedCount).toBe(4)
    expect(candidate!.irreversible).toBe(true)
    expect(candidate!.moneyAmount).toBe(180000)
  })
})

describe('captureSystemDecision — detOmojligaValet/keep (form 3, avstod)', () => {
  it('"Du lät det vara" — räknas som en giltig kandidat, inte hoppas över', () => {
    const game = makeGame()
    const event: GameEvent = {
      id: 'ev6', type: 'detOmojligaValet', title: 't', body: 'b',
      choices: [
        { id: 'sell', label: 'l', effect: { type: 'noOp' } },
        { id: 'keep', label: 'l', effect: { type: 'noOp' } },
      ],
      resolved: false, systemhandelse: true,
    }
    const candidate = captureSystemDecision(game, event, 'keep')
    expect(candidate!.sentence).toBe('Du lät det vara. Licensnämnden fick sitt kapital på annat håll.')
    expect(candidate!.systemsAffectedCount).toBe(2)
    expect(candidate!.irreversible).toBe(false)
    expect(candidate!.namedPerson).toBeUndefined()
    expect(candidate!.moneyAmount).toBeUndefined()
  })
})

describe('captureSystemDecision — transferBidReceived/accept (form 2, sökt)', () => {
  it('nämner BÅDA: vinst (bud) och pris (spelaren)', () => {
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
    const event: GameEvent = {
      id: 'ev7', type: 'transferBidReceived', title: 't', body: 'b',
      relatedPlayerId: playerId, relatedBidId: 'bid1',
      choices: [{ id: 'accept', label: 'l', effect: { type: 'acceptTransfer', bidId: 'bid1' } }],
      resolved: false, systemhandelse: true,
    }
    const candidate = captureSystemDecision(gameWithBid, event, 'accept')
    const name = `${player.firstName} ${player.lastName}`
    expect(candidate!.sentence).toBe(`Du tog budet på ${name}. Det gav 500 tkr, och tog ${name}.`)
    expect(candidate!.systemsAffectedCount).toBe(2)
    expect(candidate!.irreversible).toBe(true)
    expect(candidate!.namedPerson).toBe(name)
    expect(candidate!.moneyAmount).toBe(500000)
  })
})

describe('captureSystemDecision — offer_tribute (mecenatEvent retirement, form 2, sökt)', () => {
  it('nämner BÅDA: vinst (avsked) och pris (25 tkr)', () => {
    const mec = makeMecenat({ id: 'mec1', name: 'Björn Lindqvist' })
    const game = makeGame({ mecenater: [mec] })
    const event: GameEvent = {
      id: 'event_mecenat_retire_mec1_1', type: 'mecenatEvent', title: 't', body: 'b',
      choices: [{ id: 'offer_tribute', label: 'l', effect: { type: 'noOp' } }],
      resolved: false, systemhandelse: true,
    }
    const candidate = captureSystemDecision(game, event, 'offer_tribute')
    expect(candidate!.sentence).toBe('Du tackade av Björn Lindqvist som han förtjänade. Det gav ett avsked ingen glömmer, och tog 25 tkr.')
    expect(candidate!.systemsAffectedCount).toBe(3)
    expect(candidate!.irreversible).toBe(false)
    expect(candidate!.namedPerson).toBe('Björn Lindqvist')
    expect(candidate!.moneyAmount).toBe(25000)
  })
})

describe('captureSystemDecision — utanför den slutna listan', () => {
  it('systemhandelse:true men okänd (type, choiceId): null', () => {
    const game = makeGame()
    const event: GameEvent = {
      id: 'ev9', type: 'playerPraise', title: 't', body: 'b',
      choices: [{ id: 'unknown_choice', label: 'l', effect: { type: 'noOp' } }],
      resolved: false, systemhandelse: true,
    }
    expect(captureSystemDecision(game, event, 'unknown_choice')).toBeNull()
  })

  it('systemhandelse ej satt: null utan att ens slå upp tabellen', () => {
    const game = makeGame()
    const event: GameEvent = {
      id: 'ev10', type: 'criticalEconomy', title: 't', body: 'b',
      choices: [{ id: 'sell_star', label: 'l', effect: { type: 'resolveEconomicCrisis' } }],
      resolved: false,
    }
    expect(captureSystemDecision(game, event, 'sell_star')).toBeNull()
  })
})

describe('pickSeasonDecision — rangordningen', () => {
  const base = { eventId: 'e', round: 5, season: 1, systemsAffectedCount: 1, irreversible: false }

  it('flest berörda system vinner, oavsett övriga fält', () => {
    const winner = { ...base, eventId: 'many-systems', systemsAffectedCount: 4, irreversible: false, moneyAmount: 1000, sentence: 'many' }
    const loser = { ...base, eventId: 'few-systems', systemsAffectedCount: 2, irreversible: true, namedPerson: 'X', moneyAmount: 999999, sentence: 'few' }
    expect(pickSeasonDecision([loser, winner])?.eventId).toBe('many-systems')
  })

  it('vid lika system: irreversibelt vinner', () => {
    const winner = { ...base, eventId: 'irrev', systemsAffectedCount: 2, irreversible: true, sentence: 'a' }
    const loser = { ...base, eventId: 'rev', systemsAffectedCount: 2, irreversible: false, moneyAmount: 999999, sentence: 'b' }
    expect(pickSeasonDecision([loser, winner])?.eventId).toBe('irrev')
  })

  it('vid lika system+irreversibilitet: namngiven person vinner', () => {
    const winner = { ...base, eventId: 'named', systemsAffectedCount: 2, irreversible: true, namedPerson: 'Erik', sentence: 'a' }
    const loser = { ...base, eventId: 'unnamed', systemsAffectedCount: 2, irreversible: true, moneyAmount: 999999, sentence: 'b' }
    expect(pickSeasonDecision([loser, winner])?.eventId).toBe('named')
  })

  it('vid lika allt övrigt: kronor som sista skiljedomare', () => {
    const winner = { ...base, eventId: 'more-money', systemsAffectedCount: 2, irreversible: true, namedPerson: 'Erik', moneyAmount: 500000, sentence: 'a' }
    const loser = { ...base, eventId: 'less-money', systemsAffectedCount: 2, irreversible: true, namedPerson: 'Anna', moneyAmount: 100000, sentence: 'b' }
    expect(pickSeasonDecision([loser, winner])?.eventId).toBe('more-money')
  })

  it('vid FULL likhet: det senaste i säsongen vinner', () => {
    const earlier = { ...base, eventId: 'early', round: 3, sentence: 'a' }
    const later = { ...base, eventId: 'late', round: 20, sentence: 'b' }
    expect(pickSeasonDecision([earlier, later])?.eventId).toBe('late')
  })

  it('tom lista: null', () => {
    expect(pickSeasonDecision([])).toBeNull()
  })
})
