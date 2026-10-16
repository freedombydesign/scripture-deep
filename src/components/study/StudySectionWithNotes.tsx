'use client'

import { useState } from 'react'
import { StudySection } from './StudySection'
import { SectionNotes } from '@/components/notes'
import { WordStudyCard } from '@/components/word-study/WordStudyCard'
import type { Json, WordStudy } from '@/types/database'

interface StudySectionWithNotesProps {
  id: string
  heading: string
  body: Json
  reflectionQuestions: string[] | null
  position: number
  userId: string | null
  isTeacher: boolean
  released?: boolean
  releaseMode?: 'all_open' | 'release_as_we_go'
  wordStudies?: WordStudy[]
}

export function StudySectionWithNotes({
  id,
  heading,
  body,
  reflectionQuestions,
  position,
  userId,
  isTeacher,
  released = true,
  releaseMode = 'all_open',
  wordStudies = [],
}: StudySectionWithNotesProps) {
  const [readAhead, setReadAhead] = useState(false)

  // Section is locked if release mode is active and section is not released
  const isLocked = releaseMode === 'release_as_we_go' && !released && !isTeacher

  // If locked and user hasn't chosen to read ahead, show locked view
  if (isLocked && !readAhead) {
    return (
      <div id={id} className="scroll-mt-32">
        <div className="border border-scripture-border rounded-xl p-8 bg-muted/30">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-lg font-semibold text-primary">
              {position}.
            </span>
            <h2 className="text-xl font-serif font-semibold">
              {heading}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="italic">Coming up next session</span>
          </div>
          <button
            onClick={() => setReadAhead(true)}
            className="text-sm text-muted-foreground hover:text-foreground underline transition"
          >
            Read ahead anyway
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {isLocked && readAhead && (
        <div className="mb-4 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
          You&apos;re reading ahead of the scheduled session
        </div>
      )}
      <StudySection
        id={id}
        heading={heading}
        body={body}
        reflectionQuestions={reflectionQuestions}
        position={position}
      />

      {/* Word Studies */}
      {wordStudies.length > 0 && (
        <div className="mt-8 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Word Studies
          </h3>
          <div className="space-y-4">
            {wordStudies.map((ws) => (
              <WordStudyCard key={ws.id} wordStudy={ws} compact />
            ))}
          </div>
        </div>
      )}

      <div className="max-w-3xl">
        <SectionNotes
          sectionId={id}
          userId={userId}
          isTeacher={isTeacher}
        />
      </div>
    </div>
  )
}
