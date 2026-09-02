import { describe, it, expect } from 'vitest'
import { processYouth } from '../youthProcessor'
import type { Player } from '../../../../domain/entities/Player'
import type { Fixture } from '../../../../domain/entities/Fixture'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { PlayerPosition, PlayerArchetype, FixtureStatus, MatchEventType } from '../../../../domain/enums'
import { classifyEventNature } from '../../../../domain/services/granskaEventClassifier'
import { getEventRenderTarget } from '../../../../domain/services/eventQueueService'
import { getDefaultRolloverChoice } from '../../../../domain/services/deferredRolloverService'
import { resolveEvent } from '../../../../domain/services/events/eventResolver'

/**
 * HIGH 8 (audit 2026-08-29) — akademidebuten återanvändes tills den slutade betyda något.
 *
 * Rotorsak: `latestManaged` i youthProcessor är "senast spelade managed-match i hela
 * säsongen" (game är förrunds-saven, dess fixtures innehåller aldrig omgångens egen
 * match). Samma fixture och samma mål återfanns därför omgång efter omgång, och
 * eftersom event-id:t bar `nextMatchday` fick varje omgång ett NYTT id — spärren bet
 * aldrig. Dessutom saknades både `promotedFromAcademy`-grinden och kravet på verklig
 * förstamatch (`totalGames <= 3` släppte igenom hela etableringsfasen).
 */

function makePlayer(id: string, overrides: Partial<Player> = {}): Player {
  const ca = 55
  return {
    id, firstName: 'Ung', lastName: 'Spelare', age: 18, nationality: 'SE', clubId: 'club_a',
    isHomegrown: true, position: PlayerPosition.Forward, archetype: PlayerArchetype.TwoWaySkater,
    salary: 5000, contractUntilSeason: 2030, marketValue: 50000,
    morale: 75, form: 70, fitness: 90, sharpness: 60,
    currentAbility: ca, potentialAbility: ca + 25, developmentRate: 70, injuryProneness: 20, discipline: 70,
    attributes: {
      skating: ca, acceleration: ca, stamina: ca, ballControl: ca, passing: ca, shooting: ca,
      dribbling: ca, vision: ca, decisions: ca, workRate: ca, positioning: ca, defending: ca,
      cornerSkill: ca, goalkeeping: Math.max(1, ca - 15), cornerRecovery: 50,
    },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    promotedFromAcademy: true,
    seasonStats: { gamesPlayed: 1, goals: 1, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 7, minutesPlayed: 90 },
    careerStats: { totalGames: 1, totalGoals: 1, totalAssists: 0, seasonsPlayed: 1 },
    ...overrides,
  }
}

function makeFixture(id: string, matchday: number, scorerId: string): Fixture {
  return {
    id, leagueId: 'liga', season: 1, roundNumber: matchday, matchday,
    homeClubId: 'club_a', awayClubId: 'club_b',
    status: FixtureStatus.Completed,
    homeScore: 1, awayScore: 0,
    homeLineup: { startingPlayerIds: [scorerId], benchPlayerIds: [], tactic: {} as never },
    awayLineup: { startingPlayerIds: [], benchPlayerIds: [], tactic: {} as never },
    events: [{ type: MatchEventType.Goal, playerId: scorerId, minute: 30 } as never],
    report: { playerRatings: { [scorerId]: 7.5 } } as never,
  }
}

function makeGame(players: Player[], fixtures: Fixture[], overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    currentSeason: 1,
    managedClubId: 'club_a',
    clubs: [{ id: 'club_a', name: 'Hemma' }, { id: 'club_b', name: 'Motstånd' }],
    players,
    fixtures,
    pendingEvents: [],
    resolvedEventIds: [],
    mentorships: [],
    youthTeam: undefined,
    ...overrides,
  } as unknown as SaveGame
}

const noRand = () => 0.99

function breakthroughEvents(game: SaveGame, matchday: number) {
  const res = processYouth(game, game.players, matchday, '2026-01-01', 1, noRand)
  return res.gameEvents.filter(e => e.type === 'academyEvent' && e.id.startsWith('event_breakthrough_'))
}

