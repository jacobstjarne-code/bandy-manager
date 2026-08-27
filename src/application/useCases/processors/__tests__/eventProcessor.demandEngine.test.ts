import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { processGameEvents } from '../eventProcessor'
import { generateMecenat } from '../../../../domain/services/mecenatService'
import { mulberry32 } from '../../../../domain/utils/random'
import type { SaveGame } from '../../../../domain/entities/SaveGame'

const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 11 })

function withActiveMecenat(game: SaveGame): SaveGame {
  const mec = { ...generateMecenat(game.managedClubId, game.currentSeason, mulberry32(1)), isActive: true, happiness: 60 }
  return { ...game, mecenater: [mec] }
}

describe('processGameEvents — kravmotor integration (Mecenat)', () => {
  it('genererar ett pendingDemand när rullningen gynnar det', () => {
    const game = withActiveMecenat(base)
    const result = processGameEvents(game, [], null, 5, () => 0) // alltid < alla trösklar
    const mec = result.updatedMecenater[0]
    expect(mec.pendingDemand).toBeDefined()
    expect(mec.pendingDemand!.deadlineRound).toBe(5 + 8)
  })

  it('genererar INGET pendingDemand när rullningen missgynnar det', () => {
    const game = withActiveMecenat(base)
    const result = processGameEvents(game, [], null, 5, () => 0.99) // aldrig < trösklarna
    const mec = result.updatedMecenater[0]
    expect(mec.pendingDemand).toBeUndefined()
  })

  it('löser ett förfallet pendingDemand — ouppfyllt sänker happiness och pushar till demands', () => {
    const gameBase = withActiveMecenat(base)
    const pendingGame: SaveGame = {
      ...gameBase,
      mecenater: [{
        ...gameBase.mecenater![0],
        pendingDemand: {
          category: 'league_position', description: '[Opus]', createdRound: 1, deadlineRound: 5,
        },
        // Botten av tabellen → league_position ouppfylld
        happiness: 60,
      }],
      standings: gameBase.standings.map(s => s.clubId === gameBase.managedClubId
        ? { ...s, position: gameBase.standings.length }
        : s),
    }
    const result = processGameEvents(pendingGame, [], null, 5, () => 0.99)
    const mec = result.updatedMecenater[0]
    expect(mec.pendingDemand).toBeUndefined()
    // 60 - 1 (befintlig roundsSinceInteraction>4-decay, lastInteractionRound
    // saknas) - 15 (kravmotorns konsekvens) = 44
    expect(mec.happiness).toBe(44)
    expect(mec.demands).toHaveLength(1)
    expect(mec.demands[0].type).toBe('league_position')
  })

  it('löser ett förfallet pendingDemand — uppfyllt höjer happiness och rensar demands-historiken', () => {
    const gameBase = withActiveMecenat(base)
    const pendingGame: SaveGame = {
      ...gameBase,
      mecenater: [{
        ...gameBase.mecenater![0],
        pendingDemand: {
          category: 'league_position', description: '[Opus]', createdRound: 1, deadlineRound: 5,
        },
        happiness: 60,
        demands: [{ type: 'league_position', description: '[Opus]' }], // tidigare konsekutivt misslyckande
      }],
      // played: 10 — LÄST-FÖRE-INITIERING-golvet (PASTAENDEKARTAN, 2026-08-26)
      // kräver minst en spelad match innan position räknas som verklig.
      standings: gameBase.standings.map(s => s.clubId === gameBase.managedClubId
        ? { ...s, position: 1, played: 10 }
        : s),
    }
    const result = processGameEvents(pendingGame, [], null, 5, () => 0.99)
    const mec = result.updatedMecenater[0]
    expect(mec.pendingDemand).toBeUndefined()
    // 60 - 1 (befintlig decay) + 15 (kravmotorns konsekvens) = 74
    expect(mec.happiness).toBe(74)
    expect(mec.demands).toHaveLength(0) // rensad — bryter den konsekutiva serien
  })
})

describe('processGameEvents — kravmotor integration (Patron)', () => {
  function withActivePatron(game: SaveGame): SaveGame {
    return {
      ...game,
      patron: { name: 'Test Patron', business: 'Test AB', influence: 40, happiness: 60, contribution: 10000, isActive: true, goodwill: 70 },
    }
  }

  it('genererar ett pendingDemand + fyller demands[0] för portalkortet', () => {
    const game = withActivePatron(base)
    const result = processGameEvents(game, [], null, 5, () => 0)
    expect(result.updatedPatron?.pendingDemand).toBeDefined()
    expect(result.updatedPatron?.demands).toHaveLength(1)
  })

  it('ouppfyllt krav: demands hålls kvar (stale text) så patronDemandUnmetOver3Rounds kan hitta den', () => {
    const game = withActivePatron(base)
    const pendingGame: SaveGame = {
      ...game,
      patron: {
        ...game.patron!,
        pendingDemand: { category: 'league_position', description: '[Opus]', createdRound: 1, deadlineRound: 5 },
        demands: ['[Opus]'],
        goodwill: 70,
      },
      standings: game.standings.map(s => s.clubId === game.managedClubId ? { ...s, position: game.standings.length } : s),
    }
    const result = processGameEvents(pendingGame, [], null, 5, () => 0.99)
    expect(result.updatedPatron?.pendingDemand).toBeUndefined()
    expect(result.updatedPatron?.demands).toEqual(['[Opus]']) // INTE rensad vid misslyckande
    expect(result.updatedPatron?.goodwill).toBe(55) // 70 - 15
  })

  it('uppfyllt krav: demands rensas', () => {
    const game = withActivePatron(base)
    const pendingGame: SaveGame = {
      ...game,
      patron: {
        ...game.patron!,
        pendingDemand: { category: 'league_position', description: '[Opus]', createdRound: 1, deadlineRound: 5 },
        demands: ['[Opus]'],
        goodwill: 70,
      },
      // played: 10 — LÄST-FÖRE-INITIERING-golvet (PASTAENDEKARTAN, 2026-08-26).
      standings: game.standings.map(s => s.clubId === game.managedClubId ? { ...s, position: 1, played: 10 } : s),
    }
    const result = processGameEvents(pendingGame, [], null, 5, () => 0.99)
    expect(result.updatedPatron?.pendingDemand).toBeUndefined()
    expect(result.updatedPatron?.demands).toEqual([])
    expect(result.updatedPatron?.goodwill).toBe(85) // 70 + 15
  })
})
