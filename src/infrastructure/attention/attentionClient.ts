import type { SaveGame } from '../../domain/entities/SaveGame'
import { evaluateAttention } from '../../domain/attention/attentionEngine'
import { createNarrativePushCopyResolver, type PushCopyRotationStore } from '../../domain/attention/narrativePushCopyResolver'
import type { AttentionVoice } from '../../domain/attention/types'
import type {
  AttentionSnapshot,
  NarrativeDeliveryReceipt,
  NotificationTelemetryEvent,
} from '../../domain/attention/types'

const IDENTITY_KEY = 'bandy-attention-installation-v1'
const ENABLED_KEY = 'bandy-attention-enabled-v1'
const ATTRIBUTION_KEY = 'bandy-notification-attribution-v1'
const PUSH_COPY_ROTATION_KEY = 'bandy-attention-push-copy-rotation-v1'

/**
 * stickiness-copy-roster (2026-09-06) — per-installation "senast visad röst
 * per scenario" (register §8.1: aldrig samma variant två leveranser i rad).
 * localStorage, samma nivå som IDENTITY_KEY/ENABLED_KEY ovan — inte i saven,
 * rotationen är en egenskap hos INSTALLATIONEN, inte klubbens historia.
 */
function readPushCopyRotation(): Record<string, AttentionVoice> {
  try {
    return JSON.parse(localStorage.getItem(PUSH_COPY_ROTATION_KEY) ?? '{}') as Record<string, AttentionVoice>
  } catch {
    return {}
  }
}

const pushCopyRotationStore: PushCopyRotationStore = {
  getLastVoice(scenarioKey) {
    return readPushCopyRotation()[scenarioKey]
  },
  setLastVoice(scenarioKey, voice) {
    try {
      const current = readPushCopyRotation()
      current[scenarioKey] = voice
      localStorage.setItem(PUSH_COPY_ROTATION_KEY, JSON.stringify(current))
    } catch {
      // Rotationsspårning är en trevnadsdetalj, inte ett kontrakt — en
      // localStorage-miss (privat läge, kvot) ska aldrig hindra en push.
    }
  },
}

interface InstallationIdentity {
  installationId: string
  token: string
}

type NavigatorWithAttentionApis = Navigator & {
  standalone?: boolean
}

export interface WebPushCapability {
  supported: boolean
  permission: NotificationPermission | 'unsupported'
  requiresHomeScreenInstall: boolean
}

export type MeaningfulNotificationAction =
  | 'lineup_confirmed'
  | 'match_played'
  | 'decision_resolved'
  | 'season_transitioned'

function randomToken(bytes: number): string {
  const data = crypto.getRandomValues(new Uint8Array(bytes))
  return btoa(String.fromCharCode(...data))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function readIdentity(): InstallationIdentity | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(IDENTITY_KEY) ?? 'null') as InstallationIdentity | null
    if (!parsed?.installationId || !parsed.token) return null
    return parsed
  } catch {
    return null
  }
}

function getOrCreateIdentity(): InstallationIdentity {
  const existing = readIdentity()
  if (existing) return existing
  const identity = {
    installationId: crypto.randomUUID(),
    token: randomToken(32),
  }
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity))
  return identity
}

export function isAttentionEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) === 'true'
  } catch {
    return false
  }
}

function authHeaders(identity: InstallationIdentity): HeadersInit {
  return {
    'content-type': 'application/json',
    'x-installation-token': identity.token,
  }
}

function applicationServerKey(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.padEnd(value.length + (4 - value.length % 4) % 4, '=')
  const base64 = padded.replaceAll('-', '+').replaceAll('_', '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let index = 0; index < raw.length; index++) bytes[index] = raw.charCodeAt(index)
  return bytes
}

async function api(path: string, init: RequestInit): Promise<Response> {
  const response = await fetch(path, init)
  if (!response.ok) throw new Error(`Attention API ${response.status}`)
  return response
}

export function getWebPushCapability(): WebPushCapability {
  if (typeof window === 'undefined') {
    return { supported: false, permission: 'unsupported', requiresHomeScreenInstall: false }
  }

  const navigatorWithBadge = navigator as NavigatorWithAttentionApis
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const standalone = window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithBadge.standalone === true
  const requiresHomeScreenInstall = isIos && !standalone
  const hasServiceWorker = 'serviceWorker' in navigator
  const hasPushApis = 'PushManager' in window && 'Notification' in window

  // iOS exponerar inte alltid hela Push API:t i en vanlig Safari-flik.
  // Installationshjälpen måste ändå kunna visas; efter installation görs
  // den vanliga, fulla capability-kontrollen på nytt.
  if (requiresHomeScreenInstall && hasServiceWorker) {
    return {
      supported: true,
      permission: 'Notification' in window ? Notification.permission : 'default',
      requiresHomeScreenInstall: true,
    }
  }
  if (!hasServiceWorker || !hasPushApis) {
    return { supported: false, permission: 'unsupported', requiresHomeScreenInstall: false }
  }

  return {
    supported: true,
    permission: Notification.permission,
    requiresHomeScreenInstall: false,
  }
}

export async function subscribeToClubNotifications(): Promise<PushSubscription> {
  const capability = getWebPushCapability()
  if (!capability.supported) throw new Error('web_push_unsupported')
  if (capability.requiresHomeScreenInstall) throw new Error('home_screen_install_required')

  const identity = getOrCreateIdentity()
  await api(`/api/notifications/installations/${identity.installationId}`, {
    method: 'PUT',
    headers: authHeaders(identity),
  })
  const keyResponse = await api('/api/notifications/vapid-public-key', { method: 'GET' })
  const { publicKey } = await keyResponse.json() as { publicKey: string }
  await recordNotificationEvent('push_permission_prompted')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    await recordNotificationEvent('push_permission_denied')
    throw new Error(`notification_permission_${permission}`)
  }
  await recordNotificationEvent('push_permission_granted')

  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey(publicKey),
  })
  await api(`/api/notifications/subscriptions/${identity.installationId}`, {
    method: 'PUT',
    headers: authHeaders(identity),
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    }),
  })
  localStorage.setItem(ENABLED_KEY, 'true')
  await recordNotificationEvent('subscription_created')
  return subscription
}

