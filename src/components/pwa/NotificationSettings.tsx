'use client'

import { useState } from 'react'
import { usePWA } from './PWAProvider'

export function NotificationSettings() {
  const { isSupported, isSubscribed, permission, isLoading, subscribe, unsubscribe } = usePWA()
  const [busy, setBusy] = useState(false)

  if (isLoading) {
    return (
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">Loading notification settings...</p>
      </div>
    )
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Push notifications are not supported in this browser.
        </p>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700">
          Notifications are blocked. Please enable them in your browser settings to receive scripture shares.
        </p>
      </div>
    )
  }

  const handleToggle = async () => {
    setBusy(true)
    if (isSubscribed) {
      await unsubscribe()
    } else {
      await subscribe()
    }
    setBusy(false)
  }

  return (
    <div className="p-4 bg-muted rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Push Notifications</h3>
          <p className="text-sm text-muted-foreground">
            {isSubscribed
              ? 'You will receive scripture shares from other users'
              : 'Enable to receive scripture shares from other users'}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={busy}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition
            ${isSubscribed
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-primary text-primary-foreground hover:opacity-90'
            }
            disabled:opacity-50
          `}
        >
          {busy
            ? 'Processing...'
            : isSubscribed
            ? 'Disable'
            : 'Enable Notifications'}
        </button>
      </div>
    </div>
  )
}
