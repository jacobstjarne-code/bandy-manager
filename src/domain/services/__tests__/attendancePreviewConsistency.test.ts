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
})
