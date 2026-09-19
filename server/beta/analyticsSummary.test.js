import { describe, expect, it } from 'vitest'
import { summarizeBetaAnalytics } from './analyticsSummary.js'

const NOW = new Date('2026-09-18T12:00:00Z')
const row = (installationId, event, daysAgo, payload = {}) => ({
  installationId, event, payload,
  recordedAt: new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString(),
})

describe('closed beta analytics summary', () => {
  it('counts installations, not repeated events, and only retained windows', () => {
    const summary = summarizeBetaAnalytics([
      row('a', 'install', 2), row('a', 'session_start', 2), row('a', 'session_start', 1),
      row('a', 'game_created', 2), row('a', 'first_match', 1),
      row('a', 'season_checkpoint', 1, { season: 2026, careerSeason: 1, milestone: 'five_league_matches' }),
      row('a', 'feature_opened', 1, { feature: 'scouting' }),
      row('a', 'feature_opened', 1, { feature: 'scouting' }),
      row('a', 'session_end', 1, { durationSeconds: 540 }),
      row('b', 'install', 40), row('b', 'session_start', 40),
      row('c', 'install', 91), row('c', 'session_start', 91),
    ], NOW)
    expect(summary.active7).toBe(1)
    expect(summary.active30).toBe(1)
    expect(summary.returnedOnAnotherDay7).toBe(1)
    expect(summary.funnel90.installed).toBe(2)
    expect(summary.funnel90.firstMatch).toBe(1)
    expect(summary.funnel90.firstSeasonFiveMatches).toBe(1)
    expect(summary.features90.scouting).toBe(1)
    expect(summary.session30).toEqual({ starts: 2, ends: 1, medianCompletedMinutes: 9 })
  })

  it('uses the midpoint of two completed sessions for an even-sized median', () => {
    const summary = summarizeBetaAnalytics([
      row('a', 'session_end', 1, { durationSeconds: 600 }),
      row('b', 'session_end', 1, { durationSeconds: 3_000 }),
    ], NOW)
    expect(summary.session30.medianCompletedMinutes).toBe(30)
  })
})
