import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ExportButton } from '@/components/notes/ExportButton'

// This page uses auth which is runtime-only
export const instant = false

export const metadata = {
  title: 'My Notes | Scripture Deep',
  description: 'Your personal notes on Bible studies',
}

export default async function NotesPage() {
  const supabase = await createClient()

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/signin')
  }

  // Get all notes with their section and study info
  const { data: notes } = await supabase
    .from('notes')
    .select(`
      id,
      body,
      updated_at,
      section_id,
      sections!inner (
        id,
        heading,
        position,
        study_id,
        studies!inner (
          id,
          title,
          slug
        )
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  // Group notes by study
  type NoteWithSection = {
    id: string
    body: string
    updated_at: string
    section_id: string
    sections: {
      id: string
      heading: string
      position: number
      study_id: string
      studies: {
        id: string
        title: string
        slug: string
      }
    }
  }

  const studyMap = new Map<string, {
    study: { id: string; title: string; slug: string }
    notes: Array<{
      id: string
      body: string
      updated_at: string
      sectionHeading: string
      sectionPosition: number
    }>
  }>()

  if (notes) {
    for (const note of notes as unknown as NoteWithSection[]) {
      const study = note.sections.studies
      const existing = studyMap.get(study.id)

      const noteData = {
        id: note.id,
        body: note.body,
        updated_at: note.updated_at,
        sectionHeading: note.sections.heading,
        sectionPosition: note.sections.position,
      }

      if (existing) {
        existing.notes.push(noteData)
      } else {
        studyMap.set(study.id, {
          study,
          notes: [noteData],
        })
      }
    }
  }

  const studiesWithNotes = Array.from(studyMap.values())

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-scripture-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            &larr; Scripture Deep
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Notes</h1>

        {studiesWithNotes.length > 0 ? (
          <div className="space-y-8">
            {studiesWithNotes.map(({ study, notes: studyNotes }) => (
              <div key={study.id} className="border border-scripture-border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-3 border-b border-scripture-border">
                  <Link
                    href={`/study/${study.slug}`}
                    className="text-lg font-semibold hover:text-primary transition"
                  >
                    {study.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {studyNotes.length} note{studyNotes.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="divide-y divide-scripture-border">
                  {studyNotes
                    .sort((a, b) => a.sectionPosition - b.sectionPosition)
                    .map((note) => (
                      <div key={note.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-primary">
                            {note.sectionPosition}. {note.sectionHeading}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {new Date(note.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.body}</p>
                      </div>
                    ))}
                </div>

                {/* Export button */}
                <div className="bg-muted px-4 py-3 border-t border-scripture-border">
                  <ExportButton
                    studyTitle={study.title}
                    notes={studyNotes.sort((a, b) => a.sectionPosition - b.sectionPosition)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>You haven&apos;t written any notes yet.</p>
            <Link
              href="/"
              className="inline-block mt-4 text-primary hover:underline"
            >
              Browse studies
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

