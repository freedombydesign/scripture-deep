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
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-scripture-border/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <span className="text-lg font-semibold">Scripture Deep</span>
          </Link>
          <nav className="flex items-center gap-6">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {userProfile?.display_name || user.email?.split('@')[0]}
                </span>
                {isTeacher && (
                  <Link
                    href="/dashboard"
                    className="text-sm text-muted-foreground hover:text-foreground transition"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/notes"
                  className="text-sm text-muted-foreground hover:text-foreground transition"
                >
                  Notes
                </Link>
                <Link
                  href="/settings"
                  className="text-sm text-muted-foreground hover:text-foreground transition"
                >
                  Settings
                </Link>
                <form action="/signout" method="POST">
                  <button
                    type="submit"
                    className="text-sm text-muted-foreground hover:text-foreground transition"
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
        <div className="absolute inset-0 grid-pattern pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 badge-accent mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Biblical Study Platform
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 tracking-tight">
            Study the Word,{' '}
            <span className="gradient-text">Deeply</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Topical Bible studies with every scripture reference linked to the original
            Hebrew and Greek. Tap any verse to read it, then dive deeper with Blue Letter Bible.
          </p>
          {!user && (
            <div className="flex items-center justify-center gap-4">
              <Link href="/signin" className="btn-accent px-8 py-3 text-base">
                Get Started
              </Link>
              <a href="#studies" className="btn-premium px-8 py-3 text-base">
                <span>Browse Studies</span>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Studies Section */}
      <main id="studies" className="max-w-5xl mx-auto px-6 pb-20">
        {/* Show notification banner for logged-in users */}
        {user && <NotificationBanner />}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Published Studies</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Explore in-depth topical studies with linked scripture
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
          <div className="grid gap-5 sm:grid-cols-2">
            {studies.map((study) => (
              <Link
                key={study.id}
                href={`/study/${study.slug}`}
                className="premium-card p-6 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold group-hover:text-accent transition">
                    {study.title}
                  </h3>
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                {study.subtitle && (
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {study.subtitle}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-auto">
                  {study.key_verse_ref && (
                    <span className="badge">
                      {study.key_verse_ref}
                    </span>
                  )}
                  {study.published_at && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(study.published_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-scripture-border rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
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
      <section className="border-t border-scripture-border py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[var(--gradient-start)]/20 to-[var(--gradient-end)]/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Instant Verse Lookup</h3>
              <p className="text-sm text-muted-foreground">
                Tap any scripture reference to see the full verse without leaving the page
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[var(--gradient-start)]/20 to-[var(--gradient-end)]/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Hebrew & Greek</h3>
              <p className="text-sm text-muted-foreground">
                Every verse links to Strong&apos;s Concordance for original language study
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[var(--gradient-start)]/20 to-[var(--gradient-end)]/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Personal Notes</h3>
              <p className="text-sm text-muted-foreground">
                Take notes on each section and share them with your teacher
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-scripture-border">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="text-sm text-muted-foreground">Scripture Deep</span>
          </div>
          <p className="text-sm text-muted-foreground">
            KJV text is public domain
          </p>
        </div>
      </footer>
    </div>
  )
}
