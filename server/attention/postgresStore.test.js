import { createHash } from 'node:crypto'
import { newDb } from 'pg-mem'
import { beforeEach, describe, expect, it } from 'vitest'
import { PostgresAttentionStore } from './postgresStore.js'

const INSTALLATION_ID = 'installation-123'
const TOKEN = 'secret-one'

function snapshot(stateVersion, candidates) {
  return {
    schemaVersion: 1,
    installationId: INSTALLATION_ID,
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
    title: 'Laget väntar',
    body: 'Ta ut laget före nästa match.',
    deepLink: '/game/squad',
    ...overrides,
  }
}

describe('PostgresAttentionStore', () => {
  let pool
  let store

  beforeEach(async () => {
    const memoryDb = newDb({ autoCreateForeignKeyIndices: true })
    const adapter = memoryDb.adapters.createPg()
    pool = new adapter.Pool()
    store = new PostgresAttentionStore(pool)
    await store.initialize()
  })

  it('behåller subscription, snapshot och kandidat över en ny store-instans', async () => {
    await store.setSubscription(INSTALLATION_ID, TOKEN, {
      endpoint: 'https://push.test', keys: { p256dh: 'key', auth: 'auth' },
    })
    await store.setSnapshot(INSTALLATION_ID, TOKEN, snapshot('state-1', [candidate()]))

    const afterRestart = new PostgresAttentionStore(pool)
    const due = await afterRestart.listDispatchable(new Date('2026-09-05T05:00:00.000Z'))

    expect(due).toHaveLength(1)
    expect(due[0].installation.subscription.endpoint).toBe('https://push.test')
    expect(due[0].candidate.id).toBe('candidate-123')
  })

  it('bevarar första availableAfter när samma öppna loop synkas på nytt', async () => {
    await store.setSubscription(INSTALLATION_ID, TOKEN, { endpoint: 'https://push.test' })
    await store.setSnapshot(INSTALLATION_ID, TOKEN, snapshot('state-1', [candidate()]))
    await store.setSnapshot(INSTALLATION_ID, TOKEN, snapshot('state-2', [candidate({
      id: 'candidate-456',
      stateVersion: 'state-2',
      title: 'Ny sann copy',
      availableAfter: '2026-09-06T04:00:00.000Z',
    })]))

    const due = await store.listDispatchable(new Date('2026-09-05T05:00:00.000Z'))
    expect(due[0].candidate).toMatchObject({
      id: 'candidate-456',
      title: 'Ny sann copy',
      availableAfter: '2026-09-05T04:00:00.000Z',
    })
  })

  it('markerar levererad dedupe durabelt och återutsänder den inte', async () => {
    await store.setSubscription(INSTALLATION_ID, TOKEN, { endpoint: 'https://push.test' })
    await store.setSnapshot(INSTALLATION_ID, TOKEN, snapshot('state-1', [candidate()]))
    await store.registerDelivery({
      id: 'delivery-123',
      installationId: INSTALLATION_ID,
      candidateId: 'candidate-123',
      saveId: 'save-12345',
      category: 'match_preparation',
      importance: 'normal',
      tokenHash: createHash('sha256').update('delivery-token').digest(),
      createdAt: '2026-09-05T05:00:00.000Z',
    })
    await store.markDelivered(
      INSTALLATION_ID,
      'match_preparation:fixture-1',
      new Date('2026-09-05T05:00:00.000Z'),
      'delivery-123',
    )

    const afterRestart = new PostgresAttentionStore(pool)
    expect(await afterRestart.listDispatchable(new Date('2026-09-05T06:00:00.000Z'))).toEqual([])
    expect(await afterRestart.authenticateDelivery('delivery-123', 'delivery-token')).toBe(true)
  })

  it('raderar hela installationens lagrade state vid uttrycklig avregistrering', async () => {
    await store.setSubscription(INSTALLATION_ID, TOKEN, { endpoint: 'https://push.test' })
    await store.setSnapshot(INSTALLATION_ID, TOKEN, snapshot('state-1', [candidate()]))
    await store.recordAnalyticsEvent({
      installationId: INSTALLATION_ID, event: 'first_match', payload: {},
    })

    expect(await store.removeSubscription(INSTALLATION_ID, TOKEN)).toBe(true)
    expect(await store.authenticateInstallation(INSTALLATION_ID, TOKEN)).toBe(false)
    expect(await store.listDispatchable(new Date('2026-09-05T05:00:00.000Z'))).toEqual([])
    expect((await pool.query('SELECT * FROM analytics_events')).rows).toEqual([])
  })

  it('keeps analytics out of attention_events, respects opt-out and prunes at 90-day boundary', async () => {
    await store.ensureInstallation(INSTALLATION_ID, TOKEN)
    expect(await store.recordAnalyticsEvent({
      installationId: INSTALLATION_ID,
      event: 'game_created',
      payload: { club: 'slottsbron', difficulty: 'hard' },
    }, new Date('2026-06-01T10:00:00.000Z'))).toBe(true)

    expect((await pool.query('SELECT * FROM attention_events')).rows).toEqual([])
    expect((await pool.query('SELECT event, payload FROM analytics_events')).rows).toEqual([{
      event: 'game_created', payload: { club: 'slottsbron', difficulty: 'hard' },
    }])

    await store.setPreferences(INSTALLATION_ID, TOKEN, {
      analytics: false,
      categories: { match_preparation: true, narrative_return: true, calendar_anchor: false, season_context: false },
      quietHours: { startHour: 21, startMinute: 30, endHour: 8, endMinute: 0 },
    })
    expect(await store.recordAnalyticsEvent({
      installationId: INSTALLATION_ID, event: 'first_match', payload: {},
    })).toBe(false)
    expect(await store.pruneAnalyticsEvents(new Date('2026-08-01T00:00:00.000Z'))).toBe(1)
    expect((await pool.query('SELECT * FROM analytics_events')).rows).toEqual([])
  })
})
