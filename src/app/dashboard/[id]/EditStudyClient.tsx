'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import type { Study, Section, Json } from '@/types/database'

interface SectionState {
  id: string
  position: number
  heading: string
  body: string
  reflection_questions: string[] | null
}

interface EditStudyClientProps {
  studyId: string
}

export function EditStudyClient({ studyId }: EditStudyClientProps) {
  const [study, setStudy] = useState<Study | null>(null)
  const [sections, setSections] = useState<SectionState[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state for study metadata
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [keyVerseRef, setKeyVerseRef] = useState('')
  const [theme, setTheme] = useState('')

  // Load study and sections
  useEffect(() => {
    const loadStudy = async () => {
      const supabase = createClient()

      const { data: studyData, error: studyError } = await supabase
        .from('studies')
        .select('*')
        .eq('id', studyId)
        .single()

      if (studyError || !studyData) {
        setError('Study not found')
        setLoading(false)
        return
      }

      const typedStudy = studyData as Study
      setStudy(typedStudy)
      setTitle(typedStudy.title)
      setSubtitle(typedStudy.subtitle || '')
      setKeyVerseRef(typedStudy.key_verse_ref || '')
      setTheme(typedStudy.theme || '')

      const { data: sectionsData } = await supabase
        .from('sections')
        .select('*')
        .eq('study_id', studyId)
        .order('position')

      const typedSections = (sectionsData as Section[] | null) || []
      setSections(typedSections.map(s => ({
        ...s,
        body: typeof s.body === 'string' ? s.body : JSON.stringify(s.body)
      })))
      setLoading(false)
    }

    loadStudy()
  }, [studyId])

  // Save study metadata
  const saveStudy = useCallback(async () => {
    if (!study) return

    setSaving(true)
    const supabase = createClient()

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('studies') as any)
      .update({
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        slug,
        key_verse_ref: keyVerseRef.trim() || null,
        theme: theme.trim() || null,
      })
      .eq('id', studyId)

    setSaving(false)
  }, [study, studyId, title, subtitle, keyVerseRef, theme])

  // Add a new section
  const addSection = async () => {
    const supabase = createClient()
    const newPosition = sections.length + 1

    const newSection = {
      study_id: studyId,
      position: newPosition,
      heading: `Section ${newPosition}`,
      body: { type: 'doc', content: [{ type: 'paragraph' }] } as Json,
      reflection_questions: [] as string[],
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: insertError } = await (supabase.from('sections') as any)
      .insert(newSection)
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      return
    }

    const typedData = data as Section
    setSections([...sections, {
      ...typedData,
      body: JSON.stringify(typedData.body)
    }])
  }

  // Update a section
  const updateSection = async (sectionId: string, updates: Partial<SectionState>) => {
    const supabase = createClient()

    let bodyToSave: Json | undefined = undefined
    if (updates.body !== undefined) {
      try {
        bodyToSave = JSON.parse(updates.body)
      } catch {
        bodyToSave = updates.body
      }
    }

    const dbUpdates: Partial<Section> = {}
    if (updates.heading !== undefined) dbUpdates.heading = updates.heading
    if (updates.reflection_questions !== undefined) dbUpdates.reflection_questions = updates.reflection_questions
    if (bodyToSave !== undefined) dbUpdates.body = bodyToSave

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('sections') as any)
      .update(dbUpdates)
      .eq('id', sectionId)

    setSections(sections.map((s) =>
      s.id === sectionId ? { ...s, ...updates } : s
    ))
  }

  // Delete a section
  const deleteSection = async (sectionId: string) => {
    if (!confirm('Delete this section?')) return

    const supabase = createClient()

    const { error: deleteError } = await supabase
      .from('sections')
      .delete()
      .eq('id', sectionId)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    // Reorder remaining sections
    const remaining = sections.filter((s) => s.id !== sectionId)
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i + 1) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('sections') as any)
          .update({ position: i + 1 })
          .eq('id', remaining[i].id)
        remaining[i].position = i + 1
      }
    }

    setSections(remaining)
  }

  // Publish/unpublish study
  const togglePublish = async () => {
    if (!study) return

    const supabase = createClient()
    const newStatus: 'draft' | 'published' = study.status === 'published' ? 'draft' : 'published'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('studies') as any)
      .update({
        status: newStatus,
        published_at: newStatus === 'published' ? new Date().toISOString() : null,
      })
      .eq('id', studyId)

    setStudy({ ...study, status: newStatus })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (error && !study) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/dashboard" className="text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-scripture-border sticky top-0 bg-background z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            &larr; Dashboard
          </Link>
          <div className="flex items-center gap-3">
            {saving && (
              <span className="text-sm text-muted-foreground">Saving...</span>
            )}
            <button
              onClick={saveStudy}
              className="text-sm bg-muted px-3 py-1.5 rounded hover:bg-muted/80 transition"
            >
              Save
            </button>
            <button
              onClick={togglePublish}
              className={`text-sm px-3 py-1.5 rounded transition ${
                study?.status === 'published'
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {study?.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
            {study?.status === 'published' && (
              <Link
                href={`/study/${study.slug}`}
                className="text-sm text-primary hover:underline"
                target="_blank"
              >
                View →
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Study metadata */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Study Details</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveStudy}
                className="w-full px-4 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                onBlur={saveStudy}
                className="w-full px-4 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="keyVerse" className="block text-sm font-medium mb-1">
                  Key Verse
                </label>
                <input
                  id="keyVerse"
                  type="text"
                  value={keyVerseRef}
                  onChange={(e) => setKeyVerseRef(e.target.value)}
                  onBlur={saveStudy}
                  placeholder="e.g., Daniel 10:12"
                  className="w-full px-4 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div>
              <label htmlFor="theme" className="block text-sm font-medium mb-1">
                Theme Statement
              </label>
              <textarea
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                onBlur={saveStudy}
                rows={2}
                className="w-full px-4 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
              />
            </div>
          </div>
        </section>

        {/* Sections */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Sections</h2>
            <button
              onClick={addSection}
              className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded hover:opacity-90 transition"
            >
              Add Section
            </button>
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-scripture-border rounded-lg">
              <p className="text-muted-foreground mb-4">No sections yet</p>
              <button
                onClick={addSection}
                className="text-primary hover:underline"
              >
                Add your first section
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {sections.map((section) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  onUpdate={(updates) => updateSection(section.id, updates)}
                  onDelete={() => deleteSection(section.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

// Section editor component
function SectionEditor({
  section,
  onUpdate,
  onDelete,
}: {
  section: SectionState
  onUpdate: (updates: Partial<SectionState>) => void
  onDelete: () => void
}) {
  const [heading, setHeading] = useState(section.heading)
  const [questions, setQuestions] = useState(
    section.reflection_questions?.join('\n') || ''
  )

  return (
    <div className="border border-scripture-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-muted border-b border-scripture-border">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-primary">
            {section.position}.
          </span>
          <input
            type="text"
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            onBlur={() => onUpdate({ heading })}
            className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0"
            placeholder="Section heading"
          />
        </div>
        <button
          onClick={onDelete}
          className="text-sm text-red-500 hover:text-red-700"
        >
          Delete
        </button>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Content</label>
          <RichTextEditor
            content={section.body}
            onChange={(content) => onUpdate({ body: content })}
            placeholder="Write your section content here. Scripture references will be automatically linked."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Reflection Questions (one per line)
          </label>
          <textarea
            value={questions}
            onChange={(e) => setQuestions(e.target.value)}
            onBlur={() =>
              onUpdate({
                reflection_questions: questions
                  .split('\n')
                  .map((q) => q.trim())
                  .filter(Boolean),
              })
            }
            rows={3}
            placeholder="What does this passage teach about...?&#10;How can you apply this to your life?"
            className="w-full px-4 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
          />
        </div>
      </div>
    </div>
  )
}
