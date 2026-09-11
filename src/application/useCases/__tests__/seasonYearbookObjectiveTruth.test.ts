import { describe, expect, it } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'
import type { BoardObjective } from '../../../domain/entities/Community'
import type { Fixture } from '../../../domain/entities/Fixture'
import { ClubExpectation, FixtureStatus, InboxItemType } from '../../../domain/enums'
import { calculateStandings } from '../../../domain/services/standingsService'
import {
  yearbookAssessmentVerdict,
  yearbookPlacementVerdictText,
} from '../../../domain/services/seasonSummaryService'

const MANAGED_ID = 'club_forsbacka'

const TOP_SIX_OBJECTIVE: BoardObjective = {
  id: 'topHalf',
  type: 'sporting',
  label: 'Sluta topp 6',
  description: 'Testfixture',
  ownerId: 'Test Supporter',
  ownerPersonality: 'supporter',
  targetValue: 6,
  currentValue: 8,
  startValue: 8,
  measureFn: 'topHalf',
  status: 'active',
  assignedSeason: 2025,
  successReward: 'Test Supporter: "Topp 6! Vi är på rätt väg."',
  failureConsequence: 'Test Supporter: "Under nedre halvan. Inte godkänt."',
  carryOver: false,
}

function gameAtPositionEight() {
  const game = createNewGame({ managerName: 'Test', clubId: MANAGED_ID, season: 2025, seed: 42 })
  const opponents = game.clubs.map(club => club.id).filter(id => id !== MANAGED_ID)
  const winners = opponents.slice(0, 7)
  const losers = opponents.slice(7)
  const fixtures: Fixture[] = winners.map((winnerId, index) => ({
    id: `yearbook_truth_${index}`,
    leagueId: game.league.id,
    season: game.currentSeason,
    roundNumber: 1,
    matchday: 1,
    homeClubId: winnerId,
    awayClubId: losers[index % losers.length],
    status: FixtureStatus.Completed,
    homeScore: 3,
    awayScore: 0,
    events: [],
  }))
  const standings = calculateStandings(game.league.teamIds, fixtures)

  return {
    ...game,
    clubs: game.clubs.map(club => club.id === MANAGED_ID
      ? { ...club, boardExpectation: ClubExpectation.MidTable }
      : club),
    seasonStartBoardExpectation: ClubExpectation.MidTable,
    fixtures,
    standings,
    boardObjectives: [TOP_SIX_OBJECTIVE],
  }
}

describe('seasonEndProcessor — årsboken läser samma topplistemål som portal och inkorg', () => {
  it('plats 8 fryses som misslyckat topp 6-mål och kan inte beskrivas som godkänt', () => {
    const result = handleSeasonEnd(gameAtPositionEight(), 1).game
    const summary = result.seasonSummaries.at(-1)!

    expect(summary.finalPosition).toBe(8)
    expect(summary.expectationVerdict).toBe('exceeded')
    expect(summary.placementObjectiveOutcome).toEqual({
      objectiveId: 'topHalf',
      label: 'Sluta topp 6',
      result: 'failed',
      ownerReaction: TOP_SIX_OBJECTIVE.failureConsequence,
    })
    expect(yearbookAssessmentVerdict(summary)).toBe('failed')
    expect(yearbookPlacementVerdictText(summary, 12)).toBe('Åttondeplatsen låg under målet.')
    expect(summary.narrativeSummary).toContain(TOP_SIX_OBJECTIVE.failureConsequence)
    expect(summary.narrativeSummary).not.toContain('överträffade')

    const inboxResult = result.inbox.find(item =>
      item.type === InboxItemType.BoardFeedback && item.id.startsWith('inbox_boardobj_end_topHalf_'),
    )
    expect(inboxResult?.title).toBe('Sluta topp 6 — misslyckat')
    expect(result.boardObjectiveHistory?.at(-1)).toMatchObject({
      season: 2025,
      objectiveId: 'topHalf',
      result: 'failed',
      label: 'Sluta topp 6',
    })
  })
})
