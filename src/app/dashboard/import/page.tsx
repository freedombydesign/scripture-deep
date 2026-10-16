import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ImportStudyForm } from '@/components/dashboard/ImportStudyForm'
import type { User } from '@/types/database'

export const instant = false

export const metadata = {
  title: 'Import Study | Scripture Deep',
  description: 'Import a study from markdown',
}

export default async function ImportStudyPage() {
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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-scripture-border/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Import Study</h1>
          <p className="text-muted-foreground mt-1">
            Upload or paste a study file in the{' '}
            <Link href="/docs/study-format" className="text-accent hover:underline">
              standard format
            </Link>
          </p>
        </div>

        <ImportStudyForm userId={user.id} />
      </main>
    </div>
  )
}
