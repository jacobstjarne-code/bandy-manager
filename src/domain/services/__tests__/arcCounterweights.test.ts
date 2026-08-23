/**
 * O2 lager 3, sista fyra bågarna (Jacobs dom 2026-08-24, magnituder godkända
 * samma dag). Alla fyra var tidigare rena boostMorale/teamBoostMorale-val
 * med noll kostnad — dominerade sina "hårda" syskon fullständigt
 * (O2_PAIRWISE_DOMINANCE_AUDIT_2026-08-23.md). Behåller sin ursprungliga
 * uppsida, kostar nu en riktig motvikt:
 * - hungrig_peak_event/back_him: +5 moral (oförändrat) + developmentRate −4
 * - joker_peak_event/back_joker: +8 moral (oförändrat) + discipline −4
 * - vetfinal_ceremony/ceremony_flowers: +15 moral hela laget (oförändrat) + −10 000 kr
 * - ledare_peak_event/give_word: +10 moral hela laget (oförändrat) + boardPatience −3
 */
import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../events/eventResolver'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent } from '../../entities/GameEvent'

function makeGame(): SaveGame {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

function multiEffectEvent(id: string, choiceId: string, subEffects: unknown[]): GameEvent {
  return {
    id, type: 'playerArc', title: 't', body: 'b',
    choices: [{ id: choiceId, label: 'l', effect: { type: 'multiEffect', subEffects: JSON.stringify(subEffects) } }],
    resolved: false,
  }
}

describe('hungrig_peak_event — back_him: moral oförändrad, developmentRate −4', () => {
  it('applicerar båda sub-effekterna', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const before = game.players.find(p => p.id === playerId)!
    const event = multiEffectEvent('ev1', 'back_him', [
      { type: 'boostMorale', amount: 5, targetPlayerId: playerId },
      { type: 'developmentRateDelta', amount: -4, targetPlayerId: playerId },
    ])
    let g = { ...game, pendingEvents: [event] }
    g = resolveEvent(g, event.id, 'back_him')

    const after = g.players.find(p => p.id === playerId)!
    expect(after.morale).toBe(Math.min(100, before.morale + 5))
    expect(after.developmentRate).toBe(Math.max(0, before.developmentRate - 4))
  })

  it('developmentRate clampas vid 0', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    let g = {
      ...game,
      players: game.players.map(p => p.id === playerId ? { ...p, developmentRate: 2 } : p),
    }
    const event = multiEffectEvent('ev1b', 'back_him', [
      { type: 'boostMorale', amount: 5, targetPlayerId: playerId },
      { type: 'developmentRateDelta', amount: -4, targetPlayerId: playerId },
    ])
    g = { ...g, pendingEvents: [event] }
    g = resolveEvent(g, event.id, 'back_him')

    expect(g.players.find(p => p.id === playerId)!.developmentRate).toBe(0)
  })
})

describe('joker_peak_event — back_joker: moral oförändrad, discipline −4', () => {
  it('applicerar båda sub-effekterna', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const before = game.players.find(p => p.id === playerId)!
    const event = multiEffectEvent('ev2', 'back_joker', [
      { type: 'boostMorale', amount: 8, targetPlayerId: playerId },
      { type: 'disciplineDelta', amount: -4, targetPlayerId: playerId },
    ])
    let g = { ...game, pendingEvents: [event] }
    g = resolveEvent(g, event.id, 'back_joker')

    const after = g.players.find(p => p.id === playerId)!
    expect(after.morale).toBe(Math.min(100, before.morale + 8))
    expect(after.discipline).toBe(Math.max(0, before.discipline - 4))
  })
})

describe('vetfinal_ceremony — ceremony_flowers: hela laget +15 moral, −10 000 kr', () => {
  it('applicerar båda sub-effekterna', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const beforeMorales = new Map(game.players.map(p => [p.id, p.morale]))
    const beforeFinances = club.finances
    const event = multiEffectEvent('ev3', 'ceremony_flowers', [
      { type: 'teamBoostMorale', amount: 15, targetClubId: game.managedClubId },
      { type: 'income', amount: -10000 },
    ])
    let g = { ...game, pendingEvents: [event] }
    g = resolveEvent(g, event.id, 'ceremony_flowers')

    for (const pid of club.squadPlayerIds) {
      const after = g.players.find(p => p.id === pid)!
      expect(after.morale).toBe(Math.min(100, (beforeMorales.get(pid) ?? 50) + 15))
    }
    const clubAfter = g.clubs.find(c => c.id === g.managedClubId)!
    expect(clubAfter.finances).toBe(beforeFinances - 10000)
  })
})

describe('ledare_peak_event — give_word: hela laget +10 moral, boardPatience −3', () => {
  it('applicerar båda sub-effekterna', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const beforeMorales = new Map(game.players.map(p => [p.id, p.morale]))
    const beforePatience = game.boardPatience ?? 70
    const event = multiEffectEvent('ev4', 'give_word', [
      { type: 'teamBoostMorale', amount: 10, targetClubId: game.managedClubId },
      { type: 'boardPatience', amount: -3 },
    ])
    let g = { ...game, pendingEvents: [event] }
    g = resolveEvent(g, event.id, 'give_word')

    for (const pid of club.squadPlayerIds) {
      const after = g.players.find(p => p.id === pid)!
      expect(after.morale).toBe(Math.min(100, (beforeMorales.get(pid) ?? 50) + 10))
    }
    expect(g.boardPatience).toBe(Math.max(0, beforePatience - 3))
  })
})
