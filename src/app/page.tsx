import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { User, Study } from '@/types/database'
import { NotificationBanner } from '@/components/pwa/NotificationBanner'

// This page uses auth which is runtime-only
export const instant = false

export default async function Home() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Get user profile if logged in
  let userProfile: Pick<User, 'display_name' | 'role'> | null = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('display_name, role')
      .eq('id', user.id)
      .single()
    userProfile = data as Pick<User, 'display_name' | 'role'> | null
  }

  // Get published studies
  type StudyPreview = Pick<Study, 'id' | 'title' | 'subtitle' | 'slug' | 'key_verse_ref' | 'published_at'>
  const { data: studiesData } = await supabase
    .from('studies')
    .select('id, title, subtitle, slug, key_verse_ref, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10)

  const studies = studiesData as StudyPreview[] | null
  const isTeacher = userProfile?.role === 'teacher'

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-scripture-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Scripture Deep</h1>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {userProfile?.display_name || user.email}
                </span>
                {isTeacher && (
                  <Link
                    href="/dashboard"
                    className="text-sm text-primary hover:underline"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/notes"
                  className="text-sm text-primary hover:underline"
                >
                  My Notes
                </Link>
                <form action="/signout" method="POST">
                  <button
                    type="submit"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/signin"
                className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-4xl font-bold mb-4">Study the Word, Deeply</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Topical Bible studies with every scripture reference linked to the original
          Hebrew and Greek. Tap any verse to read it, then dive deeper with Blue Letter Bible.
        </p>
      </div>

      {/* Studies list */}
      <main className="max-w-4xl mx-auto px-4 pb-12">
        {/* Show notification banner for logged-in users */}
        {user && <NotificationBanner />}

        <h3 className="text-lg font-semibold mb-6">Published Studies</h3>

        {studies && studies.length > 0 ? (
          <div className="grid gap-4">
            {studies.map((study) => (
              <Link
                key={study.id}
                href={`/study/${study.slug}`}
                className="block p-6 border border-scripture-border rounded-lg hover:border-primary/50 hover:bg-scripture-bg transition"
              >
                <h4 className="text-xl font-semibold mb-1">{study.title}</h4>
                {study.subtitle && (
                  <p className="text-muted-foreground mb-2">{study.subtitle}</p>
                )}
                {study.key_verse_ref && (
                  <p className="text-sm text-primary">{study.key_verse_ref}</p>
                )}
                {study.published_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(study.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No studies published yet.</p>
            {isTeacher && (
              <Link
                href="/dashboard/new"
                className="inline-block mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 transition"
              >
                Create your first study
              </Link>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-scripture-border">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Scripture Deep - Topical Bible studies with linked scripture</p>
          <p className="mt-1">KJV text is public domain</p>
        </div>
      </footer>
    </div>
  )
}
