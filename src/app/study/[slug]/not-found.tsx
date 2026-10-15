import Link from 'next/link'

export default function StudyNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Study Not Found</h1>
        <p className="text-muted-foreground mb-6">
          This study doesn&apos;t exist or hasn&apos;t been published yet.
        </p>
        <Link
          href="/"
          className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 transition"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
