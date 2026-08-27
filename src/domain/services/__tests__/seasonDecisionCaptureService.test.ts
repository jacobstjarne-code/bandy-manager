/**
 * O18 fält 2 (SASONGENS_BESLUT_2026-08-23.md, Jacobs dom 2026-08-24) — alla
 * åtta klassificerade (event.type, choiceId)-par, plus rangordningen.
 * Meningarna i assertions är Jacobs egna, klistrade ordagrant.
 */
import { describe, it, expect } from 'vitest'
import { captureSystemDecision, pickSeasonDecision } from '../seasonDecisionCaptureService'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import { formatValue } from '../../format'
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

// H3-uppföljning (5c9a7a8, 2026-08-24): applySale/applyFullTimePro speglar
// exakt vad eventResolver.ts:s riktiga effekt-hanterare gör (clubId→
// free_agent + bort ur squadPlayerIds; isFullTimePro:true) — så testerna
// bygger gameAfter på samma sätt produktionskoden faktiskt gör, inte en
// egen genväg som råkar se rätt ut.
function applySale(game: SaveGame, playerId: string): SaveGame {
  return {
    ...game,
    players: game.players.map(p => p.id === playerId ? { ...p, clubId: 'free_agent' } : p),
    clubs: game.clubs.map(c =>
      c.id === game.managedClubId ? { ...c, squadPlayerIds: c.squadPlayerIds.filter(id => id !== playerId) } : c
    ),
  }
}

function applyFullTimePro(game: SaveGame, playerId: string): SaveGame {
  return { ...game, players: game.players.map(p => p.id === playerId ? { ...p, isFullTimePro: true } : p) }
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
    const gameAfter = applySale(game, playerId)
    const candidate = captureSystemDecision(game, gameAfter, event, 'sell_star')
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
    expect(captureSystemDecision(game, game, event, 'sell_star')).toBeNull()
  })

  // H3 (5c9a7a8, 2026-08-24): den faktiska buggen — meningen fick tidigare
  // skrivas oavsett om spelaren fanns kvar i klubben eller inte.
  it('spelaren fortfarande kvar i managedClub (övergången bekräftas INTE): null, ingen falsk mening', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const event: GameEvent = {
      id: 'ev1', type: 'criticalEconomy', title: 't', body: 'b',
      choices: [{ id: 'sell_star', label: 'l', effect: { type: 'resolveEconomicCrisis', removePlayerId: playerId } }],
      resolved: false, systemhandelse: true,
    }
    // gameAfter = game (ingen mutation applicerad) — simulerar en trasig/
    // uteblivet effekt-hanterare.
    expect(captureSystemDecision(game, game, event, 'sell_star')).toBeNull()
  })
})

// PÅSTÅENDEKARTAN (2026-08-24): ask_mecenat påstod tidigare "kostade er hans
// förtroende" utan att kolla att happiness faktiskt sjönk — eventResolver.ts
// applicerar deltat villkorat (targetMecenatId + mecenatHappinessDelta måste
// båda finnas). Testerna bygger nu gameBefore/gameAfter som två skilda
// speltillstånd, samma mönster som H3 etablerade för sell_star/sell.
describe('captureSystemDecision — ask_mecenat (criticalEconomy, form 1)', () => {
  it('happiness faktiskt sjunker: bygger meningen ur mecenatens namn, ingen pengasumma nämnd', () => {
    const mecBefore = makeMecenat({ id: 'mec1', name: 'Björn Lindqvist', happiness: 70 })
    const gameBefore = makeGame({ mecenater: [mecBefore] })
    const gameAfter = { ...gameBefore, mecenater: [{ ...mecBefore, happiness: 40 }] }
    const event: GameEvent = {
      id: 'ev2', type: 'criticalEconomy', title: 't', body: 'b',
      choices: [{ id: 'ask_mecenat', label: 'l', effect: { type: 'resolveEconomicCrisis', targetMecenatId: 'mec1' } }],
      resolved: false, systemhandelse: true,
    }
    const candidate = captureSystemDecision(gameBefore, gameAfter, event, 'ask_mecenat')
    expect(candidate!.sentence).toBe('Du bad Björn Lindqvist om hjälp. Det kostade er hans förtroende.')
    expect(candidate!.systemsAffectedCount).toBe(2)
    expect(candidate!.irreversible).toBe(false)
    expect(candidate!.namedPerson).toBe('Björn Lindqvist')
  })

  it('happiness OFÖRÄNDRAD (effekten uteblev): null, ingen falsk mening', () => {
    const mec = makeMecenat({ id: 'mec1', name: 'Björn Lindqvist', happiness: 70 })
    const game = makeGame({ mecenater: [mec] })
    const event: GameEvent = {
      id: 'ev2', type: 'criticalEconomy', title: 't', body: 'b',
      choices: [{ id: 'ask_mecenat', label: 'l', effect: { type: 'resolveEconomicCrisis', targetMecenatId: 'mec1' } }],
      resolved: false, systemhandelse: true,
    }
    // gameAfter = game (ingen mutation applicerad) — samma mecenat, samma happiness.
    expect(captureSystemDecision(game, game, event, 'ask_mecenat')).toBeNull()
  })
})

