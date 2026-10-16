/**
 * Verse Extraction Utility
 * Extracts all verse references from study content for the Verse Checklist
 */

import { findScriptureReferences, formatVerseRef, type VerseRef } from './scripture'

// Book chapter counts for expanding chapter ranges
const CHAPTER_COUNTS: Record<string, number> = {
  'genesis': 50, 'exodus': 40, 'leviticus': 27, 'numbers': 36, 'deuteronomy': 34,
  'joshua': 24, 'judges': 21, 'ruth': 4, '1 samuel': 31, '2 samuel': 24,
  '1 kings': 22, '2 kings': 25, '1 chronicles': 29, '2 chronicles': 36,
  'ezra': 10, 'nehemiah': 13, 'esther': 10, 'job': 42, 'psalms': 150,
  'proverbs': 31, 'ecclesiastes': 12, 'song of solomon': 8, 'isaiah': 66,
  'jeremiah': 52, 'lamentations': 5, 'ezekiel': 48, 'daniel': 12, 'hosea': 14,
  'joel': 3, 'amos': 9, 'obadiah': 1, 'jonah': 4, 'micah': 7, 'nahum': 3,
  'habakkuk': 3, 'zephaniah': 3, 'haggai': 2, 'zechariah': 14, 'malachi': 4,
  'matthew': 28, 'mark': 16, 'luke': 24, 'john': 21, 'acts': 28, 'romans': 16,
  '1 corinthians': 16, '2 corinthians': 13, 'galatians': 6, 'ephesians': 6,
  'philippians': 4, 'colossians': 4, '1 thessalonians': 5, '2 thessalonians': 3,
  '1 timothy': 6, '2 timothy': 4, 'titus': 3, 'philemon': 1, 'hebrews': 13,
  'james': 5, '1 peter': 5, '2 peter': 3, '1 john': 5, '2 john': 1, '3 john': 1,
  'jude': 1, 'revelation': 22
}

// Verse counts per chapter for common books (simplified - expand as needed)
const VERSE_COUNTS: Record<string, Record<number, number>> = {
  'job': {
    1: 22, 2: 13, 3: 26, 4: 21, 5: 27, 6: 30, 7: 21, 8: 22, 9: 35, 10: 22,
    11: 20, 12: 25, 13: 28, 14: 22, 15: 35, 16: 22, 17: 16, 18: 21, 19: 29, 20: 29,
    21: 34, 22: 30, 23: 17, 24: 25, 25: 6, 26: 14, 27: 23, 28: 28, 29: 25, 30: 31,
    31: 40, 32: 22, 33: 33, 34: 37, 35: 16, 36: 33, 37: 24, 38: 41, 39: 30, 40: 24,
    41: 34, 42: 17
  },
  'daniel': {
    1: 21, 2: 49, 3: 30, 4: 37, 5: 31, 6: 28, 7: 28, 8: 27, 9: 27, 10: 21,
    11: 45, 12: 13
  },
  'luke': {
    1: 80, 2: 52, 3: 38, 4: 44, 5: 39, 6: 49, 7: 50, 8: 56, 9: 62, 10: 42,
    11: 54, 12: 59, 13: 35, 14: 35, 15: 32, 16: 31, 17: 37, 18: 43, 19: 48, 20: 47,
    21: 38, 22: 71, 23: 56, 24: 53
  },
  'ephesians': {
    1: 23, 2: 22, 3: 21, 4: 32, 5: 33, 6: 24
  },
  'revelation': {
    1: 20, 2: 29, 3: 22, 4: 11, 5: 14, 6: 17, 7: 17, 8: 13, 9: 21, 10: 11,
    11: 19, 12: 17, 13: 18, 14: 20, 15: 8, 16: 21, 17: 18, 18: 24, 19: 21, 20: 15,
    21: 27, 22: 21
  }
}

export interface ExtractedVerse {
  reference: string
  book: string
  chapter: number
  verse: number
  source: 'quote' | 'inline' | 'chapter_range'
}

/**
 * Extract all verses from study sections
 */
export function extractVersesFromStudy(sections: Array<{ body: any }>): ExtractedVerse[] {
  const allVerses: ExtractedVerse[] = []
  const seen = new Set<string>()

  for (const section of sections) {
    const sectionText = extractTextFromTiptap(section.body)
    const verses = extractVersesFromText(sectionText)

    for (const verse of verses) {
      const key = `${verse.book}|${verse.chapter}|${verse.verse}`
      if (!seen.has(key)) {
        seen.add(key)
        allVerses.push(verse)
      }
    }
  }

  // Sort by book order, then chapter, then verse
  return allVerses.sort((a, b) => {
    if (a.book !== b.book) return a.book.localeCompare(b.book)
    if (a.chapter !== b.chapter) return a.chapter - b.chapter
    return a.verse - b.verse
  })
}

