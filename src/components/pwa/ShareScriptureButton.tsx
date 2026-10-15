'use client'

import { useState } from 'react'

interface ShareScriptureButtonProps {
  scripture: string
  studySlug?: string
}

export function ShareScriptureButton({ scripture, studySlug }: ShareScriptureButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleShare = async () => {
    setSending(true)
    setResult(null)

    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scripture,
          message,
          studySlug,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to share')
      }

      if (data.sent > 0) {
        setResult({ success: true, message: `Shared with ${data.sent} user${data.sent > 1 ? 's' : ''}!` })
      } else {
        setResult({ success: true, message: 'No subscribers to notify' })
      }

      setTimeout(() => {
        setIsOpen(false)
        setMessage('')
        setResult(null)
      }, 2000)
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : 'Failed to share' })
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-scripture-gold/20 text-scripture-gold rounded-md hover:bg-scripture-gold/30 transition"
        title="Share this scripture"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </button>
    )
  }

  return (
    <div className="mt-3 p-3 bg-muted rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Share Scripture</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-muted-foreground mb-2">
        Send &quot;{scripture}&quot; to all subscribed users
      </p>

      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Add a message (optional)"
        className="w-full px-3 py-2 text-sm border border-scripture-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
      />

      {result && (
        <p className={`mt-2 text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
          {result.message}
        </p>
      )}

      <button
        onClick={handleShare}
        disabled={sending}
        className="mt-2 w-full py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {sending ? 'Sending...' : 'Send to Subscribers'}
      </button>
    </div>
  )
}
