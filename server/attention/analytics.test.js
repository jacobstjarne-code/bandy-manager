import { describe, expect, it } from 'vitest'
import { validAnalyticsEvent } from './routes.js'

describe('analytics payload contract', () => {
  it('accepts the seven specified lifecycle shapes', () => {
    expect(validAnalyticsEvent('install', { appVersion: 'abc1234', platform: 'ios', locale: 'sv-SE' })).toBe(true)
    expect(validAnalyticsEvent('game_created', { club: 'slottsbron', difficulty: 'hard' })).toBe(true)
    expect(validAnalyticsEvent('onboarding_done', {})).toBe(true)
    expect(validAnalyticsEvent('first_match', {})).toBe(true)
    expect(validAnalyticsEvent('season_completed', { season: 2, placement: 5 })).toBe(true)
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
})
