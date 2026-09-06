import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { processYouth } from '../youthProcessor'

describe('processYouth — skolkonflikten minns personen', () => {
  it('erbjuder inte samma P19-spelare samma isolerade konflikt två gånger under en säsong', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const youth = base.youthTeam!.players[0]
    const game = {
      ...base,
      youthTeam: {
        ...base.youthTeam!,
        players: base.youthTeam!.players.map((player, index) => ({
          ...player,
          schoolConflict: index === 0,
        })),
      },
      resolvedEventIds: [`event_school_conflict_${youth.id}_s${base.currentSeason}_m5`],
    }

    const result = processYouth(game, game.players, 7, '2025-11-01', 42, () => 0)
    expect(result.gameEvents.some(event => event.id.startsWith(`event_school_conflict_${youth.id}_`))).toBe(false)
  })

  it('minns samma spelare nästa säsong men låter skolkonflikten återkomma', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 42 })
    const youth = base.youthTeam!.players[0]
    const game = {
      ...base,
      youthTeam: {
        ...base.youthTeam!,
        players: base.youthTeam!.players.map((player, index) => ({
          ...player,
          schoolConflict: index === 0,
        })),
      },
      resolvedEventIds: [`event_school_conflict_${youth.id}_s2025_m5`],
    }

    const result = processYouth(game, game.players, 7, '2026-11-01', 42, () => 0)
    expect(result.gameEvents).toContainEqual(expect.objectContaining({
      id: `event_school_conflict_${youth.id}_s2026_m7`,
      body: `Samma samtal som förra året. ${youth.firstName} har nationellt prov imorgon. Han missar träningen om han pluggar.`,
    }))
  })
})
