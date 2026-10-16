'use client'

import { WordStudyCard } from './WordStudyCard'
import type { WordStudy } from '@/types/database'

interface WordStudyListProps {
  wordStudies: WordStudy[]
  groupBySection?: boolean
  sectionHeadings?: Record<string, string>
}

export function WordStudyList({
  wordStudies,
  groupBySection = false,
  sectionHeadings = {},
}: WordStudyListProps) {
  if (wordStudies.length === 0) {
    return null
  }

  if (!groupBySection) {
    return (
      <div className="space-y-4">
        {wordStudies.map((ws) => (
          <WordStudyCard key={ws.id} wordStudy={ws} />
        ))}
      </div>
    )
  }

  // Group by section
  const grouped = wordStudies.reduce((acc, ws) => {
    const sectionId = ws.section_id || 'general'
    if (!acc[sectionId]) {
      acc[sectionId] = []
    }
    acc[sectionId].push(ws)
    return acc
  }, {} as Record<string, WordStudy[]>)

  // Sort sections by their order (assuming section IDs are in order or we have position info)
  const sectionIds = Object.keys(grouped)

  return (
    <div className="space-y-8">
      {sectionIds.map((sectionId) => {
        const sectionWordStudies = grouped[sectionId]
        const heading = sectionHeadings[sectionId] || (sectionId === 'general' ? 'General' : 'Section')

        return (
          <div key={sectionId}>
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-scripture-border">
              {heading}
            </h3>
            <div className="space-y-4">
              {sectionWordStudies.map((ws) => (
                <WordStudyCard key={ws.id} wordStudy={ws} compact />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
