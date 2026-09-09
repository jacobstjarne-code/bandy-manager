export async function runAttentionCron({ env = process.env, fetchImpl = fetch } = {}) {
  const apiBase = env.ATTENTION_API_URL?.trim().replace(/\/+$/, '')
  const secret = env.ATTENTION_CRON_SECRET
  if (!apiBase || !secret) {
    throw new Error('ATTENTION_API_URL och ATTENTION_CRON_SECRET kravs')
  }

  const response = await fetchImpl(`${apiBase}/api/attention/run`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${secret}`,
    },
  })
  const body = await response.text()
  if (!response.ok) {
    throw new Error(`Attention cron misslyckades (${response.status}): ${body}`)
  }
  return body ? JSON.parse(body) : null
}
