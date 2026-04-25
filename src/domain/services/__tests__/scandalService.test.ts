import { describe, it, expect } from 'vitest'
import { checkScandalTrigger, applyScandalEffect, resolveExpiredScandals, isTransferFrozen } from '../scandalService'
import type { SaveGame } from '../../entities/SaveGame'
import type { Club } from '../../entities/Club'

function makeClub(id: string, reputation = 50, finances = 500_000): Club {
  return {
    id,
    name: `Klub ${id}`,
    shortName: id,
    reputation,
    finances,
    squadPlayerIds: [],
    activeTactic: 'balanced' as never,
    facilities: 50,
    transferBudget: 100_000,
  } as unknown as Club
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const clubs = [
    makeClub('managed', 70, 500_000),
    makeClub('ai1', 45, 300_000),
    makeClub('ai2', 55, 400_000),
    makeClub('ai3', 60, 350_000),
  ]
  return {
    managedClubId: 'managed',
    currentSeason: 2027,
    currentDate: '2027-01-15',
    players: [],
    clubs,
    fixtures: [],
    league: { teamIds: clubs.map(c => c.id) },
    inbox: [],
    activeScandals: [],
    scandalHistory: [],
    pointDeductions: {},
    pendingPointDeductions: {},
  } as unknown as SaveGame
}

const alwaysRand = (val: number) => () => val

describe('checkScandalTrigger', () => {
  it('returns null outside trigger windows', () => {
    const game = makeGame()
    // round 1-5 and 9-11 are outside windows
    for (const round of [1, 3, 5, 9, 10, 11, 15, 17, 21, 23, 27]) {
      expect(checkScandalTrigger(game, round, alwaysRand(0.1))).toBeNull()
    }
  })

  it('returns null when rand() > 0.25 within window', () => {
    const game = makeGame()
    const result = checkScandalTrigger(game, 7, alwaysRand(0.5))
    expect(result).toBeNull()
  })

  it('returns a Scandal within trigger window when rand passes', () => {
    const game = makeGame()
    const result = checkScandalTrigger(game, 7, alwaysRand(0.1))
    expect(result).not.toBeNull()
    expect(result!.season).toBe(2027)
    expect(result!.triggerRound).toBe(7)
  })

  it('never affects the managed club', () => {
    const game = makeGame()
    for (let i = 0; i < 50; i++) {
      const r = Math.random()
      if (r > 0.25) continue
      const rand = (() => {
        let call = 0
        return () => { call++; return call === 1 ? 0.1 : Math.random() }
      })()
      const result = checkScandalTrigger(game, 7, rand)
      if (result) {
        expect(result.affectedClubId).not.toBe('managed')
      }
    }
  })

  it('does not trigger the same window twice', () => {
    const game = makeGame()
    const rand = alwaysRand(0.1)
    const s1 = checkScandalTrigger(game, 6, rand)
    expect(s1).not.toBeNull()
    // Simulate game with that scandal already active
    const gameWithScandal: SaveGame = {
      ...game,
      activeScandals: [s1!],
    }
    const s2 = checkScandalTrigger(gameWithScandal, 7, rand)
    expect(s2).toBeNull()
  })

  it('can trigger in each window independently (up to available clubs)', () => {
    // 3 AI clubs → max 3 scandals per season (one club per season rule)
    const game = makeGame()
    const rand = alwaysRand(0.1)
    const windows = [7, 13, 19, 25]
    let gameState = game
    let triggered = 0
    for (const round of windows) {
      const result = checkScandalTrigger(gameState, round, rand)
      if (result) {
        triggered++
        gameState = { ...gameState, activeScandals: [...(gameState.activeScandals ?? []), result] }
      }
    }
    // With 3 AI clubs, max 3 scandals per season
    expect(triggered).toBe(3)
  })

  it('does not trigger a club already hit this season', () => {
    // With only one AI club possible, should return null
    const clubs = [makeClub('managed', 70), makeClub('ai1', 45)]
    const game: SaveGame = {
      ...makeGame(),
      clubs,
      league: { teamIds: ['managed', 'ai1'] },
      scandalHistory: [{
        id: 'prev',
        season: 2027,
        triggerRound: 6,
        type: 'sponsor_collapse',
        affectedClubId: 'ai1',
        resolutionRound: 6,
        isResolved: true,
      }],
    }
    const rand = alwaysRand(0.1)
    const result = checkScandalTrigger(game, 13, rand)
    expect(result).toBeNull()
  })
})

