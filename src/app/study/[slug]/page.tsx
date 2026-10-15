import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SectionJumpBar } from '@/components/study/SectionJumpBar'
import { StudySectionWithNotes } from '@/components/study/StudySectionWithNotes'
import { LinkedText } from '@/components/scripture'
import Link from 'next/link'
import type { Study, Section, User } from '@/types/database'

// This page uses auth and params which are runtime-only
export const instant = false

interface StudyPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: StudyPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('studies')
    .select('title, subtitle, theme')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  const study = data as Pick<Study, 'title' | 'subtitle' | 'theme'> | null

  if (!study) {
    return { title: 'Study Not Found | Scripture Deep' }
  }

  return {
    title: `${study.title} | Scripture Deep`,
    description: study.theme || study.subtitle || 'A topical Bible study',
  }
}

export default async function StudyPage({ params }: StudyPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch the study
  type StudyData = Pick<Study, 'id' | 'title' | 'subtitle' | 'key_verse_ref' | 'theme' | 'author_id' | 'published_at'>
  const { data: studyData, error: studyError } = await supabase
    .from('studies')
    .select('id, title, subtitle, key_verse_ref, theme, author_id, published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  const study = studyData as StudyData | null

  if (studyError || !study) {
    notFound()
  }

  // Fetch sections ordered by position
  type SectionData = Pick<Section, 'id' | 'position' | 'heading' | 'body' | 'reflection_questions'>
  const { data: sectionsData, error: sectionsError } = await supabase
    .from('sections')
    .select('id, position, heading, body, reflection_questions')
    .eq('study_id', study.id)
    .order('position')

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError)
  }

  const sections = (sectionsData as SectionData[] | null) || []

  // Fetch author name
  const { data: authorData } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', study.author_id)
    .single()

  const author = authorData as Pick<User, 'display_name'> | null

  // Get current user for notes
  const { data: { user } } = await supabase.auth.getUser()
  let isTeacher = false
  if (user) {
    const { data: profileData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    const profile = profileData as Pick<User, 'role'> | null
    isTeacher = profile?.role === 'teacher'
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-scripture-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-accent transition"
          >
            &larr; Scripture Deep
          </Link>
          {user && (
            <Link
              href="/notes"
              className="text-sm text-muted-foreground hover:text-accent transition"
            >
              My Notes
            </Link>
          )}
        </div>
      </header>

      {/* Study header */}
      <div className="pt-24 pb-8 px-6 border-b border-scripture-border bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold mb-3">
            {study.title}
          </h1>

          {study.subtitle && (
            <p className="text-xl text-muted-foreground mb-4">{study.subtitle}</p>
          )}

          {study.key_verse_ref && (
            <div className="mb-4">
              <span className="text-sm text-muted-foreground mr-2">Key verse:</span>
              <LinkedText text={study.key_verse_ref} className="font-medium text-accent" />
            </div>
          )}

          {study.theme && (
            <p className="text-lg mb-4 italic text-muted-foreground font-serif">
              <LinkedText text={study.theme} />
            </p>
          )}

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {author?.display_name && (
              <span>By {author.display_name}</span>
            )}
            {study.published_at && (
              <span>
                {author?.display_name && <span className="mx-2">&middot;</span>}
                {new Date(study.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Section jump bar */}
      {sections.length > 1 && (
        <div className="sticky top-[65px] z-40 glass border-b border-scripture-border">
          <div className="max-w-3xl mx-auto px-6 py-3">
            <SectionJumpBar
              sections={sections.map((s) => ({ id: s.id, heading: s.heading }))}
            />
          </div>
        </div>
      )}

      {/* Study content */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="space-y-10">
          {sections.map((section) => (
            <StudySectionWithNotes
              key={section.id}
              id={section.id}
              heading={section.heading}
              body={section.body}
              reflectionQuestions={section.reflection_questions}
              position={section.position}
              userId={user?.id || null}
              isTeacher={isTeacher}
            />
          ))}
        </div>

        {sections.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground italic">
              This study has no sections yet.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-scripture-border mt-12">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif text-muted-foreground">Scripture Deep</span>
          <p className="text-sm text-muted-foreground">
            KJV text is public domain
          </p>
        </div>
      </footer>
    </div>
  )
}
