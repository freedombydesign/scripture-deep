import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ExportButton } from '@/components/notes/ExportButton'
import { DeleteNoteButton } from '@/components/notes/DeleteNoteButton'
import { NoteReplyForm } from '@/components/notes/NoteReplyForm'
import type { User } from '@/types/database'

// This page uses auth which is runtime-only
export const instant = false

export const metadata = {
  title: 'My Notes | Scripture Deep',
  description: 'Your personal notes on Bible studies',
}

const NOTES_PER_PAGE = 10

interface NotesPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1', 10))
  const supabase = await createClient()

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/signin')
  }

  // Check if user is a teacher
  const { data: profileData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  const profile = profileData as Pick<User, 'role'> | null
  const isTeacher = profile?.role === 'teacher'

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

  // If teacher, also get student notes that are shared (with pagination)
  let sharedStudentNotes: Array<{
    id: string
    body: string
    updated_at: string
    user_id: string
    studentName: string
    sectionHeading: string
    sectionPosition: number
    studyTitle: string
    studySlug: string
    reply: { id: string; body: string } | null
  }> = []
  let totalStudentNotes = 0

  if (isTeacher) {
    // Get count first
    const { count } = await supabase
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('shared_with_teacher', true)
      .neq('user_id', user.id)

    totalStudentNotes = count || 0

    const offset = (currentPage - 1) * NOTES_PER_PAGE
    const { data: studentNotes } = await supabase
      .from('notes')
      .select(`
        id,
        body,
        updated_at,
        user_id,
        sections!inner (
          id,
          heading,
          position,
          studies!inner (
            id,
            title,
            slug
          )
        )
      `)
      .eq('shared_with_teacher', true)
      .neq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + NOTES_PER_PAGE - 1)

    if (studentNotes && studentNotes.length > 0) {
      // Get student names using admin client to bypass RLS
      const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const studentIds = [...new Set(studentNotes.map((n: { user_id: string }) => n.user_id))]
      const { data: students } = await adminSupabase
        .from('users')
        .select('id, display_name, email')
        .in('id', studentIds)

      // Get replies for these notes
      const noteIds = studentNotes.map((n: { id: string }) => n.id)
      const { data: replies } = await adminSupabase
        .from('note_replies')
        .select('id, note_id, body')
        .in('note_id', noteIds)
        .eq('user_id', user.id)

      const replyMap = new Map(
        (replies || []).map((r: { id: string; note_id: string; body: string }) => [
          r.note_id,
          { id: r.id, body: r.body }
        ])
      )

      const studentMap = new Map(
        (students || []).map((s: { id: string; display_name: string | null; email: string }) => [
          s.id,
          s.display_name || s.email.split('@')[0]
        ])
      )

      sharedStudentNotes = studentNotes.map((note: {
        id: string
        body: string
        updated_at: string
        user_id: string
        sections: {
          heading: string
          position: number
          studies: {
            title: string
            slug: string
          }
        }
      }) => ({
        id: note.id,
        body: note.body,
        updated_at: note.updated_at,
        user_id: note.user_id,
        studentName: studentMap.get(note.user_id) || 'Unknown Student',
        sectionHeading: note.sections.heading,
        sectionPosition: note.sections.position,
        studyTitle: note.sections.studies.title,
        studySlug: note.sections.studies.slug,
        reply: replyMap.get(note.id) || null,
      }))
    }
  }

  const totalPages = Math.ceil(totalStudentNotes / NOTES_PER_PAGE)

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
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.updated_at).toLocaleDateString()}
                            </span>
                            <DeleteNoteButton noteId={note.id} />
                          </div>
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

        {/* Student Notes Section for Teachers */}
        {isTeacher && sharedStudentNotes.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-2">Student Notes</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {totalStudentNotes} shared note{totalStudentNotes !== 1 ? 's' : ''}
            </p>
            <div className="space-y-4">
              {sharedStudentNotes.map((note) => (
                <div
                  key={note.id}
                  className="border border-scripture-border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-0.5 rounded mb-1">
                        {note.studentName}
                      </span>
                      <h3 className="font-medium">
                        <Link
                          href={`/study/${note.studySlug}`}
                          className="hover:text-primary transition"
                        >
                          {note.studyTitle}
                        </Link>
                        <span className="text-muted-foreground"> - </span>
                        {note.sectionPosition}. {note.sectionHeading}
                      </h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap mt-2">{note.body}</p>
                  <div className="mt-3 pt-3 border-t border-scripture-border">
                    <NoteReplyForm noteId={note.id} existingReply={note.reply} />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {currentPage > 1 && (
                  <Link
                    href={`/notes?page=${currentPage - 1}`}
                    className="px-3 py-1 text-sm border border-scripture-border rounded hover:bg-muted transition"
                  >
                    Previous
                  </Link>
                )}
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                {currentPage < totalPages && (
                  <Link
                    href={`/notes?page=${currentPage + 1}`}
                    className="px-3 py-1 text-sm border border-scripture-border rounded hover:bg-muted transition"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {isTeacher && sharedStudentNotes.length === 0 && studiesWithNotes.length > 0 && (
          <div className="mt-12 text-center py-8 text-muted-foreground border border-dashed border-scripture-border rounded-lg">
            <p>No students have shared notes with you yet.</p>
          </div>
        )}
      </main>
    </div>
  )
}

