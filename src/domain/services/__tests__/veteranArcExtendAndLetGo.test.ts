/**
 * O2 lager 1 (Jacobs dom 2026-08-24).
 *
 * extend_veteran (veteran_farewell-bågen) applicerade tidigare bara
 * boostMorale — "vi förlänger" gav aldrig något nytt kontrakt. Wirat till
 * extendContract (contractYears: 2, oförändrad lön).
 *
 * let_go (contract_drama-bågen) applicerade tidigare bara boostMorale på
 * spelaren som lämnar — "Du får gå" gjorde honom aldrig faktiskt free
 * agent. Wirat till multiEffect (oförändrad "💛 Moral −25"-text +
 * releasePlayer).
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

describe('extend_veteran — extendContract, inte boostMorale', () => {
  it('förlänger kontraktet 2 säsonger och lönen är oförändrad', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const targetId = club.squadPlayerIds[0]
    const before = game.players.find(p => p.id === targetId)!
    const event: GameEvent = {
      id: 'ev_extend_veteran',
      type: 'playerArc',
      title: 't', body: 'b',
      choices: [{
        id: 'extend_veteran',
        label: 'Han är en legend — vi förlänger',
        subtitle: '💛 Moral +10',
        effect: { type: 'extendContract', targetPlayerId: targetId, contractYears: 2 },
      }],
      resolved: false,
    }
    let g = { ...game, pendingEvents: [event] }
    g = resolveEvent(g, event.id, 'extend_veteran', undefined, true)

    const after = g.players.find(p => p.id === targetId)!
    expect(after.contractUntilSeason).toBe(g.currentSeason + 2)
    expect(after.salary).toBe(before.salary)
    expect(after.morale).toBe(Math.min(100, before.morale + 10))
  })
})

describe('let_go — multiEffect (moral −25 + releasePlayer), inte boostMorale ensamt', () => {
  it('spelaren blir free agent och försvinner ur truppen', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const targetId = club.squadPlayerIds[0]
    const squadSizeBefore = club.squadPlayerIds.length
    const event: GameEvent = {
      id: 'ev_let_go',
      type: 'playerArc',
      title: 't', body: 'b',
      choices: [{
        id: 'let_go',
        label: 'Du får gå',
        subtitle: '💛 Moral −25',
        effect: {
          type: 'multiEffect',
          subEffects: JSON.stringify([
            { type: 'boostMorale', amount: -25, targetPlayerId: targetId },
            { type: 'releasePlayer', targetPlayerId: targetId },
          ]),
        },
      }],
      resolved: false,
    }
    let g = { ...game, pendingEvents: [event] }
    g = resolveEvent(g, event.id, 'let_go', undefined, true)

    const updatedClub = g.clubs.find(c => c.id === g.managedClubId)!
    expect(updatedClub.squadPlayerIds).not.toContain(targetId)
    expect(updatedClub.squadPlayerIds.length).toBe(squadSizeBefore - 1)
    const player = g.players.find(p => p.id === targetId)!
    expect(player.clubId).toBe('free_agent')
  })

  it('spelarens moral sänks med 25 (samma text som tidigare, nu faktiskt kombinerad med borttagning)', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const targetId = club.squadPlayerIds[0]
    const before = game.players.find(p => p.id === targetId)!
    const event: GameEvent = {
      id: 'ev_let_go2',
      type: 'playerArc',
      title: 't', body: 'b',
      choices: [{
        id: 'let_go',
        label: 'Du får gå',
        subtitle: '💛 Moral −25',
        effect: {
          type: 'multiEffect',
          subEffects: JSON.stringify([
            { type: 'boostMorale', amount: -25, targetPlayerId: targetId },
            { type: 'releasePlayer', targetPlayerId: targetId },
          ]),
        },
      }],
      resolved: false,
    }
    let g = { ...game, pendingEvents: [event] }
    g = resolveEvent(g, event.id, 'let_go', undefined, true)

    const player = g.players.find(p => p.id === targetId)!
    expect(player.morale).toBe(Math.min(100, before.morale - 25))
  })
})
