import { Router } from 'express'
import { InMemoryAttentionStore } from './store.js'
import { createAttentionDispatcher } from './dispatcher.js'

const ALLOWED_CATEGORIES = new Set([
  'match_preparation', 'calendar_anchor', 'season_context', 'narrative_return',
])
const ALLOWED_DEEP_LINKS = new Set([
  '/game/dashboard', '/game/match', '/game/tabell', '/game/inbox', '/game/squad',
])
const ALLOWED_CLIENT_EVENTS = new Set([
  'push_permission_prompted', 'push_permission_granted', 'push_permission_denied',
  'subscription_created', 'subscription_removed', 'snapshot_synced',
  'push_received', 'notification_clicked', 'notification_opened',
  'app_opened', 'meaningful_action',
])
const ALLOWED_MEANINGFUL_ACTIONS = new Set([
  'lineup_confirmed', 'match_played', 'decision_resolved', 'season_transitioned',
])

function validId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{8,128}$/.test(value)
}

function tokenFrom(req) {
  return typeof req.headers['x-installation-token'] === 'string'
    ? req.headers['x-installation-token']
    : ''
}

function validCandidate(candidate, stateVersion) {
  return candidate &&
    typeof candidate.id === 'string' && candidate.id.length >= 8 && candidate.id.length <= 512 &&
    typeof candidate.dedupeKey === 'string' && candidate.dedupeKey.length <= 180 &&
    ALLOWED_CATEGORIES.has(candidate.category) &&
    ALLOWED_DEEP_LINKS.has(candidate.deepLink) &&
    candidate.stateVersion === stateVersion &&
    typeof candidate.title === 'string' && candidate.title.length <= 120 &&
    typeof candidate.body === 'string' && candidate.body.length <= 240 &&
    Number.isFinite(candidate.score) &&
    Number.isFinite(Date.parse(candidate.availableAfter)) &&
    Number.isFinite(Date.parse(candidate.expiresAt)) &&
    validNarrativePost(candidate.narrativePost)
}

function validNarrativePost(reference) {
  if (reference === undefined) return true
  const post = reference?.post
  const chronology = reference?.chronology
  return post && chronology &&
    typeof post.type === 'string' && post.type.length <= 80 &&
    typeof post.semanticKey === 'string' && post.semanticKey.length <= 240 &&
    Number.isInteger(post.season) && Number.isInteger(post.matchday) &&
    Number.isInteger(chronology.season) && Number.isInteger(chronology.matchday)
}

function validSnapshot(snapshot, installationId) {
  return snapshot && snapshot.schemaVersion === 1 &&
    snapshot.installationId === installationId &&
    validId(snapshot.saveId) &&
    typeof snapshot.stateVersion === 'string' && snapshot.stateVersion.length <= 240 &&
    typeof snapshot.timeZone === 'string' && snapshot.timeZone.length <= 80 &&
    Array.isArray(snapshot.openLoops) && snapshot.openLoops.length <= 20 &&
    Array.isArray(snapshot.candidates) && snapshot.candidates.length <= 20 &&
    snapshot.candidates.every(candidate => validCandidate(candidate, snapshot.stateVersion))
}

function validSubscription(subscription) {
  return subscription && typeof subscription.endpoint === 'string' &&
    subscription.endpoint.startsWith('https://') && subscription.endpoint.length <= 2_048 &&
    subscription.keys && typeof subscription.keys.p256dh === 'string' &&
    typeof subscription.keys.auth === 'string'
}

