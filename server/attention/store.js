import { createHash, timingSafeEqual } from 'node:crypto'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const IMPLICIT_RETURN_WINDOW_MS = 6 * 60 * 60 * 1000
const STRONG_BACKOFF_MS = 3 * DAY_MS
const POSITIVE_RESPONSE_EVENTS = new Set([
  'notification_clicked', 'notification_opened', 'meaningful_action',
])

function hashSecret(value) {
  return createHash('sha256').update(value).digest()
}

function secretsMatch(value, expectedHash) {
  if (!value || !expectedHash) return false
  const actual = hashSecret(value)
  return actual.length === expectedHash.length && timingSafeEqual(actual, expectedHash)
}

/**
 * Utbytbar repository-gräns för Attention Engine. In-memory-adaptern gör
 * kontraktet körbart lokalt men är avsiktligt inte maskerad som hållbar
 * produktionslagring; se rapportens blockerare.
 */
export class InMemoryAttentionStore {
  #installations = new Map()
  #deliveries = new Map()
  #events = []

  authenticateInstallation(installationId, token) {
    const installation = this.#installations.get(installationId)
    return installation ? secretsMatch(token, installation.tokenHash) : false
  }

  ensureInstallation(installationId, token, metadata = {}) {
    const existing = this.#installations.get(installationId)
    if (existing) {
      if (!secretsMatch(token, existing.tokenHash)) return null
      existing.metadata = { ...existing.metadata, ...metadata }
      existing.updatedAt = new Date().toISOString()
      return existing
    }
    if (!installationId || !token) return null
    const created = {
      id: installationId,
      tokenHash: hashSecret(token),
      metadata,
      snapshot: null,
      subscription: null,
      activeCandidates: new Map(),
      sentDedupeKeys: new Set(),
      deliveryTimes: [],
      updatedAt: new Date().toISOString(),
    }
    this.#installations.set(installationId, created)
    return created
  }

  setSubscription(installationId, token, subscription, metadata = {}) {
    const installation = this.ensureInstallation(installationId, token, metadata)
    if (!installation) return false
    installation.subscription = subscription
    installation.updatedAt = new Date().toISOString()
    return true
  }

