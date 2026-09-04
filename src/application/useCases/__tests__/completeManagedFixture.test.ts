import { describe, expect, it } from 'vitest'
import { createNewGame } from '../createNewGame'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { FixtureStatus, PlayoffRound, PlayoffStatus } from '../../../domain/enums'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { PlayoffSeries } from '../../../domain/entities/Playoff'
import { completeManagedFixture } from '../completeManagedFixture'
import { matchActions } from '../../../presentation/store/actions/matchActions'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { advanceToNextEvent } from '../roundProcessor'

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

function gameWithManagedHomeMatchAtNextMatchday(): SaveGame {
  const game = CLUB_TEMPLATES.map(template =>
    createNewGame({ managerName: 'Test', clubId: template.id, season: 2025, seed: 919 })
  ).find(candidate => {
    const nextMatchday = Math.min(...candidate.fixtures.filter(f => f.status === FixtureStatus.Scheduled).map(f => f.matchday))
    return candidate.fixtures.some(f =>
      f.matchday === nextMatchday && f.homeClubId === candidate.managedClubId && f.status === FixtureStatus.Scheduled
    )
  })
  if (!game) throw new Error('Testvärlden saknar hanterad hemmamatch på nästa matchdag')
  return game
}

describe('completeManagedFixture — en kanonisk och idempotent sluttransaktion', () => {
  it('bokför hemmamatchens intäkt först när en livespelad match är avgjord', () => {
    const generated = gameWithManagedHomeMatchAtNextMatchday()
    const base = { ...generated, managedClubPendingLineup: undefined }

    const firstPass = advanceToNextEvent(base, 411)
    expect(firstPass.hasManagedCupMatch).toBe(true)
    const fixture = firstPass.game.fixtures.find(f =>
      f.matchday === firstPass.roundPlayed && f.homeClubId === base.managedClubId && f.status === FixtureStatus.Scheduled
    )!
    const logBefore = firstPass.game.financeLog ?? []
    expect(logBefore.some(entry => entry.round === fixture.matchday && entry.reason === 'wages')).toBe(false)

    const completed = completeManagedFixture(firstPass.game, {
      ...fixture,
      status: FixtureStatus.Completed,
      homeScore: 4,
      awayScore: 2,
      attendance: 1000,
      events: [],
    })
    const newEntries = (completed.financeLog ?? []).slice(logBefore.length)
    expect(newEntries.filter(entry => entry.reason === 'match_revenue')).toHaveLength(1)
    expect(newEntries.find(entry => entry.reason === 'match_revenue')?.amount).toBeGreaterThan(0)
    expect(newEntries.filter(entry => entry.reason === 'wages')).toHaveLength(1)
    const cashBefore = firstPass.game.clubs.find(c => c.id === base.managedClubId)!.finances
    const cashAfter = completed.clubs.find(c => c.id === base.managedClubId)!.finances
    expect(cashAfter - cashBefore).toBe(newEntries.reduce((sum, entry) => sum + entry.amount, 0))
  })

  it('snabbsimens andra pass bokför managed exakt en gång utan att köra AI-ekonomin igen', () => {
    const generated = gameWithManagedHomeMatchAtNextMatchday()
    const firstPass = advanceToNextEvent({ ...generated, managedClubPendingLineup: undefined }, 511)
    const aiBalancesAfterFirstPass = new Map(firstPass.game.clubs
      .filter(c => c.id !== generated.managedClubId)
      .map(c => [c.id, c.finances]))

    const secondPass = advanceToNextEvent({
      ...firstPass.game,
      managedClubPendingLineup: generated.managedClubPendingLineup,
    }, 512)
    const currentRoundEntries = (secondPass.game.financeLog ?? []).filter(entry => entry.round === firstPass.roundPlayed)

    expect(secondPass.hasManagedCupMatch).toBe(false)
    expect(currentRoundEntries.filter(entry => entry.reason === 'match_revenue')).toHaveLength(1)
    expect(currentRoundEntries.filter(entry => entry.reason === 'wages')).toHaveLength(1)
    for (const club of secondPass.game.clubs.filter(c => c.id !== generated.managedClubId)) {
      expect(club.finances).toBe(aiBalancesAfterFirstPass.get(club.id))
    }
  })

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
    expect(store.game!.financeLog?.some(entry => entry.reason === 'match_revenue')).toBe(false)
  })
})
