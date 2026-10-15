import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BroadcastNotification } from '@/components/dashboard/BroadcastNotification'
import type { User, Study } from '@/types/database'

// This page uses auth which is runtime-only - allow blocking prerender
export const instant = false

export const metadata = {
  title: 'Dashboard | Scripture Deep',
  description: 'Manage your Bible studies',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Check if user is logged in and is a teacher
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/signin')
  }

  const { data: profileData } = await supabase
    .from('users')
    .select('role, display_name')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<User, 'role' | 'display_name'> | null

  if (profile?.role !== 'teacher') {
    redirect('/')
  }

  // Get all studies by this teacher
  type StudyListItem = Pick<Study, 'id' | 'title' | 'slug' | 'status' | 'published_at' | 'created_at'>
  const { data: studiesData } = await supabase
    .from('studies')
    .select('id, title, slug, status, published_at, created_at')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  const studies = studiesData as StudyListItem[] | null

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-scripture-border/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-serif font-semibold">Scripture Deep</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {profile?.display_name || user.email?.split('@')[0]}
            </span>
            <Link
              href="/notes"
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              Notes
            </Link>
            <form action="/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-foreground transition"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-24 pb-12">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your studies and communicate with students</p>
          </div>
          <Link
            href="/dashboard/new"
            className="btn-accent px-5 py-2.5 text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Study
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Studies List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold">My Studies</h2>

            {studies && studies.length > 0 ? (
              <div className="space-y-4">
                {studies.map((study) => (
                  <div
                    key={study.id}
                    className="premium-card p-5 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-semibold">{study.title}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            study.status === 'published'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}
                        >
                          {study.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Created {new Date(study.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {study.status === 'published' && (
                        <Link
                          href={`/study/${study.slug}`}
                          className="text-sm text-muted-foreground hover:text-accent transition"
                        >
                          View
                        </Link>
                      )}
                      <Link
                        href={`/dashboard/${study.id}`}
                        className="text-sm px-4 py-2 border border-scripture-border rounded-lg hover:bg-muted transition"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-scripture-border rounded-2xl">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-muted flex items-center justify-center">
                  <svg className="w-7 h-7 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-muted-foreground mb-4">You haven&apos;t created any studies yet.</p>
                <Link
                  href="/dashboard/new"
                  className="btn-accent inline-flex px-6 py-2.5"
                >
                  Create your first study
                </Link>
              </div>
            )}
          </div>

          {/* Notifications Sidebar */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Send Notifications</h2>

            {/* Scripture Notification */}
            <div className="premium-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/10 to-accent/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Daily Scripture</h3>
                  <p className="text-xs text-muted-foreground">Share a verse with students</p>
                </div>
              </div>
              <BroadcastNotification type="scripture" />
            </div>

            {/* Announcement Notification */}
            <div className="premium-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/10 to-accent/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Announcement</h3>
                  <p className="text-xs text-muted-foreground">Send a message to students</p>
                </div>
              </div>
              <BroadcastNotification type="announcement" />
            </div>

            {/* Quick Links */}
            <div className="border border-scripture-border rounded-2xl p-5">
              <h3 className="font-semibold mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/notes"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition py-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Student Notes
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition py-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
