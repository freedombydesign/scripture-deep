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

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="space-y-8">
          {/* Profile Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Profile</h2>
            <ProfileForm
              userId={user.id}
              initialName={userProfile?.display_name || ''}
              email={userProfile?.email || user.email || ''}
              role={userProfile?.role || 'student'}
            />
          </section>

          {/* Notifications Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Notifications</h2>
            <NotificationSettings />
          </section>
        </div>
      </main>
    </div>
  )
}
