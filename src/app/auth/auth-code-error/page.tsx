export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-4">Authentication Error</h1>
        <p className="text-muted-foreground mb-6">
          There was a problem signing you in. The link may have expired or already been used.
        </p>
        <a
          href="/signin"
          className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 transition"
        >
          Try again
        </a>
      </div>
    </div>
  )
}
