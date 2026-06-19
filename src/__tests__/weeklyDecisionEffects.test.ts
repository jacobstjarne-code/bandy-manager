/**
 * Fynd 11 — veckans beslut: de två tidigare stubbarna ger nu riktiga effekter.
 * scout_opponent_corners A → scoutNextOpponent (drar scout + analys, appliceras i store).
 * training_corners_vs_matchprep B → cornerRecovery på en back (matchCore läser den direkt).
 */
import { describe, it, expect } from 'vitest'
import { resolveWeeklyDecision } from '../domain/services/weeklyDecisionService'
import { createNewGame } from '../application/useCases/createNewGame'
import type { WeeklyDecision } from '../domain/services/weeklyDecisionService'

const game = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 5 })
const decision = (id: string): WeeklyDecision =>
  ({ id, question: '', category: 'training', optionA: { label: '', effect: '' }, optionB: { label: '', effect: '' } } as WeeklyDecision)

describe('Fynd 11 — veckans beslut-effekter', () => {
  it('PC-1: player_weekend_off A → moral +5 OCH kondition −1 (inte form)', () => {
    // wearyPlayer = en spelare med form < 40; injicera en.
    const g = { ...game, players: game.players.map((p, i) => i === 0 ? { ...p, form: 30 } : p) }
    const effects = resolveWeeklyDecision(g, decision('player_weekend_off'), 'A')
    expect(effects).toContainEqual({ type: 'morale', playerId: g.players[0].id, delta: 5 })
    expect(effects).toContainEqual({ type: 'fitness', playerId: g.players[0].id, delta: -1 })
    // ingen effekt rör form-fältet
    expect(effects.every(e => e.type !== 'cornerSkill')).toBe(true)
  })

  it('scout_opponent_corners A → scoutNextOpponent (ingen mer no-op/proxy)', () => {
    const effects = resolveWeeklyDecision(game, decision('scout_opponent_corners'), 'A')
    expect(effects).toEqual([{ type: 'scoutNextOpponent' }])
  })

  it('scout_opponent_corners B → ingen effekt (spara scouten)', () => {
    const effects = resolveWeeklyDecision(game, decision('scout_opponent_corners'), 'B')
    expect(effects).toEqual([{ type: 'noop' }])
  })

  it('training_corners_vs_matchprep B → cornerRecovery på en egen utespelare', () => {
    const effects = resolveWeeklyDecision(game, decision('training_corners_vs_matchprep'), 'B')
    expect(effects).toHaveLength(1)
    expect(effects[0].type).toBe('cornerRecovery')
    if (effects[0].type === 'cornerRecovery') {
      expect(effects[0].delta).toBe(2)
      const target = game.players.find(p => p.id === effects[0].playerId)
      expect(target?.clubId).toBe(game.managedClubId)
    }
  })
})
