import assert from 'node:assert/strict'
import express from 'express'
import { createHash } from 'node:crypto'
import { newDb } from 'pg-mem'
import { createAttentionRouter, validAnalyticsEvent } from '../server/attention/routes.js'
import { PostgresAttentionStore } from '../server/attention/postgresStore.js'
import { InMemoryAttentionStore } from '../server/attention/store.js'
const output = { checks: [], observations: {} }
const check = (name, actual, expected) => {
  output.checks.push({ name, actual, expected, pass: JSON.stringify(actual) === JSON.stringify(expected) })
}
const db = newDb({ autoCreateForeignKeyIndices: true })
const adapter = db.adapters.createPg()
const pool = new adapter.Pool()
const store = new PostgresAttentionStore(pool)
await store.initialize()
const app = express()
app.use(express.json())
const secret = 'audit-local-secret-not-for-deployment-20260918'
app.use('/api', createAttentionRouter({ store, env: { BETA_ADMIN_SECRET: secret } }).router)
const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)) })
const base = `http://127.0.0.1:${server.address().port}/api`
const request = async (path, method = 'GET', body, headers = {}) => fetch(base + path, {
  method, headers: { 'content-type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body),
})
const admin = { Authorization: `Bearer ${secret}` }
try {
  for (const [path, method] of [['/admin/beta-stats','GET'],['/admin/beta-invites','GET'],['/admin/beta-invites','POST'],['/admin/beta-invites/invite-one','DELETE']]) {
    check(`unauthorized ${method} ${path}`, (await request(path, method)).status, 401)
  }
  for (const id of ['installation-one', 'installation-two', 'installation-admin']) await store.ensureInstallation(id, 'token-for-' + id)
  const createdResponse = await request('/admin/beta-invites', 'POST', undefined, admin)
  const invite = await createdResponse.json()
  check('create invitation', createdResponse.status, 201)
  check('no cache on code', createdResponse.headers.get('cache-control'), 'no-store')
  check('192-bit base64url code shape', /^[A-Za-z0-9_-]{32}$/.test(invite.code), true)
  const redeem = id => request('/beta/invites/redeem', 'POST', { installationId: id, code: invite.code }, { 'x-installation-token': 'token-for-' + id })
  check('wrong installation token', (await request('/beta/invites/redeem', 'POST', { installationId: 'installation-one', code: invite.code }, { 'x-installation-token': 'wrong' })).status, 403)
  const race = await Promise.all(['installation-one','installation-two'].map(redeem))
  check('two simultaneous redemptions, one winner (pg-mem)', race.map(r=>r.status).sort(), [204,404])
  const winner = race[0].status === 204 ? 'installation-one' : 'installation-two'
  check('same owner retry idempotent', (await redeem(winner)).status, 204)
  check('access survives new store instance', await new PostgresAttentionStore(pool).hasBetaAccess(winner), true)
  const listing = JSON.stringify(await store.listBetaInvites())
  check('list excludes code/hash/installation', !listing.includes(invite.code) && !listing.includes('codeHash') && !listing.includes(winner), true)
  for (const durationSeconds of [0,999,1000,1001,1800,3600,86400,86401,-1]) {
    check(`session duration ${durationSeconds}`, validAnalyticsEvent('session_end', { sessionId:'session-audit-123',durationSeconds }), durationSeconds >= 0 && durationSeconds <= 86400)
  }
  check('extra analytics payload field rejected', validAnalyticsEvent('first_match', { name:'private' }), false)
  await store.setPreferences(winner, 'token-for-' + winner, { analytics: false })
  check('analytics opt-out honored server-side', await store.recordAnalyticsEvent({ installationId:winner, event:'first_match',payload:{} }), false)
  check('analytics opt-out preserves access', await store.hasBetaAccess(winner), true)
  await store.setPreferences(winner, 'token-for-' + winner, { analytics:true })
  const postEvent = (id,event,payload) => request('/analytics-events','POST',{ installationId:id,event,payload }, { 'x-installation-token':'token-for-'+id })
  check('30-minute session API', (await postEvent(winner,'session_end',{sessionId:'session-audit-123',durationSeconds:1800})).status,204)
  await postEvent('installation-admin','session_start',{sessionId:'session-admin-123'})
  const stats = await (await request('/admin/beta-stats','GET',undefined,admin)).json()
  output.observations.nonInvitedAdminCountedActive = stats.active7
  // The API accepts gameplay telemetry also before the invite gate is enabled.
  // Admin exclusion belongs at the client source (audit-beta-browser), not an
  // invented rule that excludes all legitimate non-invited gameplay.
  check('gameplay summary includes opted-in non-invited gameplay', stats.active7, 1)
  const expiredHash = createHash('sha256').update('expired').digest('hex')
  await store.createBetaInvite({id:'invite-expired',codeHash:expiredHash,expiresAt:new Date(Date.now()-86400000)})
  check('expired unused invite denied',await store.redeemBetaInvite(expiredHash,'installation-two'),false)
  await pool.query('UPDATE beta_invites SET expires_at = $2 WHERE id = $1',[invite.id,new Date(Date.now()-86400000)])
  check('redemption expiry does not end existing access',await store.hasBetaAccess(winner),true)
  await pool.query('UPDATE beta_invites SET expires_at = $2 WHERE id = $1',[invite.id,new Date(Date.now()+86400000)])
  check('push mute endpoint', (await request('/notifications/push/'+winner, 'DELETE', undefined, {'x-installation-token':'token-for-'+winner})).status, 204)
  check('turning push off preserves beta access',await store.hasBetaAccess(winner),true)
  const loser = winner === 'installation-one' ? 'installation-two' : 'installation-one'
  check('used code stays spent after push removal', (await redeem(loser)).status,404)
  const raw = (await pool.query('SELECT redeemed_at, redeemed_installation_id FROM beta_invites WHERE id = $1',[invite.id])).rows[0]
  output.observations.afterDeletionAndReredeem = raw
  check('revocation succeeds',await store.revokeBetaInvite(invite.id),true)
  check('revoked access denied',await store.hasBetaAccess(loser),false)
  check('revoked code denied',(await redeem(loser)).status,404)
  const memory = new InMemoryAttentionStore()
  memory.ensureInstallation('installation-one','token')
  memory.createBetaInvite({id:'invite-memory',codeHash:'hash',expiresAt:new Date(Date.now()+86400000)})
  memory.redeemBetaInvite('hash','installation-one')
  memory.removeSubscription('installation-one','token')
  output.observations.memoryRetainsDeletedOwner = memory.hasBetaAccess('installation-one')
  assert(output.checks.length > 20)
  console.log(JSON.stringify(output,null,2))
} finally { await new Promise(resolve=>server.close(resolve)); await pool.end() }
