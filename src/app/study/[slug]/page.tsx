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
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    const profile = profileData as Pick<User, 'role'> | null
    isTeacher = profile?.role === 'teacher'
    console.log('DEBUG: user.id:', user.id, 'profile:', profile, 'error:', profileError, 'isTeacher:', isTeacher)
  } else {
    console.log('DEBUG: No user found')
  }

  return (
    <div className="min-h-screen">
      {/* Debug info - remove after testing */}
      <div className="bg-yellow-100 p-2 text-xs text-black">
        DEBUG: userId={user?.id || 'null'}, isTeacher={String(isTeacher)}
      </div>

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

      {/* Study header */}
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-4">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">{study.title}</h1>

        {study.subtitle && (
          <p className="text-xl text-muted-foreground mb-4">{study.subtitle}</p>
        )}

        {study.key_verse_ref && (
          <div className="mb-4">
            <span className="text-sm text-muted-foreground">Key verse: </span>
            <LinkedText text={study.key_verse_ref} className="font-medium" />
          </div>
        )}

        {study.theme && (
          <p className="text-lg mb-4 italic">
            <LinkedText text={study.theme} />
          </p>
        )}

        <div className="text-sm text-muted-foreground">
          {author?.display_name && <span>By {author.display_name}</span>}
          {study.published_at && (
            <span>
              {author?.display_name && ' · '}
              {new Date(study.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>

      {/* Section jump bar */}
      {sections.length > 1 && (
        <div className="max-w-3xl mx-auto px-4">
          <SectionJumpBar
            sections={sections.map((s) => ({ id: s.id, heading: s.heading }))}
          />
        </div>
      )}

      {/* Study content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
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

        {sections.length === 0 && (
          <p className="text-muted-foreground italic">
            This study has no sections yet.
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-scripture-border mt-12">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Scripture Deep - Topical Bible studies with linked scripture</p>
          <p className="mt-1">KJV text is public domain</p>
        </div>
      </footer>
    </div>
  )
}
