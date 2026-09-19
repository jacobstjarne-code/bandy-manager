import { describe, expect, it } from 'vitest'
import { validAnalyticsEvent } from './routes.js'

describe('analytics payload contract', () => {
  it('accepts the seven specified lifecycle shapes', () => {
    expect(validAnalyticsEvent('install', { appVersion: 'abc1234', platform: 'ios', locale: 'sv-SE' })).toBe(true)
    expect(validAnalyticsEvent('game_created', { club: 'slottsbron', difficulty: 'hard' })).toBe(true)
    expect(validAnalyticsEvent('onboarding_done', {})).toBe(true)
    expect(validAnalyticsEvent('first_match', {})).toBe(true)
    expect(validAnalyticsEvent('season_completed', { season: 2026, careerSeason: 1, placement: 5 })).toBe(true)
    expect(validAnalyticsEvent('game_over', { reason: 'dismissed', seasonsSurvived: 3 })).toBe(true)
    expect(validAnalyticsEvent('session_start', { sessionId: 'session-12345' })).toBe(true)
    expect(validAnalyticsEvent('session_end', { sessionId: 'session-12345', durationSeconds: 83 })).toBe(true)
  })

  it('rejects unknown events, free text and extra payload fields', () => {
    expect(validAnalyticsEvent('button_clicked', {})).toBe(false)
    expect(validAnalyticsEvent('first_match', { playerName: 'Erik' })).toBe(false)
    expect(validAnalyticsEvent('game_created', {
      club: 'slottsbron', difficulty: 'hard', managerName: 'Jacob',
    })).toBe(false)
    expect(validAnalyticsEvent('session_end', {
      sessionId: 'session-12345', durationSeconds: 90_000,
    })).toBe(false)
  })

  it('accepts only fixed beta milestone, feature and issue codes', () => {
    expect(validAnalyticsEvent('season_checkpoint', { season: 2026, careerSeason: 1, milestone: 'five_league_matches' })).toBe(true)
    expect(validAnalyticsEvent('feature_opened', { feature: 'scouting' })).toBe(true)
    expect(validAnalyticsEvent('client_issue', { kind: 'render_error', appVersion: 'abc1234', route: '/game/squad' })).toBe(true)
    expect(validAnalyticsEvent('feature_opened', { feature: 'other' })).toBe(false)
    expect(validAnalyticsEvent('client_issue', { kind: 'render_error', appVersion: 'abc1234', route: '/game/squad?name=Erik' })).toBe(false)
  })
})
