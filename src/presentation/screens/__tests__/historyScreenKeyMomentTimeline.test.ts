/**
 * c-hist1-klubbhistorik-berattelse (DOM 2026-09-03, Opus): Timeline-lite —
 * en tidigare säsongs storylines/keyMoments var helt osynliga i återblick,
 * bara narrativeSummary + managerSeason syntes. `keyMoments` fryses redan
 * per säsong (seasonSummaryService.ts) — testet täcker bara urval/sortering/
 * ikonval, ingen ny text.
 */
import { describe, it, expect } from 'vitest'
import 'react'
import { keyMomentTimelineForHistory } from '../HistoryScreen'
import type { SeasonSummary } from '../../../domain/entities/SeasonSummary'
import { ClubExpectation } from '../../../domain/enums'

function s(keyMoments: SeasonSummary['keyMoments']): SeasonSummary {
  return {
    id: 's_2026_club_a', season: 2026, clubId: 'club_a', clubName: 'Alfa',
    finalPosition: 6, points: 20, wins: 8, draws: 4, losses: 10,
    goalsFor: 80, goalsAgainst: 85, goalDifference: -5,
    playoffResult: null,
    boardExpectation: ClubExpectation.MidTable,
    metExpectation: true, expectationVerdict: 'met',
    topScorer: null, topAssister: null, topRated: null, mostImproved: null, youngPlayer: null,
    totalGoals: 80, totalAssists: 50, totalCornerGoals: 18, totalCleanSheets: 2,
    longestWinStreak: 3, longestLossStreak: 3, biggestWin: null, worstLoss: null,
    homeRecord: { wins: 5, draws: 2, losses: 4 },
    awayRecord: { wins: 3, draws: 2, losses: 6 },
    firstHalfPoints: 10, secondHalfPoints: 10, formTrend: 'stable',
    totalInjuries: 4, mostInjuredPlayer: null,
    startFinances: 0, endFinances: 0, financialChange: 0,
    keyMoments,
  } as SeasonSummary
}

describe('HistoryScreen — keyMomentTimelineForHistory', () => {
  it('saknar summary.keyMoments → tom lista, ingen krasch', () => {
    expect(keyMomentTimelineForHistory(s(undefined))).toEqual([])
  })

  it('sorterar kronologiskt efter round, oavsett lagringsordning', () => {
    const result = keyMomentTimelineForHistory(s([
      { round: 15, type: 'bigWin', headline: 'Sent på säsongen', body: '' },
      { round: 3, type: 'hatTrick', headline: 'Tidigt på säsongen', body: '' },
    ]))
    expect(result.map(m => m.headline)).toEqual(['Tidigt på säsongen', 'Sent på säsongen'])
  })

  it('kappar till högst 5 rader även om fler moment finns', () => {
    const moments: SeasonSummary['keyMoments'] = Array.from({ length: 7 }, (_, i) => ({
      round: i + 1, type: 'storyline' as const, headline: `Moment ${i + 1}`, body: '',
    }))
    expect(keyMomentTimelineForHistory(s(moments))).toHaveLength(5)
  })

  it('mappar ikon per typ, samma sju typer som SeasonSummaryScreen', () => {
    const result = keyMomentTimelineForHistory(s([
      { round: 1, type: 'derbyWin', headline: 'A', body: '' },
      { round: 2, type: 'derbyLoss', headline: 'B', body: '' },
      { round: 3, type: 'hatTrick', headline: 'C', body: '' },
      { round: 4, type: 'bigWin', headline: 'D', body: '' },
      { round: 5, type: 'bigLoss', headline: 'E', body: '' },
    ]))
    expect(result.map(m => m.icon)).toEqual(['🔥', '😶', '🎩', '✅', '❌'])
  })

  it('headline kopieras ordagrant — genererar ingen egen text', () => {
    const result = keyMomentTimelineForHistory(s([
      { round: 1, type: 'storyline', headline: 'Exakt originaltext från seasonSummaryService', body: '' },
    ]))
    expect(result[0].headline).toBe('Exakt originaltext från seasonSummaryService')
  })
})
