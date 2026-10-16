'use client'

import { useState, useRef, useEffect } from 'react'
import { LinkedText } from '@/components/scripture'
import type { WordStudy } from '@/types/database'

interface WordStudyPopoverProps {
  wordStudy: WordStudy
  children: React.ReactNode
}

export function WordStudyPopover({ wordStudy, children }: WordStudyPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <span className="relative inline">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="border-b-2 border-accent border-dashed cursor-pointer hover:border-solid transition-all"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {children}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`Word study for ${wordStudy.english_word}`}
          className="verse-popover absolute z-50 left-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] p-5 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-serif font-semibold text-accent">
                {wordStudy.english_word}
              </h3>
              <p className="text-sm text-muted-foreground">{wordStudy.verse_reference}</p>
            </div>
            {wordStudy.needs_check_on_blb && (
              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded shrink-0">
                Needs verification
              </span>
            )}
          </div>

          {/* Original language */}
          <div className="flex flex-wrap items-baseline gap-2 mb-3">
            <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              {wordStudy.language}:
            </span>
            <span className="text-xl font-serif">
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
            <div className="flex flex-wrap gap-2 mb-4">
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
            <div className="mb-4">
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">
                Meaning
              </h4>
              <p className="text-sm leading-relaxed">{wordStudy.meaning}</p>
            </div>
          )}

          {/* What it changes - styled differently */}
          {wordStudy.what_it_changes && (
            <div className="bg-accent/5 border-l-3 border-accent pl-3 py-2 rounded-r-lg mb-4">
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
    </span>
  )
}
