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
    ...overrides,
  } as unknown as SaveGame
}

const alwaysRand = (val: number) => () => val

describe('checkScandalTrigger', () => {
  it('returns null outside trigger windows', () => {
    const game = makeGame()
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

  it('non-municipal/non-absurdity types never affect the managed club', () => {
    const game = makeGame()
    for (let i = 0; i < 100; i++) {
      let callCount = 0
      const rand = () => {
        callCount++
        // First call: trigger chance (below 0.25), second: type selection, third+: club selection
        if (callCount === 1) return 0.1  // passes 25% gate
        // Force a non-municipal type by returning a value that maps to treasurer_resigned (~21+15+15 = 51/100)
        if (callCount === 2) return 0.55 // ~55% into distribution → treasurer_resigned range
        return Math.random()
      }
      const result = checkScandalTrigger(game, 7, rand)
      if (result && result.type !== 'municipal_scandal' && result.type !== 'small_absurdity') {
        expect(result.affectedClubId).not.toBe('managed')
      }
    }
  })

  it('municipal_scandal can affect managed club', () => {
    // With only managed + 1 AI club, if type = municipal_scandal, managed could be picked
    const clubs = [makeClub('managed', 70), makeClub('ai1', 45)]
    const game = makeGame({ clubs, league: { teamIds: ['managed', 'ai1'] } as never, scandalHistory: [
      // Make ai1 already hit this season so only managed remains
      {
        id: 'prev',
        season: 2027,
        triggerRound: 6,
        type: 'treasurer_resigned' as const,
        affectedClubId: 'ai1',
        resolutionRound: 9,
        isResolved: false,
      },
    ] })
    let callCount = 0
    const rand = () => {
      callCount++
      if (callCount === 1) return 0.1  // passes gate
      if (callCount === 2) return 0.0  // first type in weights = municipal_scandal
      return 0.0
    }
    const result = checkScandalTrigger(game, 13, rand)
    // If type is municipal_scandal, managed club is a candidate
    if (result) {
      expect(result.type).toBe('municipal_scandal')
      expect(result.affectedClubId).toBe('managed')
    }
  })

  it('does not trigger the same window twice', () => {
    const game = makeGame()
    const rand = alwaysRand(0.1)
    const s1 = checkScandalTrigger(game, 6, rand)
    expect(s1).not.toBeNull()
    const gameWithScandal: SaveGame = { ...game, activeScandals: [s1!] }
    const s2 = checkScandalTrigger(gameWithScandal, 7, rand)
    expect(s2).toBeNull()
  })

  it('can trigger in each window independently (up to available clubs)', () => {
    // 3 AI clubs → max 3 scandals per season for non-municipal types
    // (municipal_scandal can hit managed too, so potentially 4)
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
    expect(triggered).toBeGreaterThanOrEqual(1)
    expect(triggered).toBeLessThanOrEqual(4)
  })

  it('does not trigger a club already hit this season', () => {
    const clubs = [makeClub('managed', 70), makeClub('ai1', 45)]
    const game: SaveGame = {
      ...makeGame(),
      clubs,
      league: { teamIds: ['managed', 'ai1'] } as never,
      scandalHistory: [{
        id: 'prev',
        season: 2027,
        triggerRound: 6,
        type: 'sponsor_collapse' as const,
        affectedClubId: 'ai1',
        resolutionRound: 6,
        isResolved: true,
      }],
    }
    // Force non-municipal type so managed is excluded
    let callCount = 0
    const rand = () => {
      callCount++
      if (callCount === 1) return 0.1   // passes gate
      if (callCount === 2) return 0.55  // treasurer_resigned (not municipal)
      return 0.0
    }
    const result = checkScandalTrigger(game, 13, rand)
    // ai1 is hit, non-municipal can't hit managed → null
    expect(result).toBeNull()
  })
})

describe('applyScandalEffect', () => {
  it('sponsor_collapse reduces club finances by 30k', () => {
    const game = makeGame()
    const scandal = {
      id: 'test_sponsor',
      season: 2027,
      triggerRound: 7,
      type: 'sponsor_collapse' as const,
      affectedClubId: 'ai1',
      resolutionRound: 7,
      isResolved: false,
    }
    const { updatedClubs } = applyScandalEffect(game, scandal, alwaysRand(0))
    const club = updatedClubs.find(c => c.id === 'ai1')!
    expect(club.finances).toBe(300_000 - 30_000)
  })

  it('phantom_salaries adds 2-point deduction', () => {
    const game = makeGame()
    const scandal = {
      id: 'test_phantom',
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

  it('generates inbox items for non-absurdity scandals', () => {
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

  it('small_absurdity generates no inbox items and no delta', () => {
    const game = makeGame()
    const scandal = {
      id: 'test_absurdity',
      season: 2027,
      triggerRound: 7,
      type: 'small_absurdity' as const,
      affectedClubId: 'ai1',
      resolutionRound: 7,
      isResolved: false,
    }
    const { inboxItems, updatedClubs, pointDeductions, pendingPointDeductions } = applyScandalEffect(game, scandal, alwaysRand(0))
    expect(inboxItems).toHaveLength(0)
    expect(updatedClubs.find(c => c.id === 'ai1')!.finances).toBe(300_000)  // unchanged
    expect(Object.keys(pointDeductions)).toHaveLength(0)
    expect(Object.keys(pendingPointDeductions)).toHaveLength(0)
  })

  it('municipal_scandal negative variant reduces finances for managed club', () => {
    const game = makeGame({
      localPolitician: { name: 'Anna Svensson', party: 'S', kommunBidrag: 30_000 } as never,
    })
    const scandal = {
      id: 'test_municipal',
      season: 2027,
      triggerRound: 7,
      type: 'municipal_scandal' as const,
      affectedClubId: 'managed',
      resolutionRound: 7,
      isResolved: false,
      variant: 'negative' as const,
    }
    const { updatedClubs } = applyScandalEffect(game, scandal, alwaysRand(0))
    const club = updatedClubs.find(c => c.id === 'managed')!
    expect(club.finances).toBeLessThan(500_000)
  })

  it('municipal_scandal positive variant increases finances', () => {
    const game = makeGame({
      localPolitician: { name: 'Anna Svensson', party: 'S', kommunBidrag: 30_000 } as never,
    })
    const scandal = {
      id: 'test_municipal_pos',
      season: 2027,
      triggerRound: 7,
      type: 'municipal_scandal' as const,
      affectedClubId: 'managed',
      resolutionRound: 7,
      isResolved: false,
      variant: 'positive' as const,
    }
    const { updatedClubs } = applyScandalEffect(game, scandal, alwaysRand(0))
    const club = updatedClubs.find(c => c.id === 'managed')!
    expect(club.finances).toBeGreaterThan(500_000)
  })

  it('municipal_scandal generates an inbox item', () => {
    const game = makeGame({
      localPolitician: { name: 'Lars Holmberg', party: 'M', kommunBidrag: 25_000 } as never,
    })
    const scandal = {
      id: 'test_mun_inbox',
      season: 2027,
      triggerRound: 7,
      type: 'municipal_scandal' as const,
      affectedClubId: 'ai1',
      resolutionRound: 7,
      isResolved: false,
      variant: 'negative' as const,
    }
    const { inboxItems } = applyScandalEffect(game, scandal, alwaysRand(0))
    expect(inboxItems.length).toBeGreaterThanOrEqual(1)
  })

  it('coach_meltdown text uses "assisterande tränare"', () => {
    const game = makeGame()
    const scandal = {
      id: 'test_coach_text',
      season: 2027,
      triggerRound: 7,
      type: 'coach_meltdown' as const,
      affectedClubId: 'ai1',
      resolutionRound: 11,
      isResolved: false,
    }
    const { inboxItems } = applyScandalEffect(game, scandal, alwaysRand(0))
    const bodyText = inboxItems.map(i => i.body).join(' ').toLowerCase()
    expect(bodyText).toContain('assisterande tränare')
    expect(bodyText).not.toContain('assistenttränare')
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
      clubs: [makeClub('managed', 70), makeClub('ai1', 45)],
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
  it('generates some scandals per season on average', () => {
    let totalScandals = 0
    const SEASONS = 20

    for (let season = 0; season < SEASONS; season++) {
      let game = makeGame()
      game = { ...game, currentSeason: 2027 + season }

      for (let round = 1; round <= 30; round++) {
        const scandal = checkScandalTrigger(game, round, Math.random)
        if (scandal) {
          totalScandals++
          game = { ...game, activeScandals: [...(game.activeScandals ?? []), scandal] }
        }
        if (round === 30) {
          game = { ...game, activeScandals: [], scandalHistory: [] }
        }
      }
    }

    const avg = totalScandals / SEASONS
    expect(avg).toBeGreaterThanOrEqual(0.5)
    expect(avg).toBeLessThanOrEqual(6)
  })
})
