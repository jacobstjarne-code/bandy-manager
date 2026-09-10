import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { initializeAnalyticsBaseline, syncGameAnalytics } from '../analyticsLifecycle'

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

function analyticsBodies(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls
    .filter(([url]) => String(url).endsWith('/api/analytics-events'))
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)))
}

describe('analyticsLifecycle', () => {
  const localStorageMock = createLocalStorageMock()

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

  afterEach(() => vi.unstubAllGlobals())

  it('emits each durable game milestone once even when the same state is observed repeatedly', async () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_slottsbron', seed: 42 })
    game.onboardingComplete = true
    game.lastCompletedFixtureId = 'fixture-completed'
    game.seasonSummaries = [{ season: 1, finalPosition: 6 } as typeof game.seasonSummaries[number]]
    game.managerFired = true
    game.firedReason = 'licenseDenied'

    syncGameAnalytics(game)
    syncGameAnalytics(game)
    const fetchMock = vi.mocked(fetch)
    await vi.waitFor(() => expect(analyticsBodies(fetchMock)).toHaveLength(5))

    expect(analyticsBodies(fetchMock).map(body => body.event).sort()).toEqual([
      'first_match', 'game_created', 'game_over', 'onboarding_done', 'season_completed',
    ])
    expect(analyticsBodies(fetchMock).find(body => body.event === 'game_over')?.payload).toEqual({
      reason: 'license', seasonsSurvived: 1,
    })
  })

  it('sends nothing while analytics is opted out and marks current milestones as non-retroactive', async () => {
    localStorage.setItem('bandy-attention-preferences-v1', JSON.stringify({
      analytics: false,
      categories: { match_preparation: true, narrative_return: true, calendar_anchor: false, season_context: false },
      quietHours: { startHour: 21, startMinute: 30, endHour: 8, endMinute: 0 },
    }))
    const game = createNewGame({ managerName: 'Test', clubId: 'club_slottsbron', seed: 43 })
    syncGameAnalytics(game)
    await Promise.resolve()
    expect(analyticsBodies(vi.mocked(fetch))).toEqual([])
  })

  it('baselines an existing career instead of reporting old milestones as if they happened today', async () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_slottsbron', seed: 44 })
    game.onboardingComplete = true
    game.lastCompletedFixtureId = 'old-fixture'
    game.seasonSummaries = [{ season: 1, finalPosition: 6 } as typeof game.seasonSummaries[number]]

    initializeAnalyticsBaseline(game)
    syncGameAnalytics(game)
    await Promise.resolve()
    expect(analyticsBodies(vi.mocked(fetch))).toEqual([])

    game.seasonSummaries = [
      ...game.seasonSummaries,
      { season: 2, finalPosition: 4 } as typeof game.seasonSummaries[number],
    ]
    syncGameAnalytics(game)
    await vi.waitFor(() => expect(analyticsBodies(vi.mocked(fetch))).toHaveLength(1))
    expect(analyticsBodies(vi.mocked(fetch))[0]).toMatchObject({
      event: 'season_completed', payload: { season: 2, placement: 4 },
    })
  })
})
