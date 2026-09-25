// Säkerhetsgenomgång 2026-09-25: endpointen är en URL servern själv POST:ar
// till vid varje push. Utan värdkontroll kunde en installation registrera en
// intern adress och låta cronen anropa den (SSRF). Bara webbläsarnas egna
// push-tjänster godtas.
const PUSH_SERVICE_HOSTS = [
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'web.push.apple.com',
  'notify.windows.com',
]

export function validPushEndpoint(endpoint) {
  if (typeof endpoint !== 'string' || endpoint.length > 2_048) return false
  let url
  try { url = new URL(endpoint) } catch { return false }
  if (url.protocol !== 'https:' || url.port !== '' || url.username || url.password) return false
  const host = url.hostname.toLowerCase()
  return PUSH_SERVICE_HOSTS.some(allowed => host === allowed || host.endsWith(`.${allowed}`))
}
