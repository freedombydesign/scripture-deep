'use client'

import { useState, useRef, useEffect } from 'react'
import { type VerseRef, generateBLBUrl, generateBLBInterlinearUrl, formatVerseRef } from '@/lib/scripture'
import { fetchVersesForRef, formatVerses } from '@/lib/verses'
import { ShareScriptureButton } from '@/components/pwa/ShareScriptureButton'

interface ScriptureLinkProps {
  text: string
  refs: VerseRef[]
}

export function ScriptureLink({ text, refs }: ScriptureLinkProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [verseText, setVerseText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const linkRef = useRef<HTMLButtonElement>(null)

  const primaryRef = refs[0]
  const blbUrl = generateBLBUrl(primaryRef)
  const interlinearUrl = generateBLBInterlinearUrl(primaryRef)

  // Fetch verse text when popover opens
  useEffect(() => {
    if (isOpen && verseText === null && !loading) {
      setLoading(true)
      fetchVersesForRef(primaryRef)
        .then((verses) => {
          if (verses.length > 0) {
            setVerseText(formatVerses(verses))
          } else {
            setVerseText('Verse not found')
          }
        })
        .catch(() => {
          setVerseText('Failed to load verse')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isOpen, verseText, loading, primaryRef])

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        linkRef.current &&
        !linkRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape key or scroll
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    function handleScroll() {
      setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      window.addEventListener('scroll', handleScroll, true)
      return () => {
        document.removeEventListener('keydown', handleEscape)
        window.removeEventListener('scroll', handleScroll, true)
      }
    }
  }, [isOpen])

  // Calculate popover position on desktop
  const handleClick = () => {
    if (!isOpen && linkRef.current) {
      const rect = linkRef.current.getBoundingClientRect()
      const popoverWidth = 320 // w-80 = 20rem = 320px
      const viewportWidth = window.innerWidth

      // Position below the link, centered if possible
      let left = rect.left + (rect.width / 2) - (popoverWidth / 2)

      // Ensure it doesn't overflow right
      if (left + popoverWidth > viewportWidth - 16) {
        left = viewportWidth - popoverWidth - 16
      }
      // Ensure it doesn't overflow left
      if (left < 16) {
        left = 16
      }

      setPopoverPosition({
        top: rect.bottom + 8,
        left: left
      })
    }
    setIsOpen(!isOpen)
  }

  // Check if we're on mobile (used for conditional styling)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  return (
    <span className="relative inline">
      <button
        ref={linkRef}
        onClick={handleClick}
        className="scripture-ref"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {text}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`${formatVerseRef(primaryRef)} verse text`}
          className="verse-popover fixed z-50 w-80 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto p-4 animate-in fade-in slide-in-from-top-2 duration-200"
          style={
            popoverPosition && !isMobile
              ? { top: popoverPosition.top, left: popoverPosition.left }
              : { bottom: 16, left: 16, right: 16, width: 'auto' }
          }
        >
          {/* Reference header */}
          <div className="font-semibold text-sm mb-2 text-primary">
            {formatVerseRef(primaryRef)}
          </div>

          {/* Verse text */}
          <div className="scripture-text text-base mb-4 break-words">
            {loading ? (
              <span className="text-muted-foreground italic">Loading...</span>
            ) : (
              verseText
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <a
              href={blbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
            >
              Open in Blue Letter Bible
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <a
              href={interlinearUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-accent text-white rounded-md hover:opacity-90 transition"
            >
              Original language
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <ShareScriptureButton scripture={formatVerseRef(primaryRef)} />
          </div>

          {/* Multiple references note */}
          {refs.length > 1 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Also references: {refs.slice(1).map(r => formatVerseRef(r)).join(', ')}
            </p>
          )}
        </div>
      )}
    </span>
  )
}