describe('captureSystemDecision — take_loan (criticalEconomy, form 1, löpande kostnad)', () => {
  it('economicCrisisState.outcome==="loan": bygger meningen utan namngiven person', () => {
    const gameBefore = makeGame()
    const gameAfter: SaveGame = {
      ...gameBefore,
      economicCrisisState: {
        startedSeason: gameBefore.currentSeason, startedMatchday: 1,
        phase: 'resolved', eventsFired: [], outcome: 'loan',
      },
    }
    const event: GameEvent = {
      id: 'ev3', type: 'criticalEconomy', title: 't', body: 'b',
      choices: [{ id: 'take_loan', label: 'l', effect: { type: 'resolveEconomicCrisis' } }],
      resolved: false, systemhandelse: true,
    }
    const candidate = captureSystemDecision(gameBefore, gameAfter, event, 'take_loan')
    expect(candidate!.sentence).toBe('Du tog lånet. Det kostade er varje månad sedan dess.')
    expect(candidate!.systemsAffectedCount).toBe(1)
    expect(candidate!.irreversible).toBe(false)
    expect(candidate!.namedPerson).toBeUndefined()
    expect(candidate!.moneyAmount).toBe(300000)
  })

  it('economicCrisisState.outcome saknas/matchar inte "loan": null, ingen falsk mening', () => {
    const game = makeGame()
    const event: GameEvent = {
      id: 'ev3', type: 'criticalEconomy', title: 't', body: 'b',
      choices: [{ id: 'take_loan', label: 'l', effect: { type: 'resolveEconomicCrisis' } }],
      resolved: false, systemhandelse: true,
    }
    expect(captureSystemDecision(game, game, event, 'take_loan')).toBeNull()
  })
})

