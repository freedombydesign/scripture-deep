'use client'

import { StudySection } from './StudySection'
import { SectionNotes } from '@/components/notes'
import type { Json } from '@/types/database'

interface StudySectionWithNotesProps {
  id: string
  heading: string
  body: Json
  reflectionQuestions: string[] | null
  position: number
  userId: string | null
  isTeacher: boolean
}

export function StudySectionWithNotes({
  id,
  heading,
  body,
  reflectionQuestions,
  position,
  userId,
  isTeacher,
}: StudySectionWithNotesProps) {
  return (
    <div>
      <StudySection
        id={id}
        heading={heading}
        body={body}
        reflectionQuestions={reflectionQuestions}
        position={position}
      />
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
