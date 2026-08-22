// E-STRESS1 (2026-08-23, BACKLOG.md): ingen headless körning byggde någonsin
// en anläggningsnod — O5 kraft 2 kunde bara verifieras analytiskt. Denna
// minimala byggpolicy låter stress-infrastrukturen faktiskt bygga.
import { describe, it, expect } from 'vitest'
import { autoBuildCheapestAffordableFacility } from '../fixtures'
import type { SaveGame } from '../../../src/domain/entities/SaveGame'
import type { Club } from '../../../src/domain/entities/Club'
import { ClubExpectation, ClubStyle } from '../../../src/domain/enums'

function makeClub(overrides: Partial<Club> = {}): Club {
  return {
    id: 'c1', name: 'Test FK', shortName: 'TFK', region: 'Test',
    reputation: 60, finances: 1_000_000, wageBudget: 200000, transferBudget: 300000,
    youthQuality: 50, youthRecruitment: 50, youthDevelopment: 50, facilities: 60,
    boardExpectation: ClubExpectation.MidTable, fanExpectation: ClubExpectation.MidTable,
    preferredStyle: ClubStyle.Balanced, hasArtificialIce: false,
    squadPlayerIds: [],
    ...overrides,
  } as Club
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    managedClubId: 'c1', clubs: [makeClub()], currentMatchday: 5,
    facilityState: { builtNodeIds: [], builtSeasons: {} },
    ...overrides,
  } as unknown as SaveGame
}

describe('autoBuildCheapestAffordableFacility', () => {
  it('startar ett bygge när kassan räcker med marginal', () => {
    const game = makeGame()
    const result = autoBuildCheapestAffordableFacility(game)
    expect(result.facilityState?.activeProject).toBeDefined()
  })

  it('drar kostnaden ur egen kassa', () => {
    const game = makeGame({ clubs: [makeClub({ finances: 1_000_000 })] })
    const result = autoBuildCheapestAffordableFacility(game)
    const club = result.clubs.find(c => c.id === 'c1')
    expect(club!.finances).toBeLessThan(1_000_000)
  })

  it('bygger INTE om säkerhetsmarginalen skulle brytas', () => {
    const game = makeGame({ clubs: [makeClub({ finances: 100_000 })] })  // under billigaste nod + marginal
    const result = autoBuildCheapestAffordableFacility(game)
    expect(result.facilityState?.activeProject).toBeUndefined()
    expect(result.clubs.find(c => c.id === 'c1')!.finances).toBe(100_000)
  })

  it('bygger INTE om ett bygge redan pågår', () => {
    const game = makeGame({
      facilityState: { builtNodeIds: [], builtSeasons: {}, activeProject: { nodeId: 'kiosk', startedMatchday: 1, etaMatchday: 5 } },
    })
    const result = autoBuildCheapestAffordableFacility(game)
    expect(result).toBe(game)  // oförändrad referens — tidig retur
  })

  it('väljer den BILLIGASTE tillgängliga noden, inte första i listan', () => {
    const game = makeGame()
    const result = autoBuildCheapestAffordableFacility(game)
    const nodeId = result.facilityState?.activeProject?.nodeId
    // De två billigaste ordinarie noderna (80 tkr): kiosk, stralkastare — inga requires
    expect(['kiosk', 'stralkastare']).toContain(nodeId)
  })
})
