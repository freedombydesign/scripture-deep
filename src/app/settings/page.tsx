import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/settings/ProfileForm'
import { NotificationSettings } from '@/components/pwa/NotificationSettings'
import type { User } from '@/types/database'

export const instant = false

export const metadata = {
  title: 'Settings | Scripture Deep',
  description: 'Manage your account settings',
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/signin')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, email, role')
    .eq('id', user.id)
    .single()

  const userProfile = profile as Pick<User, 'display_name' | 'email' | 'role'> | null

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
            href="/notes"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            My Notes
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>

        <div className="space-y-8">
          {/* Profile Section */}
          <section className="premium-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/10 to-accent/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Profile</h2>
                <p className="text-sm text-muted-foreground">Your personal information</p>
              </div>
            </div>
            <ProfileForm
              userId={user.id}
              initialName={userProfile?.display_name || ''}
              email={userProfile?.email || user.email || ''}
              role={userProfile?.role || 'student'}
            />
          </section>

          {/* Notifications Section */}
          <section className="premium-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/10 to-accent/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Notifications</h2>
                <p className="text-sm text-muted-foreground">Manage push notification preferences</p>
              </div>
            </div>
            <NotificationSettings />
          </section>

          {/* Sign Out Section */}
          <section className="border border-scripture-border rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Sign out</h2>
                <p className="text-sm text-muted-foreground">End your current session</p>
              </div>
              <form action="/signout" method="POST">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm border border-scripture-border rounded-lg hover:bg-muted transition"
                >
                  Sign out
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
