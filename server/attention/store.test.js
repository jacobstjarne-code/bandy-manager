import { afterEach, describe, expect, it, vi } from 'vitest'
import { createHash } from 'node:crypto'
import { InMemoryAttentionStore } from './store.js'

function snapshot(stateVersion, candidates) {
  return {
    schemaVersion: 1,
    installationId: 'installation-123',
    saveId: 'save-12345',
    capturedAt: '2026-09-04T10:00:00.000Z',
    evaluatedAt: '2026-09-04T10:00:00.000Z',
    timeZone: 'Europe/Stockholm',
    stateVersion,
    openLoops: [],
    candidates,
    badgeCount: candidates.length,
  }
}

function candidate(overrides = {}) {
  return {
    id: 'candidate-123',
    dedupeKey: 'match_preparation:fixture-1',
    category: 'match_preparation',
    importance: 'normal',
    stateVersion: 'state-1',
    availableAfter: '2026-09-05T04:00:00.000Z',
    expiresAt: '2026-09-11T10:00:00.000Z',
    score: 68,
    ...overrides,
  }
}

describe('InMemoryAttentionStore', () => {
  afterEach(() => vi.useRealTimers())

  it('rejects a second client that does not know the installation token', () => {
    const store = new InMemoryAttentionStore()
    expect(store.ensureInstallation('installation-123', 'secret-one')).not.toBeNull()
    expect(store.ensureInstallation('installation-123', 'secret-two')).toBeNull()
  })

  it('preserves the first due time while revalidating copy and state version', () => {
    const store = new InMemoryAttentionStore()
    store.setSubscription('installation-123', 'secret-one', { endpoint: 'https://push.test' })
    store.setSnapshot('installation-123', 'secret-one', snapshot('state-1', [candidate()]))
    store.setSnapshot('installation-123', 'secret-one', snapshot('state-2', [candidate({
      id: 'candidate-456',
      stateVersion: 'state-2',
      title: 'Ny verifierad copy',
      availableAfter: '2026-09-06T04:00:00.000Z',
    })]))

    const due = store.listDispatchable(new Date('2026-09-05T05:00:00.000Z'))
    expect(due).toHaveLength(1)
    expect(due[0].candidate.stateVersion).toBe('state-2')
    expect(due[0].candidate.title).toBe('Ny verifierad copy')
    expect(due[0].candidate.availableAfter).toBe('2026-09-05T04:00:00.000Z')
  })

  it('removes a candidate when the newest snapshot resolves its open loop', () => {
    const store = new InMemoryAttentionStore()
    store.setSubscription('installation-123', 'secret-one', { endpoint: 'https://push.test' })
    store.setSnapshot('installation-123', 'secret-one', snapshot('state-1', [candidate()]))
    store.setSnapshot('installation-123', 'secret-one', snapshot('state-2', []))

    expect(store.listDispatchable(new Date('2026-09-05T05:00:00.000Z'))).toEqual([])
  })

  it('deletes the full installation state when notifications are disabled', () => {
    const store = new InMemoryAttentionStore()
    store.setSubscription('installation-123', 'secret-one', { endpoint: 'https://push.test' })
    store.setSnapshot('installation-123', 'secret-one', snapshot('state-1', [candidate()]))
    store.registerDelivery({
      id: 'delivery-123',
      installationId: 'installation-123',
      tokenHash: createHash('sha256').update('delivery-token').digest(),
    })

    expect(store.authenticateDelivery('delivery-123', 'delivery-token')).toBe(true)
    expect(store.removeSubscription('installation-123', 'secret-one')).toBe(true)
    expect(store.authenticateInstallation('installation-123', 'secret-one')).toBe(false)
    expect(store.listDispatchable(new Date('2026-09-05T05:00:00.000Z'))).toEqual([])
    expect(store.authenticateDelivery('delivery-123', 'delivery-token')).toBe(false)
  })

  it('deletes the full state after 90 days of inactivity but keeps the boundary and active installations', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'))
    const store = new InMemoryAttentionStore()
    store.setSubscription('installation-old', 'secret-old', { endpoint: 'https://push.test/old' })
    store.registerDelivery({
      id: 'delivery-old',
      installationId: 'installation-old',
      tokenHash: createHash('sha256').update('delivery-token').digest(),
    })
    store.recordAnalyticsEvent({ installationId: 'installation-old', event: 'install', payload: {} })

    vi.setSystemTime(new Date('2026-06-02T00:00:00.000Z'))
    store.ensureInstallation('installation-boundary', 'secret-boundary')
    store.ensureInstallation('installation-active', 'secret-active')
    vi.setSystemTime(new Date('2026-08-31T00:00:00.000Z'))
    store.recordEvent({ type: 'app_opened', installationId: 'installation-active' })

    expect(store.pruneInactiveInstallations(new Date('2026-06-02T00:00:00.000Z'))).toBe(1)
    expect(store.authenticateInstallation('installation-old', 'secret-old')).toBe(false)
    expect(store.authenticateDelivery('delivery-old', 'delivery-token')).toBe(false)
    expect(store.listAnalyticsEvents('installation-old')).toEqual([])
    expect(store.authenticateInstallation('installation-boundary', 'secret-boundary')).toBe(true)
    expect(store.authenticateInstallation('installation-active', 'secret-active')).toBe(true)
  })

  it('exposes a narrative receipt only after confirmed delivery and acknowledges it', () => {
    const store = new InMemoryAttentionStore()
    store.ensureInstallation('installation-123', 'secret-one')
    store.registerDelivery({
      id: 'delivery-456',
      installationId: 'installation-123',
      saveId: 'save-12345',
      narrativePost: {
        post: { type: 'player_milestone', semanticKey: 'player:p1:s2:m4', season: 2, matchday: 4 },
        chronology: { season: 2, matchday: 7 },
      },
      tokenHash: createHash('sha256').update('delivery-token').digest(),
    })

    expect(store.listNarrativeDeliveryReceipts('installation-123')).toEqual([])
    store.markDelivered(
      'installation-123',
      'narrative_return:player:p1:s2:m4',
      new Date('2026-09-05T09:00:00.000Z'),
      'delivery-456',
    )
    expect(store.listNarrativeDeliveryReceipts('installation-123')).toEqual([{
      deliveryId: 'delivery-456',
      saveId: 'save-12345',
      deliveredAt: '2026-09-05T09:00:00.000Z',
      narrativePost: {
        post: { type: 'player_milestone', semanticKey: 'player:p1:s2:m4', season: 2, matchday: 4 },
        chronology: { season: 2, matchday: 7 },
      },
    }])

    expect(store.acknowledgeNarrativeDeliveryReceipts('installation-123', ['delivery-456'])).toBe(1)
    expect(store.listNarrativeDeliveryReceipts('installation-123')).toEqual([])
  })

  it('attributes delivery events to the owning installation and learns category affinity', () => {
    const store = new InMemoryAttentionStore()
    store.ensureInstallation('installation-123', 'secret-one')
    store.registerDelivery({
      id: 'delivery-positive',
      installationId: 'installation-123',
      category: 'narrative_return',
      tokenHash: createHash('sha256').update('delivery-token').digest(),
    })
    store.markDelivered(
      'installation-123',
      'narrative_return:story-1',
      new Date('2026-09-01T09:00:00.000Z'),
      'delivery-positive',
    )
    store.recordEvent(
      { type: 'notification_opened', deliveryId: 'delivery-positive' },
      new Date('2026-09-01T09:05:00.000Z'),
    )

    expect(store.deliveryBelongsToInstallation('delivery-positive', 'installation-123')).toBe(true)
    expect(store.deliveryBelongsToInstallation('delivery-positive', 'installation-other')).toBe(false)
    expect(store.responseProfile('installation-123', new Date('2026-09-03T09:00:00.000Z'))).toMatchObject({
      consecutiveIgnored: 0,
      categoryAffinity: { narrative_return: 8 },
      backoffUntil: null,
    })
  })

  it('counts an unlinked app open within six hours as implicit positive response', () => {
    const store = new InMemoryAttentionStore()
    store.ensureInstallation('installation-123', 'secret-one')
    store.registerDelivery({
      id: 'delivery-implicit',
      installationId: 'installation-123',
      category: 'season_context',
      tokenHash: createHash('sha256').update('delivery-token').digest(),
    })
    store.markDelivered(
      'installation-123',
      'season_context:story-1',
      new Date('2026-09-01T09:00:00.000Z'),
      'delivery-implicit',
    )
    store.recordEvent(
      { type: 'app_opened', installationId: 'installation-123' },
      new Date('2026-09-01T14:59:00.000Z'),
    )

    expect(store.responseProfile('installation-123', new Date('2026-09-02T10:00:00.000Z'))).toMatchObject({
      consecutiveIgnored: 0,
      categoryAffinity: { season_context: 8 },
    })
  })

  it('backs off after two ignored deliveries but lets a major candidate through', () => {
    const store = new InMemoryAttentionStore()
    store.setSubscription('installation-123', 'secret-one', { endpoint: 'https://push.test' })
    for (const [id, deliveredAt] of [
      ['delivery-ignore-1', '2026-09-01T09:00:00.000Z'],
      ['delivery-ignore-2', '2026-09-02T09:00:00.000Z'],
    ]) {
      store.registerDelivery({
        id,
        installationId: 'installation-123',
        category: 'match_preparation',
        tokenHash: createHash('sha256').update(`${id}-token`).digest(),
      })
      store.markDelivered(
        'installation-123',
        `old:${id}`,
        new Date(deliveredAt),
        id,
      )
    }
    store.setSnapshot('installation-123', 'secret-one', snapshot('state-1', [candidate({
      id: 'candidate-normal',
      dedupeKey: 'match_preparation:new-normal',
      availableAfter: '2026-09-03T08:00:00.000Z',
    })]))

    const now = new Date('2026-09-03T10:00:00.000Z')
    expect(store.responseProfile('installation-123', now)).toMatchObject({
      consecutiveIgnored: 2,
      categoryAffinity: { match_preparation: -24 },
      backoffUntil: '2026-09-05T09:00:00.000Z',
    })
    expect(store.listDispatchable(now)).toEqual([])

    store.setSnapshot('installation-123', 'secret-one', snapshot('state-2', [candidate({
      id: 'candidate-major',
      dedupeKey: 'narrative_return:new-major',
      category: 'narrative_return',
      importance: 'major',
      stateVersion: 'state-2',
      availableAfter: '2026-09-03T08:00:00.000Z',
    })]))
    expect(store.listDispatchable(now)[0]?.candidate.id).toBe('candidate-major')
  })
})

