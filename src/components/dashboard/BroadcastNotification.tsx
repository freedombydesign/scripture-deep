'use client'

import { useState } from 'react'

interface BroadcastNotificationProps {
  type: 'scripture' | 'announcement'
}

export function BroadcastNotification({ type }: BroadcastNotificationProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return

    setSending(true)
    setResult(null)

    try {
      const res = await fetch('/api/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          type,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult({
          type: 'success',
          text: `Notification sent to ${data.sent} student${data.sent !== 1 ? 's' : ''}!`,
        })
        setTitle('')
        setBody('')
      } else {
        setResult({
          type: 'error',
          text: data.error || 'Failed to send notification',
        })
      }
    } catch {
      setResult({
        type: 'error',
        text: 'Failed to send notification',
      })
    }

    setSending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor={`${type}-title`} className="block text-sm font-medium mb-1.5">
          Title
        </label>
        <input
          id={`${type}-title`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === 'scripture' ? 'Daily Scripture' : 'Announcement'}
          className="w-full px-4 py-2.5 border border-scripture-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
        />
      </div>

      <div>
        <label htmlFor={`${type}-body`} className="block text-sm font-medium mb-1.5">
          {type === 'scripture' ? 'Scripture Reference & Text' : 'Message'}
        </label>
        <textarea
          id={`${type}-body`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            type === 'scripture'
              ? 'John 3:16 - For God so loved the world...'
              : 'Enter your announcement message...'
          }
          rows={3}
          className="w-full px-4 py-2.5 border border-scripture-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition resize-none"
        />
      </div>

      {result && (
        <div
          className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
            result.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}
        >
          {result.type === 'success' ? (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {result.text}
        </div>
      )}

      <button
        type="submit"
        disabled={sending || !title.trim() || !body.trim()}
        className="w-full btn-accent py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {sending ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Sending...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send to All Students
          </>
        )}
      </button>
    </form>
  )
}
