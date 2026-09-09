import { describe, expect, it } from 'vitest'
import { attentionApiUrl } from '../attentionApiBase'

describe('attentionApiUrl', () => {
  it('behaller relativ same-origin-adress lokalt', () => {
    expect(attentionApiUrl('/api/attention/run', '')).toBe('/api/attention/run')
  })

  it('kopplar separat driftbas utan dubbla snedstreck', () => {
    expect(attentionApiUrl(
      '/api/notifications/vapid-public-key',
      ' https://attention.example/ ',
    )).toBe('https://attention.example/api/notifications/vapid-public-key')
  })

  it('vagrar en vag utan API-grans', () => {
    expect(() => attentionApiUrl('/game/dashboard', '')).toThrow('/api/')
  })
})
