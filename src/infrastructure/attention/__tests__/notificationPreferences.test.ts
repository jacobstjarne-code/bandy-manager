/**
 * stickiness-settings-kategorier (2026-09-07): local-first läs/skriv för
 * kategori-/tystatimmar-inställningarna. Nätverket mockas — testerna
 * verifierar det synkrona, garanterade beteendet (localStorage), inte
 * server-roundtripen (den täcks av server/attention/store.test.js).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getNotificationPreferences,
  setNotificationPreferences,
} from '../attentionClient'
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../../../domain/attention/types'

// Samma localStorage-mockmönster som saveGameStorage.test.ts — jsdoms
// inbyggda localStorage krockar med Node ≥22:s egna --localstorage-file-
// globalvariabel, som saknar .clear().
function createLocalStorageMock() {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
}

const localStorageMock = createLocalStorageMock()

describe('getNotificationPreferences / setNotificationPreferences', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.stubGlobal('localStorage', localStorageMock)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }))
    vi.stubGlobal('crypto', {
      ...globalThis.crypto,
      randomUUID: () => 'installation-test',
      getRandomValues: (arr: Uint8Array) => arr.fill(1),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the mock-locked defaults when nothing is stored yet', () => {
    expect(getNotificationPreferences()).toEqual(DEFAULT_NOTIFICATION_PREFERENCES)
  })

  it('setNotificationPreferences writes to localStorage immediately, readable via getNotificationPreferences', async () => {
    const next = {
      categories: { match_preparation: false, narrative_return: true, calendar_anchor: true, season_context: false },
      quietHours: { startHour: 22, startMinute: 0, endHour: 7, endMinute: 30 },
    }
    await setNotificationPreferences(next)
    expect(getNotificationPreferences()).toEqual({ ...next, analytics: true })
  })

  it('falls back to defaults for corrupted localStorage content', () => {
    localStorage.setItem('bandy-attention-preferences-v1', '{not json')
    expect(getNotificationPreferences()).toEqual(DEFAULT_NOTIFICATION_PREFERENCES)
  })

  it('best-effort syncs to the server (PUT to the preferences endpoint)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 })
    vi.stubGlobal('fetch', fetchMock)
    await setNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/notifications\/installations\/.+\/preferences/),
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('does not undo an analytics opt-out when a caller changes only push fields', async () => {
    localStorage.setItem('bandy-attention-preferences-v1', JSON.stringify({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      analytics: false,
    }))
    const pushOnly = {
      categories: { ...DEFAULT_NOTIFICATION_PREFERENCES.categories, match_preparation: false },
      quietHours: DEFAULT_NOTIFICATION_PREFERENCES.quietHours,
    }
    await setNotificationPreferences(pushOnly)
    expect(getNotificationPreferences().analytics).toBe(false)
    const body = JSON.parse(String((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body))
    expect(body.analytics).toBe(false)
  })
})
