import { Router } from 'express'
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { InMemoryAttentionStore } from './store.js'
import { createAttentionDispatcher } from './dispatcher.js'
import { summarizeBetaAnalytics } from '../beta/analyticsSummary.js'

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
const ALLOWED_ANALYTICS_EVENTS = new Set([
  'install', 'game_created', 'onboarding_done', 'first_match',
  'season_completed', 'game_over', 'session_start', 'session_end',
  'season_checkpoint', 'feature_opened', 'client_issue',
])
const ANALYTICS_RETENTION_MS = 90 * 24 * 60 * 60 * 1000
const INSTALLATION_RETENTION_MS = 90 * 24 * 60 * 60 * 1000

function validId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{8,128}$/.test(value)
}

function tokenFrom(req) {
  return typeof req.headers['x-installation-token'] === 'string'
    ? req.headers['x-installation-token']
    : ''
}

// Konstanttids-jämförelse av cron-hemligheten. En vanlig `!==` kortsluter vid
// första avvikande byte, vilket i teorin läcker hur många tecken som stämmer.
// Olika längd är alltid fel utan att timingSafeEqual (som kräver lika längd)
// behöver kastas på.
function secretMatches(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string' || !expected) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

function betaAdminAuthorized(req, env) {
  return typeof env.BETA_ADMIN_SECRET === 'string' && env.BETA_ADMIN_SECRET.length >= 32 &&
    secretMatches(req.headers.authorization, `Bearer ${env.BETA_ADMIN_SECRET}`)
}

function betaAdminConfigured(env) {
  return typeof env.BETA_ADMIN_SECRET === 'string' && env.BETA_ADMIN_SECRET.length >= 32
}

function betaCodeHash(code) {
  return createHash('sha256').update(code).digest('hex')
}

function normalizeWaitlistEmail(value) {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  if (email.length < 3 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return null
  return email
}

function normalizeInviteText(value, maxLength) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') return null
  const normalized = value.trim().replace(/\s+/g, ' ')
  return normalized && normalized.length <= maxLength ? normalized : null
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
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

function validPreferences(preferences) {
  if (!preferences || typeof preferences !== 'object') return false
  const { categories, quietHours } = preferences
  if (preferences.analytics !== undefined && typeof preferences.analytics !== 'boolean') return false
  if (!categories || typeof categories !== 'object') return false
  if (![...ALLOWED_CATEGORIES].every(key => typeof categories[key] === 'boolean')) return false
  if (Object.keys(categories).length !== ALLOWED_CATEGORIES.size) return false
  if (!quietHours || typeof quietHours !== 'object') return false
  const { startHour, startMinute, endHour, endMinute } = quietHours
  const validHour = value => Number.isInteger(value) && value >= 0 && value <= 23
  const validMinute = value => Number.isInteger(value) && value >= 0 && value <= 59
  return validHour(startHour) && validMinute(startMinute) && validHour(endHour) && validMinute(endMinute)
}

function hasOnlyKeys(value, allowed) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).every(key => allowed.includes(key))
}

