'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewStudyPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [keyVerseRef, setKeyVerseRef] = useState('')
  const [theme, setTheme] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be signed in')
      setLoading(false)
      return
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Create the study
    const newStudy = {
      author_id: user.id,
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      slug,
      key_verse_ref: keyVerseRef.trim() || null,
      theme: theme.trim() || null,
      status: 'draft' as const,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: insertError } = await (supabase.from('studies') as any)
      .insert(newStudy)
      .select('id')
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Redirect to edit page
    const studyData = data as { id: string } | null
    if (studyData) {
      router.push(`/dashboard/${studyData.id}`)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-scripture-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">New Study</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Heard From the First Day"
              className="w-full px-4 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <div>
            <label htmlFor="subtitle" className="block text-sm font-medium mb-1">
              Subtitle
            </label>
            <input
              id="subtitle"
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g., A Study on Prayer and Spiritual Warfare"
              className="w-full px-4 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label htmlFor="keyVerse" className="block text-sm font-medium mb-1">
              Key Verse
            </label>
            <input
              id="keyVerse"
              type="text"
              value={keyVerseRef}
              onChange={(e) => setKeyVerseRef(e.target.value)}
              placeholder="e.g., Daniel 10:12"
              className="w-full px-4 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              This will be automatically linked to Blue Letter Bible
            </p>
          </div>

          <div>
            <label htmlFor="theme" className="block text-sm font-medium mb-1">
              Theme Statement
            </label>
            <textarea
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g., Why are some prayers answered quickly while others seem delayed? This study explores the spiritual warfare behind prayer."
              rows={3}
              className="w-full px-4 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Study'}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-2 border border-scripture-border rounded-lg hover:bg-muted transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
