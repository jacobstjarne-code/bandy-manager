/**
 * PÅSTÅENDEKARTAN, LÄST-FÖRE-INITIERING (2026-08-27, Jacobs dom): "0–0.
 * Allt kan hända härifrån." antydde ett läge som inte fanns — samma familj
 * som HalftimeModals "förra året". Låst text för en oöppnad serie: "Serien
 * börjar. Först till {N} vinster." Efter första matchen tar den vanliga
 * texten över.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { getSituation } from '../situationService'
import { FixtureStatus, PlayoffStatus, PlayoffRound } from '../../enums'
import type { SaveGame } from '../../entities/SaveGame'
import type { PlayoffBracket } from '../../entities/Playoff'
import type { Fixture } from '../../entities/Fixture'

function makeGameWithActiveQuarterFinal(homeWins: number, awayWins: number): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
  const opponentId = game.clubs.find(c => c.id !== game.managedClubId)!.id

  const seriesFixture: Fixture = {
    id: 'qf_fx_1',
    season: game.currentSeason,
    matchday: 27,
    roundNumber: 27,
    homeClubId: game.managedClubId,
    awayClubId: opponentId,
    status: FixtureStatus.Scheduled,
    isKnockout: true,
  } as unknown as Fixture

  const bracket: PlayoffBracket = {
    season: game.currentSeason,
    status: PlayoffStatus.QuarterFinals,
    quarterFinals: [{
      id: 'qf_1',
      round: PlayoffRound.QuarterFinal,
      homeClubId: game.managedClubId,
      awayClubId: opponentId,
      fixtures: [seriesFixture.id],
      homeWins,
      awayWins,
      winnerId: null,
      loserId: null,
    }],
    semiFinals: [],
    final: null,
    champion: null,
  }

  return { ...game, fixtures: [...game.fixtures, seriesFixture], playoffBracket: bracket }
}

describe('getSituation — slutspelsserie, "Allt kan hända härifrån" bara när serien faktiskt börjat', () => {
  it('0–0 (ingen match spelad i serien än): den låsta "Serien börjar"-texten, med N från formatet', () => {
    const game = makeGameWithActiveQuarterFinal(0, 0)
    const situation = getSituation(game)
    expect(situation.body).toContain('Serien börjar. Först till 3 vinster.')
    expect(situation.body).not.toMatch(/allt kan hända härifrån/i)
  })

  it('1–1 (serien har börjat, verkligt oavgjort läge): "Allt kan hända härifrån" är fortsatt sant text', () => {
    const game = makeGameWithActiveQuarterFinal(1, 1)
    const situation = getSituation(game)
    expect(situation.body).toContain('1–1. Allt kan hända härifrån.')
  })
})
