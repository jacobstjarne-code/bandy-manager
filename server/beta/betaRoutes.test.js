import express from 'express'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAttentionRouter } from '../attention/routes.js'
import { InMemoryAttentionStore } from '../attention/store.js'

describe('closed beta routes', () => {
  let server
  let base
  let store
  const secret = 'test-admin-secret-with-at-least-32-chars'
  const admin = { Authorization: `Bearer ${secret}` }

  beforeEach(async () => {
    store = new InMemoryAttentionStore()
    const app = express()
    app.use(express.json())
    app.use('/api', createAttentionRouter({ store, env: { BETA_ADMIN_SECRET: secret } }).router)
    server = await new Promise(resolve => {
      const listener = app.listen(0, '127.0.0.1', () => resolve(listener))
    })
    base = `http://127.0.0.1:${server.address().port}/api`
  })
  afterEach(async () => { await new Promise(resolve => server.close(resolve)) })

  it('protects aggregate stats and never sends raw installation IDs', async () => {
    await store.ensureInstallation('installation-one', 'secret-token')
    await store.recordAnalyticsEvent({ installationId: 'installation-one', event: 'session_start', payload: { sessionId: 'session-12345' } })
    expect((await fetch(`${base}/admin/beta-stats`)).status).toBe(401)
    const response = await fetch(`${base}/admin/beta-stats`, { headers: admin })
    expect(response.status).toBe(200)
    const body = await response.text()
    expect(body).toContain('"active7":1')
    expect(body).not.toContain('installation-one')
  })

  it('redeems a single-use code, blocks a second installation, then revokes access', async () => {
    await store.ensureInstallation('installation-one', 'token-one')
    await store.ensureInstallation('installation-two', 'token-two')
    const created = await fetch(`${base}/admin/beta-invites`, { method: 'POST', headers: admin })
    expect(created.status).toBe(201)
    const { id, code } = await created.json()
    expect(code).toMatch(/^[A-Za-z0-9_-]{32}$/)
    const redeem = (installationId, token) => fetch(`${base}/beta/invites/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-installation-token': token },
      body: JSON.stringify({ installationId, code }),
    })
    expect((await redeem('installation-one', 'wrong-token')).status).toBe(403)
    expect((await redeem('installation-one', 'token-one')).status).toBe(204)
    expect((await redeem('installation-two', 'token-two')).status).toBe(404)
    const access = () => fetch(`${base}/beta/access/installation-one`, {
      headers: { 'x-installation-token': 'token-one' },
    })
    expect((await access()).status).toBe(200)
    expect((await (await access()).json()).granted).toBe(true)
    expect((await fetch(`${base}/admin/beta-invites/${id}`, {
      method: 'DELETE', headers: admin,
    })).status).toBe(204)
    expect((await (await access()).json()).granted).toBe(false)
  })
})
