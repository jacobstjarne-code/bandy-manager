import { Pool } from 'pg'
import {
  DEFAULT_PREFERENCES,
  buildResponseProfile,
  hashSecret,
  secretsMatch,
} from './store.js'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

const SCHEMA = `
CREATE TABLE IF NOT EXISTS attention_installations (
  id varchar(128) PRIMARY KEY,
  token_hash varchar(64) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  snapshot jsonb,
  subscription jsonb,
  preferences jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_snapshot_at timestamptz
);

CREATE TABLE IF NOT EXISTS attention_candidates (
  installation_id varchar(128) NOT NULL REFERENCES attention_installations(id) ON DELETE CASCADE,
  dedupe_key varchar(180) NOT NULL,
  payload jsonb NOT NULL,
  available_after timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  state_version varchar(240) NOT NULL,
  PRIMARY KEY (installation_id, dedupe_key)
);

CREATE INDEX IF NOT EXISTS attention_candidates_due_idx
  ON attention_candidates (available_after, expires_at);

CREATE TABLE IF NOT EXISTS attention_sent_dedupe (
  installation_id varchar(128) NOT NULL REFERENCES attention_installations(id) ON DELETE CASCADE,
  dedupe_key varchar(180) NOT NULL,
  delivered_at timestamptz NOT NULL,
  PRIMARY KEY (installation_id, dedupe_key)
);

CREATE TABLE IF NOT EXISTS attention_deliveries (
  id varchar(128) PRIMARY KEY,
  installation_id varchar(128) NOT NULL REFERENCES attention_installations(id) ON DELETE CASCADE,
  candidate_id varchar(512),
  save_id varchar(128),
  category varchar(80),
  importance varchar(32),
  narrative_post jsonb,
  token_hash varchar(64) NOT NULL,
  created_at timestamptz NOT NULL,
  delivered_at timestamptz,
  acknowledged_at timestamptz
);

CREATE INDEX IF NOT EXISTS attention_deliveries_installation_idx
  ON attention_deliveries (installation_id, delivered_at DESC);

CREATE TABLE IF NOT EXISTS attention_events (
  id bigserial PRIMARY KEY,
  installation_id varchar(128) REFERENCES attention_installations(id) ON DELETE CASCADE,
  delivery_id varchar(128) REFERENCES attention_deliveries(id) ON DELETE CASCADE,
  type varchar(80) NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS attention_events_installation_idx
  ON attention_events (installation_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS attention_events_delivery_idx
  ON attention_events (delivery_id);

CREATE TABLE IF NOT EXISTS analytics_events (
  id bigserial PRIMARY KEY,
  installation_id varchar(128) REFERENCES attention_installations(id) ON DELETE CASCADE,
  event varchar(80) NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_install_idx
  ON analytics_events (installation_id, recorded_at);
CREATE INDEX IF NOT EXISTS analytics_events_event_idx
  ON analytics_events (event, recorded_at);
`