  removeSubscription(installationId, token) {
    const installation = this.#installations.get(installationId)
    if (!installation || !secretsMatch(token, installation.tokenHash)) return false
    // Local-first-domen: avregistrering är också radering. När en spelare
    // stänger av push ska snapshot, kandidater, leveranser och installation
    // inte ligga kvar i den framtida persistenta adaptern.
    this.#installations.delete(installationId)
    const removedDeliveryIds = new Set()
    for (const [deliveryId, delivery] of this.#deliveries) {
      if (delivery.installationId === installationId) {
        removedDeliveryIds.add(deliveryId)
        this.#deliveries.delete(deliveryId)
      }
    }
    this.#events = this.#events.filter(event =>
      event.installationId !== installationId &&
      (!event.deliveryId || !removedDeliveryIds.has(event.deliveryId)),
    )
    return true
  }

  setSnapshot(installationId, token, snapshot) {
    const installation = this.ensureInstallation(installationId, token, {
      timeZone: snapshot.timeZone,
    })
    if (!installation) return false

    const previous = installation.activeCandidates
    const next = new Map()
    for (const candidate of snapshot.candidates) {
      const existing = previous.get(candidate.dedupeKey)
      next.set(candidate.dedupeKey, {
        ...candidate,
        // State-versionen och copyn får ändras vid ny save, men samma open
        // loop ska inte skjutas 18 timmar framåt varje gång klienten synkar.
        availableAfter: existing?.availableAfter ?? candidate.availableAfter,
      })
    }
    installation.activeCandidates = next
    installation.snapshot = snapshot
    installation.updatedAt = new Date().toISOString()
    return true
  }

  listDispatchable(now = new Date()) {
    const nowMs = now.getTime()
    const weekAgo = nowMs - WEEK_MS
    const result = []
    for (const installation of this.#installations.values()) {
      if (!installation.subscription || !installation.snapshot) continue
      installation.deliveryTimes = installation.deliveryTimes.filter(time => time >= weekAgo)
      const response = this.responseProfile(installation.id, now)
      const due = [...installation.activeCandidates.values()]
        .filter(candidate => !installation.sentDedupeKeys.has(candidate.dedupeKey))
        .filter(candidate => Date.parse(candidate.availableAfter) <= nowMs)
        .filter(candidate => Date.parse(candidate.expiresAt) > nowMs)
        .filter(candidate => candidate.stateVersion === installation.snapshot.stateVersion)
        .filter(candidate =>
          candidate.importance === 'major' ||
          response.backoffUntil === null ||
          Date.parse(response.backoffUntil) <= nowMs
        )
        .sort((a, b) => {
          const aChannelScore = a.score + (response.categoryAffinity[a.category] ?? 0)
          const bChannelScore = b.score + (response.categoryAffinity[b.category] ?? 0)
          return bChannelScore - aChannelScore || a.dedupeKey.localeCompare(b.dedupeKey)
        })
      if (due[0]) result.push({ installation, candidate: due[0] })
    }
    return result
  }

  registerDelivery(delivery) {
    this.#deliveries.set(delivery.id, delivery)
  }

  authenticateDelivery(deliveryId, token) {
    const delivery = this.#deliveries.get(deliveryId)
    return delivery ? secretsMatch(token, delivery.tokenHash) : false
  }

  deliveryBelongsToInstallation(deliveryId, installationId) {
    return this.#deliveries.get(deliveryId)?.installationId === installationId
  }

  markDelivered(installationId, dedupeKey, deliveredAt = new Date(), deliveryId) {
    const installation = this.#installations.get(installationId)
    if (!installation) return
    installation.sentDedupeKeys.add(dedupeKey)
    installation.deliveryTimes.push(deliveredAt.getTime())
    const delivery = deliveryId ? this.#deliveries.get(deliveryId) : null
    if (delivery && delivery.installationId === installationId) {
      delivery.deliveredAt = deliveredAt.toISOString()
    }
  }

  listNarrativeDeliveryReceipts(installationId) {
    return [...this.#deliveries.values()]
      .filter(delivery =>
        delivery.installationId === installationId &&
        delivery.deliveredAt &&
        delivery.narrativePost &&
        !delivery.acknowledgedAt
      )
      .map(delivery => ({
        deliveryId: delivery.id,
        saveId: delivery.saveId,
        deliveredAt: delivery.deliveredAt,
        narrativePost: delivery.narrativePost,
      }))
      .sort((a, b) => a.deliveredAt.localeCompare(b.deliveredAt))
  }

  acknowledgeNarrativeDeliveryReceipts(installationId, deliveryIds) {
    let acknowledged = 0
    const acknowledgedAt = new Date().toISOString()
    for (const deliveryId of deliveryIds) {
      const delivery = this.#deliveries.get(deliveryId)
      if (!delivery || delivery.installationId !== installationId || !delivery.deliveredAt) continue
      if (!delivery.acknowledgedAt) {
        delivery.acknowledgedAt = acknowledgedAt
        acknowledged++
      }
    }
    return acknowledged
  }

  responseProfile(installationId, now = new Date()) {
    const nowMs = now.getTime()
    const deliveries = [...this.#deliveries.values()]
      .filter(delivery => delivery.installationId === installationId && delivery.deliveredAt)
      .sort((a, b) => b.deliveredAt.localeCompare(a.deliveredAt))
    const outcomes = deliveries.map(delivery => {
      const deliveredMs = Date.parse(delivery.deliveredAt)
      const explicitPositive = this.#events.some(event =>
        event.deliveryId === delivery.id && POSITIVE_RESPONSE_EVENTS.has(event.type)
      )
      const implicitPositive = this.#events.some(event => {
        if (event.installationId !== installationId || event.type !== 'app_opened') return false
        const openedMs = Date.parse(event.recordedAt)
        return openedMs >= deliveredMs && openedMs <= deliveredMs + IMPLICIT_RETURN_WINDOW_MS
      })
      const outcome = explicitPositive || implicitPositive
        ? 'positive'
        : nowMs - deliveredMs >= DAY_MS
          ? 'ignored'
          : 'pending'
      return { delivery, outcome }
    })

    let consecutiveIgnored = 0
    for (const { outcome } of outcomes) {
      if (outcome === 'pending') continue
      if (outcome !== 'ignored') break
      consecutiveIgnored++
    }

    const categoryAffinity = {}
    for (const { delivery, outcome } of outcomes) {
      if (!delivery.category || outcome === 'pending') continue
      const delta = outcome === 'positive' ? 8 : -12
      categoryAffinity[delivery.category] = Math.max(
        -24,
        Math.min(16, (categoryAffinity[delivery.category] ?? 0) + delta),
      )
    }
    const latestDeliveredMs = deliveries[0] ? Date.parse(deliveries[0].deliveredAt) : null
    return {
      consecutiveIgnored,
      categoryAffinity,
      backoffUntil: consecutiveIgnored >= 2 && latestDeliveredMs !== null
        ? new Date(latestDeliveredMs + STRONG_BACKOFF_MS).toISOString()
        : null,
    }
  }

  removeExpiredSubscription(installationId) {
    const installation = this.#installations.get(installationId)
    if (installation) installation.subscription = null
  }

  recordEvent(event, recordedAt = new Date()) {
    const delivery = event.deliveryId ? this.#deliveries.get(event.deliveryId) : null
    this.#events.push({
      ...event,
      installationId: event.installationId ?? delivery?.installationId,
      recordedAt: recordedAt.toISOString(),
    })
    if (this.#events.length > 5_000) this.#events.splice(0, this.#events.length - 5_000)
  }

  deliveryCountSince(installation, sinceMs) {
    return installation.deliveryTimes.filter(time => time >= sinceMs).length
  }
}
