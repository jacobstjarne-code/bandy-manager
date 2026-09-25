import express from 'express'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAttentionRouter, normalizeBetaCode } from '../attention/routes.js'
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
    const created = await fetch(`${base}/admin/beta-invites`, {
      method: 'POST', headers: { ...admin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientLabel: 'Erik', recipientContact: 'erik@example.se' }),
    })
    expect(created.status).toBe(201)
    const { id, code } = await created.json()
    // Betafynd 5: tio tecken Crockford base32, visade som XXXXX-XXXXX.
    expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/)
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
    const invites = await (await fetch(`${base}/admin/beta-invites`, { headers: admin })).json()
    expect(invites.invites[0]).toMatchObject({
      recipientLabel: 'Erik', recipientContact: null, redeemedAt: expect.any(String),
    })
    expect((await fetch(`${base}/admin/beta-invites/${id}`, {
      method: 'DELETE', headers: admin,
    })).status).toBe(204)
    expect((await (await access()).json()).granted).toBe(false)
  })

  it('betafynd 5: koden tål gemener, mellanslag och förväxlingsbara tecken', async () => {
    expect(normalizeBetaCode(' abcde-fghjk ')).toBe('ABCDEFGHJK')
    expect(normalizeBetaCode('0ILo1 23456')).toBe('0110123456')
    expect(normalizeBetaCode('ABCDE-FGHJ')).toBeNull()
    expect(normalizeBetaCode('ABCDE-FGHJU')).toBeNull()
    const legacy = 'aB3_-xY9aB3_-xY9aB3_-xY9aB3_-xY9'
    expect(normalizeBetaCode(`  ${legacy} `)).toBe(legacy)
    expect(normalizeBetaCode(42)).toBeNull()

    await store.ensureInstallation('installation-one', 'token-one')
    const created = await fetch(`${base}/admin/beta-invites`, {
      method: 'POST', headers: { ...admin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientLabel: 'Birger' }),
    })
    const { code } = await created.json()
    const typed = ` ${code.toLowerCase().replace('-', ' ')} `
    const redeemed = await fetch(`${base}/beta/invites/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-installation-token': 'token-one' },
      body: JSON.stringify({ installationId: 'installation-one', code: typed }),
    })
    expect(redeemed.status).toBe(204)
  })

  it('betafynd 4: tillträdet överlever att installationen gallras', async () => {
    await store.ensureInstallation('installation-one', 'token-one')
    const created = await fetch(`${base}/admin/beta-invites`, {
      method: 'POST', headers: { ...admin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientLabel: 'Birger' }),
    })
    const { code } = await created.json()
    const redeem = () => fetch(`${base}/beta/invites/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-installation-token': 'token-one' },
      body: JSON.stringify({ installationId: 'installation-one', code }),
    })
    expect((await redeem()).status).toBe(204)
    expect(store.pruneInactiveInstallations(new Date(Date.now() + 1000))).toBe(1)
    await store.ensureInstallation('installation-one', 'token-one')
    const access = await fetch(`${base}/beta/access/installation-one`, {
      headers: { 'x-installation-token': 'token-one' },
    })
    expect((await access.json()).granted).toBe(true)
  })

  it('queues a normalized email once without an installation identity', async () => {
    const join = email => fetch(`${base}/beta/waitlist`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, installationId: 'must-not-be-stored' }),
    })
    expect((await join(' Testare@Example.SE ')).status).toBe(200)
    expect((await join('testare@example.se')).status).toBe(409)
    expect((await join('inte-en-adress')).status).toBe(400)

    expect((await fetch(`${base}/admin/beta-waitlist`)).status).toBe(401)
    const listed = await fetch(`${base}/admin/beta-waitlist`, { headers: admin })
    expect(listed.status).toBe(200)
    expect(await listed.json()).toEqual({
      waitlist: [{ email: 'testare@example.se', createdAt: expect.any(String) }],
    })
  })

  it('deletes the waitlist address when its invitation code is issued', async () => {
    await fetch(`${base}/beta/waitlist`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'beta@example.se' }),
    })
    const created = await fetch(`${base}/admin/beta-invites`, {
      method: 'POST', headers: { ...admin, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        waitlistEmail: 'beta@example.se', recipientLabel: 'Beta Testare',
        recipientContact: 'beta@example.se',
      }),
    })
    expect(created.status).toBe(201)
    const listed = await fetch(`${base}/admin/beta-waitlist`, { headers: admin })
    expect(await listed.json()).toEqual({ waitlist: [] })
  })

  it('kräver en mottagaretikett och gallrar kontaktuppgiften vid återkallelse', async () => {
    expect((await fetch(`${base}/admin/beta-invites`, { method: 'POST', headers: admin })).status).toBe(400)
    const created = await fetch(`${base}/admin/beta-invites`, {
      method: 'POST', headers: { ...admin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientLabel: 'Erik', recipientContact: '+46 70 123 45 67' }),
    })
    const { id } = await created.json()
    expect((await fetch(`${base}/admin/beta-invites/${id}`, { method: 'DELETE', headers: admin })).status).toBe(204)
    const invites = await (await fetch(`${base}/admin/beta-invites`, { headers: admin })).json()
    expect(invites.invites[0]).toMatchObject({
      recipientLabel: 'Erik', recipientContact: null, revokedAt: expect.any(String),
    })
  })
})
