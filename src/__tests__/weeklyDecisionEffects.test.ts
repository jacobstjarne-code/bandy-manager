/**
 * Fynd 11 — veckans beslut: de två tidigare stubbarna ger nu riktiga effekter.
 * scout_opponent_corners A → scoutNextOpponent (drar scout + analys, appliceras i store).
 * training_corners_vs_matchprep B → cornerRecovery på en back (matchCore läser den direkt).
 */
import { describe, it, expect } from 'vitest'
import { resolveWeeklyDecision, generateWeeklyDecision } from '../domain/services/weeklyDecisionService'
import { createNewGame } from '../application/useCases/createNewGame'
import { PlayerPosition } from '../domain/enums'
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

describe('Throw-guard (SLUTTEST_KO.md, 2026-08-17) — samma mönster som eventResolver.ts', () => {
  // Ingen spelare i managedClubId har cornerSkill > 60 eller form < 40 i denna
  // truppen — exakt tillståndet generateWeeklyDecision:s filter ska förhindra.
  const noQualifyingPlayers = {
    ...game,
    players: game.players.map(p =>
      p.clubId === game.managedClubId ? { ...p, attributes: { ...p.attributes, cornerSkill: 30 }, form: 60 } : p
    ),
  }

  it('corner_extra_training A utan cornerCandidate kastar, tyst noop döljer inte längre bugg', () => {
    expect(() => resolveWeeklyDecision(noQualifyingPlayers, decision('corner_extra_training'), 'A')).toThrow(/cornerCandidate/)
  })

  it('player_weekend_off utan wearyPlayer kastar (oavsett val)', () => {
    expect(() => resolveWeeklyDecision(noQualifyingPlayers, decision('player_weekend_off'), 'A')).toThrow(/wearyPlayer/)
    expect(() => resolveWeeklyDecision(noQualifyingPlayers, decision('player_weekend_off'), 'B')).toThrow(/wearyPlayer/)
  })

  it('training_corners_vs_matchprep A utan cornerCandidate kastar', () => {
    expect(() => resolveWeeklyDecision(noQualifyingPlayers, decision('training_corners_vs_matchprep'), 'A')).toThrow(/cornerCandidate/)
  })

  it('rotorsak-fix: generateWeeklyDecision väljer aldrig player_weekend_off när ingen wearyPlayer finns', () => {
    // Kör över många rundor/säsonger — det deterministiska urvalet (round*13+season*7)
    // ska ALDRIG landa på ett dolt beslut om filtret fungerar.
    for (let season = 1; season <= 5; season++) {
      const g = { ...noQualifyingPlayers, currentSeason: season, pendingWeeklyDecision: undefined, weeklyDecisionLastRound: undefined, resolvedWeeklyDecisions: [] }
      for (let round = 1; round <= 22; round++) {
        const d = generateWeeklyDecision(g, round)
        expect(d?.id).not.toBe('player_weekend_off')
      }
    }
  })

  it('rotorsak-fix: generateWeeklyDecision väljer aldrig corner-besluten utan cornerCandidate (redan skyddat, regressionstäckt här)', () => {
    for (let season = 1; season <= 5; season++) {
      const g = { ...noQualifyingPlayers, currentSeason: season, pendingWeeklyDecision: undefined, weeklyDecisionLastRound: undefined, resolvedWeeklyDecisions: [] }
      for (let round = 1; round <= 22; round++) {
        const d = generateWeeklyDecision(g, round)
        expect(d?.id).not.toBe('corner_extra_training')
        expect(d?.id).not.toBe('training_corners_vs_matchprep')
      }
    }
  })

  it('med en kvalificerande spelare: player_weekend_off väljs ibland OCH resolverar utan att kasta', () => {
    const withWeary = {
      ...game,
      players: game.players.map((p, i) => (p.clubId === game.managedClubId && i === 0 ? { ...p, form: 30, position: PlayerPosition.Defender } : p)),
    }
    let sawIt = false
    for (let round = 1; round <= 22; round++) {
      const d = generateWeeklyDecision({ ...withWeary, currentSeason: 1, pendingWeeklyDecision: undefined }, round)
      if (d?.id === 'player_weekend_off') {
        sawIt = true
        expect(() => resolveWeeklyDecision(withWeary, d, 'A')).not.toThrow()
      }
    }
    expect(sawIt).toBe(true)
  })
})
