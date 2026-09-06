/**
 * O18 fält 2 (SASONGENS_BESLUT_2026-08-23.md, Jacobs dom 2026-08-24) — alla
 * åtta klassificerade (event.type, choiceId)-par, plus rangordningen.
 * Meningarna i assertions är Jacobs egna, klistrade ordagrant.
 */
import { describe, it, expect } from 'vitest'
import { captureSystemDecision, captureFacilityBuildDecision, pickSeasonDecisionFromLedger, pickMostImportantDecisionText, composeSeasonDecisionSentence, SEASON_DECISION_NONE_TEXT, buildDecisionLedgerEntry } from '../seasonDecisionCaptureService'
import type { EventLedgerEntry } from '../../entities/Narrative'
import {
  buildFacilityBuildTokens,
  sentenceForCaptainSupport,
  sentenceForCaptainTakeCharge,
  sentenceForFacilityBuild,
  sentenceForMecenatConflictSide,
  getOfferProMultiSentence,
} from '../../data/seasonDecisionSentences'
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
  it('economicCrisisState.outcome==="loan": den bindande treårsskulden kvalificerar som beslut', () => {
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
    expect(candidate).toMatchObject({
      irreversible: true,
      tension: true,
      moneyAmount: 300_000,
    })
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

  // A-H9: flera varslade ger ingen namngiven person (namedPerson undefined)
  // — bara tension=true kvar, score 1 av 3, kvalificerar inte längre.
  // Byggarens meningslogik är oförändrad (text-utan-yta för detta fallet).
  it('FLERA varslade: kvalificerar INTE (ingen namngiven person, score 1 av 3)', () => {
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
    expect(candidate).toBeNull()
  })

  // H3-uppföljning (5c9a7a8, 2026-08-24): ingen av de berörda spelarna
  // faktiskt blev isFullTimePro (trasig/utebliven effekt) → null, inte en
  // mening som påstår att någon fick kontrakt när ingen fick det.
  it('ingen berörd spelare bekräftat isFullTimePro i gameAfter: null', () => {
    // sluttest-narrative-truth-grind-svepet (2026-09-06) unifierade attribut-
    // generatorn (playerAttributeGenerator.ts), vilket ändrade RNG-förbruknings-
    // ordningen i createNewGame({seed:1}) — squadPlayerIds[0] kunde därför bli
    // en spelare som RÅKAR ha isFullTimePro:true redan vid generering. Testet
    // ska bevisa logikvägen ("ingen bekräftad" → null), inte råka bero på vilken
    // spelare frö 1 för tillfället ger — explicit isFullTimePro:false på källan.
    const game0 = makeGame()
    const club = game0.clubs.find(c => c.id === game0.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const game: SaveGame = {
      ...game0,
      players: game0.players.map(p => p.id === playerId ? { ...p, isFullTimePro: false } : p),
    }
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
  // A-H9: "keep" har en namngiven person men varken irreversibilitet eller
  // spänning (inget uttalat pris för att avstå) — score 1 av 3, kvalificerar
  // inte längre som kandidat. Byggarens meningslogik oförändrad (text-utan-yta).
  it('"Du lät det vara. {Namn} spelar kvar." — kvalificerar INTE (score 1 av 3, ingen kostnad uttalad)', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const event: GameEvent = {
      id: 'ev6', type: 'detOmojligaValet', title: 't', body: 'b', relatedPlayerId: playerId,
      choices: [
        { id: 'sell', label: 'l', effect: { type: 'noOp' } },
        { id: 'keep', label: 'l', effect: { type: 'noOp' } },
      ],
      resolved: false, systemhandelse: true,
    }
    const candidate = captureSystemDecision(game, game, event, 'keep')
    expect(candidate).toBeNull()
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

// A-H9 (DOM_AH9_ARSBOKENS_BESLUT_2026-08-27.md): ny rangordning — namngiven
// person → irreversibelt → spänning → antal system (sist, bara skiljedomare)
// → kronor (allra sist). Ersätter den gamla ordningen (flest system vann
// oavsett övrigt) — domens ord: "en räknare är inte ett minne."
/**
 * MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md Fas 2 — RETIRE-STEGET.
 * pickSeasonDecision (SeasonDecisionCandidate[]) superseterad av
 * pickSeasonDecisionFromLedger (EventLedgerEntry[]) — exakt samma sex
 * scenarier portade en-till-en (namedPerson→subject, round→matchday,
 * ingen sentence på liggarposten) för att bevisa "samma femstegsvektor,
 * samma vinnare".
 */
describe('pickSeasonDecisionFromLedger — rangordningen (A-H9), portad från pickSeasonDecision', () => {
  const base: Omit<EventLedgerEntry, 'subject' | 'irreversible' | 'tension' | 'systemsAffectedCount' | 'moneyAmount'> & { systemsAffectedCount: number; irreversible: boolean; tension: boolean } = {
    type: 'decision', semanticKey: 'k', matchday: 5, season: 1, significance: 50, systemsAffectedCount: 1, irreversible: false, tension: false,
  }
  const subj = { kind: 'player' as const, id: 'p1' }

  it('namngiven person (subject) vinner FÖRST, oavsett antal berörda system', () => {
    const winner: EventLedgerEntry = { ...base, semanticKey: 'named-few-systems', systemsAffectedCount: 1, subject: subj }
    const loser: EventLedgerEntry = { ...base, semanticKey: 'unnamed-many-systems', systemsAffectedCount: 4, moneyAmount: 999999 }
    expect(pickSeasonDecisionFromLedger([loser, winner])?.semanticKey).toBe('named-few-systems')
  })

  it('vid lika (namngiven eller ej): irreversibelt vinner', () => {
    const winner: EventLedgerEntry = { ...base, semanticKey: 'irrev', subject: subj, irreversible: true }
    const loser: EventLedgerEntry = { ...base, semanticKey: 'rev', subject: subj, irreversible: false, moneyAmount: 999999 }
    expect(pickSeasonDecisionFromLedger([loser, winner])?.semanticKey).toBe('irrev')
  })

  it('vid lika namngiven+irreversibilitet: spänning (gjorde det ont) vinner', () => {
    const winner: EventLedgerEntry = { ...base, semanticKey: 'tension', subject: subj, irreversible: true, tension: true }
    const loser: EventLedgerEntry = { ...base, semanticKey: 'no-tension', subject: subj, irreversible: true, tension: false, moneyAmount: 999999 }
    expect(pickSeasonDecisionFromLedger([loser, winner])?.semanticKey).toBe('tension')
  })

  it('vid lika de tre första: antal berörda system, BARA som skiljedomare', () => {
    const winner: EventLedgerEntry = { ...base, semanticKey: 'many-systems', subject: subj, irreversible: true, tension: true, systemsAffectedCount: 4 }
    const loser: EventLedgerEntry = { ...base, semanticKey: 'few-systems', subject: subj, irreversible: true, tension: true, systemsAffectedCount: 2, moneyAmount: 999999 }
    expect(pickSeasonDecisionFromLedger([loser, winner])?.semanticKey).toBe('many-systems')
  })

  it('vid lika allt övrigt: kronor som allra sista skiljedomare', () => {
    const winner: EventLedgerEntry = { ...base, semanticKey: 'more-money', subject: subj, irreversible: true, tension: true, systemsAffectedCount: 2, moneyAmount: 500000 }
    const loser: EventLedgerEntry = { ...base, semanticKey: 'less-money', subject: { kind: 'mecenat', id: 'm1' }, irreversible: true, tension: true, systemsAffectedCount: 2, moneyAmount: 100000 }
    expect(pickSeasonDecisionFromLedger([loser, winner])?.semanticKey).toBe('more-money')
  })

  it('vid FULL likhet: den senaste omgången (matchday) vinner', () => {
    const earlier: EventLedgerEntry = { ...base, semanticKey: 'early', matchday: 3 }
    const later: EventLedgerEntry = { ...base, semanticKey: 'late', matchday: 20 }
    expect(pickSeasonDecisionFromLedger([earlier, later])?.semanticKey).toBe('late')
  })

  it('tom lista: null', () => {
    expect(pickSeasonDecisionFromLedger([])).toBeNull()
  })
})

// A-H9: raden ska ALDRIG utebli längre. pickMostImportantDecisionText
// bär SEASON_DECISION_NONE_TEXT (Jacobs ord, ordagrant) internt när ingen
// kandidat kvalificerar ELLER går att komponera.
describe('SEASON_DECISION_NONE_TEXT — A-H9 fallback', () => {
  it('är den låsta texten', () => {
    expect(SEASON_DECISION_NONE_TEXT).toBe('Inget beslut stack ut i vintras.')
  })

  it('pickMostImportantDecisionText faller tillbaka på den när liggaren är tom', () => {
    const game = makeGame({ eventLedger: [] })
    expect(pickMostImportantDecisionText(game, game.currentSeason)).toBe('Inget beslut stack ut i vintras.')
  })
})

// ── HIGH 6 (auditen 2026-08-29) — levererade mallar + tom-mall-invariant ──
//
// De tre nya kandidatkällorna (mecenatkonflikt, kaptensmöte, anläggningsbygge)
// har nu sina levererade meningsmallar i seasonDecisionSentences.ts. Den här
// filen kör OMOCKAT — precis som produktionen — och bevisar både de faktiska
// årsboksraderna och den kvarvarande hjälparinvarianten: en explicit tom mall
// ger `null`, aldrig en kandidat med blank mening.
describe('HIGH 6 — levererade årsboksmeningar och tom-mall-invariant', () => {
  it('interpolationen fungerar när en mall FINNS (injicerad, inte den tomma konstanten)', () => {
    expect(sentenceForMecenatConflictSide('{backed} före {other}.', { backed: 'Björn', other: 'Astrid' }))
      .toBe('Björn före Astrid.')
    expect(sentenceForCaptainTakeCharge('{captain} ({last}).', { captain: 'Erik Ros', last: 'Ros' }))
      .toBe('Erik Ros (Ros).')
    expect(sentenceForCaptainSupport('{last} fick ordet.', { captain: 'Erik Ros', last: 'Ros' }))
      .toBe('Ros fick ordet.')
    expect(sentenceForFacilityBuild('{facility} för {cost}.', buildFacilityBuildTokens('Värmestuga', 120000)))
      .toBe('Värmestuga för 120 tkr.')
  })

  it('tom mall ger null, aldrig tom sträng — signalen byggarna läser', () => {
    expect(sentenceForMecenatConflictSide('', { backed: 'A', other: 'B' })).toBeNull()
    expect(sentenceForCaptainTakeCharge('', { captain: 'A', last: 'A' })).toBeNull()
    expect(sentenceForCaptainSupport('', { captain: 'A', last: 'A' })).toBeNull()
    expect(sentenceForFacilityBuild('', { facility: 'A', cost: '1 tkr' })).toBeNull()
  })

  it('mecenatkonflikten: verifieringen ger den levererade årsboksraden', () => {
    const gameBefore = makeGame({ mecenater: [
      makeMecenat({ id: 'mec1', name: 'Björn Lindqvist', happiness: 60 }),
      makeMecenat({ id: 'mec2', name: 'Astrid Wahl', happiness: 60 }),
    ] })
    const gameAfter: SaveGame = { ...gameBefore, mecenater: [
      { ...gameBefore.mecenater![0], happiness: 75 },
      { ...gameBefore.mecenater![1], happiness: 50 },
    ] }
    const event: GameEvent = {
      id: 'event_conflict_mec1_mec2', type: 'mecenatEvent', title: 't', body: 'b',
      choices: [{ id: 'side_mec1', label: 'l', effect: { type: 'multiEffect', subEffects: JSON.stringify([
        { type: 'mecenatHappiness', targetMecenatId: 'mec1', amount: 15 },
        { type: 'mecenatHappiness', targetMecenatId: 'mec2', amount: -10 },
      ]) } }],
      resolved: false,
    }
    const candidate = captureSystemDecision(gameBefore, gameAfter, event, 'side_mec1')
    expect(candidate?.sentence).toBe('Du valde Björn Lindqvists sida när mecenaterna drabbade samman. Astrid Wahl glömmer inte vem du släppte.')
  })

  it('kaptensmötet: verifieringen ger den levererade årsboksraden', () => {
    const base = makeGame({ boardPatience: 70 })
    const captain = base.players.find(p => p.clubId === base.managedClubId && p.morale > 10)!
    const event: GameEvent = {
      id: 'event_captain_speech_s1', type: 'captainSpeech', title: 't', body: 'b',
      choices: [{ id: 'take_charge', label: 'l', effect: { type: 'boostMorale', value: -5, targetPlayerId: captain.id } }],
      resolved: false,
    }
    const gameAfter: SaveGame = {
      ...base,
      players: base.players.map(p => p.id === captain.id ? { ...p, morale: p.morale - 5 } : p),
    }
    const candidate = captureSystemDecision(base, gameAfter, event, 'take_charge')
    expect(candidate?.sentence).toBe(`${captain.firstName} ${captain.lastName} bad om att få ta kommandot i krisen. Du tog det själv, och ${captain.lastName} kände av det.`)
  })

  it('anläggningsbygget: verifieringen ger den levererade årsboksraden', () => {
    const gameBefore = makeGame({ facilityState: { builtNodeIds: [] } })
    const club = gameBefore.clubs.find(c => c.id === gameBefore.managedClubId)!
    const gameAfter: SaveGame = {
      ...gameBefore,
      facilityState: { builtNodeIds: [], activeProject: { nodeId: 'varmestuga', startedMatchday: 0, etaMatchday: 8 } },
      clubs: gameBefore.clubs.map(c => c.id === club.id ? { ...c, finances: c.finances - 120000 } : c),
    }
    const candidate = captureFacilityBuildDecision(gameBefore, gameAfter, 'varmestuga', 120000)
    expect(candidate?.sentence).toBe('Värmestuga stod klar. Den kostade 120 tkr ur kassan, men blir kvar längre än de flesta beslut.')
  })
})

/**
 * MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md Fas 2 — DUAL-WRITE.
 * buildDecisionLedgerEntry är en ren konvertering (ingen ny verifiering) —
 * testerna bekräftar att candidate.subject/irreversible/tension/
 * systemsAffectedCount/moneyAmount bärs över orört, sentence INTE med, och
 * att significance härleds deterministiskt ur samma rangordningsfält.
 */
describe('buildDecisionLedgerEntry — Fas 2 dual-write', () => {
  it('sell_star: subject=player, sentence saknas, alla A-H9-fält bärs', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const event: GameEvent = {
      id: 'ev1', type: 'criticalEconomy', title: 't', body: 'b',
      choices: [{ id: 'sell_star', label: 'l', effect: { type: 'resolveEconomicCrisis', removePlayerId: playerId } }],
      resolved: false, systemhandelse: true,
    }
    const gameAfter = applySale(game, playerId)
    const candidate = captureSystemDecision(game, gameAfter, event, 'sell_star')!
    const entry = buildDecisionLedgerEntry(candidate, 'criticalEconomy', 42)

    expect(entry.type).toBe('decision')
    expect(entry.semanticKey).toBe('criticalEconomy')
    expect(entry.season).toBe(candidate.season)
    expect(entry.matchday).toBe(42) // EGEN parameter, inte candidate.round (rond-identitet)
    expect(entry.subject).toEqual({ kind: 'player', id: playerId })
    expect(entry.irreversible).toBe(true)
    expect(entry.tension).toBe(true)
    expect(entry.systemsAffectedCount).toBe(2)
    expect(entry.moneyAmount).toBe(350000)
    expect(entry.madeByPlayer).toBe(true)
    expect(entry).not.toHaveProperty('sentence')
  })

  it('ask_mecenat: subject=mecenat (inte player/club) — den tidigare fyndluckan', () => {
    const mecBefore = makeMecenat({ id: 'mec1', name: 'Björn Lindqvist', happiness: 70 })
    const gameBefore = makeGame({ mecenater: [mecBefore] })
    const club = gameBefore.clubs.find(c => c.id === gameBefore.managedClubId)!
    const event: GameEvent = {
      id: 'ev1', type: 'criticalEconomy', title: 't', body: 'b',
      choices: [{ id: 'ask_mecenat', label: 'l', effect: { type: 'resolveEconomicCrisis', targetMecenatId: 'mec1' } }],
      resolved: false, systemhandelse: true,
    }
    const gameAfter: SaveGame = {
      ...gameBefore,
      mecenater: [{ ...mecBefore, happiness: 55 }],
      clubs: gameBefore.clubs.map(c => c.id === club.id ? { ...c, finances: c.finances + 200000 } : c),
    }
    const candidate = captureSystemDecision(gameBefore, gameAfter, event, 'ask_mecenat')!
    const entry = buildDecisionLedgerEntry(candidate, 'criticalEconomy', 10)
    expect(entry.subject).toEqual({ kind: 'mecenat', id: 'mec1' })
  })

  it('kandidat utan subject (t.ex. take_loan-formen — inget namedPerson) ⇒ subject undefined i liggarposten', () => {
    // Konstruerad candidate direkt för att testa buildDecisionLedgerEntry:s
    // hantering av "inget subject satt" isolerat.
    const candidate = { eventId: 'x', round: 10, season: 1, systemsAffectedCount: 1, irreversible: false, tension: true, moneyAmount: 300000, sentence: 'Du tog lånet. Det kostade er varje månad sedan dess.' }
    const entry = buildDecisionLedgerEntry(candidate, 'criticalEconomy', 10)
    expect(entry.subject).toBeUndefined()
    expect(entry.moneyAmount).toBe(300000)
  })

  it('significance: baseline 50 + tension(15) + subject(10) + systemsAffectedCount, INTE klampad (captainSpeech/take_charge)', () => {
    const base = makeGame({ boardPatience: 70 })
    const captain = base.players.find(p => p.clubId === base.managedClubId && p.morale > 10)!
    const event: GameEvent = {
      id: 'event_captain_speech_s1', type: 'captainSpeech', title: 't', body: 'b',
      choices: [{ id: 'take_charge', label: 'l', effect: { type: 'boostMorale', value: -5, targetPlayerId: captain.id } }],
      resolved: false,
    }
    const gameAfter: SaveGame = {
      ...base,
      players: base.players.map(p => p.id === captain.id ? { ...p, morale: p.morale - 5 } : p),
    }
    // take_charge: irreversible=false, tension=true, subject satt, systemsAffectedCount=1
    const candidate = captureSystemDecision(base, gameAfter, event, 'take_charge')!
    const entry = buildDecisionLedgerEntry(candidate, 'captainSpeech', 10)
    expect(entry.significance).toBe(50 + 15 + 10 + 5) // + min(20, 1*5)=5, långt under 100-taket
  })

  it('significance klampas till 100 när summan skulle bli högre (detOmojligaValet/sell, alla fyra bonusar)', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const event: GameEvent = {
      id: 'ev1', type: 'detOmojligaValet', title: 't', body: 'b',
      choices: [{ id: 'sell', label: 'l', effect: { type: 'noOp' } }],
      resolved: false, relatedPlayerId: playerId,
    }
    const gameAfter = applySale(game, playerId)
    // irreversible=true, tension=true, subject satt, systemsAffectedCount=4 → 50+15+15+10+20=110
    const candidate = captureSystemDecision(game, gameAfter, event, 'sell')!
    const entry = buildDecisionLedgerEntry(candidate, 'detOmojligaValet', 10)
    expect(entry.significance).toBe(100)
  })

  it('significance klampas till 100', () => {
    // Konstruerad candidate direkt (ingen builder ger idag ett stort nog
    // systemsAffectedCount för att i sig nå taket) — verifierar bara klampen.
    const candidate = { eventId: 'x', round: 1, season: 1, systemsAffectedCount: 10, irreversible: true, tension: true, subject: { kind: 'player' as const, id: 'p1' }, sentence: 's' }
    const entry = buildDecisionLedgerEntry(candidate, 'k', 1)
    expect(entry.significance).toBe(100)
  })
})

/**
 * MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md Fas 2 — RETIRE-STEGET,
 * slutbeviset: "samma femstegsvektor, samma vinnare" — end-to-end genom
 * resolveEvent → captureSystemDecision → buildDecisionLedgerEntry →
 * composeSeasonDecisionSentence, jämfört mot candidate.sentence (den gamla
 * vägen) för samma resolution. Skillnaden bevisas noll.
 */
describe('composeSeasonDecisionSentence — Fas 2 slutbevis (samma mening som candidate.sentence)', () => {
  it('sell_star: liggarkomponerad mening === candidate.sentence', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const event: GameEvent = {
      id: 'ev1', type: 'criticalEconomy', title: 't', body: 'b',
      choices: [{ id: 'sell_star', label: 'l', effect: { type: 'resolveEconomicCrisis', removePlayerId: playerId } }],
      resolved: false, systemhandelse: true,
    }
    const gameAfter = applySale(game, playerId)
    const candidate = captureSystemDecision(game, gameAfter, event, 'sell_star')!
    const entry = buildDecisionLedgerEntry(candidate, 'criticalEconomy:sell_star', 14)
    expect(composeSeasonDecisionSentence(entry, gameAfter)).toBe(candidate.sentence)
  })

  it('offer_pro (EN varslad, den enda som kvalificerar — flera ger score 1/3): liggarkomponerad === candidate.sentence', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const player = game.players.find(p => p.id === playerId)!
    const newSalary = Math.round(player.salary * 1.5)
    const event: GameEvent = {
      id: 'ev4', type: 'varsel', title: 't', body: 'b',
      choices: [{ id: 'offer_pro', label: 'l', effect: { type: 'multiEffect', subEffects: JSON.stringify([{ targetPlayerId: playerId, value: newSalary }]) } }],
      resolved: false, systemhandelse: true,
    }
    const gameAfter = applyFullTimePro(game, playerId)
    const candidate = captureSystemDecision(game, gameAfter, event, 'offer_pro')!
    const entry = buildDecisionLedgerEntry(candidate, 'varsel:offer_pro', 14)
    expect(composeSeasonDecisionSentence(entry, gameAfter)).toBe(candidate.sentence)
  })

  it('offer_pro (flera varslade): kvalificerar aldrig via captureSystemDecision (score 1/3, se egen describe ovan) — multi-mallen testas direkt mot en konstruerad post', () => {
    const entry: EventLedgerEntry = {
      type: 'decision', semanticKey: 'varsel:offer_pro', season: 1, matchday: 10,
      significance: 60, irreversible: false, tension: true, systemsAffectedCount: 2, moneyAmount: 84000,
    }
    expect(composeSeasonDecisionSentence(entry, makeGame())).toBe(getOfferProMultiSentence({ amount: formatValue(84000) }))
  })

  it('anläggningsbygge: semanticKey (candidate.eventId) parsas till nodeId, mening === candidate.sentence', () => {
    const gameBefore = makeGame({ facilityState: { builtNodeIds: [] } })
    const club = gameBefore.clubs.find(c => c.id === gameBefore.managedClubId)!
    const gameAfter: SaveGame = {
      ...gameBefore,
      facilityState: { builtNodeIds: [], activeProject: { nodeId: 'varmestuga', startedMatchday: 0, etaMatchday: 8 } },
      clubs: gameBefore.clubs.map(c => c.id === club.id ? { ...c, finances: c.finances - 120000 } : c),
    }
    const candidate = captureFacilityBuildDecision(gameBefore, gameAfter, 'varmestuga', 120000)!
    const entry = buildDecisionLedgerEntry(candidate, candidate.eventId, gameAfter.currentMatchday)
    expect(composeSeasonDecisionSentence(entry, gameAfter)).toBe(candidate.sentence)
  })

  it('nodeId med interna understreck (akademi_2) parsas korrekt trots season-suffixet', () => {
    const gameBefore = makeGame({ facilityState: { builtNodeIds: [] }, currentSeason: 2027 })
    const club = gameBefore.clubs.find(c => c.id === gameBefore.managedClubId)!
    const gameAfter: SaveGame = {
      ...gameBefore,
      facilityState: { builtNodeIds: [], activeProject: { nodeId: 'akademi_2', startedMatchday: 0, etaMatchday: 8 } },
      clubs: gameBefore.clubs.map(c => c.id === club.id ? { ...c, finances: c.finances - 90000 } : c),
    }
    const candidate = captureFacilityBuildDecision(gameBefore, gameAfter, 'akademi_2', 90000)!
    expect(candidate.eventId).toBe('facility_akademi_2_s2027')
    const entry = buildDecisionLedgerEntry(candidate, candidate.eventId, gameAfter.currentMatchday)
    expect(composeSeasonDecisionSentence(entry, gameAfter)).toBe(candidate.sentence)
  })

  it('KÄND LUCKA: mecenatkonfliktens post går inte att komponera (subject bär bara backed, inte other)', () => {
    const mec1 = makeMecenat({ id: 'mec1', name: 'Björn', happiness: 60 })
    const mec2 = makeMecenat({ id: 'mec2', name: 'Anna', happiness: 60 })
    const gameBefore = makeGame({ mecenater: [mec1, mec2] })
    const event: GameEvent = {
      id: 'ev1', type: 'mecenatEvent', title: 't', body: 'b',
      choices: [{ id: 'side_mec1', label: 'l', effect: { type: 'noOp', subEffects: JSON.stringify([{ type: 'mecenatHappiness', targetMecenatId: 'mec1', amount: 15 }, { type: 'mecenatHappiness', targetMecenatId: 'mec2', amount: -10 }]) } }],
      resolved: false,
    }
    const gameAfter: SaveGame = { ...gameBefore, mecenater: [{ ...mec1, happiness: 75 }, { ...mec2, happiness: 50 }] }
    const candidate = captureSystemDecision(gameBefore, gameAfter, event, 'side_mec1')!
    expect(candidate.sentence).toContain('Björn') // gamla vägen HAR meningen
    const entry = buildDecisionLedgerEntry(candidate, 'mecenatEvent:side_mec1', 14)
    expect(composeSeasonDecisionSentence(entry, gameAfter)).toBeNull() // nya vägen kan inte
  })

  it('subject pekar på en spelare som inte längre finns: null, inte en krasch', () => {
    const entry: EventLedgerEntry = {
      type: 'decision', semanticKey: 'criticalEconomy:sell_star', season: 1, matchday: 5,
      subject: { kind: 'player', id: 'does-not-exist' }, significance: 80, irreversible: true, tension: true,
    }
    expect(composeSeasonDecisionSentence(entry, makeGame())).toBeNull()
  })

  it('okänd semanticKey (varken A-H9-mönster eller facility-mönster): null', () => {
    const entry: EventLedgerEntry = { type: 'decision', semanticKey: 'unknownType:unknownChoice', season: 1, matchday: 5, significance: 50 }
    expect(composeSeasonDecisionSentence(entry, makeGame())).toBeNull()
  })
})

describe('pickMostImportantDecisionText — samma vinnare som pickSeasonDecision skulle valt', () => {
  it('rankar rätt vinnare bland flera liggarposter OCH faller igenom en okomponerbar post till nästa', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]

    // Kandidat 1 (svagare): anonym ekonomisk följd, direkt i liggaren för
    // att isolera rangordningen.
    // Kandidat 2 (starkare, ska vinna): sell_star — subject+irreversible+tension.
    const event: GameEvent = {
      id: 'ev1', type: 'criticalEconomy', title: 't', body: 'b',
      choices: [{ id: 'sell_star', label: 'l', effect: { type: 'resolveEconomicCrisis', removePlayerId: playerId } }],
      resolved: false, systemhandelse: true,
    }
    const gameAfter = applySale(game, playerId)
    const candidate = captureSystemDecision(game, gameAfter, event, 'sell_star')!
    const winningEntry = buildDecisionLedgerEntry(candidate, 'criticalEconomy:sell_star', 14)

    // En svagare men KOMPONERBAR konkurrent (offer_tribute, mecenat) — ska förlora rangordningen.
    const mec = makeMecenat({ id: 'mec1', name: 'Björn', happiness: 60 })
    const weakerEntry: EventLedgerEntry = {
      type: 'decision', semanticKey: 'mecenatEvent:offer_tribute', season: game.currentSeason, matchday: 10,
      subject: { kind: 'mecenat', id: 'mec1' }, significance: 60, irreversible: false, tension: true, systemsAffectedCount: 3, moneyAmount: 25000,
    }
    const finalGame: SaveGame = { ...gameAfter, mecenater: [mec], eventLedger: [weakerEntry, winningEntry] }

    expect(pickMostImportantDecisionText(finalGame, game.currentSeason)).toBe(candidate.sentence)
  })

  it('om högst rankade post inte går att komponera, faller den igenom till nästa (inte NONE_TEXT direkt)', () => {
    const mec1 = makeMecenat({ id: 'mec1', name: 'Björn', happiness: 60 })
    const mec2 = makeMecenat({ id: 'mec2', name: 'Anna', happiness: 60 })
    const game = makeGame({ mecenater: [mec1, mec2] })

    // Okomponerbar men HÖGRE rankad (subject satt): mecenatkonflikt.
    const unComposable: EventLedgerEntry = {
      type: 'decision', semanticKey: 'mecenatEvent:side_mec1', season: game.currentSeason, matchday: 8,
      subject: { kind: 'mecenat', id: 'mec1' }, significance: 70, irreversible: false, tension: true, systemsAffectedCount: 2,
    }
    // Komponerbar men lägre rankad: offer_tribute (samma subject-bit, men lägre annars — irreversible false/tension true på bägge, avgörs av systemsAffectedCount/moneyAmount).
    const composable: EventLedgerEntry = {
      type: 'decision', semanticKey: 'mecenatEvent:offer_tribute', season: game.currentSeason, matchday: 10,
      subject: { kind: 'mecenat', id: 'mec2' }, significance: 60, irreversible: false, tension: true, systemsAffectedCount: 1, moneyAmount: 25000,
    }
    const finalGame: SaveGame = { ...game, eventLedger: [composable, unComposable] }

    const result = pickMostImportantDecisionText(finalGame, game.currentSeason)
    expect(result).not.toBe(SEASON_DECISION_NONE_TEXT)
    expect(result).toContain('Anna')
  })

  it('ingen post kvalificerar/går att komponera: SEASON_DECISION_NONE_TEXT', () => {
    const unComposable: EventLedgerEntry = {
      type: 'decision', semanticKey: 'mecenatEvent:side_mec1', season: 1, matchday: 8,
      subject: { kind: 'mecenat', id: 'ghost' }, significance: 70, irreversible: false, tension: true,
    }
    const game = makeGame({ eventLedger: [unComposable] })
    expect(pickMostImportantDecisionText(game, game.currentSeason)).toBe(SEASON_DECISION_NONE_TEXT)
  })

  it('burnout-valet kan vinna rangordningen utan att vara hårdkodat som vinnare', () => {
    const burnout: EventLedgerEntry = {
      type: 'decision', semanticKey: 'burnoutCeiling:step_back', season: 1, matchday: 20,
      significance: 100, irreversible: true, tension: true, systemsAffectedCount: 4, madeByPlayer: true,
    }
    const smaller: EventLedgerEntry = {
      type: 'decision', semanticKey: 'criticalEconomy:take_loan', season: 1, matchday: 22,
      significance: 60, irreversible: false, tension: true, systemsAffectedCount: 1, madeByPlayer: true,
    }

    expect(pickSeasonDecisionFromLedger([smaller, burnout])).toBe(burnout)
  })

  it('komponerar Opus båda burnout-val ordagrant från liggaren', () => {
    const stepBack: EventLedgerEntry = {
      type: 'decision', semanticKey: 'burnoutCeiling:step_back', season: 1, matchday: 20,
      significance: 100, irreversible: true, tension: true, systemsAffectedCount: 4, madeByPlayer: true,
    }
    const pushThrough: EventLedgerEntry = {
      ...stepBack,
      semanticKey: 'burnoutCeiling:push_through',
    }

    expect(composeSeasonDecisionSentence(stepBack, makeGame())).toBe('Du klev tillbaka en period när det tog för hårt. Första gången du valde dig själv.')
    expect(composeSeasonDecisionSentence(pushThrough, makeGame())).toBe('Du körde vidare fast kroppen sa ifrån. Det satte sina spår.')
  })

  it('ett genuint större namngivet beslut kan fortfarande slå burnout-valet', () => {
    const burnout: EventLedgerEntry = {
      type: 'decision', semanticKey: 'burnoutCeiling:push_through', season: 1, matchday: 20,
      significance: 100, irreversible: true, tension: true, systemsAffectedCount: 4, madeByPlayer: true,
    }
    const larger: EventLedgerEntry = {
      type: 'decision', semanticKey: 'criticalEconomy:sell_star', season: 1, matchday: 10,
      subject: { kind: 'player', id: 'p1' }, significance: 100,
      irreversible: true, tension: true, systemsAffectedCount: 5, moneyAmount: 500_000, madeByPlayer: true,
    }

    expect(pickSeasonDecisionFromLedger([burnout, larger])).toBe(larger)
  })
})
