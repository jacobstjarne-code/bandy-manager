/**
 * Survive-tierns eget avskedskontrakt (Jacobs dom 2026-08-25, efter fjärde
 * H4-mätningen — RAPPORT_SURVIVE_AVSKEDSMEKANIK_AVGRANSNING_2026-08-25.md):
 * "Att förlora är förväntat — det är premissen." En Survive-klubb ska inte
 * kunna sparkas på boardPatience<=15 eller consecutiveFailures>=3 (båda
 * sportsligt utfall) — men FORTFARANDE sparkas på licensnekan (rent
 * finansiellt, seasonEndProcessor.ts). Konkurs-vägen (postRoundFlagsProcessor.ts)
 * är per-omgång och testas inte här — den koden rörs inte av denna fix.
 *
 * boardPatience: -500 (inte t.ex. 5) — handleSeasonEnd räknar OM
 * boardPatience/consecutiveFailures från faktisk tabellplacering
 * (computeBoardPatienceUpdate läser bara den satta siffran som startpunkt
 * för säsongens DELTA, inte som facit). Ett grundat-i-noll test-game utan
 * spelade matcher ger en helt tie-broken tabell där club_heros inte
 * garanterat hamnar sist — ett milt negativt startvärde hade då kunnat
 * räddas av en positiv positionsterm och ge ett falskt negativt test. -500
 * är djupt nog att INGEN rimlig säsongsslutsdelta kan lyfta den över 15,
 * oavsett var club_heros faktiskt hamnar i den tie-broken tabellen —
 * samma trick som meritBufferPartialProtection.test.ts använder för att
 * isolera en effekt från tabellplaceringens brus.
 * consecutiveFailures testas inte separat (samma svårighet att forcera en
 * given tabellplacering utan att spela riktiga matcher) — koden delar
 * samma `!isSurviveTier &&`-grind för båda halvorna av villkoret, så
 * boardPatience-testet bevisar grinden fungerar för hela raden.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { ClubExpectation } from '../../../domain/enums'

function makeBase(expectation: ClubExpectation): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 42 })
  return {
    ...game,
    clubs: game.clubs.map(c => c.id === game.managedClubId ? { ...c, boardExpectation: expectation } : c),
    boardPatience: -500,
  }
}

describe('seasonEndProcessor — Survive-tierns avskedsundantag', () => {
  it('Survive: djupt negativ boardPatience sparkar INTE managern', () => {
    const game = makeBase(ClubExpectation.Survive)
    const result = handleSeasonEnd(game, 1)
    expect(result.game.managerFired).not.toBe(true)
  })

  it('AvoidBottom (regressionsvakt): samma djupt negativa boardPatience sparkar managern som förut', () => {
    const game = makeBase(ClubExpectation.AvoidBottom)
    const result = handleSeasonEnd(game, 1)
    expect(result.game.managerFired).toBe(true)
  })

  it('Survive: licensnekan sparkar FORTFARANDE managern — inte osparkbar', () => {
    const surviveGame = makeBase(ClubExpectation.Survive)
    const declined: SaveGame = {
      ...surviveGame,
      licenseStatus: 'point_deduction',
      licenseRiskScore: 65,  // +20 straff denna säsong (netResult negativt nedan) korsar 80-tröskeln → license_denied
      seasonStartSnapshot: {
        season: 2025, finalPosition: 12, finances: 200000, communityStanding: 50, squadSize: 16, supporterMembers: 100,
      },
      clubs: surviveGame.clubs.map(c => c.id === surviveGame.managedClubId ? { ...c, finances: 50000 } : c),
    }
    const result = handleSeasonEnd(declined, 1)
    expect(result.game.managerFired).toBe(true)
  })
})
