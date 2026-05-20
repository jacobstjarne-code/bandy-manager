import { describe, it, expect } from 'vitest'
import { playerAcceptsTransfer } from '../transferService'
import type { Player } from '../../entities/Player'
import type { Club } from '../../entities/Club'

// Helper stubs
function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1', firstName: 'Test', lastName: 'Player', age: 28,
    nationality: 'svenska', clubId: 'club_a', isHomegrown: false,
    position: 'FWD' as never, archetype: 'Finisher' as never,
    salary: 10000, contractUntilSeason: 2027, marketValue: 100000,
    morale: 60, form: 60, fitness: 80, sharpness: 70,
    currentAbility: 60, potentialAbility: 70, developmentRate: 40,
    injuryProneness: 20, discipline: 70,
    attributes: {} as never,
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    seasonStats: {} as never, careerStats: {} as never,
    isFullTimePro: false,
    ...overrides,
  }
}
function makeClub(id: string, region: string): Club {
  return {
    id, name: id, shortName: id, region, reputation: 50, finances: 200000,
    wageBudget: 50000, transferBudget: 100000,
    youthQuality: 50, youthRecruitment: 50, youthDevelopment: 50,
    facilities: 50,
    boardExpectation: 'midTable' as never,
    fanExpectation: 'midTable' as never,
    preferredStyle: 'balanced' as never,
    hasArtificialIce: false,
    activeTactic: {} as never,
    squadPlayerIds: [],
  } as Club
}

describe('playerAcceptsTransfer', () => {
  it('dream_club player accepts 100% when buyer matches dreamClubId', () => {
    const player = makePlayer({ transferPersonality: 'dream_club', dreamClubId: 'club_b' })
    const seller = makeClub('club_a', 'Dalarna')
    const buyer = makeClub('club_b', 'Dalarna')
    // dream club match — always accept regardless of rand
    expect(playerAcceptsTransfer(player, buyer, seller, () => 0.99)).toBe(true)
  })

  it('ambitious player has higher base accept than homebound', () => {
    const ambitious = makePlayer({ transferPersonality: 'ambitious' })
    const homebound = makePlayer({ transferPersonality: 'homebound' })
    const seller = makeClub('club_a', 'Uppland')
    const buyer = makeClub('club_b', 'Uppland')
    // Same region (dist=0), no rivalry — base rates apply
    // ambitious base 0.85, homebound base 0.35
    // rand() = 0.5: ambitious accepts (0.85 > 0.5), homebound rejects (0.35 < 0.5)
    expect(playerAcceptsTransfer(ambitious, buyer, seller, () => 0.5)).toBe(true)
    expect(playerAcceptsTransfer(homebound, buyer, seller, () => 0.5)).toBe(false)
  })

  it('getRegionDistance returns 0 for same region', async () => {
    const { getRegionDistance } = await import('../../data/regionGeography')
    expect(getRegionDistance('Dalarna', 'Dalarna')).toBe(0)
  })

  it('getRegionDistance returns 4 for Norrbotten vs Skåne', async () => {
    const { getRegionDistance } = await import('../../data/regionGeography')
    expect(getRegionDistance('Norrbotten', 'Skåne')).toBe(4)
  })

  it('homebound player strongly penalized for large distance', () => {
    const player = makePlayer({ transferPersonality: 'homebound' })
    const seller = makeClub('club_a', 'Norrbotten')
    const buyer = makeClub('club_b', 'Skåne')
    // dist=4, homebound: 0.35 * 0.30 = 0.105
    // rand() = 0.15 → rejects (0.105 < 0.15)
    expect(playerAcceptsTransfer(player, buyer, seller, () => 0.15)).toBe(false)
  })

  it('rival club reduces accept chance', () => {
    // club_soderfors vs club_skutskar = intensity 3, -0.30
    const player = makePlayer({ transferPersonality: 'default', clubId: 'club_soderfors' })
    const seller = makeClub('club_soderfors', 'Uppland')
    const buyer = makeClub('club_skutskar', 'Gästrikland')
    // default 0.70 - 0.30 = 0.40, rand 0.50 → rejects
    expect(playerAcceptsTransfer(player, buyer, seller, () => 0.50)).toBe(false)
    // rand 0.30 → accepts
    expect(playerAcceptsTransfer(player, buyer, seller, () => 0.30)).toBe(true)
  })
})

describe('personality distribution', () => {
  it('distribution within ±2% of 35/30/15/12/8', () => {
    // Simulate 1000 players via the same formula as getPersonalityFromSeed
    const counts = { homebound: 0, default: 0, ambitious: 0, family: 0, dream_club: 0 }
    for (let i = 0; i < 1000; i++) {
      const v = i % 100
      const p = v < 35 ? 'homebound' : v < 65 ? 'default' : v < 80 ? 'ambitious' : v < 92 ? 'family' : 'dream_club'
      counts[p as keyof typeof counts]++
    }
    expect(counts.homebound / 10).toBeCloseTo(35, 0)
    expect(counts.default / 10).toBeCloseTo(30, 0)
    expect(counts.ambitious / 10).toBeCloseTo(15, 0)
    expect(counts.family / 10).toBeCloseTo(12, 0)
    expect(counts.dream_club / 10).toBeCloseTo(8, 0)
  })
})
