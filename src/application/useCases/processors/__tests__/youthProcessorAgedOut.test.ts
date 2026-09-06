import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { processYouth } from '../youthProcessor'

describe('processYouth — akademi-junior-fyller-20 (DOM_AKADEMI_LIGGARE §4)', () => {
  it('genererar ett beslutskort vid matchdag 19 för en P19-spelare som fyller 20 med ≥3 stjärnor', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const target = base.youthTeam!.players[0]
    const game = {
      ...base,
      youthTeam: {
        ...base.youthTeam!,
        players: base.youthTeam!.players.map((player, index) =>
          index === 0 ? { ...player, age: 19, potentialAbility: 60 } : player
        ),
      },
    }

    const result = processYouth(game, game.players, 19, '2026-05-01', 42, () => 0)
    const card = result.gameEvents.find(event => event.id === `event_youth_aged_out_${target.id}_s2025`)
    expect(card).toBeDefined()
    expect(card?.title).toBe(`${target.firstName} ${target.lastName} fyller tjugo`)
    expect(card?.choices.map(c => c.id)).toEqual(['flytta_upp', 'slapp'])
  })

  it('genererar inget kort för en spelare under 3 stjärnor', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const target = base.youthTeam!.players[0]
    const game = {
      ...base,
      youthTeam: {
        ...base.youthTeam!,
        players: base.youthTeam!.players.map((player, index) =>
          index === 0 ? { ...player, age: 19, potentialAbility: 30 } : player
        ),
      },
    }

    const result = processYouth(game, game.players, 19, '2026-05-01', 42, () => 0)
    expect(result.gameEvents.some(event => event.id === `event_youth_aged_out_${target.id}_s2025`)).toBe(false)
  })

  it('genererar inget kort utanför matchdag 19', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const target = base.youthTeam!.players[0]
    const game = {
      ...base,
      youthTeam: {
        ...base.youthTeam!,
        players: base.youthTeam!.players.map((player, index) =>
          index === 0 ? { ...player, age: 19, potentialAbility: 60 } : player
        ),
      },
    }

    const result = processYouth(game, game.players, 18, '2026-05-01', 42, () => 0)
    expect(result.gameEvents.some(event => event.id === `event_youth_aged_out_${target.id}_s2025`)).toBe(false)
  })

  it('genererar inte om kortet redan finns i pendingEvents (dedup)', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const target = base.youthTeam!.players[0]
    const eventId = `event_youth_aged_out_${target.id}_s2025`
    const game = {
      ...base,
      youthTeam: {
        ...base.youthTeam!,
        players: base.youthTeam!.players.map((player, index) =>
          index === 0 ? { ...player, age: 19, potentialAbility: 60 } : player
        ),
      },
      pendingEvents: [{ id: eventId, type: 'academyEvent', title: 't', body: 'b', choices: [], resolved: false } as any],
    }

    const result = processYouth(game, game.players, 19, '2026-05-01', 42, () => 0)
    expect(result.gameEvents.filter(event => event.id === eventId)).toHaveLength(0)
  })
})
