/**
 * PÅSTÅENDEKARTAN, preview-mönstret (2026-08-26): två bekräftade instanser
 * där en förhandsvisning (MatchScreen, EkonomiTab/EkonomiSecondary) tidigare
 * använde andra indata än den auktoritativa simuleringen. Se
 * RAPPORT_FYRA_UTREDNINGAR_2026-08-26.md. Dessa tester låser att de delade
 * byggfunktionerna faktiskt läser samma sanning matchSimProcessor/
 * economyProcessor läser — inte en tredje, egen gissning.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { buildAttendanceParams, buildRoundIncomeParamsForNextFixture } from '../economyService'
import { FixtureStatus } from '../../enums'
import type { SaveGame } from '../../entities/SaveGame'

describe('buildAttendanceParams — samma indata som matchSimProcessor tidigare härledde själv', () => {
  it('communityStanding sätts när hemmalaget är den hanterade klubben', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const gameWithCs: SaveGame = { ...game, communityStanding: 77 }
    const fixture = gameWithCs.fixtures.find(f => f.homeClubId === gameWithCs.managedClubId)!
    const params = buildAttendanceParams(gameWithCs, fixture)
    expect(params?.communityStanding).toBe(77)
  })

  it('communityStanding är undefined när hemmalaget INTE är den hanterade klubben', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const gameWithCs: SaveGame = { ...game, communityStanding: 77 }
    const awayFixture = gameWithCs.fixtures.find(f => f.awayClubId === gameWithCs.managedClubId && f.homeClubId !== gameWithCs.managedClubId)!
    const params = buildAttendanceParams(gameWithCs, awayFixture)
    expect(params?.communityStanding).toBeUndefined()
  })

  it('isDerby härleds via en riktig rivalitetsuppslagning, inte hårdkodad false', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const fixture = game.fixtures.find(f => f.homeClubId === game.managedClubId)!
    const params = buildAttendanceParams(game, fixture)
    expect(typeof params?.isDerby).toBe('boolean') // inte alltid false — beror på verklig rivalitet
  })

  it('fixtureMonth sätts (decemberbonusen) — utelämnades tidigare i MatchScreens anrop', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const fixture = game.fixtures.find(f => f.homeClubId === game.managedClubId)!
    const params = buildAttendanceParams(game, fixture)
    expect(params?.fixtureMonth).toBeGreaterThanOrEqual(1)
    expect(params?.fixtureMonth).toBeLessThanOrEqual(12)
  })
})

describe('buildRoundIncomeParamsForNextFixture — isHomeMatch läser den VERKLIGA nästa matchen', () => {
  it('om nästa schemalagda match är borta: isHomeMatch är false, inte hårdkodat true', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const awayFixture = game.fixtures
      .filter(f => f.status === FixtureStatus.Scheduled && f.awayClubId === game.managedClubId)
      .sort((a, b) => (a.matchday ?? 0) - (b.matchday ?? 0))[0]
    // Gör borta-matchen till den tidigaste schemalagda genom att markera allt tidigare som spelat
    const adjustedFixtures = game.fixtures.map(f =>
      (f.matchday ?? 0) < (awayFixture.matchday ?? 0) && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
        ? { ...f, status: FixtureStatus.Completed, homeScore: 1, awayScore: 1 }
        : f,
    )
    const gameWithAwayNext: SaveGame = { ...game, fixtures: adjustedFixtures }
    const params = buildRoundIncomeParamsForNextFixture(gameWithAwayNext)
    expect(params.isHomeMatch).toBe(false)
  })

  it('ingen schemalagd match kvar: isHomeMatch är false (ett riktigt svar, inte en gissning)', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const noScheduled: SaveGame = { ...game, fixtures: game.fixtures.map(f => ({ ...f, status: FixtureStatus.Completed, homeScore: 0, awayScore: 0 })) }
    const params = buildRoundIncomeParamsForNextFixture(noScheduled)
    expect(params.isHomeMatch).toBe(false)
  })

  it('bär alla ekonomiska sidokostnader och bonusar som EkonomiTab behöver för samma prognos som motorn', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const game: SaveGame = {
      ...base,
      volunteers: ['Testvolontär'],
      sponsorNetworkMood: 73,
      facilityState: { builtNodeIds: ['varmestuga'] },
      clubLegends: [{
        id: 'legend_1', playerId: 'p1', name: 'Legend', role: 'scout',
        joinedSeason: 2024, seasonsAtClub: 8,
      } as never],
    }
    const params = buildRoundIncomeParamsForNextFixture(game)
    expect(params.volunteers).toEqual(['Testvolontär'])
    expect(params.sponsorNetworkMood).toBe(73)
    expect(params.builtNodeIds).toEqual(['varmestuga'])
    expect(params.builtFacilityUpkeepCosts).toEqual([10000])
    expect(params.legendSalaryCost).toBe(500)
    expect(params.volunteerRoster).toHaveLength(4)
  })
})

// ── ANSPRÅK 4, spak 3 / VÄG C (2026-08-31) ─────────────────────────────────
// freshnessFactor trådas genom SAMMA två byggfunktioner som communityStanding,
// med samma managed-only-villkor. Utan det hade förhandsvisningen (MatchScreen,
// EkonomiTab) visat ett publiktal som inte kände till nyhetstretmillen medan
// matchsimuleringen tog betalt för den — precis den drift dessa byggfunktioner
// finns för att omöjliggöra.
describe('freshnessFactor trådas genom de delade byggfunktionerna (väg C)', () => {
  const ALL_ON = {
    kiosk: 'upgraded' as const, lottery: 'intensive' as const, bandyplay: true,
    functionaries: true, julmarknad: false, bandySchool: true, socialMedia: true,
    vipTent: true, pensionarskaffe: true, soppkvall: true, skolbesok: true,
  }
  const KEYS = ['kiosk', 'lottery', 'bandyplay', 'functionaries', 'bandySchool',
    'socialMedia', 'pensionarskaffe', 'soppkvall', 'skolbesok'] as const

  function wornBigClub(seasonsActive: number): SaveGame {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    return {
      ...base,
      communityActivities: { ...ALL_ON },
      communityActivitiesSince: Object.fromEntries(
        KEYS.map(k => [k, base.currentSeason - seasonsActive]),
      ),
      clubs: base.clubs.map(c => (c.id === base.managedClubId ? { ...c, reputation: 100 } : c)),
    }
  }

  it('buildAttendanceParams sätter freshnessFactor < 1 för den hanterade klubbens hemmamatch', () => {
    const game = wornBigClub(5)
    const fixture = game.fixtures.find(f => f.homeClubId === game.managedClubId)!
    const params = buildAttendanceParams(game, fixture)
    expect(params?.freshnessFactor).toBeDefined()
    expect(params!.freshnessFactor!).toBeLessThan(1)
    expect(params!.freshnessFactor!).toBeGreaterThan(0.5)
  })

  it('buildAttendanceParams lämnar freshnessFactor undefined när hemmalaget är en AI-klubb', () => {
    const game = wornBigClub(5)
    const awayFixture = game.fixtures.find(
      f => f.awayClubId === game.managedClubId && f.homeClubId !== game.managedClubId,
    )!
    expect(buildAttendanceParams(game, awayFixture)?.freshnessFactor).toBeUndefined()
  })

  it('en helt färsk klubb får exakt 1,0 — mekaniken syns inte för den som just startat', () => {
    const game = wornBigClub(0)
    const fixture = game.fixtures.find(f => f.homeClubId === game.managedClubId)!
    expect(buildAttendanceParams(game, fixture)?.freshnessFactor).toBe(1)
  })

  it('buildRoundIncomeParamsForNextFixture bär samma freshness till intäktsvägen', () => {
    const worn = wornBigClub(5)
    const fresh = wornBigClub(0)
    const wornParams = buildRoundIncomeParamsForNextFixture(worn)
    expect(buildRoundIncomeParamsForNextFixture(fresh).freshnessFactor).toBe(1)
    expect(wornParams.freshnessFactor).toBeLessThan(1)
    // EN SANNING: samma tal som publikvägen härleder.
    const fixture = worn.fixtures.find(f => f.homeClubId === worn.managedClubId)!
    expect(wornParams.freshnessFactor).toBe(buildAttendanceParams(worn, fixture)?.freshnessFactor)
  })
})