function iso(value) {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function asObject(value, fallback = null) {
  if (value === null || value === undefined) return fallback
  return typeof value === 'string' ? JSON.parse(value) : value
}

function storedSecretMatches(token, expectedHex) {
  if (typeof expectedHex !== 'string' || !/^[0-9a-f]{64}$/.test(expectedHex)) return false
  return secretsMatch(token, Buffer.from(expectedHex, 'hex'))
}

function installationFromRow(row, deliveryTimes = []) {
  return {
    id: row.id,
    tokenHash: row.token_hash,
    metadata: asObject(row.metadata, {}),
    snapshot: asObject(row.snapshot),
    subscription: asObject(row.subscription),
    preferences: asObject(row.preferences),
    deliveryTimes,
    updatedAt: iso(row.updated_at),
  }
}

function deliveryFromRow(row) {
  return {
    id: row.id,
    installationId: row.installation_id,
    candidateId: row.candidate_id,
    saveId: row.save_id,
    category: row.category,
    importance: row.importance,
    narrativePost: asObject(row.narrative_post),
    deliveredAt: iso(row.delivered_at),
    acknowledgedAt: iso(row.acknowledged_at),
  }
}

function eventFromRow(row) {
  return {
    ...asObject(row.payload, {}),
    type: row.type,
    installationId: row.installation_id,
    deliveryId: row.delivery_id,
    recordedAt: iso(row.recorded_at),
  }
}

/**
 * Hållbar implementation av samma kontrakt som InMemoryAttentionStore.
 * Alla metoder är asynkrona; routes/dispatcher await:ar även referenslagringen.
 */
export class PostgresAttentionStore {
  constructor(pool) {
    this.pool = pool
  }

  async initialize() {
    await this.pool.query(SCHEMA)
  }

  async close() {
    await this.pool.end()
  }

  async #withTransaction(work) {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const result = await work(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async #ensureWith(client, installationId, token, metadata = {}) {
    if (!installationId || !token) return null
    const existing = await client.query(
      'SELECT * FROM attention_installations WHERE id = $1 FOR UPDATE',
      [installationId],
    )
    if (existing.rows[0]) {
      if (!storedSecretMatches(token, existing.rows[0].token_hash)) return null
      const mergedMetadata = {
        ...asObject(existing.rows[0].metadata, {}),
        ...metadata,
      }
      const updated = await client.query(
        `UPDATE attention_installations
         SET metadata = $2::jsonb, updated_at = now()
         WHERE id = $1 RETURNING *`,
        [installationId, JSON.stringify(mergedMetadata)],
      )
      return installationFromRow(updated.rows[0])
    }

    const inserted = await client.query(
      `INSERT INTO attention_installations (id, token_hash, metadata)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (id) DO NOTHING
       RETURNING *`,
      [installationId, hashSecret(token).toString('hex'), JSON.stringify(metadata)],
    )
    if (inserted.rows[0]) return installationFromRow(inserted.rows[0])

    // En samtidig första registrering vann konflikten. Läs dess token under lås.
    const raced = await client.query(
      'SELECT * FROM attention_installations WHERE id = $1 FOR UPDATE',
      [installationId],
    )
    return raced.rows[0] && storedSecretMatches(token, raced.rows[0].token_hash)
      ? installationFromRow(raced.rows[0])
      : null
  }

  async authenticateInstallation(installationId, token) {
    const result = await this.pool.query(
      'SELECT token_hash FROM attention_installations WHERE id = $1',
      [installationId],
    )
    return result.rows[0] ? storedSecretMatches(token, result.rows[0].token_hash) : false
  }

  async ensureInstallation(installationId, token, metadata = {}) {
    return this.#withTransaction(client => this.#ensureWith(client, installationId, token, metadata))
  }

  async setSubscription(installationId, token, subscription, metadata = {}) {
    return this.#withTransaction(async client => {
      const installation = await this.#ensureWith(client, installationId, token, metadata)
      if (!installation) return false
      await client.query(
        `UPDATE attention_installations
         SET subscription = $2::jsonb, updated_at = now()
         WHERE id = $1`,
        [installationId, JSON.stringify(subscription)],
      )
      return true
    })
  }

  async setPreferences(installationId, token, preferences) {
    return this.#withTransaction(async client => {
      const installation = await this.#ensureWith(client, installationId, token)
      if (!installation) return false
      // En gammal klient som bara känner push-fälten får aldrig råka
      // återaktivera en uttrycklig analytics-opt-out genom att ersätta jsonb.
      const mergedPreferences = { ...(installation.preferences ?? {}), ...preferences }
      await client.query(
        `UPDATE attention_installations
         SET preferences = $2::jsonb, updated_at = now()
         WHERE id = $1`,
        [installationId, JSON.stringify(mergedPreferences)],
      )
      return true
    })
  }

  async getPreferences(installationId) {
    const result = await this.pool.query(
      'SELECT preferences FROM attention_installations WHERE id = $1',
      [installationId],
    )
    return asObject(result.rows[0]?.preferences) ?? DEFAULT_PREFERENCES
  }

  async removeSubscription(installationId, token) {
    return this.#withTransaction(async client => {
      const result = await client.query(
        'SELECT token_hash FROM attention_installations WHERE id = $1 FOR UPDATE',
        [installationId],
      )
      if (!result.rows[0] || !storedSecretMatches(token, result.rows[0].token_hash)) return false
      // ON DELETE CASCADE verkställer kontraktet: hela installationens serverstate.
      await client.query('DELETE FROM attention_installations WHERE id = $1', [installationId])
      return true
    })
  }

  async setSnapshot(installationId, token, snapshot) {
    return this.#withTransaction(async client => {
      const installation = await this.#ensureWith(client, installationId, token, {
        timeZone: snapshot.timeZone,
      })
      if (!installation) return false

      const previous = await client.query(
        `SELECT dedupe_key, available_after
         FROM attention_candidates WHERE installation_id = $1`,
        [installationId],
      )
      const firstDueByKey = new Map(previous.rows.map(row => [row.dedupe_key, iso(row.available_after)]))

      await client.query(
        `UPDATE attention_installations
         SET snapshot = $2::jsonb, last_snapshot_at = now(), updated_at = now()
         WHERE id = $1`,
        [installationId, JSON.stringify(snapshot)],
      )
      await client.query('DELETE FROM attention_candidates WHERE installation_id = $1', [installationId])

      for (const candidate of snapshot.candidates) {
        const payload = {
          ...candidate,
          availableAfter: firstDueByKey.get(candidate.dedupeKey) ?? candidate.availableAfter,
        }
        await client.query(
          `INSERT INTO attention_candidates
             (installation_id, dedupe_key, payload, available_after, expires_at, state_version)
           VALUES ($1, $2, $3::jsonb, $4, $5, $6)`,
          [
            installationId,
            candidate.dedupeKey,
            JSON.stringify(payload),
            payload.availableAfter,
            payload.expiresAt,
            payload.stateVersion,
          ],
        )
      }
      return true
    })
  }

  async #historyFor(installationId) {
    const [deliveriesResult, eventsResult] = await Promise.all([
      this.pool.query(
        `SELECT * FROM attention_deliveries
         WHERE installation_id = $1 AND delivered_at IS NOT NULL
         ORDER BY delivered_at DESC`,
        [installationId],
      ),
      this.pool.query(
        `SELECT * FROM attention_events
         WHERE installation_id = $1 ORDER BY recorded_at DESC`,
        [installationId],
      ),
    ])
    return {
      deliveries: deliveriesResult.rows.map(deliveryFromRow),
      events: eventsResult.rows.map(eventFromRow),
    }
  }

  async responseProfile(installationId, now = new Date()) {
    const { deliveries, events } = await this.#historyFor(installationId)
    return buildResponseProfile(deliveries, events, now)
  }

  async listDispatchable(now = new Date()) {
    const nowMs = now.getTime()
    const weekAgo = new Date(nowMs - WEEK_MS)
    const installations = await this.pool.query(
      `SELECT * FROM attention_installations
       WHERE subscription IS NOT NULL AND snapshot IS NOT NULL`,
    )
    const result = []

    for (const row of installations.rows) {
      const deliveryTimesResult = await this.pool.query(
        `SELECT delivered_at FROM attention_deliveries
         WHERE installation_id = $1 AND delivered_at >= $2
         ORDER BY delivered_at`,
        [row.id, weekAgo],
      )
      const installation = installationFromRow(
        row,
        deliveryTimesResult.rows.map(item => new Date(item.delivered_at).getTime()),
      )
      const response = await this.responseProfile(installation.id, now)
      const categoryPrefs = (installation.preferences ?? DEFAULT_PREFERENCES).categories
      const candidates = await this.pool.query(
        `SELECT c.payload
         FROM attention_candidates c
         LEFT JOIN attention_sent_dedupe sent
           ON sent.installation_id = c.installation_id
          AND sent.dedupe_key = c.dedupe_key
         WHERE c.installation_id = $1
           AND c.available_after <= $2
           AND c.expires_at > $2
           AND c.state_version = $3
           AND sent.dedupe_key IS NULL`,
        [installation.id, now, installation.snapshot.stateVersion],
      )
      const due = candidates.rows
        .map(item => asObject(item.payload))
        .filter(candidate => categoryPrefs[candidate.category] !== false)
        .filter(candidate =>
          candidate.importance === 'major' ||
          response.backoffUntil === null ||
          Date.parse(response.backoffUntil) <= nowMs
        )
        .sort((a, b) => {
          const aScore = a.score + (response.categoryAffinity[a.category] ?? 0)
          const bScore = b.score + (response.categoryAffinity[b.category] ?? 0)
          return bScore - aScore || a.dedupeKey.localeCompare(b.dedupeKey)
        })
      if (due[0]) result.push({ installation, candidate: due[0] })
    }
    return result
  }

  async registerDelivery(delivery) {
    await this.pool.query(
      `INSERT INTO attention_deliveries
         (id, installation_id, candidate_id, save_id, category, importance,
          narrative_post, token_hash, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)`,
      [
        delivery.id,
        delivery.installationId,
        delivery.candidateId ?? null,
        delivery.saveId ?? null,
        delivery.category ?? null,
        delivery.importance ?? null,
        delivery.narrativePost ? JSON.stringify(delivery.narrativePost) : null,
        delivery.tokenHash.toString('hex'),
        delivery.createdAt,
      ],
    )
  }

  async authenticateDelivery(deliveryId, token) {
    const result = await this.pool.query(
      'SELECT token_hash FROM attention_deliveries WHERE id = $1',
      [deliveryId],
    )
    return result.rows[0] ? storedSecretMatches(token, result.rows[0].token_hash) : false
  }

  async deliveryBelongsToInstallation(deliveryId, installationId) {
    const result = await this.pool.query(
      'SELECT 1 FROM attention_deliveries WHERE id = $1 AND installation_id = $2',
      [deliveryId, installationId],
    )
    return result.rowCount > 0
  }

  async markDelivered(installationId, dedupeKey, deliveredAt = new Date(), deliveryId) {
    await this.#withTransaction(async client => {
      await client.query(
        `INSERT INTO attention_sent_dedupe (installation_id, dedupe_key, delivered_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (installation_id, dedupe_key) DO NOTHING`,
        [installationId, dedupeKey, deliveredAt],
      )
      if (deliveryId) {
        await client.query(
          `UPDATE attention_deliveries SET delivered_at = $3
           WHERE id = $1 AND installation_id = $2`,
          [deliveryId, installationId, deliveredAt],
        )
      }
    })
  }

  async listNarrativeDeliveryReceipts(installationId) {
    const result = await this.pool.query(
      `SELECT * FROM attention_deliveries
       WHERE installation_id = $1
         AND delivered_at IS NOT NULL
         AND narrative_post IS NOT NULL
         AND acknowledged_at IS NULL
       ORDER BY delivered_at`,
      [installationId],
    )
    return result.rows.map(row => ({
      deliveryId: row.id,
      saveId: row.save_id,
      deliveredAt: iso(row.delivered_at),
      narrativePost: asObject(row.narrative_post),
    }))
  }

  async acknowledgeNarrativeDeliveryReceipts(installationId, deliveryIds) {
    if (deliveryIds.length === 0) return 0
    const result = await this.pool.query(
      `UPDATE attention_deliveries
       SET acknowledged_at = now()
       WHERE installation_id = $1
         AND id = ANY($2::varchar[])
         AND delivered_at IS NOT NULL
         AND acknowledged_at IS NULL`,
      [installationId, deliveryIds],
    )
    return result.rowCount
  }

  async removeExpiredSubscription(installationId) {
    await this.pool.query(
      `UPDATE attention_installations
       SET subscription = NULL, updated_at = now() WHERE id = $1`,
      [installationId],
    )
  }

  async recordEvent(event, recordedAt = new Date()) {
    let installationId = event.installationId ?? null
    if (!installationId && event.deliveryId) {
      const delivery = await this.pool.query(
        'SELECT installation_id FROM attention_deliveries WHERE id = $1',
        [event.deliveryId],
      )
      installationId = delivery.rows[0]?.installation_id ?? null
    }
    await this.pool.query(
      `INSERT INTO attention_events
         (installation_id, delivery_id, type, payload, recorded_at)
       VALUES ($1, $2, $3, $4::jsonb, $5)`,
      [
        installationId,
        event.deliveryId ?? null,
        event.type,
        JSON.stringify(event),
        recordedAt,
      ],
    )
    if (installationId) {
      await this.pool.query(
        'UPDATE attention_installations SET updated_at = $2 WHERE id = $1',
        [installationId, recordedAt],
      )
    }
  }

  async recordAnalyticsEvent(event, recordedAt = new Date()) {
    const installation = await this.pool.query(
      'SELECT preferences FROM attention_installations WHERE id = $1',
      [event.installationId],
    )
    if (!installation.rows[0]) return false
    const preferences = asObject(installation.rows[0].preferences, {})
    if (preferences.analytics === false) return false
    await this.pool.query(
      `INSERT INTO analytics_events (installation_id, event, payload, recorded_at)
       VALUES ($1, $2, $3::jsonb, $4)`,
      [event.installationId, event.event, JSON.stringify(event.payload ?? {}), recordedAt],
    )
    return true
  }

  async pruneAnalyticsEvents(before) {
    const result = await this.pool.query(
      'DELETE FROM analytics_events WHERE recorded_at < $1',
      [before],
    )
    return result.rowCount
  }

  async pruneInactiveInstallations(before) {
    // Installationstabellen är ägare till all pseudonym serverstate. Samma
    // cascade-kontrakt som vid uttrycklig avregistrering gör gallringen hel.
    const result = await this.pool.query(
      'DELETE FROM attention_installations WHERE updated_at < $1',
      [before],
    )
    return result.rowCount
  }

  deliveryCountSince(installation, sinceMs) {
    return installation.deliveryTimes.filter(time => time >= sinceMs).length
  }
}

export async function createPostgresAttentionStore({ connectionString, pool } = {}) {
  const ownedPool = pool ?? new Pool({ connectionString })
  const store = new PostgresAttentionStore(ownedPool)
  await store.initialize()
  return store
}
