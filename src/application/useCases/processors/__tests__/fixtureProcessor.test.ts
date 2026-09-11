import { describe, expect, it } from 'vitest'
import type { Fixture } from '../../../../domain/entities/Fixture'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { FixtureStatus, InboxItemType, MatchEventType } from '../../../../domain/enums'
import {
  generateSpecialDateInbox,
  generateSpecialDateInboxSpectator,
  INBOX_PROTECTED_TYPES,
  processUpcomingFixtureInbox,
  stripCompletedFixture,
} from '../fixtureProcessor'

const tactic = {
  mentality: 'balanced',
  tempo: 'normal',
  passingRisk: 'balanced',
  width: 'normal',
  attackingFocus: 'balanced',
  cornerStrategy: 'mixed',
  penaltyKillStyle: 'compact',
} as const

function completedFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'fixture-1',
    homeClubId: 'managed',
    awayClubId: 'away',
    matchday: 4,
    roundNumber: 4,
    status: FixtureStatus.Completed,
    homeScore: 1,
    awayScore: 1,
    events: [
      { type: MatchEventType.Goal, minute: 12, description: 'mål' },
      { type: MatchEventType.Suspension, minute: 31, description: 'utvisning' },
      { type: MatchEventType.Shot, minute: 44, description: 'skott' },
    ],
    homeLineup: { startingPlayerIds: ['p1'], benchPlayerIds: ['p2'], tactic },
    awayLineup: { startingPlayerIds: ['p3'], benchPlayerIds: ['p4'], tactic },
    report: { playerRatings: { p1: 7 } },
    ...overrides,
  } as Fixture
}

function game(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    managedClubId: 'managed',
    currentSeason: 2,
    currentDate: '2026-12-26',
    clubs: [
      { id: 'managed', name: 'Brukets BK', shortName: 'Bruket', arenaName: 'Bruksvallen' },
      { id: 'away', name: 'Gästerna BK', shortName: 'Gästerna', arenaName: 'Bortavallen' },
      { id: 'final-home', name: 'Finalisterna', shortName: 'Finalorten', arenaName: 'Finalvallen' },
    ],
    fixtures: [],
    inbox: [],
    seasonCalendar: [],
    ...overrides,
  } as unknown as SaveGame
}

describe('fixtureProcessor', () => {
  it('komprimerar avslutade matcher men behåller kanoniska mål och utvisningar', () => {
    const result = stripCompletedFixture(completedFixture(), undefined, 'other-club')

    expect(result.events.map(event => event.type)).toEqual([
      MatchEventType.Goal,
      MatchEventType.Suspension,
    ])
    expect(result.events.every(event => event.description === '')).toBe(true)
    expect(result.homeLineup?.benchPlayerIds).toEqual([])
    expect(result.report?.playerRatings).toEqual({})
  })

  it('bevarar betygen från varje vanlig match för den hanterade klubbens årsbok', () => {
    const routineLeagueMatch = completedFixture({
      id: 'routine-managed',
      matchday: 8,
      roundNumber: 8,
      homeScore: 2,
      awayScore: 1,
      report: { playerRatings: { p1: 7.2, p2: 6.4, p3: 6.8 } } as never,
    })

    const result = stripCompletedFixture(routineLeagueMatch, undefined, 'managed')

    expect(result.homeLineup?.benchPlayerIds).toEqual(['p2'])
    expect(result.awayLineup?.benchPlayerIds).toEqual([])
    expect(result.report?.playerRatings).toEqual({ p1: 7.2, p2: 6.4, p3: 6.8 })
  })

  it('skapar annandagsnotisen från den lagrade kalendern', () => {
    const fixture = completedFixture({ status: FixtureStatus.Scheduled })
    const save = game({ seasonCalendar: [{ matchday: 4, isAnnandagen: true }] })

    const result = generateSpecialDateInbox(fixture, save, 4)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('inbox_annandagen_match_2')
    expect(result[0].type).toBe(InboxItemType.Derby)
  })

  it('skapar en åskådarnotis för finaldagen högst en gång', () => {
    const final = completedFixture({
      id: 'final',
      homeClubId: 'final-home',
      awayClubId: 'away',
      status: FixtureStatus.Scheduled,
      isFinaldag: true,
    })
    const save = game({ fixtures: [final] })

    const first = generateSpecialDateInboxSpectator(save)
    const second = generateSpecialDateInboxSpectator(game({
      fixtures: [final],
      inbox: first,
    }))

    expect(first).toHaveLength(1)
    expect(second).toEqual([])
  })

  it('öppnar annandagsvalet exakt två globala matchdagar före hemmamatchen', () => {
    const annandagen = completedFixture({
      status: FixtureStatus.Scheduled,
      matchday: 12,
      isAnnandagen: true,
    })

    const result = processUpcomingFixtureInbox([annandagen], game(), 10)

    expect(result.pendingAnnandagsVal).toBe(true)
    expect(result.upcomingManagedFixture?.id).toBe(annandagen.id)
  })

  it('skyddar alla handlingskrävande inkorgstyper från åldersrensning', () => {
    expect(INBOX_PROTECTED_TYPES).toEqual(new Set([
      InboxItemType.TransferOffer,
      InboxItemType.ContractExpiring,
      InboxItemType.Retirement,
      InboxItemType.TransferBidReceived,
      InboxItemType.YouthIntake,
      InboxItemType.ScoutReport,
      InboxItemType.TransferDeadline,
    ]))
  })
})
