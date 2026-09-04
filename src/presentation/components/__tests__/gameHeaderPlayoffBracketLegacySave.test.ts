/**
 * sidofynd-gameheader-playoffbracket-legacy-save (Codex dagsrapport
 * 2026-09-03 §7, rapporterad → verifierad). REGRESSION: `bracket !== null`
 * fångade inte `undefined` — en save vars playoffBracket saknades helt
 * skulle nå `bracket.status` och krascha GameHeader. migrateSaveGame
 * backfyller redan undefined→null för varje riktig laddningsväg (verifierat
 * separat: saveGameMigration.ts:281, ovillkorat, körs för alla tre
 * migreringsingångarna i saveGameStorage.ts + gameStore.ts:s persist-
 * rehydrering) — kraschen är alltså inte reproducerbar via normal
 * spelgång idag, men kollen i sig var falsk trygghet. Fixat med `!= null`.
 */
import { describe, it, expect } from 'vitest'
import { getPlayoffHeaderLabel, isInPlayoffBracket } from '../GameHeader'
import { PlayoffRound, PlayoffStatus } from '../../../domain/enums'
import type { PlayoffBracket } from '../../../domain/entities/Playoff'
import { createNewGame } from '../../../application/useCases/createNewGame'

describe('GameHeader — isInPlayoffBracket', () => {
  it('undefined (den saknade-fält-legacy-saven) ger false, kraschar inte', () => {
    expect(() => isInPlayoffBracket(undefined)).not.toThrow()
    expect(isInPlayoffBracket(undefined)).toBe(false)
  })

  it('null (normalfallet utanför slutspel) ger false', () => {
    expect(isInPlayoffBracket(null)).toBe(false)
  })

  it('ett aktivt bracket (status ≠ Completed) ger true', () => {
    const bracket = { status: PlayoffStatus.InProgress } as PlayoffBracket
    expect(isInPlayoffBracket(bracket)).toBe(true)
  })

  it('ett avslutat bracket (status = Completed) ger false', () => {
    const bracket = { status: PlayoffStatus.Completed } as PlayoffBracket
    expect(isInPlayoffBracket(bracket)).toBe(false)
  })

  it('Granska behåller semifinalens matchnummer efter att uttågsmatchen avslutat bracketen', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', seed: 1 })
    const fixtureId = 'playoff_sf_3'
    game.playoffBracket = {
      season: game.currentSeason,
      status: PlayoffStatus.Completed,
      quarterFinals: [],
      semiFinals: [{
        id: 'sf_1',
        round: PlayoffRound.SemiFinal,
        homeClubId: game.managedClubId,
        awayClubId: 'club_vastanfors',
        fixtures: ['playoff_sf_1', 'playoff_sf_2', fixtureId],
        homeWins: 0,
        awayWins: 3,
        winnerId: 'club_vastanfors',
        loserId: game.managedClubId,
      }],
      final: null,
      champion: 'club_vastanfors',
    }

    expect(getPlayoffHeaderLabel(game, fixtureId)).toBe('Semifinal · match 3')
  })
})