export async function unsubscribeFromClubNotifications(): Promise<void> {
  const identity = readIdentity()
  const registration = 'serviceWorker' in navigator
    ? await navigator.serviceWorker.ready
    : null
  const subscription = await registration?.pushManager.getSubscription()
  try {
    if (identity) {
      await recordNotificationEvent('subscription_removed').catch(() => {})
      await api(`/api/notifications/subscriptions/${identity.installationId}`, {
        method: 'DELETE',
        headers: authHeaders(identity),
      })
    }
  } finally {
    await subscription?.unsubscribe()
    localStorage.removeItem(ENABLED_KEY)
    localStorage.removeItem(IDENTITY_KEY)
    sessionStorage.removeItem(ATTRIBUTION_KEY)
  }
}

export function buildAttentionSnapshot(game: SaveGame, now = new Date()): AttentionSnapshot | null {
  const identity = readIdentity()
  if (!identity || !isAttentionEnabled()) return null
  const evaluation = evaluateAttention(game, now, {
    narrativePushCopy: createNarrativePushCopyResolver(game, pushCopyRotationStore),
  })
  return {
    schemaVersion: 1,
    installationId: identity.installationId,
    saveId: game.id,
    capturedAt: now.toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    ...evaluation,
  }
}

export async function syncAttentionSnapshot(game: SaveGame): Promise<void> {
  const identity = readIdentity()
  const snapshot = buildAttentionSnapshot(game)
  if (!identity || !snapshot) return
  await api(`/api/attention/snapshots/${identity.installationId}`, {
    method: 'PUT',
    headers: authHeaders(identity),
    body: JSON.stringify(snapshot),
  })
}

export async function getNarrativeDeliveryReceipts(): Promise<NarrativeDeliveryReceipt[]> {
  const identity = readIdentity()
  if (!identity || !isAttentionEnabled()) return []
  const response = await api(`/api/attention/delivery-receipts/${identity.installationId}`, {
    method: 'GET',
    headers: authHeaders(identity),
  })
  const result = await response.json() as { receipts?: NarrativeDeliveryReceipt[] }
  return Array.isArray(result.receipts) ? result.receipts : []
}

export async function acknowledgeNarrativeDeliveryReceipts(deliveryIds: string[]): Promise<void> {
  const identity = readIdentity()
  if (!identity || !isAttentionEnabled() || deliveryIds.length === 0) return
  await api(`/api/attention/delivery-receipts/${identity.installationId}/ack`, {
    method: 'POST',
    headers: authHeaders(identity),
    body: JSON.stringify({ deliveryIds }),
  })
}

export async function recordNotificationEvent(
  type: NotificationTelemetryEvent,
  extra: Record<string, string | undefined> = {},
): Promise<void> {
  const identity = readIdentity()
  if (!identity) return
  await api('/api/notification-events', {
    method: 'POST',
    headers: authHeaders(identity),
    body: JSON.stringify({ type, installationId: identity.installationId, ...extra }),
    keepalive: true,
  })
}

export async function updateAppBadge(count: number): Promise<void> {
  const badge = navigator as NavigatorWithAttentionApis
  try {
    if (count > 0) await badge.setAppBadge?.(Math.min(count, 99))
    else await badge.clearAppBadge?.()
  } catch {
    // Badging is progressive enhancement and must never block the game.
  }
}

export function consumeNotificationOpen(): boolean {
  const url = new URL(window.location.href)
  if (url.searchParams.get('bmNotification') !== '1') return false
  const deliveryId = url.searchParams.get('deliveryId') ?? undefined
  const candidateId = url.searchParams.get('candidateId') ?? undefined
  try {
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify({
      deliveryId,
      candidateId,
      openedAt: new Date().toISOString(),
    }))
  } catch {
    // Attribution must not block navigation in restricted browser modes.
  }
  void recordNotificationEvent('notification_opened', { deliveryId, candidateId }).catch(() => {})
  void recordNotificationEvent('app_opened', { deliveryId, candidateId }).catch(() => {})
  url.searchParams.delete('bmNotification')
  url.searchParams.delete('deliveryId')
  url.searchParams.delete('candidateId')
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  return true
}

export function recordMeaningfulNotificationAction(action: MeaningfulNotificationAction): void {
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_KEY)
    if (!raw) return
    const attribution = JSON.parse(raw) as {
      deliveryId?: string
      candidateId?: string
      openedAt?: string
      actions?: string[]
    }
    const openedAt = Date.parse(attribution.openedAt ?? '')
    if (!Number.isFinite(openedAt) || Date.now() - openedAt > 60 * 60 * 1000) {
      sessionStorage.removeItem(ATTRIBUTION_KEY)
      return
    }
    if (attribution.actions?.includes(action)) return
    attribution.actions = [...(attribution.actions ?? []), action]
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution))
    void recordNotificationEvent('meaningful_action', {
      deliveryId: attribution.deliveryId,
      candidateId: attribution.candidateId,
      action,
    }).catch(() => {})
  } catch {
    // Best-effort attribution only.
  }
}
