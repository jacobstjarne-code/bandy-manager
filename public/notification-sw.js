const ALLOWED_DEEP_LINKS = new Set([
  '/game/dashboard',
  '/game/match',
  '/game/tabell',
  '/game/inbox',
  '/game/squad',
])

function safeDeepLink(value) {
  return ALLOWED_DEEP_LINKS.has(value) ? value : '/game/dashboard'
}

async function recordDeliveryEvent(type, data) {
  if (!data.deliveryId || !data.deliveryToken) return
  try {
    await fetch('/api/notification-events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type,
        deliveryId: data.deliveryId,
        deliveryToken: data.deliveryToken,
        candidateId: data.candidateId,
        category: data.category,
      }),
    })
  } catch {
    // Telemetry is best-effort; notification delivery must still succeed.
  }
}

self.addEventListener('push', event => {
  let data
  try {
    data = event.data?.json() ?? {}
  } catch {
    data = {}
  }
  const title = typeof data.title === 'string' ? data.title : 'Bandy Manager'
  const body = typeof data.body === 'string' ? data.body : 'Något väntar i klubben.'
  event.waitUntil(Promise.all([
    recordDeliveryEvent('push_received', data),
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: typeof data.category === 'string' ? `bandy-${data.category}` : 'bandy-attention',
      renotify: false,
      data: {
        deepLink: safeDeepLink(data.deepLink),
        candidateId: data.candidateId,
        deliveryId: data.deliveryId,
        deliveryToken: data.deliveryToken,
        category: data.category,
      },
    }),
    typeof self.registration.setAppBadge === 'function'
      ? self.registration.setAppBadge(1).catch(() => {})
      : Promise.resolve(),
  ]))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const data = event.notification.data ?? {}
  const target = new URL(safeDeepLink(data.deepLink), self.location.origin)
  target.searchParams.set('bmNotification', '1')
  if (data.deliveryId) target.searchParams.set('deliveryId', data.deliveryId)
  if (data.candidateId) target.searchParams.set('candidateId', data.candidateId)

  event.waitUntil(Promise.all([
    recordDeliveryEvent('notification_clicked', data),
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async clients => {
      const existing = clients.find(client => new URL(client.url).origin === self.location.origin)
      if (existing) {
        await existing.navigate(target.href)
        return existing.focus()
      }
      return self.clients.openWindow(target.href)
    }),
  ]))
})
