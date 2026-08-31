import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { generateCaptainSpeechEvent, generateVarselEvent } from '../eventFactories'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { GameEvent } from '../../../entities/GameEvent'

/**
 * 2.5 (choice-label-svepet, 2026-08-17) — fyra kompletta no-ops wirade.
 * Alla fyra hade samma rotorsak: ett effektblock saknade ett obligatoriskt
 * fält (targetPlayerId/targetClubId), och eventResolver.ts hoppade tyst över
 * hela blocket i stället för att klaga. Se LESSONS.md.
 */
function makeGameWithSquad() {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

describe('captainSpeech — teamBoostMorale (var boostMorale utan targetPlayerId)', () => {
  it("'support' faktiskt höjer moralen för hela laget, inte noll spelare", () => {
    let game = makeGameWithSquad()
    const squad = game.players.filter(p => p.clubId === game.managedClubId)
    game = { ...game, players: game.players.map(p => p.clubId === game.managedClubId ? { ...p, morale: 50 } : p) }
    const captain = squad[0]

    const event = generateCaptainSpeechEvent(captain, game.managedClubId, game.currentSeason)
    game = { ...game, pendingEvents: [event] }
    game = resolveEvent(game, event.id, 'support', undefined, true)

    const updatedSquad = game.players.filter(p => p.clubId === game.managedClubId)
    expect(updatedSquad.every(p => p.morale > 50)).toBe(true)
  })

  it("'support' skriver storylinen captain_rallied_team", () => {
    let game = makeGameWithSquad()
    const captain = game.players.find(p => p.clubId === game.managedClubId)!
    const event = generateCaptainSpeechEvent(captain, game.managedClubId, game.currentSeason)
    game = { ...game, pendingEvents: [event] }
    game = resolveEvent(game, event.id, 'support', undefined, true)

    expect(game.storylines?.some(s => s.type === 'captain_rallied_team')).toBe(true)
  })

  it("'decline' varken höjer moral eller skriver storylinen (var tidigare skriven oavsett val)", () => {
    let game = makeGameWithSquad()
    game = { ...game, players: game.players.map(p => p.clubId === game.managedClubId ? { ...p, morale: 50 } : p) }
    const captain = game.players.find(p => p.clubId === game.managedClubId)!
    const event = generateCaptainSpeechEvent(captain, game.managedClubId, game.currentSeason)
    game = { ...game, pendingEvents: [event] }
    game = resolveEvent(game, event.id, 'decline', undefined, true)

    const updatedSquad = game.players.filter(p => p.clubId === game.managedClubId)
    expect(updatedSquad.every(p => p.morale === 50)).toBe(true)
    expect(game.storylines?.some(s => s.type === 'captain_rallied_team')).toBeFalsy()
  })

  // HIGH 6, attributionshålet (Jacobs körorder 2026-08-31): 'support' HÖJER
  // fortfarande moralen (mekanisk effekt, oberoende av vem som "tryckte") men
  // ska INTE skriva karriärminnet när det var sim-the-rest/rollover som
  // auto-valde 'support' åt en AI-styrd säsong — spelaren var inte med.
  it("'support' AUTO-RESOLVAD (madeByPlayer=false) höjer moral men skriver INTE storylinen", () => {
    let game = makeGameWithSquad()
    game = { ...game, players: game.players.map(p => p.clubId === game.managedClubId ? { ...p, morale: 50 } : p) }
    const captain = game.players.find(p => p.clubId === game.managedClubId)!
    const event = generateCaptainSpeechEvent(captain, game.managedClubId, game.currentSeason)
    game = { ...game, pendingEvents: [event] }
    game = resolveEvent(game, event.id, 'support', undefined, false)

    const updatedSquad = game.players.filter(p => p.clubId === game.managedClubId)
    expect(updatedSquad.every(p => p.morale > 50)).toBe(true)
    expect(game.storylines?.some(s => s.type === 'captain_rallied_team')).toBeFalsy()
  })
})

describe('varsel — de berörda spelarnas moral (var boostMorale utan targetPlayerId)', () => {
  function makeVarselEvent(game: ReturnType<typeof makeGameWithSquad>) {
    const squad = game.players.filter(p => p.clubId === game.managedClubId)
    const affected = squad.slice(0, 2).map(p => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, dayJob: p.dayJob }))
    return { event: generateVarselEvent(affected, 'TestFöretaget', game.currentSeason), affectedIds: affected.map(p => p.id) }
  }

  it("'support' höjer moral bara för de berörda spelarna, inte hela truppen", () => {
    let game = makeGameWithSquad()
    game = { ...game, players: game.players.map(p => ({ ...p, morale: 50 })) }
    const { event, affectedIds } = makeVarselEvent(game)
    game = { ...game, pendingEvents: [event] }
    game = resolveEvent(game, event.id, 'support', undefined, true)

    const affected = game.players.filter(p => affectedIds.includes(p.id))
    const rest = game.players.filter(p => !affectedIds.includes(p.id))
    expect(affected.every(p => p.morale === 55)).toBe(true)
    expect(rest.every(p => p.morale === 50)).toBe(true)
  })

  it("'nothing' sänker moral för de berörda spelarna med -8", () => {
    let game = makeGameWithSquad()
    game = { ...game, players: game.players.map(p => ({ ...p, morale: 50 })) }
    const { event, affectedIds } = makeVarselEvent(game)
    game = { ...game, pendingEvents: [event] }
    game = resolveEvent(game, event.id, 'nothing', undefined, true)

    const affected = game.players.filter(p => affectedIds.includes(p.id))
    expect(affected.every(p => p.morale === 42)).toBe(true)
  })

  it("'offer_pro' gör de berörda spelarna heltidsproffs (var multiEffect-subtyp utan gren i resolvern)", () => {
    let game = makeGameWithSquad()
    const { event, affectedIds } = makeVarselEvent(game)
    game = { ...game, pendingEvents: [event] }
    game = resolveEvent(game, event.id, 'offer_pro', undefined, true)

    const affected = game.players.filter(p => affectedIds.includes(p.id))
    expect(affected.every(p => p.isFullTimePro === true)).toBe(true)
    expect(affected.every(p => p.dayJob === undefined)).toBe(true)
    expect(game.storylines?.some(s => s.type === 'went_fulltime_pro' || s.type === 'rescued_from_unemployment')).toBeTruthy()
  })

  // HIGH 6, attributionshålet (Jacobs körorder 2026-08-31): effekten (heltids-
  // proffs, lönehöjning) är mekanisk och sker oavsett vem som "tryckte" —
  // bara karriärminnena (went_fulltime_pro/rescued_from_unemployment) ska
  // utebli när sim-the-rest/rollover auto-valde 'offer_pro' åt en AI-styrd
  // säsong.
  it("'offer_pro' AUTO-RESOLVAD (madeByPlayer=false) gör spelarna proffs men skriver INGA storylines", () => {
    let game = makeGameWithSquad()
    const { event, affectedIds } = makeVarselEvent(game)
    game = { ...game, pendingEvents: [event] }
    game = resolveEvent(game, event.id, 'offer_pro', undefined, false)

    const affected = game.players.filter(p => affectedIds.includes(p.id))
    expect(affected.every(p => p.isFullTimePro === true)).toBe(true)
    expect(game.storylines?.some(s => s.type === 'went_fulltime_pro' || s.type === 'rescued_from_unemployment')).toBeFalsy()
  })

  it("'offer_pro' skriver INGEN rescued_from_unemployment-storyline om effekten inte lyckades (var tidigare oberoende av utfall)", () => {
    let game = makeGameWithSquad()
    const event: GameEvent = {
      id: 'test_varsel_broken',
      type: 'varsel',
      title: 't', body: 'b',
      choices: [{ id: 'offer_pro', label: 'Erbjud proffskontrakt', effect: { type: 'multiEffect', subEffects: '[]' } as never }],
      resolved: false,
    }
    game = { ...game, pendingEvents: [event] }
    game = resolveEvent(game, event.id, 'offer_pro', undefined, true)

    expect(game.storylines?.some(s => s.type === 'rescued_from_unemployment')).toBeFalsy()
  })
})

