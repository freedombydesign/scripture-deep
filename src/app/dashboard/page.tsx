import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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
      <header className="border-b border-scripture-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold">
            Scripture Deep
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile?.display_name || user.email}
            </span>
            <form action="/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Studies</h1>
          <Link
            href="/dashboard/new"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition"
          >
            New Study
          </Link>
        </div>

        {studies && studies.length > 0 ? (
          <div className="space-y-4">
            {studies.map((study) => (
              <div
                key={study.id}
                className="flex items-center justify-between p-4 border border-scripture-border rounded-lg"
              >
                <div>
                  <h2 className="font-semibold">{study.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
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
                <div className="flex items-center gap-2">
                  {study.status === 'published' && (
                    <Link
                      href={`/study/${study.slug}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/${study.id}`}
                    className="text-sm bg-muted px-3 py-1.5 rounded hover:bg-muted/80 transition"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>You haven&apos;t created any studies yet.</p>
            <Link
              href="/dashboard/new"
              className="inline-block mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 transition"
            >
              Create your first study
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
