import { useCallback, useEffect, useState } from 'react'
import {
  getWebPushCapability,
  subscribeToClubNotifications,
  unsubscribeFromClubNotifications,
  type WebPushCapability,
} from '../../infrastructure/attention/attentionClient'

export function useClubNotifications() {
  const [capability, setCapability] = useState<WebPushCapability>(getWebPushCapability)
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null)
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null)
  const [isChanging, setIsChanging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const nextCapability = getWebPushCapability()
    setCapability(nextCapability)
    if (!nextCapability.supported) {
      setIsSubscribed(false)
      setBackendAvailable(false)
      return
    }
    try {
      const backendResponse = await fetch('/api/notifications/vapid-public-key', {
        headers: { accept: 'application/json' },
      })
      const contentType = backendResponse.headers.get('content-type') ?? ''
      if (!backendResponse.ok || !contentType.includes('application/json')) {
        setBackendAvailable(false)
        return
      }
      const status = await backendResponse.json() as { configured?: boolean }
      setBackendAvailable(status.configured === true)
      if (nextCapability.requiresHomeScreenInstall) {
        setIsSubscribed(false)
        return
      }
      const registration = await navigator.serviceWorker.getRegistration()
      const subscription = await registration?.pushManager.getSubscription()
      setIsSubscribed(subscription != null)
    } catch {
      setIsSubscribed(false)
      setBackendAvailable(false)
    }
  }, [])
  useEffect(() => { void refresh() }, [refresh])

  const enable = useCallback(async () => {
    setIsChanging(true)
    setError(null)
    try {
      await subscribeToClubNotifications()
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'notification_setup_failed')
      await refresh()
    } finally {
      setIsChanging(false)
    }
  }, [refresh])

  const disable = useCallback(async () => {
    setIsChanging(true)
    setError(null)
    try {
      await unsubscribeFromClubNotifications()
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'notification_teardown_failed')
    } finally {
      setIsChanging(false)
    }
  }, [refresh])

  return { capability, backendAvailable, isSubscribed, isChanging, error, enable, disable }
}
