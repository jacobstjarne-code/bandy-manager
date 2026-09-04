/**
 * Survive-tierns eget avskedskontrakt (Jacobs dom 2026-08-25, efter fjärde
 * H4-mätningen — RAPPORT_SURVIVE_AVSKEDSMEKANIK_AVGRANSNING_2026-08-25.md):
 * "Att förlora är förväntat — det är premissen." En Survive-klubb ska inte
 * kunna sparkas på ENBART boardPatience<=15 eller ENBART tre misslyckanden.
 * Den sportsliga grinden kräver båda samtidigt; licensnekan och konkurs är
 * fortfarande oberoende finansiella vägar.
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
 * Kombinationen och de separata signalerna testas direkt i boardService.test.
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
    // A-H1: seasonEndProcessor.ts läser nu game.seasonStartBoardExpectation
    // (den frusna säsongsstarts-förväntan), inte längre club.boardExpectation
    // live, för retrospektiva beräkningar som denna avskedskontrollen. Måste
    // sättas i lås med overriden ovan, annars läses createNewGame's default
    // (club_heros' mall-värde Survive) istf testets avsedda `expectation`.
    seasonStartBoardExpectation: expectation,
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
