import { InMemoryAttentionStore } from './store.js'
import { createPostgresAttentionStore } from './postgresStore.js'

/**
 * V1-driftgransen: produktion far aldrig tyst falla tillbaka till processminne.
 * Lokalt behaller vi referenslagringen sa `npm start` fortfarande ar enkel.
 */
export async function createAttentionStore(
  env = process.env,
  { createPostgresStore = createPostgresAttentionStore } = {},
) {
  if (env.DATABASE_URL) {
    return createPostgresStore({ connectionString: env.DATABASE_URL })
  }
  if (env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL kravs for Attention Engine i produktion')
  }
  return new InMemoryAttentionStore()
}