export function validAnalyticsEvent(event, payload) {
  if (!ALLOWED_ANALYTICS_EVENTS.has(event) || !hasOnlyKeys(payload, {
    install: ['appVersion', 'platform', 'locale'],
    game_created: ['club', 'difficulty'],
    onboarding_done: [],
    first_match: [],
    season_completed: ['season', 'careerSeason', 'placement'],
    game_over: ['reason', 'seasonsSurvived'],
    session_start: ['sessionId'],
    session_end: ['sessionId', 'durationSeconds'],
    season_checkpoint: ['season', 'careerSeason', 'milestone'],
    feature_opened: ['feature'],
    client_issue: ['kind', 'appVersion', 'route'],
  }[event] ?? [])) return false

  const shortString = (value, max = 128) => typeof value === 'string' && value.length > 0 && value.length <= max
  const nonNegativeInt = value => Number.isInteger(value) && value >= 0 && value <= 1_000
  const validCalendarSeason = value => Number.isInteger(value) && value >= 1 && value <= 3_000
  const validCareerSeason = value => Number.isInteger(value) && value >= 1 && value <= 100
  switch (event) {
    case 'install':
      return shortString(payload.appVersion, 64) && shortString(payload.platform, 32) && shortString(payload.locale, 35)
    case 'game_created':
      return shortString(payload.club) && ['easy', 'medium', 'hard'].includes(payload.difficulty)
    case 'season_completed':
      return validCalendarSeason(payload.season) &&
        (payload.careerSeason === undefined || validCareerSeason(payload.careerSeason)) &&
        nonNegativeInt(payload.placement) && payload.placement >= 1
    case 'game_over':
      return ['dismissed', 'license', 'bankruptcy'].includes(payload.reason) &&
        nonNegativeInt(payload.seasonsSurvived)
    case 'session_start':
      return validId(payload.sessionId)
    case 'session_end':
      return validId(payload.sessionId) && Number.isInteger(payload.durationSeconds) && payload.durationSeconds >= 0 &&
        payload.durationSeconds <= 24 * 60 * 60
    case 'season_checkpoint':
      return validCalendarSeason(payload.season) && payload.careerSeason === 1 &&
        ['five_league_matches', 'half_league_matches'].includes(payload.milestone)
    case 'feature_opened':
      return ['training', 'tactics', 'scouting', 'transfers', 'community'].includes(payload.feature)
    case 'client_issue':
      return ['render_error', 'save_failure'].includes(payload.kind) && shortString(payload.appVersion, 64) &&
        typeof payload.route === 'string' && /^\/[a-z0-9/-]{0,80}$/.test(payload.route)
    default:
      return Object.keys(payload).length === 0
  }
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
    if (!dispatcher.enabled) return res.status(503).json({ configured: false })
    return res.json({ configured: true, publicKey: dispatcher.publicKey })
  })

  router.put('/notifications/installations/:installationId', asyncRoute(async (req, res) => {
    const { installationId } = req.params
    if (!validId(installationId)) return res.status(400).json({ error: 'invalid_installation' })
    const installation = await store.ensureInstallation(installationId, tokenFrom(req), {
      timeZone: req.body?.timeZone,
    })
    return installation ? res.status(204).end() : res.status(403).json({ error: 'forbidden' })
  }))

  router.get('/notifications/installations/:installationId/preferences', asyncRoute(async (req, res) => {
    const { installationId } = req.params
    if (!validId(installationId)) return res.status(400).json({ error: 'invalid_installation' })
    if (!await store.authenticateInstallation(installationId, tokenFrom(req))) {
      return res.status(403).json({ error: 'forbidden' })
    }
    return res.json(await store.getPreferences(installationId))
  }))

  router.put('/notifications/installations/:installationId/preferences', asyncRoute(async (req, res) => {
    const { installationId } = req.params
    if (!validId(installationId) || !validPreferences(req.body)) {
      return res.status(400).json({ error: 'invalid_preferences' })
    }
    const saved = await store.setPreferences(installationId, tokenFrom(req), req.body)
    return saved ? res.status(204).end() : res.status(403).json({ error: 'forbidden' })
  }))

  router.put('/notifications/subscriptions/:installationId', asyncRoute(async (req, res) => {
    const { installationId } = req.params
    if (!validId(installationId) || !validSubscription(req.body?.subscription)) {
      return res.status(400).json({ error: 'invalid_subscription' })
    }
    const saved = await store.setSubscription(
      installationId,
      tokenFrom(req),
      req.body.subscription,
      { timeZone: req.body.timeZone },
    )
    return saved ? res.status(204).end() : res.status(403).json({ error: 'forbidden' })
  }))

  router.delete('/notifications/subscriptions/:installationId', asyncRoute(async (req, res) => {
    const removed = await store.removeSubscription(req.params.installationId, tokenFrom(req))
    return removed ? res.status(204).end() : res.status(403).json({ error: 'forbidden' })
  }))

  // Push has a separate lifecycle from beta access and opt-in gameplay analytics.
  // Keep the legacy deletion endpoint above for older clients' privacy contract.
  router.delete('/notifications/push/:installationId', asyncRoute(async (req, res) => {
    const removed = await store.disablePush(req.params.installationId, tokenFrom(req))
    return removed ? res.status(204).end() : res.status(403).json({ error: 'forbidden' })
  }))

  router.put('/attention/snapshots/:installationId', asyncRoute(async (req, res) => {
    const { installationId } = req.params
    if (!validId(installationId) || !validSnapshot(req.body, installationId)) {
      return res.status(400).json({ error: 'invalid_snapshot' })
    }
    const saved = await store.setSnapshot(installationId, tokenFrom(req), req.body)
    if (!saved) return res.status(403).json({ error: 'forbidden' })
    await store.recordEvent({
      type: 'snapshot_synced', installationId,
      saveId: req.body.saveId, stateVersion: req.body.stateVersion,
      candidateCount: req.body.candidates.length,
    })
    return res.status(204).end()
  }))

  router.get('/attention/delivery-receipts/:installationId', asyncRoute(async (req, res) => {
    const { installationId } = req.params
    if (!validId(installationId)) return res.status(400).json({ error: 'invalid_installation' })
    if (!await store.authenticateInstallation(installationId, tokenFrom(req))) {
      return res.status(403).json({ error: 'forbidden' })
    }
    return res.json({ receipts: await store.listNarrativeDeliveryReceipts(installationId) })
  }))

  router.post('/attention/delivery-receipts/:installationId/ack', asyncRoute(async (req, res) => {
    const { installationId } = req.params
    const deliveryIds = req.body?.deliveryIds
    if (!validId(installationId) || !Array.isArray(deliveryIds) || deliveryIds.length > 20 ||
        !deliveryIds.every(validId)) {
      return res.status(400).json({ error: 'invalid_receipts' })
    }
    if (!await store.authenticateInstallation(installationId, tokenFrom(req))) {
      return res.status(403).json({ error: 'forbidden' })
    }
    return res.json({
      acknowledged: await store.acknowledgeNarrativeDeliveryReceipts(installationId, deliveryIds),
    })
  }))

  router.post('/notification-events', asyncRoute(async (req, res) => {
    const { type, installationId, deliveryId, deliveryToken } = req.body ?? {}
    if (!ALLOWED_CLIENT_EVENTS.has(type)) return res.status(400).json({ error: 'invalid_event' })
    if (type === 'meaningful_action' && !ALLOWED_MEANINGFUL_ACTIONS.has(req.body?.action)) {
      return res.status(400).json({ error: 'invalid_meaningful_action' })
    }
    const installationAuthenticated = validId(installationId) &&
      await store.authenticateInstallation(installationId, tokenFrom(req))
    const deliveryAuthenticated = validId(deliveryId) &&
      await store.authenticateDelivery(deliveryId, deliveryToken)
    const deliveryOwnedByInstallation = installationAuthenticated && validId(deliveryId) &&
      await store.deliveryBelongsToInstallation(deliveryId, installationId)
    if (!installationAuthenticated && !deliveryAuthenticated) {
      return res.status(403).json({ error: 'forbidden' })
    }
    await store.recordEvent({
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
  }))

  router.post('/analytics-events', asyncRoute(async (req, res) => {
    const { installationId, event, payload } = req.body ?? {}
    if (!validId(installationId) || !validAnalyticsEvent(event, payload)) {
      return res.status(400).json({ error: 'invalid_analytics_event' })
    }
    if (!await store.authenticateInstallation(installationId, tokenFrom(req))) {
      return res.status(403).json({ error: 'forbidden' })
    }
    // Opt-out ger samma tomma kvitto som en lagrad post. Klienten ska inte
    // kunna använda svaret för att avläsa serverns preferenskopia.
    await store.recordAnalyticsEvent({ installationId, event, payload })
    return res.status(204).end()
  }))

  router.post('/beta/waitlist', asyncRoute(async (req, res) => {
    const email = normalizeWaitlistEmail(req.body?.email)
    if (!email) return res.status(400).json({ error: 'invalid_email' })
    const added = await store.addToBetaWaitlist(email)
    return added ? res.status(200).json({ queued: true }) : res.status(409).json({ error: 'already_queued' })
  }))

  router.get('/admin/beta-stats', asyncRoute(async (req, res) => {
    if (!betaAdminConfigured(env)) return res.status(503).json({ error: 'not_configured' })
    if (!betaAdminAuthorized(req, env)) {
      return res.status(401).json({ error: 'unauthorized' })
    }
    const rows = await store.listAllAnalyticsEvents(new Date(Date.now() - ANALYTICS_RETENTION_MS))
    const invites = await store.listBetaInvites()
    const waitlist = await store.listBetaWaitlist()
    const invitedInstallations = new Set(await store.listBetaRedeemedInstallations())
    const withEvent = event => new Set(rows.filter(row => row.event === event &&
      invitedInstallations.has(row.installationId)).map(row => row.installationId)).size
    res.set('Cache-Control', 'no-store')
    return res.json({
      ...summarizeBetaAnalytics(rows),
      invites: {
        issued: invites.length,
        redeemed: invites.filter(invite => invite.redeemedAt && !invite.revokedAt).length,
        revoked: invites.filter(invite => invite.revokedAt).length,
        startedCareer: withEvent('game_created'),
        playedFirstMatch: withEvent('first_match'),
        queued: waitlist.length,
      },
    })
  }))

  router.post('/admin/beta-invites', asyncRoute(async (req, res) => {
    if (!betaAdminConfigured(env)) return res.status(503).json({ error: 'not_configured' })
    if (!betaAdminAuthorized(req, env)) return res.status(401).json({ error: 'unauthorized' })
    const code = randomBytes(24).toString('base64url')
    const id = randomUUID()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const waitlistEmail = req.body?.waitlistEmail === undefined
      ? null
      : normalizeWaitlistEmail(req.body.waitlistEmail)
    if (req.body?.waitlistEmail !== undefined && !waitlistEmail) {
      return res.status(400).json({ error: 'invalid_email' })
    }
    const recipientLabel = normalizeInviteText(req.body?.recipientLabel, 120)
    const recipientContact = normalizeInviteText(req.body?.recipientContact, 254)
    if (!recipientLabel) return res.status(400).json({ error: 'recipient_required' })
    if (req.body?.recipientContact !== undefined && req.body.recipientContact !== '' && !recipientContact) {
      return res.status(400).json({ error: 'invalid_recipient_contact' })
    }
    if (waitlistEmail) {
      await store.createBetaInviteForWaitlist({
        id, codeHash: betaCodeHash(code), expiresAt, email: waitlistEmail,
        recipientLabel, recipientContact: recipientContact ?? waitlistEmail,
      })
    } else {
      await store.createBetaInvite({
        id, codeHash: betaCodeHash(code), expiresAt, recipientLabel, recipientContact,
      })
    }
    res.set('Cache-Control', 'no-store')
    return res.status(201).json({ id, code, expiresAt: expiresAt.toISOString() })
  }))

  router.get('/admin/beta-waitlist', asyncRoute(async (req, res) => {
    if (!betaAdminConfigured(env)) return res.status(503).json({ error: 'not_configured' })
    if (!betaAdminAuthorized(req, env)) return res.status(401).json({ error: 'unauthorized' })
    res.set('Cache-Control', 'no-store')
    return res.json({ waitlist: await store.listBetaWaitlist() })
  }))

  router.get('/admin/beta-invites', asyncRoute(async (req, res) => {
    if (!betaAdminConfigured(env)) return res.status(503).json({ error: 'not_configured' })
    if (!betaAdminAuthorized(req, env)) return res.status(401).json({ error: 'unauthorized' })
    res.set('Cache-Control', 'no-store')
    return res.json({ invites: await store.listBetaInvites() })
  }))

  router.delete('/admin/beta-invites/:id', asyncRoute(async (req, res) => {
    if (!betaAdminConfigured(env)) return res.status(503).json({ error: 'not_configured' })
    if (!betaAdminAuthorized(req, env)) return res.status(401).json({ error: 'unauthorized' })
    if (!validId(req.params.id)) return res.status(400).json({ error: 'invalid_invite' })
    const revoked = await store.revokeBetaInvite(req.params.id)
    return revoked ? res.status(204).end() : res.status(404).json({ error: 'not_found' })
  }))

  router.post('/beta/invites/redeem', asyncRoute(async (req, res) => {
    const { installationId, code } = req.body ?? {}
    if (!validId(installationId) || typeof code !== 'string' || !/^[A-Za-z0-9_-]{32}$/.test(code)) {
      return res.status(400).json({ error: 'invalid_invite' })
    }
    if (!await store.authenticateInstallation(installationId, tokenFrom(req))) {
      return res.status(403).json({ error: 'forbidden' })
    }
    const redeemed = await store.redeemBetaInvite(betaCodeHash(code), installationId)
    return redeemed ? res.status(204).end() : res.status(404).json({ error: 'invalid_invite' })
  }))

  router.get('/beta/access/:installationId', asyncRoute(async (req, res) => {
    if (!validId(req.params.installationId) ||
      !await store.authenticateInstallation(req.params.installationId, tokenFrom(req))) {
      return res.status(403).json({ error: 'forbidden' })
    }
    res.set('Cache-Control', 'no-store')
    return res.json({ granted: await store.hasBetaAccess(req.params.installationId) })
  }))

  router.post('/attention/run', asyncRoute(async (req, res) => {
    const expected = env.ATTENTION_CRON_SECRET
    if (!expected || !secretMatches(req.headers.authorization, `Bearer ${expected}`)) {
      return res.status(401).json({ error: 'unauthorized' })
    }
    const installationsPruned = await store.pruneInactiveInstallations?.(
      new Date(Date.now() - INSTALLATION_RETENTION_MS),
    ) ?? 0
    // Gallra före leverans: en installation som passerat 90 dagar får inte
    // väckas av en gammal kandidat i samma körning som den ska raderas.
    const dispatch = await dispatcher.dispatchDue()
    const analyticsPruned = await store.pruneAnalyticsEvents?.(
      new Date(Date.now() - ANALYTICS_RETENTION_MS),
    ) ?? 0
    return res.json({ ...dispatch, analyticsPruned, installationsPruned })
  }))

  return { router, store, dispatcher }
}
