'use client'

import { useState } from 'react'
import { usePWA } from './PWAProvider'

export function NotificationBanner() {
  const { isSupported, isSubscribed, permission, isLoading, subscribe } = usePWA()
  const [dismissed, setDismissed] = useState(false)
  const [busy, setBusy] = useState(false)

  // Don't show if not supported, loading, already subscribed, or dismissed
  if (isLoading || !isSupported || isSubscribed || dismissed || permission === 'denied') {
    return null
  }

  const handleSubscribe = async () => {
    setBusy(true)
    await subscribe()
    setBusy(false)
  }

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium">Enable Notifications</p>
          <p className="text-xs text-muted-foreground">
            Receive scripture shares from other users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSubscribe}
            disabled={busy}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition disabled:opacity-50"
          >
            {busy ? 'Enabling...' : 'Enable'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition"
            title="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
