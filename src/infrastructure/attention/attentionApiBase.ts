function normalizedAttentionApiBase(value: string | undefined): string {
  return value?.trim().replace(/\/+$/, '') ?? ''
}

/** Samma origin lokalt; separat Render-API i drift. */
export function attentionApiUrl(
  path: string,
  configuredBase = import.meta.env.VITE_ATTENTION_API_BASE as string | undefined,
): string {
  if (!path.startsWith('/api/')) throw new Error('Attention API path maste borja med /api/')
  return `${normalizedAttentionApiBase(configuredBase)}${path}`
}