describe('processYouth — akademigenombrott (HIGH 8)', () => {
  it('fyrar för en äkta akademidebutant som gör mål i sin första seniormatch', () => {
    const player = makePlayer('p1')
    const game = makeGame([player], [makeFixture('fx1', 4, 'p1')])
    const events = breakthroughEvents(game, 5)
    expect(events).toHaveLength(1)
    expect(events[0].id).toBe('event_breakthrough_p1')
    expect(events[0].relatedPlayerId).toBe(player.id)
    expect(classifyEventNature(events[0])).toBe('player')
    expect(getEventRenderTarget(events[0])).toBe('inline')
  })

  it('kvitteringen är ett ärligt noOp och rollover väljer samma neutrala val', () => {
    const player = makePlayer('p1')
    const game = makeGame([player], [makeFixture('fx1', 4, 'p1')], {
      currentMatchday: 5,
      currentDate: '2026-01-01',
    })
    const [event] = breakthroughEvents(game, 5)
    expect(event).toBeDefined()
    expect(getDefaultRolloverChoice(event)?.id).toBe('ack')

    const resolved = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'ack', undefined, true)
    expect(resolved.players).toEqual(game.players)
    expect(resolved.pendingEvents).toEqual([])
    expect(resolved.resolvedChoices?.at(-1)).toMatchObject({
      eventId: event.id,
      eventType: 'academyEvent',
      choiceId: 'ack',
      madeByPlayer: true,
    })
  })

  it('fyrar bara EN gång totalt — samma fixture återfinns omgång efter omgång', () => {
    const player = makePlayer('p1')
    const game = makeGame([player], [makeFixture('fx1', 4, 'p1')])

    // Omgång 5: eventet skapas.
    const first = breakthroughEvents(game, 5)
    expect(first).toHaveLength(1)

    // Omgång 6 och 7: klubben har ännu inte spelat en ny match, så latestManaged
    // är fortfarande fx1. Med matchdag i id:t fick varje omgång ett nytt id och
    // eventet återkom — nu ska det stabila id:t stoppas av resolvedEventIds.
    const afterResolve = makeGame([player], [makeFixture('fx1', 4, 'p1')], {
      resolvedEventIds: ['event_breakthrough_p1'],
    })
    expect(breakthroughEvents(afterResolve, 6)).toHaveLength(0)
    expect(breakthroughEvents(afterResolve, 7)).toHaveLength(0)

    // Och medan eventet ligger obesvarat i kön ska det inte dubbleras.
    const stillPending = makeGame([player], [makeFixture('fx1', 4, 'p1')], {
      pendingEvents: [{ id: 'event_breakthrough_p1' }] as unknown as SaveGame['pendingEvents'],
    })
    expect(breakthroughEvents(stillPending, 6)).toHaveLength(0)
  })

  it('fyrar inte för ett mål i en match som inte var spelarens första', () => {
    // Andra matchen i karriären: totalGames = 2 när matchen är infälld i statistiken.
    const player = makePlayer('p1', {
      careerStats: { totalGames: 2, totalGoals: 1, totalAssists: 0, seasonsPlayed: 1 },
    })
    const game = makeGame([player], [makeFixture('fx2', 6, 'p1')])
    expect(breakthroughEvents(game, 7)).toHaveLength(0)
  })

  it('fyrar inte för en ung extern värvning som inte kommer ur akademin', () => {
    const player = makePlayer('p1', { promotedFromAcademy: false })
    const game = makeGame([player], [makeFixture('fx1', 4, 'p1')])
    expect(breakthroughEvents(game, 5)).toHaveLength(0)
  })

  it('fyrar inte för en spelare äldre än 21', () => {
    const player = makePlayer('p1', { age: 24 })
    const game = makeGame([player], [makeFixture('fx1', 4, 'p1')])
    expect(breakthroughEvents(game, 5)).toHaveLength(0)
  })
})
