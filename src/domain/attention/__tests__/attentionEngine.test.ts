import { describe, expect, it } from 'vitest'
import type { SaveGame } from '../../entities/SaveGame'
import { FixtureStatus } from '../../enums'
import { evaluateAttention, isNotificationPromptEligible } from '../attentionEngine'

function gameFixture(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'save-1',
    revision: 4,
    lastSavedAt: '2026-09-04T09:00:00.000Z',
    managedClubId: 'club_soderfors',
    currentSeason: 2,
    currentDate: '2027-01-10',
    lineupConfirmedThisRound: false,
    clubs: [
      { id: 'club_soderfors', name: 'Söderfors GoIF', shortName: 'Söderfors' },
      { id: 'club_skutskar', name: 'Skutskärs IF', shortName: 'Skutskär' },
    ],
    fixtures: [{
      id: 'fixture-1',
      leagueId: 'league-1',
      season: 2,
      roundNumber: 19,
      matchday: 19,
      homeClubId: 'club_soderfors',
      awayClubId: 'club_skutskar',
      status: FixtureStatus.Scheduled,
      homeScore: 0,
      awayScore: 0,
      events: [],
    }],
    standings: [{
      clubId: 'club_soderfors', played: 18, wins: 8, draws: 2, losses: 8,
      goalsFor: 55, goalsAgainst: 51, goalDifference: 4, points: 18, position: 7,
    }],
    rivalryHistory: {
      club_skutskar: { wins: 1, losses: 2, draws: 0, lastResult: 'loss', currentStreak: -1 },
    },
    ...overrides,
  } as SaveGame
}

describe('evaluateAttention', () => {
  it('creates only the non-narrative preparation loop from raw game state', () => {
    const evaluation = evaluateAttention(gameFixture(), new Date('2026-09-04T10:00:00.000Z'))

    expect(evaluation.stateVersion).toBe('save-1:4:2026-09-04T09:00:00.000Z')
    expect(evaluation.candidates.map(candidate => candidate.category)).toEqual(['match_preparation'])
    expect(evaluation.candidates[0].deepLink).toBe('/game/match')
    expect(evaluation.candidates[0].availableAfter).toBe('2026-09-05T04:00:00.000Z')
    expect(evaluation.openLoops.every(loop => loop.sources.length > 0)).toBe(true)
  })

  it('does not run a narrative redaction parallel to Berättaren', () => {
    const evaluation = evaluateAttention(gameFixture(), new Date('2026-09-04T10:00:00.000Z'))

    expect(evaluation.candidates.some(candidate =>
      candidate.category === 'calendar_anchor' ||
      candidate.category === 'season_context' ||
      candidate.category === 'narrative_return',
    )).toBe(false)
  })

  it('adapts at most one ranked agenda item when an approved copy resolver exists', () => {
    const narrativePost = {
      type: 'player_milestone' as const,
      semanticKey: 'player_milestone:p1:s2:m19:first_team_goal',
      clubId: 'club_soderfors',
      season: 2,
      matchday: 19,
      subject: { kind: 'player' as const, id: 'p1' },
      significance: 60,
    }
    const evaluation = evaluateAttention(
      gameFixture({ currentMatchday: 19, eventLedger: [narrativePost], ledgerTold: {} }),
      new Date('2026-09-04T10:00:00.000Z'),
      {
        narrativePushCopy: () => ({
          title: 'Godkänd testcopy',
          body: 'Kommer från injicerat copy-register.',
          voice: 'club',
        }),
      },
    )

    const narrative = evaluation.candidates.find(candidate => candidate.category === 'narrative_return')
    expect(narrative?.sources).toEqual([{
      kind: 'ledger',
      id: '["player_milestone","player_milestone:p1:s2:m19:first_team_goal",2,19]',
    }])
    expect(narrative?.narrativePost).toEqual({
      post: {
        type: 'player_milestone',
        semanticKey: narrativePost.semanticKey,
        season: 2,
        matchday: 19,
      },
      chronology: { season: 2, matchday: 19 },
    })
    expect(evaluation.candidates.filter(candidate => candidate.narrativePost)).toHaveLength(1)
  })

  it('lets a Portal told mark downweight the shared agenda before push selection', () => {
    const narrativePost = {
      type: 'player_milestone' as const,
      semanticKey: 'player_milestone:p1:s2:m19:first_team_goal',
      clubId: 'club_soderfors',
      season: 2,
      matchday: 19,
      subject: { kind: 'player' as const, id: 'p1' },
      significance: 60,
    }
    const postKey = '["player_milestone","player_milestone:p1:s2:m19:first_team_goal",2,19]'
    const evaluation = evaluateAttention(
      gameFixture({
        currentMatchday: 19,
        eventLedger: [narrativePost],
        ledgerTold: { [postKey]: [{ surface: 'portal', season: 2, matchday: 19 }] },
      }),
      new Date('2026-09-04T10:00:00.000Z'),
      {
        narrativePushCopy: () => ({ title: 'Test', body: 'Test', voice: 'club' }),
      },
    )

    expect(evaluation.candidates.some(candidate => candidate.narrativePost)).toBe(false)
  })

  it('removes the preparation loop as soon as the lineup is confirmed', () => {
    const evaluation = evaluateAttention(
      gameFixture({ lineupConfirmedThisRound: true }),
      new Date('2026-09-04T10:00:00.000Z'),
    )

    expect(evaluation.candidates.some(candidate => candidate.category === 'match_preparation')).toBe(false)
  })

  it('does not invent candidates when no managed fixture or table state exists', () => {
    const evaluation = evaluateAttention(
      gameFixture({ fixtures: [], standings: [] }),
      new Date('2026-09-04T10:00:00.000Z'),
    )

    expect(evaluation.openLoops).toEqual([])
    expect(evaluation.candidates).toEqual([])
    expect(evaluation.badgeCount).toBe(0)
  })

  it('earns the permission prompt only after Granska and with a new open lineup', () => {
    const completed = {
      ...gameFixture().fixtures[0],
      id: 'fixture-completed',
      status: FixtureStatus.Completed,
    }
    const game = gameFixture({
      fixtures: [completed, ...gameFixture().fixtures],
      visitedScreensThisRound: ['review'],
    })

    expect(isNotificationPromptEligible(game)).toBe(true)
    expect(isNotificationPromptEligible({ ...game, visitedScreensThisRound: [] })).toBe(false)
    expect(isNotificationPromptEligible({ ...game, lineupConfirmedThisRound: true })).toBe(false)
  })
})
