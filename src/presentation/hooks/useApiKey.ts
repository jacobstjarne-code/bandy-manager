import { useState } from 'react'

export function useApiKey() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('anthropic_api_key') ?? '')

  const saveApiKey = (key: string) => {
    localStorage.setItem('anthropic_api_key', key)
    setApiKey(key)
  }

  return { apiKey, saveApiKey }
}