/**
 * Extract text content from Tiptap JSON
 */
function extractTextFromTiptap(body: any): string {
  if (!body || typeof body !== 'object') return ''

  let text = ''

  function traverse(node: any) {
    if (node.type === 'text' && node.text) {
      text += node.text + ' '
    }
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        traverse(child)
      }
    }
  }

  traverse(body)
  return text
}

/**
 * Extract verses from text content
 */
function extractVersesFromText(text: string): ExtractedVerse[] {
  const verses: ExtractedVerse[] = []

  // Find all scripture references
  const matches = findScriptureReferences(text)

  for (const match of matches) {
    for (const ref of match.refs) {
      const expandedVerses = expandReference(ref)
      verses.push(...expandedVerses)
    }
  }

  // Also look for chapter ranges like "Job 1-2"
  const chapterRangePattern = /(\d?\s*[A-Za-z]+)\s+(\d+)-(\d+)(?!\s*:)/g
  let match
  while ((match = chapterRangePattern.exec(text)) !== null) {
    const bookName = match[1].trim()
    const startChapter = parseInt(match[2])
    const endChapter = parseInt(match[3])

    // Expand to all verses in range
    const chapterVerses = expandChapterRange(bookName, startChapter, endChapter)
    verses.push(...chapterVerses)
  }

  return verses
}

/**
 * Expand a single reference to individual verses
 */
function expandReference(ref: VerseRef): ExtractedVerse[] {
  const verses: ExtractedVerse[] = []
  const bookName = ref.book.name.toLowerCase()

  if (ref.verseStart === null) {
    // Chapter-only reference - expand to all verses in chapter
    const verseCount = getVerseCount(bookName, ref.chapter)
    for (let v = 1; v <= verseCount; v++) {
      verses.push({
        reference: `${ref.book.name} ${ref.chapter}:${v}`,
        book: bookName,
        chapter: ref.chapter,
        verse: v,
        source: 'chapter_range'
      })
    }
  } else if (ref.verseEnd === null || ref.verseEnd === ref.verseStart) {
    // Single verse
    verses.push({
      reference: formatVerseRef(ref),
      book: bookName,
      chapter: ref.chapter,
      verse: ref.verseStart,
      source: 'inline'
    })
  } else {
    // Verse range
    for (let v = ref.verseStart; v <= ref.verseEnd; v++) {
      verses.push({
        reference: `${ref.book.name} ${ref.chapter}:${v}`,
        book: bookName,
        chapter: ref.chapter,
        verse: v,
        source: v === ref.verseStart ? 'quote' : 'inline'
      })
    }
  }

  return verses
}

/**
 * Expand chapter range to individual verses
 */
function expandChapterRange(bookName: string, startChapter: number, endChapter: number): ExtractedVerse[] {
  const verses: ExtractedVerse[] = []
  const normalizedBook = bookName.toLowerCase()

  for (let c = startChapter; c <= endChapter; c++) {
    const verseCount = getVerseCount(normalizedBook, c)
    for (let v = 1; v <= verseCount; v++) {
      verses.push({
        reference: `${bookName} ${c}:${v}`,
        book: normalizedBook,
        chapter: c,
        verse: v,
        source: 'chapter_range'
      })
    }
  }

  return verses
}

/**
 * Get verse count for a chapter (returns default if not in lookup)
 */
function getVerseCount(book: string, chapter: number): number {
  if (VERSE_COUNTS[book] && VERSE_COUNTS[book][chapter]) {
    return VERSE_COUNTS[book][chapter]
  }
  // Default to 30 verses if unknown (will be validated by BLB)
  return 30
}

/**
 * Generate BLB KJV URL for a verse
 */
export function generateBLBKJVUrl(book: string, chapter: number, verse: number): string {
  // BLB uses abbreviated book names
  const blbBook = book.toLowerCase().replace(/\s+/g, '')
  return `https://www.blueletterbible.org/kjv/${blbBook}/${chapter}/${verse}/`
}

/**
 * Generate BLB KJV URL from reference string
 */
export function generateBLBUrlFromRef(reference: string): string {
  const matches = findScriptureReferences(reference)
  if (matches.length === 0 || matches[0].refs.length === 0) return '#'

  const ref = matches[0].refs[0]
  const book = ref.book.blbCode || ref.book.name.toLowerCase().replace(/\s+/g, '')
  const chapter = ref.chapter
  const verse = ref.verseStart || 1

  return `https://www.blueletterbible.org/kjv/${book}/${chapter}/${verse}/`
}
