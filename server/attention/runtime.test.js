import { describe, expect, it, vi } from 'vitest'
import { InMemoryAttentionStore } from './store.js'
import { createAttentionStore } from './runtime.js'

describe('createAttentionStore', () => {
  it('anvander referenslagringen lokalt utan databas', async () => {
    expect(await createAttentionStore({ NODE_ENV: 'development' }))
      .toBeInstanceOf(InMemoryAttentionStore)
  })

  it('vagrar processminne i produktion', async () => {
    await expect(createAttentionStore({ NODE_ENV: 'production' }))
      .rejects.toThrow('DATABASE_URL')
  })

  it('kopplar Postgres nar DATABASE_URL finns', async () => {
    const store = { kind: 'postgres' }
    const createPostgresStore = vi.fn().mockResolvedValue(store)
    await expect(createAttentionStore(
      { NODE_ENV: 'production', DATABASE_URL: 'postgresql://internal/db' },
      { createPostgresStore },
    )).resolves.toBe(store)
    expect(createPostgresStore).toHaveBeenCalledWith({
      connectionString: 'postgresql://internal/db',
    })
  })
})
