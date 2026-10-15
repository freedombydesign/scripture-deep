'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Note } from '@/types/database'

interface SectionNotesProps {
  sectionId: string
  userId: string | null
  isTeacher?: boolean
}

export function SectionNotes({ sectionId, userId, isTeacher = false }: SectionNotesProps) {
  const [note, setNote] = useState('')
  const [sharedWithTeacher, setSharedWithTeacher] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Load existing note
  useEffect(() => {
    if (!userId) return

    const loadNote = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('notes')
        .select('body, shared_with_teacher')
        .eq('user_id', userId)
        .eq('section_id', sectionId)
        .single()

      const noteData = data as Pick<Note, 'body' | 'shared_with_teacher'> | null
      if (noteData) {
        setNote(noteData.body)
        setSharedWithTeacher(noteData.shared_with_teacher)
      }
      setLoaded(true)
    }

    loadNote()
  }, [userId, sectionId])

  // Autosave debounce
  const saveNote = useCallback(async (text: string, shared: boolean) => {
    if (!userId) return

    setSaving(true)
    const supabase = createClient()

    const noteData = {
      user_id: userId,
      section_id: sectionId,
      body: text,
      shared_with_teacher: shared,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('notes') as any)
      .upsert(noteData, {
        onConflict: 'user_id,section_id',
      })

    setSaving(false)
    if (error) {
      console.error('Failed to save note:', error)
    } else {
      setLastSaved(new Date())
    }
  }, [userId, sectionId])

  // Delete note
  const deleteNote = useCallback(async () => {
    if (!userId) return

    if (!confirm('Are you sure you want to delete this note?')) return

    setDeleting(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('user_id', userId)
      .eq('section_id', sectionId)

    setDeleting(false)
    if (error) {
      console.error('Failed to delete note:', error)
    } else {
      setNote('')
      setSharedWithTeacher(false)
      setLastSaved(null)
    }
  }, [userId, sectionId])

  // Debounced save on text change
  useEffect(() => {
    if (!loaded || !userId) return

    const timer = setTimeout(() => {
      if (note.trim() || sharedWithTeacher) {
        saveNote(note, sharedWithTeacher)
      }
    }, 1000) // 1 second debounce

    return () => clearTimeout(timer)
  }, [note, sharedWithTeacher, loaded, userId, saveNote])

  // If not logged in, show sign-in prompt
  if (!userId) {
    return (
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <a href="/signin" className="text-primary hover:underline">
            Sign in
          </a>{' '}
          to save notes on this section.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={`note-${sectionId}`} className="text-sm font-medium">
          My Notes
        </label>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
          {!saving && lastSaved && (
            <span className="text-xs text-muted-foreground">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <textarea
        id={`note-${sectionId}`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Write your notes here..."
        rows={4}
        className="w-full p-3 border border-scripture-border rounded-lg bg-background resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
      />

      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={() => saveNote(note, sharedWithTeacher)}
          disabled={saving}
          className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Note'}
        </button>
        {note.trim() && (
          <button
            onClick={deleteNote}
            disabled={deleting}
            className="text-sm text-red-600 hover:text-red-700 px-2 py-1.5 rounded hover:bg-red-50 transition disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
        {lastSaved && (
          <span className="text-xs text-muted-foreground">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      {!isTeacher && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            id={`share-${sectionId}`}
            checked={sharedWithTeacher}
            onChange={(e) => {
              setSharedWithTeacher(e.target.checked)
              // Save immediately when toggling share
              saveNote(note, e.target.checked)
            }}
            className="rounded border-scripture-border"
          />
          <label
            htmlFor={`share-${sectionId}`}
            className="text-sm text-muted-foreground"
          >
            Share this note with the teacher
          </label>
        </div>
      )}
    </div>
  )
}
