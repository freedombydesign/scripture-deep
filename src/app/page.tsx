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
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-scripture-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-serif font-semibold tracking-tight">Scripture Deep</span>
          </Link>
          <nav className="flex items-center gap-5">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {userProfile?.display_name || user.email?.split('@')[0]}
                </span>
                {isTeacher && (
                  <Link
                    href="/dashboard"
                    className="text-sm text-muted-foreground hover:text-accent transition"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/notes"
                  className="text-sm text-muted-foreground hover:text-accent transition"
                >
                  Notes
                </Link>
                <Link
                  href="/settings"
                  className="text-sm text-muted-foreground hover:text-accent transition"
                >
                  Settings
                </Link>
                <form action="/signout" method="POST">
                  <button
                    type="submit"
                    className="text-sm text-muted-foreground hover:text-accent transition"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link href="/signin" className="btn-accent text-sm px-5 py-2">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section pt-32 pb-20 px-6">
        <div className="pattern-overlay" />
        <div className="max-w-3xl mx-auto text-center relative">
          <p className="text-sm uppercase tracking-widest text-accent font-medium mb-4">
            Topical Bible Studies
          </p>
          <h1 className="text-4xl sm:text-5xl font-serif font-semibold mb-6 tracking-tight leading-tight">
            Study the Word, Deeply
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
            Topical Bible studies with every scripture reference linked to the original
            Hebrew and Greek. Tap any verse to read it in full.
          </p>
          {!user && (
            <div className="flex items-center justify-center gap-4">
              <Link href="/signin" className="btn-accent px-8 py-3">
                Get Started
              </Link>
              <a href="#studies" className="btn-secondary px-8 py-3">
                Browse Studies
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Studies Section */}
      <main id="studies" className="max-w-4xl mx-auto px-6 pb-20">
        {/* Show notification banner for logged-in users */}
        {user && <NotificationBanner />}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-serif font-semibold">Published Studies</h2>
            <p className="text-muted-foreground text-sm mt-1">
              In-depth topical studies with linked scripture
            </p>
          </div>
          {isTeacher && (
            <Link
              href="/dashboard/new"
              className="btn-accent px-5 py-2.5 text-sm"
            >
              Create Study
            </Link>
          )}
        </div>

        {studies && studies.length > 0 ? (
          <div className="space-y-4">
            {studies.map((study) => (
              <Link
                key={study.id}
                href={`/study/${study.slug}`}
                className="premium-card p-6 block group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-serif font-semibold group-hover:text-accent transition">
                      {study.title}
                    </h3>
                    {study.subtitle && (
                      <p className="text-muted-foreground mt-1">
                        {study.subtitle}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      {study.key_verse_ref && (
                        <span className="text-sm text-accent font-medium">
                          {study.key_verse_ref}
                        </span>
                      )}
                      {study.published_at && (
                        <span className="text-sm text-muted-foreground">
                          {new Date(study.published_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-scripture-border rounded-xl">
            <p className="text-muted-foreground mb-4">No studies published yet.</p>
            {isTeacher && (
              <Link
                href="/dashboard/new"
                className="btn-accent inline-flex px-6 py-2.5"
              >
                Create your first study
              </Link>
            )}
          </div>
        )}
      </main>

      {/* Features Section */}
      <section className="border-t border-scripture-border py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="text-3xl mb-3 text-accent">&#x2727;</div>
              <h3 className="font-serif font-semibold mb-2">Instant Verse Lookup</h3>
              <p className="text-sm text-muted-foreground">
                Tap any scripture reference to see the full verse without leaving the page
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3 text-accent">&#x2628;</div>
              <h3 className="font-serif font-semibold mb-2">Hebrew & Greek</h3>
              <p className="text-sm text-muted-foreground">
                Every verse links to Strong&apos;s Concordance for original language study
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3 text-accent">&#x270D;</div>
              <h3 className="font-serif font-semibold mb-2">Personal Notes</h3>
              <p className="text-sm text-muted-foreground">
                Take notes on each section and share them with your teacher
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-scripture-border">
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif text-muted-foreground">Scripture Deep</span>
          <p className="text-sm text-muted-foreground">
            KJV text is public domain
          </p>
        </div>
      </footer>
    </div>
  )
}
