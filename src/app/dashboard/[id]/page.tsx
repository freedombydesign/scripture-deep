import { Suspense } from 'react'
import { EditStudyClient } from './EditStudyClient'

// This page uses params which requires blocking prerender
export const instant = false

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditStudyPage({ params }: PageProps) {
  const { id } = await params

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <EditStudyClient studyId={id} />
    </Suspense>
  )
}
