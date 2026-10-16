import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { QRCodeDisplay } from './QRCodeDisplay'
import type { Study } from '@/types/database'

export const instant = false

interface SharePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: SharePageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('studies')
    .select('title')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  const study = data as Pick<Study, 'title'> | null

  if (!study) {
    return { title: 'Study Not Found | Scripture Deep' }
  }

  return {
    title: `Share: ${study.title} | Scripture Deep`,
    description: `Share this Bible study with others`,
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch the study
  const { data: studyData, error: studyError } = await supabase
    .from('studies')
    .select('id, title, subtitle, key_verse_ref, author_id')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  const study = studyData as Pick<Study, 'id' | 'title' | 'subtitle' | 'key_verse_ref' | 'author_id'> | null

  if (studyError || !study) {
    notFound()
  }

  // Get current user to check if teacher
  const { data: { user } } = await supabase.auth.getUser()
  const isTeacher = user?.id === study.author_id

  // Build the study URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://scripture-deep.vercel.app'
  const studyUrl = `${baseUrl}/study/${slug}`

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-scripture-border">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href={`/study/${slug}`}
            className="text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Study
          </Link>
          {isTeacher && (
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              Dashboard
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 pt-24 pb-12">
        {/* Study info */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-semibold mb-2">{study.title}</h1>
          {study.subtitle && (
            <p className="text-muted-foreground">{study.subtitle}</p>
          )}
          {study.key_verse_ref && (
            <p className="text-sm text-accent mt-2">{study.key_verse_ref}</p>
          )}
        </div>

        {/* QR Code Card */}
        <div className="premium-card p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Share This Study</h2>
            <p className="text-sm text-muted-foreground">
              Scan the QR code or share the link below
            </p>
          </div>

          {/* QR Code */}
          <QRCodeDisplay url={studyUrl} title={study.title} />

          {/* URL Display */}
          <div className="mt-6 p-4 bg-muted rounded-xl">
            <p className="text-xs text-muted-foreground mb-2">Study Link</p>
            <p className="text-sm font-mono break-all select-all">{studyUrl}</p>
          </div>

          {/* WhatsApp share button */}
          <div className="mt-6">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${study.title}\n\n${studyUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-scripture inline-flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Share on WhatsApp
            </a>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p className="mb-2">
            {isTeacher
              ? "Share this QR code with your students or print it for class."
              : "Share this study with a friend who wants to grow in the Word."}
          </p>
          <p>
            Anyone with the link can read the study. They&apos;ll need to sign in to save notes.
          </p>
        </div>
      </main>
    </div>
  )
}
