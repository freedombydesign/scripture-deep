'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ProfileFormProps {
  userId: string
  initialName: string
  email: string
  role: string
}

export function ProfileForm({ userId, initialName, email, role }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('users') as any)
      .update({ display_name: displayName.trim() || null })
      .eq('id', userId)

    setSaving(false)

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } else {
      setMessage({ type: 'success', text: 'Profile updated!' })
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          disabled
          className="w-full px-3 py-2 border border-scripture-border rounded-lg bg-muted text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
      </div>

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium mb-1">
          Display Name
        </label>
        <input
          type="text"
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-3 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <p className="text-xs text-muted-foreground mt-1">This name will be shown to teachers when you share notes</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Role</label>
        <div className="px-3 py-2 border border-scripture-border rounded-lg bg-muted text-muted-foreground capitalize">
          {role}
        </div>
      </div>

      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}
