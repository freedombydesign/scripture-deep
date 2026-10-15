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
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-scripture-border/50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Scripture Deep
          </Link>
          <Link
            href="/settings"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Settings
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Notes</h1>
          <p className="text-muted-foreground mt-1">Your personal study notes organized by study</p>
        </div>

        {studiesWithNotes.length > 0 ? (
          <div className="space-y-6">
            {studiesWithNotes.map(({ study, notes: studyNotes }) => (
              <div key={study.id} className="premium-card overflow-hidden">
                <div className="bg-muted/50 px-5 py-4 border-b border-scripture-border">
                  <Link
                    href={`/study/${study.slug}`}
                    className="text-lg font-semibold hover:text-accent transition"
                  >
                    {study.title}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {studyNotes.length} note{studyNotes.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="divide-y divide-scripture-border">
                  {studyNotes
                    .sort((a, b) => a.sectionPosition - b.sectionPosition)
                    .map((note) => (
                      <div key={note.id} className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium">
                            <span className="badge mr-2">{note.sectionPosition}</span>
                            {note.sectionHeading}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.updated_at).toLocaleDateString()}
                            </span>
                            <DeleteNoteButton noteId={note.id} />
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap text-muted-foreground">{note.body}</p>
                      </div>
                    ))}
                </div>

                {/* Export button */}
                <div className="bg-muted/50 px-5 py-3 border-t border-scripture-border">
                  <ExportButton
                    studyTitle={study.title}
                    notes={studyNotes.sort((a, b) => a.sectionPosition - b.sectionPosition)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-scripture-border rounded-2xl">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-muted flex items-center justify-center">
              <svg className="w-7 h-7 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <p className="text-muted-foreground">You haven&apos;t written any notes yet.</p>
            <Link
              href="/"
              className="inline-block mt-4 btn-accent px-5 py-2 text-sm"
            >
              Browse studies
            </Link>
          </div>
        )}

        {/* Student Notes Section for Teachers */}
        {isTeacher && sharedStudentNotes.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Student Notes</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalStudentNotes} shared note{totalStudentNotes !== 1 ? 's' : ''} from your students
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {sharedStudentNotes.map((note) => (
                <div
                  key={note.id}
                  className="premium-card p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="badge-accent text-xs px-2.5 py-1 mb-2 inline-block">
                        {note.studentName}
                      </span>
                      <h3 className="font-medium">
                        <Link
                          href={`/study/${note.studySlug}`}
                          className="hover:text-accent transition"
                        >
                          {note.studyTitle}
                        </Link>
                        <span className="text-muted-foreground mx-2">·</span>
                        <span className="text-muted-foreground">{note.sectionPosition}. {note.sectionHeading}</span>
                      </h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">{note.body}</p>
                  <div className="mt-4 pt-4 border-t border-scripture-border">
                    <NoteReplyForm noteId={note.id} studentId={note.user_id} existingReply={note.reply} />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                {currentPage > 1 && (
                  <Link
                    href={`/notes?page=${currentPage - 1}`}
                    className="px-4 py-2 text-sm border border-scripture-border rounded-lg hover:bg-muted transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </Link>
                )}
                <span className="text-sm text-muted-foreground px-4">
                  Page {currentPage} of {totalPages}
                </span>
                {currentPage < totalPages && (
                  <Link
                    href={`/notes?page=${currentPage + 1}`}
                    className="px-4 py-2 text-sm border border-scripture-border rounded-lg hover:bg-muted transition flex items-center gap-2"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {isTeacher && sharedStudentNotes.length === 0 && studiesWithNotes.length > 0 && (
          <div className="mt-12 text-center py-12 border border-dashed border-scripture-border rounded-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted flex items-center justify-center">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-muted-foreground">No students have shared notes with you yet.</p>
          </div>
        )}
      </main>
    </div>
  )
}

