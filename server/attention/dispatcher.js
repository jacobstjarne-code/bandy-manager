import { createHash, randomBytes, randomUUID } from 'node:crypto'
import webpush from 'web-push'
import { DEFAULT_PREFERENCES } from './store.js'

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

function inHoldout(installationId) {
  const bucket = createHash('sha256').update(installationId).digest().readUInt32BE(0) % 100
  return bucket < 10
}

function localTime(date, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: timeZone || 'UTC',
    }).formatToParts(date)
    return {
      hour: Number(parts.find(part => part.type === 'hour')?.value ?? 0),
      minute: Number(parts.find(part => part.type === 'minute')?.value ?? 0),
    }
  } catch {
    return { hour: date.getUTCHours(), minute: date.getUTCMinutes() }
  }
}

// stickiness-settings-kategorier: tysta timmar är nu spelarens eget
// fönster (default 21.30-08.00, samma som tidigare hårdkodat). Fönster som
// spänner midnatt (start > slut i minuter-på-dygnet) är det normala fallet;
// ett icke-spännande fönster (start <= slut) stöds ändå symmetriskt.
export function isQuietHours(date, timeZone, quietHours = DEFAULT_PREFERENCES.quietHours) {
  const { hour, minute } = localTime(date, timeZone)
  const minutesOfDay = hour * 60 + minute
  const startMinutes = quietHours.startHour * 60 + quietHours.startMinute
  const endMinutes = quietHours.endHour * 60 + quietHours.endMinute
  return startMinutes > endMinutes
    ? minutesOfDay >= startMinutes || minutesOfDay < endMinutes
    : minutesOfDay >= startMinutes && minutesOfDay < endMinutes
}

function deliveryToken() {
  return randomBytes(24).toString('base64url')
}

function configureWebPush(env) {
  const subject = env.VAPID_SUBJECT
  const publicKey = env.VAPID_PUBLIC_KEY
  const privateKey = env.VAPID_PRIVATE_KEY
  if (!subject || !publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  return true
}

export function createAttentionDispatcher({ store, env = process.env, now = () => new Date() }) {
  const configured = configureWebPush(env)

  return {
    configured,
    publicKey: configured ? env.VAPID_PUBLIC_KEY : null,

    async dispatchDue() {
      if (!configured) {
        return { configured: false, attempted: 0, delivered: 0, skipped: 0 }
      }

      const currentTime = now()
      let attempted = 0
      let delivered = 0
      let skipped = 0

      for (const { installation, candidate } of await store.listDispatchable(currentTime)) {
        const timeZone = installation.snapshot.timeZone || installation.metadata.timeZone
        const quietHours = (installation.preferences ?? DEFAULT_PREFERENCES).quietHours
        const sentToday = store.deliveryCountSince(installation, currentTime.getTime() - DAY_MS)
        const sentThisWeek = store.deliveryCountSince(installation, currentTime.getTime() - WEEK_MS)
        const breaksOrdinaryCooldown = candidate.importance === 'major'
        if (inHoldout(installation.id) || isQuietHours(currentTime, timeZone, quietHours) ||
            (!breaksOrdinaryCooldown && sentToday >= 1) || sentThisWeek >= 3) {
          skipped++
          continue
        }

        const id = randomUUID()
        const token = deliveryToken()
        await store.registerDelivery({
          id,
          installationId: installation.id,
          candidateId: candidate.id,
          saveId: installation.snapshot.saveId,
          category: candidate.category,
          importance: candidate.importance,
          narrativePost: candidate.narrativePost,
          tokenHash: createHash('sha256').update(token).digest(),
          createdAt: currentTime.toISOString(),
        })
        await store.recordEvent({
          type: 'candidate_selected', installationId: installation.id,
          candidateId: candidate.id, category: candidate.category, deliveryId: id,
        })
        await store.recordEvent({
          type: 'delivery_attempted', installationId: installation.id,
          candidateId: candidate.id, category: candidate.category, deliveryId: id,
        })
        attempted++

        const payload = JSON.stringify({
          schemaVersion: 1,
          title: candidate.title,
          body: candidate.body,
          deepLink: candidate.deepLink,
          category: candidate.category,
          candidateId: candidate.id,
          deliveryId: id,
          deliveryToken: token,
        })

        try {
          await webpush.sendNotification(installation.subscription, payload, {
            TTL: 6 * 60 * 60,
            urgency: candidate.importance === 'major' ? 'high' : 'normal',
            topic: createHash('sha256').update(candidate.dedupeKey).digest('base64url').slice(0, 32),
          })
          await store.markDelivered(installation.id, candidate.dedupeKey, currentTime, id)
          await store.recordEvent({
            type: 'delivery_succeeded', installationId: installation.id,
            candidateId: candidate.id, category: candidate.category, deliveryId: id,
          })
          delivered++
        } catch (error) {
          const statusCode = error?.statusCode
          if (statusCode === 404 || statusCode === 410) {
            await store.removeExpiredSubscription(installation.id)
          }
          await store.recordEvent({
            type: 'delivery_failed', installationId: installation.id,
            candidateId: candidate.id, category: candidate.category, deliveryId: id,
            statusCode: statusCode ?? null,
          })
        }
      }

      return { configured: true, attempted, delivered, skipped }
    },
  }
}
