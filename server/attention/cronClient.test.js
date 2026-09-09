import { describe, expect, it, vi } from 'vitest'
import { runAttentionCron } from './cronClient.js'

describe('runAttentionCron', () => {
  it('kraver bade API-adress och hemlighet', async () => {
    await expect(runAttentionCron({ env: {}, fetchImpl: vi.fn() }))
      .rejects.toThrow('ATTENTION_API_URL')
  })

  it('anropar den skyddade korningen en gang', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ enabled: false, delivered: 0 }),
    })
    await expect(runAttentionCron({
      env: {
        ATTENTION_API_URL: 'https://attention.example/',
        ATTENTION_CRON_SECRET: 'cron-secret',
      },
      fetchImpl,
    })).resolves.toEqual({ enabled: false, delivered: 0 })
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://attention.example/api/attention/run',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer cron-secret' }),
      }),
    )
  })

  it('gor en rod driftkorning synlig', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'not ready',
    })
    await expect(runAttentionCron({
      env: { ATTENTION_API_URL: 'https://attention.example', ATTENTION_CRON_SECRET: 'secret' },
      fetchImpl,
    })).rejects.toThrow('503')
  })
})