// stickiness-settings-kategorier (2026-09-07)
describe('InMemoryAttentionStore — notification preferences', () => {
  it('getPreferences falls back to defaults for an unknown/unset installation', () => {
    const store = new InMemoryAttentionStore()
    expect(store.getPreferences('never-registered')).toMatchObject({
      categories: { match_preparation: true, calendar_anchor: false },
    })
  })

  it('setPreferences rejects a mismatched token, same as any other write', () => {
    const store = new InMemoryAttentionStore()
    store.ensureInstallation('installation-123', 'secret-one')
    expect(store.setPreferences('installation-123', 'wrong-token', { categories: {}, quietHours: {} })).toBe(false)
  })

  it('setPreferences persists and getPreferences reflects it back', () => {
    const store = new InMemoryAttentionStore()
    const prefs = {
      categories: { match_preparation: true, narrative_return: false, calendar_anchor: true, season_context: false },
      quietHours: { startHour: 22, startMinute: 0, endHour: 7, endMinute: 0 },
    }
    expect(store.setPreferences('installation-123', 'secret-one', prefs)).toBe(true)
    expect(store.getPreferences('installation-123')).toEqual(prefs)
  })

  it('setPreferences works before setSubscription — preferences can be set before push is enabled', () => {
    const store = new InMemoryAttentionStore()
    const prefs = {
      categories: { match_preparation: false, narrative_return: true, calendar_anchor: false, season_context: false },
      quietHours: { startHour: 21, startMinute: 30, endHour: 8, endMinute: 0 },
    }
    expect(store.setPreferences('installation-new', 'secret-two', prefs)).toBe(true)
    expect(store.getPreferences('installation-new')).toEqual(prefs)
  })

  it('preserves analytics opt-out when an older client writes only push preferences', () => {
    const store = new InMemoryAttentionStore()
    store.setPreferences('installation-123', 'secret-one', {
      analytics: false,
      categories: { match_preparation: true, narrative_return: true, calendar_anchor: false, season_context: false },
      quietHours: { startHour: 21, startMinute: 30, endHour: 8, endMinute: 0 },
    })
    store.setPreferences('installation-123', 'secret-one', {
      categories: { match_preparation: false, narrative_return: true, calendar_anchor: false, season_context: false },
      quietHours: { startHour: 22, startMinute: 0, endHour: 7, endMinute: 0 },
    })
    expect(store.getPreferences('installation-123').analytics).toBe(false)
  })

  it('listDispatchable filters out a candidate whose category is turned off', () => {
    const store = new InMemoryAttentionStore()
    store.setSubscription('installation-123', 'secret-one', { endpoint: 'https://push.test' })
    store.setPreferences('installation-123', 'secret-one', {
      categories: { match_preparation: false, narrative_return: true, calendar_anchor: false, season_context: false },
      quietHours: { startHour: 21, startMinute: 30, endHour: 8, endMinute: 0 },
    })
    store.setSnapshot('installation-123', 'secret-one', snapshot('state-1', [candidate({ category: 'match_preparation' })]))
    expect(store.listDispatchable(new Date('2026-09-05T05:00:00.000Z'))).toEqual([])
  })

  it('listDispatchable still delivers a candidate whose category is on', () => {
    const store = new InMemoryAttentionStore()
    store.setSubscription('installation-123', 'secret-one', { endpoint: 'https://push.test' })
    store.setPreferences('installation-123', 'secret-one', {
      categories: { match_preparation: true, narrative_return: false, calendar_anchor: false, season_context: false },
      quietHours: { startHour: 21, startMinute: 30, endHour: 8, endMinute: 0 },
    })
    store.setSnapshot('installation-123', 'secret-one', snapshot('state-1', [candidate({ category: 'match_preparation' })]))
    expect(store.listDispatchable(new Date('2026-09-05T05:00:00.000Z'))).toHaveLength(1)
  })
})

