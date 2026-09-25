import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { InMemoryAttentionStore } from '../attention/store.js'
import { PostgresAttentionStore } from '../attention/postgresStore.js'
import { validAnalyticsEvent } from '../attention/routes.js'

for (const adapter of ['memory', 'postgres']) {
  describe(`${adapter}: independent push and beta lifecycles`, () => {
    it('mutes push without losing access/analytics; deletion never makes a used code reusable', async () => {
      const pool = adapter === 'postgres' ? new (newDb().adapters.createPg().Pool)() : null
      const store = pool ? new PostgresAttentionStore(pool) : new InMemoryAttentionStore()
      try {
        if (pool) await store.initialize()
        await store.setSubscription('installation-owner', 'token-owner', { endpoint: 'https://push.test' })
        await store.ensureInstallation('installation-other', 'token-other')
        await store.createBetaInvite({ id: 'invite-lifecycle', codeHash: 'hash-lifecycle', expiresAt: new Date(Date.now() + 86400000) })
        expect(await store.redeemBetaInvite('hash-lifecycle', 'installation-owner')).toBe(true)
        await store.recordAnalyticsEvent({ installationId: 'installation-owner', event: 'first_match', payload: {} })
        await store.setPreferences('installation-owner', 'token-owner', { analytics: false, quietHours: { startHour: 17, endHour: 11 } })
        expect(await store.disablePush('installation-owner', 'wrong')).toBe(false)
        expect(await store.disablePush('installation-owner', 'token-owner')).toBe(true)
        expect(await store.hasBetaAccess('installation-owner')).toBe(true)
        expect(await store.authenticateInstallation('installation-owner', 'token-owner')).toBe(true)
        expect((await store.getPreferences('installation-owner')).analytics).toBe(false)
        expect((await store.getPreferences('installation-owner')).quietHours.startHour).not.toBe(17)
        expect(await store.listAllAnalyticsEvents(new Date(0))).toHaveLength(1)
        expect(await store.listDispatchable(new Date())).toEqual([])
        expect(await store.redeemBetaInvite('hash-lifecycle', 'installation-other')).toBe(false)
        await store.removeSubscription('installation-owner', 'token-owner')
        expect(await store.hasBetaAccess('installation-owner')).toBe(false)
        expect(await store.listAllAnalyticsEvents(new Date(0))).toHaveLength(0)
        expect(await store.redeemBetaInvite('hash-lifecycle', 'installation-other')).toBe(false)
        await store.ensureInstallation('installation-owner', 'token-new')
        expect(await store.redeemBetaInvite('hash-lifecycle', 'installation-owner')).toBe(false)
      } finally { await pool?.end() }
    })

    it('betafynd 4: gallring efter uppehåll behåller tillträdet för samma id och token', async () => {
      const pool = adapter === 'postgres' ? new (newDb().adapters.createPg().Pool)() : null
      const store = pool ? new PostgresAttentionStore(pool) : new InMemoryAttentionStore()
      try {
        if (pool) await store.initialize()
        await store.ensureInstallation('installation-away', 'token-away')
        await store.ensureInstallation('installation-spy', 'token-spy')
        await store.createBetaInvite({ id: 'invite-away', codeHash: 'hash-away', expiresAt: new Date(Date.now() + 86400000) })
        await store.createBetaInvite({ id: 'invite-spy', codeHash: 'hash-spy', expiresAt: new Date(Date.now() + 86400000) })
        expect(await store.redeemBetaInvite('hash-away', 'installation-away')).toBe(true)
        expect(await store.redeemBetaInvite('hash-spy', 'installation-spy')).toBe(true)
        expect(await store.pruneInactiveInstallations(new Date(Date.now() + 60_000))).toBe(2)
        expect(await store.hasBetaAccess('installation-away')).toBe(false)
        // Samma id med en annan token får ingenting.
        await store.ensureInstallation('installation-spy', 'token-other')
        expect(await store.hasBetaAccess('installation-spy')).toBe(false)
        // Samma id och samma token: tillbaka i spelet utan ny kod.
        await store.ensureInstallation('installation-away', 'token-away')
        expect(await store.hasBetaAccess('installation-away')).toBe(true)
        // Koden går fortfarande inte att ge vidare.
        expect(await store.redeemBetaInvite('hash-away', 'installation-spy')).toBe(false)
        // Uttrycklig avregistrering efter återkomsten återkallar fortfarande.
        await store.pruneInactiveInstallations(new Date(Date.now() + 60_000))
        await store.ensureInstallation('installation-away', 'token-away')
        expect(await store.removeSubscription('installation-away', 'token-away')).toBe(true)
        await store.ensureInstallation('installation-away', 'token-away')
        expect(await store.hasBetaAccess('installation-away')).toBe(false)
      } finally { await pool?.end() }
    })
  })
}

it.each([0, 999, 1000, 1001, 1800, 3600, 86400])('accepts a session of %i seconds', durationSeconds => {
  expect(validAnalyticsEvent('session_end', { sessionId: 'session-lifecycle', durationSeconds })).toBe(true)
})
it.each([-1, 86401, 1.5, NaN, '1800'])('rejects invalid duration %s', durationSeconds => {
  expect(validAnalyticsEvent('session_end', { sessionId: 'session-lifecycle', durationSeconds })).toBe(false)
})