describe('captureSystemDecision — offer_pro (varsel, form 1)', () => {
  // H3-uppföljning (5c9a7a8, 2026-08-24, Jacobs dom): "hela truppen" var en
  // överdrift — offer_pro gäller bara de varslade. Två låsta textvarianter.
  it('EN varslad: "Du gav {Efternamn} heltidskontrakt" — räknar löneökningen ur lönen FÖRE höjningen', () => {
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
    const gameAfter = applyFullTimePro(game, playerId)
    const candidate = captureSystemDecision(game, gameAfter, event, 'offer_pro')
    const expectedAnnual = (newSalary - player.salary) * 12
    expect(candidate!.moneyAmount).toBe(expectedAnnual)
    expect(candidate!.sentence).toBe(`Du gav ${player.lastName} heltidskontrakt. Det kostade ${formatValue(expectedAnnual)} i året.`)
    expect(candidate!.namedPerson).toBe(`${player.firstName} ${player.lastName}`)
    expect(candidate!.systemsAffectedCount).toBe(2)
  })

  it('FLERA varslade: "Du gav de varslade heltidskontrakt", ingen namngiven person', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const [id1, id2] = club.squadPlayerIds
    const p1 = game.players.find(p => p.id === id1)!
    const p2 = game.players.find(p => p.id === id2)!
    const newSalary1 = Math.round(p1.salary * 1.5)
    const newSalary2 = Math.round(p2.salary * 1.5)
    const event: GameEvent = {
      id: 'ev4b', type: 'varsel', title: 't', body: 'b',
      choices: [{
        id: 'offer_pro', label: 'l',
        effect: { type: 'multiEffect', subEffects: JSON.stringify([
          { targetPlayerId: id1, value: newSalary1 },
          { targetPlayerId: id2, value: newSalary2 },
        ]) },
      }],
      resolved: false, systemhandelse: true,
    }
    let gameAfter = applyFullTimePro(game, id1)
    gameAfter = applyFullTimePro(gameAfter, id2)
    const candidate = captureSystemDecision(game, gameAfter, event, 'offer_pro')
    const expectedAnnual = Math.max(0, newSalary1 - p1.salary) * 12 + Math.max(0, newSalary2 - p2.salary) * 12
    expect(candidate!.sentence).toBe(`Du gav de varslade heltidskontrakt. Det kostade ${formatValue(expectedAnnual)} i året.`)
    expect(candidate!.namedPerson).toBeUndefined()
  })

  // H3-uppföljning (5c9a7a8, 2026-08-24): ingen av de berörda spelarna
  // faktiskt blev isFullTimePro (trasig/utebliven effekt) → null, inte en
  // mening som påstår att någon fick kontrakt när ingen fick det.
  it('ingen berörd spelare bekräftat isFullTimePro i gameAfter: null', () => {
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
    expect(captureSystemDecision(game, game, event, 'offer_pro')).toBeNull()
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
    const gameAfter = applySale(game, playerId)
    const candidate = captureSystemDecision(game, gameAfter, event, 'sell')
    expect(candidate!.sentence).toBe(`Du sålde ${player.firstName} ${player.lastName} innan han hunnit spela klart. Det kostade er akademins bästa år.`)
    expect(candidate!.systemsAffectedCount).toBe(4)
    expect(candidate!.irreversible).toBe(true)
    expect(candidate!.moneyAmount).toBe(180000)
  })

  // H3 (5c9a7a8, 2026-08-24) — DEN AKTUELLA BUGGEN, reproducerad direkt:
  // spelaren finns fortfarande i managedClub efter "sell" → null, aldrig
  // "Du sålde X" om övergången inte bekräftas.
  it('spelaren fortfarande i managedClub efter sell: null, inte en falsk "sålde"-mening', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const event: GameEvent = {
      id: 'ev5', type: 'detOmojligaValet', title: 't', body: 'b', relatedPlayerId: playerId,
      choices: [
        { id: 'sell', label: 'l', effect: { type: 'multiEffect', subEffects: '[]' } },
        { id: 'keep', label: 'l', effect: { type: 'multiEffect', subEffects: '[]' } },
      ],
      resolved: false, systemhandelse: true,
    }
    expect(captureSystemDecision(game, game, event, 'sell')).toBeNull()
  })
})

// PÅSTÅENDEKARTAN (2026-08-24), Jacobs egen rättelse: "Licensnämnden fick
// sitt kapital på annat håll" var en påhittad slutsats — ingenting i state
// stödjer den. Ny låst text nämner bara spelaren som stannade.
describe('captureSystemDecision — detOmojligaValet/keep (form 3, avstod)', () => {
  it('"Du lät det vara. {Namn} spelar kvar." — räknas som en giltig kandidat, inte hoppas över', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const player = game.players.find(p => p.id === playerId)!
    const event: GameEvent = {
      id: 'ev6', type: 'detOmojligaValet', title: 't', body: 'b', relatedPlayerId: playerId,
      choices: [
        { id: 'sell', label: 'l', effect: { type: 'noOp' } },
        { id: 'keep', label: 'l', effect: { type: 'noOp' } },
      ],
      resolved: false, systemhandelse: true,
    }
    const candidate = captureSystemDecision(game, game, event, 'keep')
    const name = `${player.firstName} ${player.lastName}`
    expect(candidate!.sentence).toBe(`Du lät det vara. ${name} spelar kvar.`)
    expect(candidate!.systemsAffectedCount).toBe(2)
    expect(candidate!.irreversible).toBe(false)
    expect(candidate!.namedPerson).toBe(name)
    expect(candidate!.moneyAmount).toBeUndefined()
  })

  it('relatedPlayerId saknas/pekar på ingen: null, ingen mening utan namn att verifiera', () => {
    const game = makeGame()
    const event: GameEvent = {
      id: 'ev6', type: 'detOmojligaValet', title: 't', body: 'b',
      choices: [
        { id: 'sell', label: 'l', effect: { type: 'noOp' } },
        { id: 'keep', label: 'l', effect: { type: 'noOp' } },
      ],
      resolved: false, systemhandelse: true,
    }
    expect(captureSystemDecision(game, game, event, 'keep')).toBeNull()
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
    const gameAfter = applySale(gameWithBid, playerId)
    const candidate = captureSystemDecision(gameWithBid, gameAfter, event, 'accept')
    const name = `${player.firstName} ${player.lastName}`
    expect(candidate!.sentence).toBe(`Du tog budet på ${name}. Det gav 500 tkr, och tog ${name}.`)
    expect(candidate!.systemsAffectedCount).toBe(2)
    expect(candidate!.irreversible).toBe(true)
    expect(candidate!.namedPerson).toBe(name)
    expect(candidate!.moneyAmount).toBe(500000)
  })

  // H3-uppföljning (5c9a7a8, 2026-08-24): samma verifieringskrav som sell_star/
  // detOmojligaValet — spelaren fortfarande kvar i managedClub → null.
  it('spelaren fortfarande i managedClub (transfern bekräftas INTE): null', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
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
    expect(captureSystemDecision(gameWithBid, gameWithBid, event, 'accept')).toBeNull()
  })
})

