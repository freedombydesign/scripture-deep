'use client'

import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import {
  registerServiceWorker,
  isPushSupported,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
} from '@/lib/pwa/register-sw'

interface PWAContextType {
  isSupported: boolean
  isSubscribed: boolean
  permission: NotificationPermission
  isLoading: boolean
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
}

const PWAContext = createContext<PWAContextType>({
  isSupported: false,
  isSubscribed: false,
  permission: 'default',
  isLoading: true,
  subscribe: async () => false,
  unsubscribe: async () => false,
})

export function usePWA() {
  return useContext(PWAContext)
}

interface PWAProviderProps {
  children: React.ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isLoading, setIsLoading] = useState(true)

  // Initialize service worker
  useEffect(() => {
    async function init() {
      const supported = isPushSupported()
      setIsSupported(supported)

      if (!supported) {
        setIsLoading(false)
        return
      }

      // Check current permission
      if ('Notification' in window) {
        setPermission(Notification.permission)
      }

      // Register service worker
      const reg = await registerServiceWorker()
      setRegistration(reg)

      // Check if already subscribed
      if (reg) {
        const sub = await getPushSubscription(reg)
        setIsSubscribed(!!sub)
      }

      setIsLoading(false)
    }

    init()
  }, [])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!registration) return false

    try {
      // Request permission first
      const perm = await requestNotificationPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        return false
      }

      // Subscribe to push
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.error('VAPID key not configured')
        return false
      }

      const subscription = await subscribeToPush(registration, vapidKey)
      if (!subscription) return false

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }

      setIsSubscribed(true)
      return true
    } catch (error) {
      console.error('Subscribe error:', error)
      return false
    }
  }, [registration])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!registration) return false

    try {
      const subscription = await getPushSubscription(registration)
      if (!subscription) return true

      // Unsubscribe locally
      const success = await unsubscribeFromPush(registration)
      if (!success) return false

      // Remove from server
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      })

      setIsSubscribed(false)
      return true
    } catch (error) {
      console.error('Unsubscribe error:', error)
      return false
    }
  }, [registration])

  return (
    <PWAContext.Provider
      value={{
        isSupported,
        isSubscribed,
        permission,
        isLoading,
        subscribe,
        unsubscribe,
      }}
    >
      {children}
    </PWAContext.Provider>
  )
}
