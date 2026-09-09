import webpush from 'web-push'
import { describe, expect, it, vi } from 'vitest'
import { createAttentionDispatcher, isQuietHours } from './dispatcher.js'

const DEFAULT_QUIET = { startHour: 21, startMinute: 30, endHour: 8, endMinute: 0 }

describe('isQuietHours — stickiness-settings-kategorier (2026-09-07)', () => {
  it('default fönster (21.30-08.00, spänner midnatt): mitt i natten är tyst', () => {
    expect(isQuietHours(new Date('2026-09-05T23:00:00Z'), 'UTC', DEFAULT_QUIET)).toBe(true)
    expect(isQuietHours(new Date('2026-09-05T02:00:00Z'), 'UTC', DEFAULT_QUIET)).toBe(true)
  })

  it('default fönster: mitt på dagen är INTE tyst', () => {
    expect(isQuietHours(new Date('2026-09-05T14:00:00Z'), 'UTC', DEFAULT_QUIET)).toBe(false)
  })

  it('exakt på gränserna — start inklusive, slut exklusive', () => {
    expect(isQuietHours(new Date('2026-09-05T21:30:00Z'), 'UTC', DEFAULT_QUIET)).toBe(true)
    expect(isQuietHours(new Date('2026-09-05T08:00:00Z'), 'UTC', DEFAULT_QUIET)).toBe(false)
    expect(isQuietHours(new Date('2026-09-05T07:59:00Z'), 'UTC', DEFAULT_QUIET)).toBe(true)
  })

  it('anpassat fönster som INTE spänner midnatt (start < slut)', () => {
    const daytime = { startHour: 8, startMinute: 0, endHour: 21, endMinute: 30 }
    expect(isQuietHours(new Date('2026-09-05T14:00:00Z'), 'UTC', daytime)).toBe(true)
    expect(isQuietHours(new Date('2026-09-05T23:00:00Z'), 'UTC', daytime)).toBe(false)
  })

  it('saknad quietHours-parameter faller tillbaka till default', () => {
    expect(isQuietHours(new Date('2026-09-05T23:00:00Z'), 'UTC')).toBe(true)
  })

  it('respekterar timeZone — samma UTC-tidpunkt, olika lokal tid', () => {
    // 22:00 UTC = 00:00 i Stockholm (sommartid UTC+2) — mitt i tysta timmar.
    const utcTime = new Date('2026-09-05T22:00:00Z')
    expect(isQuietHours(utcTime, 'Europe/Stockholm', DEFAULT_QUIET)).toBe(true)
  })
})

describe('Attention-produktflagga', () => {
  it('haller leveransen avstangd trots giltiga VAPID-nycklar', async () => {
    const keys = webpush.generateVAPIDKeys()
    const store = { listDispatchable: vi.fn() }
    const dispatcher = createAttentionDispatcher({
      store,
      env: {
        VAPID_SUBJECT: 'mailto:test@example.com',
        VAPID_PUBLIC_KEY: keys.publicKey,
        VAPID_PRIVATE_KEY: keys.privateKey,
        ATTENTION_PUSH_ENABLED: 'false',
      },
    })

    expect(dispatcher.configured).toBe(true)
    expect(dispatcher.enabled).toBe(false)
    expect(dispatcher.publicKey).toBeNull()
    await expect(dispatcher.dispatchDue()).resolves.toEqual({
      configured: true,
      enabled: false,
      attempted: 0,
      delivered: 0,
      skipped: 0,
    })
    expect(store.listDispatchable).not.toHaveBeenCalled()
  })
})
