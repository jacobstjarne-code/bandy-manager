import { describe, expect, it } from 'vitest'
import { createNewGame } from '../createNewGame'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { FixtureStatus, PlayoffRound, PlayoffStatus } from '../../../domain/enums'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { PlayoffSeries } from '../../../domain/entities/Playoff'
import { completeManagedFixture } from '../completeManagedFixture'
import { matchActions } from '../../../presentation/store/actions/matchActions'
import type { SaveGame } from '../../../domain/entities/SaveGame'

function playoffGame(): { game: SaveGame; fixture: Fixture; series: PlayoffSeries } {
  const base = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 919 })
  const original = base.fixtures.find(fixture => fixture.status === FixtureStatus.Scheduled)!
  const fixture: Fixture = {
    ...original,
    isKnockout: true,
    isCup: false,
    matchStartedAt: 123,
  }
  const series: PlayoffSeries = {
    id: 'test_qf',
    round: PlayoffRound.QuarterFinal,
    homeClubId: fixture.homeClubId,
    awayClubId: fixture.awayClubId,
    fixtures: [fixture.id],
    homeWins: 2,
    awayWins: 0,
    winnerId: null,
    loserId: null,
  }
  const inert = (id: string): PlayoffSeries => ({
    ...series,
    id,
    fixtures: [],
    homeWins: 0,
  })
  return {
    fixture,
    series,
    game: {
      ...base,
      fixtures: base.fixtures.map(candidate => candidate.id === fixture.id ? fixture : candidate),
      playoffBracket: {
        season: base.currentSeason,
        status: PlayoffStatus.QuarterFinals,
        quarterFinals: [series, inert('qf_2'), inert('qf_3'), inert('qf_4')],
        semiFinals: [],
        final: null,
        champion: null,
      },
    },
  }
}

describe('completeManagedFixture — en kanonisk och idempotent sluttransaktion', () => {
  it('räknar ett slutspelsresultat exakt en gång och rensar matchStartedAt', () => {
    const { game, fixture, series } = playoffGame()
    const completed: Fixture = {
      ...fixture,
      homeScore: 5,
      awayScore: 1,
      status: FixtureStatus.Completed,
    }

    const once = completeManagedFixture(game, completed)
    const twice = completeManagedFixture(once, completed)
    const onceSeries = once.playoffBracket!.quarterFinals.find(candidate => candidate.id === series.id)!
    const twiceSeries = twice.playoffBracket!.quarterFinals.find(candidate => candidate.id === series.id)!

    expect(onceSeries.homeWins).toBe(3)
    expect(twiceSeries.homeWins).toBe(3)
    expect(twice).toBe(once)
    expect(once.fixtures.find(candidate => candidate.id === fixture.id)?.matchStartedAt).toBeUndefined()
  })

  it('walkover-vägen använder samma transaktion och uppdaterar serien', () => {
    const seeded = playoffGame()
    const managedIsHome = seeded.fixture.homeClubId === seeded.game.managedClubId
    const opponentIsHome = !managedIsHome
    const series = {
      ...seeded.series,
      homeWins: opponentIsHome ? 2 : 0,
      awayWins: opponentIsHome ? 0 : 2,
    }
    let store = {
      game: {
        ...seeded.game,
        playoffBracket: {
          ...seeded.game.playoffBracket!,
          quarterFinals: seeded.game.playoffBracket!.quarterFinals.map(candidate =>
            candidate.id === series.id ? series : candidate,
          ),
        },
      } as SaveGame | null,
    }
    const actions = matchActions(
      () => store,
      partial => { store = { ...store, ...partial } },
    )

    actions.concedeWalkover(seeded.fixture.id)

    const resolved = store.game!.playoffBracket!.quarterFinals.find(candidate => candidate.id === series.id)!
    expect(opponentIsHome ? resolved.homeWins : resolved.awayWins).toBe(3)
    expect(resolved.winnerId).toBe(opponentIsHome ? seeded.fixture.homeClubId : seeded.fixture.awayClubId)
  })
})