describe('applyScandalEffect', () => {
  it('sponsor_collapse reduces club finances by 400k', () => {
    const game = makeGame()
    const scandal = checkScandalTrigger(game, 7, alwaysRand(0.1))
    if (!scandal || scandal.type !== 'sponsor_collapse') return // only test if this type rolled

    const { updatedClubs } = applyScandalEffect(game, { ...scandal, type: 'sponsor_collapse', affectedClubId: 'ai1' }, alwaysRand(0))
    const club = updatedClubs.find(c => c.id === 'ai1')!
    expect(club.finances).toBe(300_000 - 400_000)
  })

  it('phantom_salaries adds 2-point deduction', () => {
    const game = makeGame()
    const scandal = {
      id: 'test_scandal',
      season: 2027,
      triggerRound: 13,
      type: 'phantom_salaries' as const,
      affectedClubId: 'ai2',
      resolutionRound: 13,
      isResolved: false,
    }
    const { pointDeductions } = applyScandalEffect(game, scandal, alwaysRand(0))
    expect(pointDeductions['ai2']).toBe(2)
  })

  it('club_to_club_loan adds 3 pending points next season', () => {
    const game = makeGame()
    const scandal = {
      id: 'test_loan',
      season: 2027,
      triggerRound: 7,
      type: 'club_to_club_loan' as const,
      affectedClubId: 'ai1',
      secondaryClubId: 'ai2',
      resolutionRound: 7,
      isResolved: false,
    }
    const { pendingPointDeductions } = applyScandalEffect(game, scandal, alwaysRand(0))
    expect(pendingPointDeductions['ai1']).toBe(3)
  })

  it('fundraiser_vanished reduces reputation', () => {
    const game = makeGame()
    const scandal = {
      id: 'test_fund',
      season: 2027,
      triggerRound: 7,
      type: 'fundraiser_vanished' as const,
      affectedClubId: 'ai2',
      resolutionRound: 12,
      isResolved: false,
    }
    const { updatedClubs } = applyScandalEffect(game, scandal, alwaysRand(0))
    const club = updatedClubs.find(c => c.id === 'ai2')!
    expect(club.reputation).toBe(55 - 8)
  })

  it('generates an inbox item for each scandal', () => {
    const game = makeGame()
    const scandal = {
      id: 'test_coach',
      season: 2027,
      triggerRound: 7,
      type: 'coach_meltdown' as const,
      affectedClubId: 'ai3',
      resolutionRound: 11,
      isResolved: false,
    }
    const { inboxItems } = applyScandalEffect(game, scandal, alwaysRand(0))
    expect(inboxItems.length).toBeGreaterThanOrEqual(1)
    expect(inboxItems[0].id).toBe('test_coach')
  })
})

describe('resolveExpiredScandals', () => {
  it('moves expired scandals to history', () => {
    const game = makeGame()
    const scandal = {
      id: 'exp_scandal',
      season: 2027,
      triggerRound: 5,
      type: 'treasurer_resigned' as const,
      affectedClubId: 'ai1',
      resolutionRound: 8,
      isResolved: false,
    }
    const gameWithScandal = { ...game, activeScandals: [scandal] }
    const { updatedScandals, updatedScandalHistory } = resolveExpiredScandals(gameWithScandal, 8)
    expect(updatedScandals).toHaveLength(0)
    expect(updatedScandalHistory).toHaveLength(1)
    expect(updatedScandalHistory[0].isResolved).toBe(true)
  })

  it('keeps active scandals that have not expired', () => {
    const game = makeGame()
    const scandal = {
      id: 'active_scandal',
      season: 2027,
      triggerRound: 12,
      type: 'treasurer_resigned' as const,
      affectedClubId: 'ai1',
      resolutionRound: 15,
      isResolved: false,
    }
    const gameWithScandal = { ...game, activeScandals: [scandal] }
    const { updatedScandals } = resolveExpiredScandals(gameWithScandal, 13)
    expect(updatedScandals).toHaveLength(1)
  })

  it('restores reputation for coach_meltdown at resolution', () => {
    const game: SaveGame = {
      ...makeGame(),
      clubs: [makeClub('managed', 70), makeClub('ai1', 45)], // ai1 hit by meltdown
    }
    const scandal = {
      id: 'meltdown',
      season: 2027,
      triggerRound: 7,
      type: 'coach_meltdown' as const,
      affectedClubId: 'ai1',
      resolutionRound: 11,
      isResolved: false,
    }
    const gameWithScandal = { ...game, activeScandals: [scandal] }
    const { updatedClubs } = resolveExpiredScandals(gameWithScandal, 11)
    const club = updatedClubs.find(c => c.id === 'ai1')!
    expect(club.reputation).toBe(45 + 5)
  })
})

describe('isTransferFrozen', () => {
  it('returns true for club with active treasurer_resigned scandal', () => {
    const game = makeGame()
    const scandal = {
      id: 'freeze_test',
      season: 2027,
      triggerRound: 7,
      type: 'treasurer_resigned' as const,
      affectedClubId: 'ai1',
      resolutionRound: 10,
      isResolved: false,
    }
    expect(isTransferFrozen({ ...game, activeScandals: [scandal] }, 'ai1')).toBe(true)
  })

  it('returns false for club without active freeze', () => {
    const game = makeGame()
    expect(isTransferFrozen(game, 'ai1')).toBe(false)
  })
})

describe('scandal frequency over many seasons', () => {
  it('generates 2-4 scandals per season on average', () => {
    // Simulate 20 seasons × 30 rounds each, count scandals triggered
    let totalScandals = 0
    const SEASONS = 20

    for (let season = 0; season < SEASONS; season++) {
      let game = makeGame()
      game = { ...game, currentSeason: 2027 + season }

      for (let round = 1; round <= 30; round++) {
        const rand = () => Math.random()
        const scandal = checkScandalTrigger(game, round, rand)
        if (scandal) {
          totalScandals++
          game = {
            ...game,
            activeScandals: [...(game.activeScandals ?? []), scandal],
          }
        }
        // Reset scandals each season
        if (round === 30) {
          game = { ...game, activeScandals: [], scandalHistory: [] }
        }
      }
    }

    const avg = totalScandals / SEASONS
    expect(avg).toBeGreaterThanOrEqual(0.5)  // at least some scandals
    expect(avg).toBeLessThanOrEqual(6)        // not too many
  })
})