describe('InMemoryAttentionStore — analytics isolation and retention', () => {
  it('stores analytics separately and refuses it after opt-out', () => {
    const store = new InMemoryAttentionStore()
    store.ensureInstallation('installation-123', 'secret-one')

    expect(store.recordAnalyticsEvent({
      installationId: 'installation-123', event: 'first_match', payload: {},
    }, new Date('2026-06-01T10:00:00.000Z'))).toBe(true)
    store.setPreferences('installation-123', 'secret-one', {
      ...store.getPreferences('installation-123'), analytics: false,
    })
    expect(store.recordAnalyticsEvent({
      installationId: 'installation-123', event: 'season_completed', payload: { season: 1, placement: 4 },
    })).toBe(false)
    expect(store.listAnalyticsEvents('installation-123').map(event => event.event)).toEqual(['first_match'])
  })

  it('prunes only analytics older than the retention boundary', () => {
    const store = new InMemoryAttentionStore()
    store.ensureInstallation('installation-123', 'secret-one')
    store.recordAnalyticsEvent(
      { installationId: 'installation-123', event: 'install', payload: {} },
      new Date('2026-06-01T10:00:00.000Z'),
    )
    store.recordAnalyticsEvent(
      { installationId: 'installation-123', event: 'first_match', payload: {} },
      new Date('2026-09-01T10:00:00.000Z'),
    )

    expect(store.pruneAnalyticsEvents(new Date('2026-08-01T00:00:00.000Z'))).toBe(1)
    expect(store.listAnalyticsEvents('installation-123').map(event => event.event)).toEqual(['first_match'])
  })
})
