import { buildEventFromFixture, buildEventFromRetirement, buildEventFromStoryline } from '../domain/services/clubMemoryEventBuilders'
import type { Fixture } from '../domain/entities/Fixture'
import type { ClubLegend, StorylineEntry } from '../domain/entities/Narrative'
import { FixtureStatus } from '../domain/enums'

const MANAGED_CLUB_ID = 'club_a'
const OPPONENT_CLUB_ID = 'club_b'

function makeFixture(overrides: Partial<Fixture>): Fixture {
  return {
    id: 'fix_1',
    leagueId: 'league_1',
    season: 2,
    roundNumber: 22,
    matchday: 37,
    homeClubId: MANAGED_CLUB_ID,
    awayClubId: OPPONENT_CLUB_ID,
    status: FixtureStatus.Completed,
    homeScore: 3,
    awayScore: 1,
    events: [],
    ...overrides,
  }
}

describe('buildEventFromFixture', () => {
  it('returns null for scheduled fixtures', () => {
    const f = makeFixture({ status: FixtureStatus.Scheduled })
    expect(buildEventFromFixture(f, MANAGED_CLUB_ID)).toBeNull()
  })

  it('returns null when managed club is not involved', () => {
    const f = makeFixture({ homeClubId: 'other_a', awayClubId: 'other_b' })
    expect(buildEventFromFixture(f, MANAGED_CLUB_ID)).toBeNull()
  })

  it('SM-final win → sm_final event with significance 95', () => {
    const f = makeFixture({ isFinaldag: true, homeScore: 4, awayScore: 2 })
    const event = buildEventFromFixture(f, MANAGED_CLUB_ID)
    expect(event).not.toBeNull()
    expect(event!.type).toBe('sm_final')
    expect(event!.significance).toBe(95)
  })

  it('SM-final loss → sm_final event with significance 85', () => {
    const f = makeFixture({ isFinaldag: true, homeScore: 1, awayScore: 4 })
    const event = buildEventFromFixture(f, MANAGED_CLUB_ID)
    expect(event).not.toBeNull()
    expect(event!.type).toBe('sm_final')
    expect(event!.significance).toBe(85)
  })

  it('big win ≥6 margin → significance 65', () => {
    const f = makeFixture({ homeScore: 7, awayScore: 1 })
    const event = buildEventFromFixture(f, MANAGED_CLUB_ID)
    expect(event).not.toBeNull()
    expect(event!.type).toBe('big_win')
    expect(event!.significance).toBe(65)
  })

  it('big win 4 margin → significance 40', () => {
    const f = makeFixture({ homeScore: 5, awayScore: 1 })
    const event = buildEventFromFixture(f, MANAGED_CLUB_ID)
    expect(event).not.toBeNull()
    expect(event!.type).toBe('big_win')
    expect(event!.significance).toBe(40)
  })

  it('small margin match → returns null', () => {
    const f = makeFixture({ homeScore: 3, awayScore: 2 })
    expect(buildEventFromFixture(f, MANAGED_CLUB_ID)).toBeNull()
  })
})

describe('buildEventFromRetirement', () => {
  it('club legend retirement → significance 90', () => {
    const legend: ClubLegend = {
      name: 'Olle Lindqvist',
      position: 'DEF',
      seasons: 10,
      totalGoals: 30,
      totalAssists: 60,
      titles: [],
      retiredSeason: 5,
    }
    const event = buildEventFromRetirement(legend)
    expect(event.type).toBe('retirement')
    expect(event.significance).toBe(90)
    expect(event.season).toBe(5)
    expect(event.emoji).toBe('👋')
  })

  it('uses memorableStory if available', () => {
    const legend: ClubLegend = {
      name: 'Sven Nilsson',
      position: 'FWD',
      seasons: 7,
      totalGoals: 85,
      totalAssists: 40,
      titles: ['SM-guld'],
      retiredSeason: 3,
      memorableStory: 'Räddade klubben i sista omgången.',
    }
    const event = buildEventFromRetirement(legend)
    expect(event.text).toBe('Räddade klubben i sista omgången.')
  })
})

describe('buildEventFromStoryline', () => {
  it('returns null for unresolved storylines', () => {
    const storyline: StorylineEntry = {
      id: 's1', type: 'underdog_season', season: 2, matchday: 15,
      description: 'Test', displayText: 'Test storyline', resolved: false,
    }
    expect(buildEventFromStoryline(storyline)).toBeNull()
  })

  it('resolved underdog_season → significance 65', () => {
    const storyline: StorylineEntry = {
      id: 's2', type: 'underdog_season', season: 2, matchday: 22,
      description: 'Test', displayText: 'Mot alla odds tog laget säsongen hem.', resolved: true,
    }
    const event = buildEventFromStoryline(storyline)
    expect(event).not.toBeNull()
    expect(event!.type).toBe('storyline_resolution')
    expect(event!.significance).toBe(65)
    expect(event!.text).toBe('Mot alla odds tog laget säsongen hem.')
  })
})