export function createAttentionRouter({
  store = new InMemoryAttentionStore(),
  env = process.env,
  dispatcher = createAttentionDispatcher({ store, env }),
} = {}) {
  const router = Router()

  router.get('/notifications/vapid-public-key', (_req, res) => {
    if (!dispatcher.configured) return res.status(503).json({ configured: false })
    return res.json({ configured: true, publicKey: dispatcher.publicKey })
  })

  router.put('/notifications/installations/:installationId', (req, res) => {
    const { installationId } = req.params
    if (!validId(installationId)) return res.status(400).json({ error: 'invalid_installation' })
    const installation = store.ensureInstallation(installationId, tokenFrom(req), {
      timeZone: req.body?.timeZone,
    })
    return installation ? res.status(204).end() : res.status(403).json({ error: 'forbidden' })
  })

  router.put('/notifications/subscriptions/:installationId', (req, res) => {
    const { installationId } = req.params
    if (!validId(installationId) || !validSubscription(req.body?.subscription)) {
      return res.status(400).json({ error: 'invalid_subscription' })
    }
    const saved = store.setSubscription(
      installationId,
      tokenFrom(req),
      req.body.subscription,
      { timeZone: req.body.timeZone },
    )
    return saved ? res.status(204).end() : res.status(403).json({ error: 'forbidden' })
  })

  router.delete('/notifications/subscriptions/:installationId', (req, res) => {
    const removed = store.removeSubscription(req.params.installationId, tokenFrom(req))
    return removed ? res.status(204).end() : res.status(403).json({ error: 'forbidden' })
  })

  router.put('/attention/snapshots/:installationId', (req, res) => {
    const { installationId } = req.params
    if (!validId(installationId) || !validSnapshot(req.body, installationId)) {
      return res.status(400).json({ error: 'invalid_snapshot' })
    }
    const saved = store.setSnapshot(installationId, tokenFrom(req), req.body)
    if (!saved) return res.status(403).json({ error: 'forbidden' })
    store.recordEvent({
      type: 'snapshot_synced', installationId,
      saveId: req.body.saveId, stateVersion: req.body.stateVersion,
      candidateCount: req.body.candidates.length,
    })
    return res.status(204).end()
  })

  router.get('/attention/delivery-receipts/:installationId', (req, res) => {
    const { installationId } = req.params
    if (!validId(installationId)) return res.status(400).json({ error: 'invalid_installation' })
    if (!store.authenticateInstallation(installationId, tokenFrom(req))) {
      return res.status(403).json({ error: 'forbidden' })
    }
    return res.json({ receipts: store.listNarrativeDeliveryReceipts(installationId) })
  })

  router.post('/attention/delivery-receipts/:installationId/ack', (req, res) => {
    const { installationId } = req.params
    const deliveryIds = req.body?.deliveryIds
    if (!validId(installationId) || !Array.isArray(deliveryIds) || deliveryIds.length > 20 ||
        !deliveryIds.every(validId)) {
      return res.status(400).json({ error: 'invalid_receipts' })
    }
    if (!store.authenticateInstallation(installationId, tokenFrom(req))) {
      return res.status(403).json({ error: 'forbidden' })
    }
    return res.json({
      acknowledged: store.acknowledgeNarrativeDeliveryReceipts(installationId, deliveryIds),
    })
  })

  router.post('/notification-events', (req, res) => {
    const { type, installationId, deliveryId, deliveryToken } = req.body ?? {}
    if (!ALLOWED_CLIENT_EVENTS.has(type)) return res.status(400).json({ error: 'invalid_event' })
    if (type === 'meaningful_action' && !ALLOWED_MEANINGFUL_ACTIONS.has(req.body?.action)) {
      return res.status(400).json({ error: 'invalid_meaningful_action' })
    }
    const installationAuthenticated = validId(installationId) &&
      store.authenticateInstallation(installationId, tokenFrom(req))
    const deliveryAuthenticated = validId(deliveryId) &&
      store.authenticateDelivery(deliveryId, deliveryToken)
    const deliveryOwnedByInstallation = installationAuthenticated && validId(deliveryId) &&
      store.deliveryBelongsToInstallation(deliveryId, installationId)
    if (!installationAuthenticated && !deliveryAuthenticated) {
      return res.status(403).json({ error: 'forbidden' })
    }
    store.recordEvent({
      type,
      installationId: installationAuthenticated ? installationId : undefined,
      deliveryId: deliveryAuthenticated || deliveryOwnedByInstallation ? deliveryId : undefined,
      candidateId: typeof req.body.candidateId === 'string' ? req.body.candidateId : undefined,
      category: ALLOWED_CATEGORIES.has(req.body.category) ? req.body.category : undefined,
      action: type === 'meaningful_action' && ALLOWED_MEANINGFUL_ACTIONS.has(req.body.action)
        ? req.body.action
        : undefined,
    })
    return res.status(204).end()
  })

  router.post('/attention/run', async (req, res) => {
    const expected = env.ATTENTION_CRON_SECRET
    if (!expected || req.headers.authorization !== `Bearer ${expected}`) {
      return res.status(401).json({ error: 'unauthorized' })
    }
    return res.json(await dispatcher.dispatchDue())
  })

  return { router, store, dispatcher }
}