describe('vakten — obligatoriska fält kastar i stället för att tystna', () => {
  function pendingWith(effect: unknown): GameEvent {
    return {
      id: 'test_guard_event',
      type: 'test',
      title: 't', body: 'b',
      choices: [{ id: 'go', label: 'Go', effect: effect as never }],
      resolved: false,
    }
  }

  it("boostMorale utan targetPlayerId kastar", () => {
    let game = makeGameWithSquad()
    game = { ...game, pendingEvents: [pendingWith({ type: 'boostMorale', value: 5 })] }
    expect(() => resolveEvent(game, 'test_guard_event', 'go', undefined, true)).toThrow(/targetPlayerId/)
  })

  it("makeFullTimePro utan targetPlayerId kastar", () => {
    let game = makeGameWithSquad()
    game = { ...game, pendingEvents: [pendingWith({ type: 'makeFullTimePro', value: 0 })] }
    expect(() => resolveEvent(game, 'test_guard_event', 'go', undefined, true)).toThrow(/targetPlayerId/)
  })

  it("teamBoostMorale utan targetClubId kastar", () => {
    let game = makeGameWithSquad()
    game = { ...game, pendingEvents: [pendingWith({ type: 'teamBoostMorale', value: 5 })] }
    expect(() => resolveEvent(game, 'test_guard_event', 'go', undefined, true)).toThrow(/targetClubId/)
  })

  it("teamBoostMorale MED targetClubId fungerar fortfarande", () => {
    let game = makeGameWithSquad()
    game = { ...game, players: game.players.map(p => ({ ...p, morale: 50 })) }
    game = { ...game, pendingEvents: [pendingWith({ type: 'teamBoostMorale', value: 5, targetClubId: game.managedClubId })] }
    game = resolveEvent(game, 'test_guard_event', 'go', undefined, true)
    expect(game.players.filter(p => p.clubId === game.managedClubId).every(p => p.morale === 55)).toBe(true)
  })

  it("multiEffect-subEffect boostMorale utan targetPlayerId kastar", () => {
    let game = makeGameWithSquad()
    game = {
      ...game,
      pendingEvents: [pendingWith({ type: 'multiEffect', subEffects: JSON.stringify([{ type: 'boostMorale', amount: 5 }]) })],
    }
    expect(() => resolveEvent(game, 'test_guard_event', 'go', undefined, true)).toThrow(/targetPlayerId/)
  })

  it("multiEffect-subEffect makeFullTimePro utan targetPlayerId kastar", () => {
    let game = makeGameWithSquad()
    game = {
      ...game,
      pendingEvents: [pendingWith({ type: 'multiEffect', subEffects: JSON.stringify([{ type: 'makeFullTimePro' }]) })],
    }
    expect(() => resolveEvent(game, 'test_guard_event', 'go', undefined, true)).toThrow(/targetPlayerId/)
  })

  it("ett trasigt JSON i subEffects tystas fortfarande (annan felklass, inte ett saknat fält)", () => {
    let game = makeGameWithSquad()
    game = {
      ...game,
      pendingEvents: [pendingWith({ type: 'multiEffect', subEffects: '{not valid json' })],
    }
    expect(() => resolveEvent(game, 'test_guard_event', 'go', undefined, true)).not.toThrow()
  })
})
