'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NoteReplyFormProps {
  noteId: string
  existingReply?: { id: string; body: string } | null
}

export function NoteReplyForm({ noteId, existingReply }: NoteReplyFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [body, setBody] = useState(existingReply?.body || '')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return

    setSaving(true)
    const supabase = createClient()

    if (existingReply) {
      // Update existing reply
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('note_replies') as any)
        .update({ body: body.trim(), updated_at: new Date().toISOString() })
        .eq('id', existingReply.id)
    } else {
      // Create new reply
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('note_replies') as any)
        .insert({
          note_id: noteId,
          user_id: user.id,
          body: body.trim(),
        })
    }

    setSaving(false)
    setIsOpen(false)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!existingReply || !confirm('Delete this reply?')) return

    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('note_replies') as any)
      .delete()
      .eq('id', existingReply.id)

    router.refresh()
  }

  if (!isOpen && !existingReply) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs text-primary hover:underline"
      >
        Reply
      </button>
    )
  }

  if (!isOpen && existingReply) {
    return (
      <div className="mt-2 pl-4 border-l-2 border-primary/30">
        <p className="text-xs text-primary font-medium mb-1">Your reply:</p>
        <p className="text-sm">{existingReply.body}</p>
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => setIsOpen(true)}
            className="text-xs text-muted-foreground hover:underline"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your reply..."
        rows={2}
        className="w-full px-3 py-2 text-sm border border-scripture-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <div className="flex gap-2 mt-1">
        <button
          type="submit"
          disabled={saving || !body.trim()}
          className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Sending...' : existingReply ? 'Update' : 'Send Reply'}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false)
            setBody(existingReply?.body || '')
          }}
          className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