// PÅSTÅENDEKARTAN (2026-08-24): påstod tidigare "tog 25 tkr" så fort
// mecenaten existerade i gameAfter — verifierar nu mot den faktiska
// finansdeltan (eventResolver.ts drar 25000 ovillkorat på choiceId, men
// byggaren ska bekräfta det i state, inte anta det).
describe('captureSystemDecision — offer_tribute (mecenatEvent retirement, form 2, sökt)', () => {
  it('finances faktiskt lägre i gameAfter: nämner BÅDA: vinst (avsked) och pris (25 tkr)', () => {
    const mec = makeMecenat({ id: 'mec1', name: 'Björn Lindqvist' })
    const gameBefore = makeGame({ mecenater: [mec] })
    const club = gameBefore.clubs.find(c => c.id === gameBefore.managedClubId)!
    const gameAfter = {
      ...gameBefore,
      clubs: gameBefore.clubs.map(c => c.id === club.id ? { ...c, finances: c.finances - 25000 } : c),
    }
    const event: GameEvent = {
      id: 'event_mecenat_retire_mec1_1', type: 'mecenatEvent', title: 't', body: 'b',
      choices: [{ id: 'offer_tribute', label: 'l', effect: { type: 'noOp' } }],
      resolved: false, systemhandelse: true,
    }
    const candidate = captureSystemDecision(gameBefore, gameAfter, event, 'offer_tribute')
    expect(candidate!.sentence).toBe('Du tackade av Björn Lindqvist som han förtjänade. Det gav ett avsked ingen glömmer, och tog 25 tkr.')
    expect(candidate!.systemsAffectedCount).toBe(3)
    expect(candidate!.irreversible).toBe(false)
    expect(candidate!.namedPerson).toBe('Björn Lindqvist')
    expect(candidate!.moneyAmount).toBe(25000)
  })

  it('finances OFÖRÄNDRADE (effekten uteblev): null, ingen falsk mening', () => {
    const mec = makeMecenat({ id: 'mec1', name: 'Björn Lindqvist' })
    const game = makeGame({ mecenater: [mec] })
    const event: GameEvent = {
      id: 'event_mecenat_retire_mec1_1', type: 'mecenatEvent', title: 't', body: 'b',
      choices: [{ id: 'offer_tribute', label: 'l', effect: { type: 'noOp' } }],
      resolved: false, systemhandelse: true,
    }
    expect(captureSystemDecision(game, game, event, 'offer_tribute')).toBeNull()
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
    expect(captureSystemDecision(game, game, event, 'unknown_choice')).toBeNull()
  })

  it('systemhandelse ej satt: null utan att ens slå upp tabellen', () => {
    const game = makeGame()
    const event: GameEvent = {
      id: 'ev10', type: 'criticalEconomy', title: 't', body: 'b',
      choices: [{ id: 'sell_star', label: 'l', effect: { type: 'resolveEconomicCrisis' } }],
      resolved: false,
    }
    expect(captureSystemDecision(game, game, event, 'sell_star')).toBeNull()
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
