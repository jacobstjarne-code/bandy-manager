import { describe, expect, it } from 'vitest'
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
