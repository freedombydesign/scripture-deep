'use client'

import { useState } from 'react'
import { LinkedText } from '@/components/scripture'
import type { WordStudy } from '@/types/database'

interface WordStudyCardProps {
  wordStudy: WordStudy
  compact?: boolean
  isTeacher?: boolean
}

export function WordStudyCard({ wordStudy, compact = false, isTeacher = false }: WordStudyCardProps) {
  const [isExpanded, setIsExpanded] = useState(!compact)

  return (
    <div className="border border-scripture-border rounded-xl overflow-hidden bg-scripture-bg">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-serif font-semibold text-accent">
            {wordStudy.english_word}
          </span>
          <span className="text-sm text-muted-foreground">
            {wordStudy.verse_reference}
          </span>
          {isTeacher && wordStudy.needs_check_on_blb && (
            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded">
              Needs verification
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-scripture-border pt-4">
          {/* Original language */}
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              {wordStudy.language}:
            </span>
            <span className="text-lg font-serif">
              {wordStudy.original_word.join(', ')}
            </span>
            {wordStudy.transliteration && (
              <span className="text-sm text-muted-foreground italic">
                ({wordStudy.transliteration})
              </span>
            )}
          </div>

          {/* Strong's numbers */}
          {wordStudy.strongs && wordStudy.strongs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {wordStudy.strongs.map((strong, index) => (
                <a
                  key={index}
                  href={strong.blb_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-muted rounded hover:bg-accent hover:text-white transition"
                >
                  {strong.number}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          )}

          {/* Meaning */}
          {wordStudy.meaning && (
            <div>
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">
                Meaning
              </h4>
              <p className="text-sm leading-relaxed">{wordStudy.meaning}</p>
            </div>
          )}

          {/* What it changes - styled differently */}
          {wordStudy.what_it_changes && (
            <div className="bg-accent/5 border-l-3 border-accent pl-4 py-3 rounded-r-lg">
              <h4 className="text-xs uppercase tracking-wide text-accent font-medium mb-1">
                What This Changes
              </h4>
              <p className="text-sm leading-relaxed italic">
                {wordStudy.what_it_changes}
              </p>
            </div>
          )}

          {/* Cross-references */}
          {wordStudy.cross_references && wordStudy.cross_references.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">
                Cross References
              </h4>
              <div className="text-sm">
                <LinkedText text={wordStudy.cross_references.join('; ')} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
