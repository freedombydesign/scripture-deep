'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { extractVersesFromStudy, type ExtractedVerse } from '@/lib/verse-extraction'
import type { Json } from '@/types/database'

interface SectionWithBody {
  body: Json
}

interface VerseChecklistProps {
  studyId: string
  sections: SectionWithBody[]
}

interface VerseWithData extends ExtractedVerse {
  reviewId: string | null
  reviewed: boolean
  wordStudies: Array<{ english_word: string; id: string }>
}

interface DbVerseReview {
  id: string
  verse_reference: string
  reviewed: boolean
}

interface DbWordStudy {
  id: string
  english_word: string
  verse_reference: string
}

export function VerseChecklist({ studyId, sections }: VerseChecklistProps) {
  const [verses, setVerses] = useState<VerseWithData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(true)

  // Load verses and their review status
  useEffect(() => {
    const loadData = async () => {
      // Extract all verses from sections
      const extracted = extractVersesFromStudy(sections)

      if (extracted.length === 0) {
        setVerses([])
        setLoading(false)
        return
      }

      const supabase = createClient()

      // Fetch existing reviews for this study
      const { data: reviewsData } = await supabase
        .from('verse_reviews')
        .select('id, verse_reference, reviewed')
        .eq('study_id', studyId)

      const reviews = (reviewsData || []) as DbVerseReview[]

      // Fetch word studies for this study
      const { data: wordStudiesData } = await supabase
        .from('word_studies')
        .select('id, english_word, verse_reference')
        .eq('study_id', studyId)

      const wordStudies = (wordStudiesData || []) as DbWordStudy[]

      // Map reviews and word studies to verses
      const reviewMap = new Map<string, DbVerseReview>()
      reviews.forEach(r => {
        reviewMap.set(r.verse_reference.toLowerCase(), r)
      })

      // Group word studies by verse reference
      const wordStudyMap = new Map<string, Array<{ english_word: string; id: string }>>()
      wordStudies.forEach(ws => {
        const ref = ws.verse_reference.toLowerCase()
        if (!wordStudyMap.has(ref)) {
          wordStudyMap.set(ref, [])
        }
        wordStudyMap.get(ref)!.push({ english_word: ws.english_word, id: ws.id })
      })

      // Combine extracted verses with review status and word studies
      const versesWithData: VerseWithData[] = extracted.map(v => {
        const refKey = v.reference.toLowerCase()
        const review = reviewMap.get(refKey)
        const ws = wordStudyMap.get(refKey) || []

        return {
          ...v,
          reviewId: review?.id || null,
          reviewed: review?.reviewed || false,
          wordStudies: ws
        }
      })

      setVerses(versesWithData)
      setLoading(false)
    }

    loadData()
  }, [studyId, sections])

  // Toggle review status
  const toggleReview = useCallback(async (verse: VerseWithData) => {
    setSaving(verse.reference)
    const supabase = createClient()

    const newReviewed = !verse.reviewed
    let newReviewId = verse.reviewId

    if (verse.reviewId) {
      // Update existing review
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('verse_reviews') as any)
        .update({
          reviewed: newReviewed,
          reviewed_at: newReviewed ? new Date().toISOString() : null
        })
        .eq('id', verse.reviewId)
    } else {
      // Create new review
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('verse_reviews') as any)
        .insert({
          study_id: studyId,
          verse_reference: verse.reference,
          reviewed: newReviewed,
          reviewed_at: newReviewed ? new Date().toISOString() : null
        })
        .select()
        .single()

      if (data) {
        newReviewId = data.id
      }
    }

    // Update local state
    setVerses(prev => prev.map(v =>
      v.reference === verse.reference
        ? { ...v, reviewed: newReviewed, reviewId: newReviewId }
        : v
    ))

    setSaving(null)
  }, [studyId])

  // Mark all as reviewed
  const markAllReviewed = useCallback(async () => {
    setSaving('all')
    const supabase = createClient()

    const unreviewedVerses = verses.filter(v => !v.reviewed)

    // Create reviews for verses that don't have one
    const toInsert = unreviewedVerses
      .filter(v => !v.reviewId)
      .map(v => ({
        study_id: studyId,
        verse_reference: v.reference,
        reviewed: true,
        reviewed_at: new Date().toISOString()
      }))

    if (toInsert.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('verse_reviews') as any).insert(toInsert)
    }

    // Update existing reviews
    const toUpdate = unreviewedVerses.filter(v => v.reviewId).map(v => v.reviewId!)
    if (toUpdate.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('verse_reviews') as any)
        .update({ reviewed: true, reviewed_at: new Date().toISOString() })
        .in('id', toUpdate)
    }

    // Update local state
    setVerses(prev => prev.map(v => ({ ...v, reviewed: true })))
    setSaving(null)
  }, [studyId, verses])

  // Generate BLB URL
  const getBLBUrl = (verse: ExtractedVerse) => {
    const bookCode = getBlbCode(verse.book)
    return `https://www.blueletterbible.org/kjv/${bookCode}/${verse.chapter}/${verse.verse}/s_1/`
  }

  // Count stats
  const reviewedCount = verses.filter(v => v.reviewed).length
  const totalCount = verses.length

  if (loading) {
    return (
      <div className="border border-scripture-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Loading verse checklist...</p>
      </div>
    )
  }

  if (totalCount === 0) {
    return null
  }

  return (
    <div className="border border-scripture-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-4 bg-muted hover:bg-muted/80 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Verse Checklist</span>
          <span className={`text-xs px-2 py-0.5 rounded ${
            reviewedCount === totalCount
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
          }`}>
            {reviewedCount} of {totalCount} verses reviewed
          </span>
        </div>
        <span className="text-muted-foreground text-sm">
          {collapsed ? '▼' : '▲'}
        </span>
      </button>

      {/* Content */}
      {!collapsed && (
        <div className="p-4 border-t border-scripture-border">
          {/* Actions */}
          <div className="flex items-center gap-3 mb-4">
            {reviewedCount < totalCount && (
              <button
                onClick={markAllReviewed}
                disabled={saving === 'all'}
                className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded hover:opacity-90 transition disabled:opacity-50"
              >
                {saving === 'all' ? 'Marking...' : 'Mark All Reviewed'}
              </button>
            )}
            <span className="text-xs text-muted-foreground">
              Check off each verse after reviewing it on Blue Letter Bible
            </span>
          </div>

          {/* Verse list */}
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {verses.map((verse, index) => (
              <div
                key={`${verse.reference}-${index}`}
                className={`flex items-center gap-3 py-2 px-3 rounded transition ${
                  verse.reviewed ? 'bg-green-50 dark:bg-green-900/10' : 'hover:bg-muted'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleReview(verse)}
                  disabled={saving === verse.reference}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition ${
                    verse.reviewed
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'border-scripture-border hover:border-primary'
                  } ${saving === verse.reference ? 'opacity-50' : ''}`}
                >
                  {verse.reviewed && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Reference link */}
                <a
                  href={getBLBUrl(verse)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm font-medium hover:underline ${
                    verse.reviewed ? 'text-green-700 dark:text-green-400' : 'text-primary'
                  }`}
                >
                  {verse.reference}
                </a>

                {/* Word studies */}
                {verse.wordStudies.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({verse.wordStudies.map(ws => ws.english_word).join(', ')})
                  </span>
                )}

                {/* Source indicator */}
                <span className="text-xs text-muted-foreground/60 ml-auto">
                  {verse.source === 'quote' ? 'quote' : verse.source === 'chapter_range' ? 'range' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper to get BLB book code from book name
function getBlbCode(book: string): string {
  const codeMap: Record<string, string> = {
    'genesis': 'gen', 'exodus': 'exo', 'leviticus': 'lev', 'numbers': 'num',
    'deuteronomy': 'deu', 'joshua': 'jos', 'judges': 'jdg', 'ruth': 'rth',
    '1 samuel': '1sa', '2 samuel': '2sa', '1 kings': '1ki', '2 kings': '2ki',
    '1 chronicles': '1ch', '2 chronicles': '2ch', 'ezra': 'ezr', 'nehemiah': 'neh',
    'esther': 'est', 'job': 'job', 'psalms': 'psa', 'proverbs': 'pro',
    'ecclesiastes': 'ecc', 'song of solomon': 'sng', 'isaiah': 'isa',
    'jeremiah': 'jer', 'lamentations': 'lam', 'ezekiel': 'ezk', 'daniel': 'dan',
    'hosea': 'hos', 'joel': 'joe', 'amos': 'amo', 'obadiah': 'oba',
    'jonah': 'jon', 'micah': 'mic', 'nahum': 'nah', 'habakkuk': 'hab',
    'zephaniah': 'zep', 'haggai': 'hag', 'zechariah': 'zec', 'malachi': 'mal',
    'matthew': 'mat', 'mark': 'mar', 'luke': 'luk', 'john': 'jhn', 'acts': 'act',
    'romans': 'rom', '1 corinthians': '1co', '2 corinthians': '2co',
    'galatians': 'gal', 'ephesians': 'eph', 'philippians': 'php',
    'colossians': 'col', '1 thessalonians': '1th', '2 thessalonians': '2th',
    '1 timothy': '1ti', '2 timothy': '2ti', 'titus': 'tit', 'philemon': 'phm',
    'hebrews': 'heb', 'james': 'jas', '1 peter': '1pe', '2 peter': '2pe',
    '1 john': '1jn', '2 john': '2jn', '3 john': '3jn', 'jude': 'jde',
    'revelation': 'rev'
  }
  return codeMap[book.toLowerCase()] || book.toLowerCase().replace(/\s+/g, '')
}
