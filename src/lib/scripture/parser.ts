import { findBook, getAllBookPatterns, type BookData } from './books'

export interface VerseRef {
  book: BookData
  chapter: number
  verseStart: number | null  // null for chapter-only references
  verseEnd: number | null    // null for single verse, or end of range
}

export interface ScriptureMatch {
  text: string           // The original matched text
  startIndex: number     // Position in the original string
  endIndex: number       // End position in the original string
  refs: VerseRef[]       // Parsed references (can be multiple for "Job 1:11, 2:5")
}

// Build the master regex pattern
function buildScriptureRegex(): RegExp {
  const bookPatterns = getAllBookPatterns()
  const bookGroup = `(${bookPatterns.join('|')})\\.?`

  // Chapter and verse patterns
  // Matches: 3:16, 3:16-18, 3, 3:16-4:2 (cross-chapter range)
  const chapterVerse = `(\\d{1,3})(?::(\\d{1,3})(?:\\s*[-–—]\\s*(\\d{1,3}(?::\\d{1,3})?))?)?`

  // Full pattern: Book + chapter:verse with optional continuation
  // Continuation handles: ", 2:5" or ", 5" after initial reference
  const fullPattern = `${bookGroup}\\s*${chapterVerse}(?:\\s*,\\s*(?:(\\d{1,3})(?::(\\d{1,3})(?:\\s*[-–—]\\s*(\\d{1,3}))?)?|(?:${bookGroup}\\s*${chapterVerse})))*`

  return new RegExp(fullPattern, 'gi')
}

const SCRIPTURE_REGEX = buildScriptureRegex()

/**
 * Parse a scripture reference string into structured verse references
 */
export function parseScriptureRef(text: string): VerseRef[] {
  const refs: VerseRef[] = []
  const trimmed = text.trim()

  // Match book name at the start
  const bookPatterns = getAllBookPatterns()
  let bookMatch: { book: BookData; endIndex: number } | null = null

  for (const pattern of bookPatterns) {
    const regex = new RegExp(`^(${pattern})\\.?\\s*`, 'i')
    const match = trimmed.match(regex)
    if (match) {
      const book = findBook(match[1])
      if (book) {
        bookMatch = { book, endIndex: match[0].length }
        break
      }
    }
  }

  if (!bookMatch) {
    return refs
  }

  let currentBook = bookMatch.book
  const remainder = trimmed.slice(bookMatch.endIndex)

  // Parse chapter:verse portions
  // Split on commas but keep track of context
  const parts = remainder.split(/\s*,\s*/)

  let lastChapter: number | null = null

  for (const part of parts) {
    const trimmedPart = part.trim()
    if (!trimmedPart) continue

    // Check if this part starts with a new book reference
    let partBook = currentBook
    let partRemainder = trimmedPart

    for (const pattern of bookPatterns) {
      const regex = new RegExp(`^(${pattern})\\.?\\s*`, 'i')
      const match = trimmedPart.match(regex)
      if (match) {
        const foundBook = findBook(match[1])
        if (foundBook) {
          partBook = foundBook
          currentBook = foundBook
          partRemainder = trimmedPart.slice(match[0].length)
          lastChapter = null // Reset chapter context for new book
          break
        }
      }
    }

    // Parse chapter:verse from remainder
    const parsed = parseChapterVerse(partRemainder, lastChapter)
    if (parsed) {
      refs.push({
        book: partBook,
        chapter: parsed.chapter,
        verseStart: parsed.verseStart,
        verseEnd: parsed.verseEnd,
      })
      lastChapter = parsed.chapter
    }
  }

  return refs
}

interface ChapterVerseParsed {
  chapter: number
  verseStart: number | null
  verseEnd: number | null
}

function parseChapterVerse(text: string, contextChapter: number | null): ChapterVerseParsed | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  // Pattern: chapter:verseStart-verseEnd or chapter:verse or just chapter or just verse (with context)
  // Also handles cross-chapter ranges like 3:16-4:2

  // Try chapter:verse-verse or chapter:verse
  const fullMatch = trimmed.match(/^(\d{1,3}):(\d{1,3})(?:\s*[-–—]\s*(\d{1,3})(?::(\d{1,3}))?)?$/)
  if (fullMatch) {
    const chapter = parseInt(fullMatch[1], 10)
    const verseStart = parseInt(fullMatch[2], 10)

    if (fullMatch[4]) {
      // Cross-chapter range like 3:16-4:2 - we'll just use the start verse
      return { chapter, verseStart, verseEnd: null }
    } else if (fullMatch[3]) {
      // Simple range like 3:16-18
      const verseEnd = parseInt(fullMatch[3], 10)
      return { chapter, verseStart, verseEnd }
    } else {
      // Single verse like 3:16
      return { chapter, verseStart, verseEnd: null }
    }
  }

  // Try just a number - could be chapter or verse depending on context
  const numMatch = trimmed.match(/^(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?$/)
  if (numMatch) {
    const num1 = parseInt(numMatch[1], 10)
    const num2 = numMatch[2] ? parseInt(numMatch[2], 10) : null

    if (contextChapter !== null) {
      // We have a chapter context, so this is a verse reference
      return { chapter: contextChapter, verseStart: num1, verseEnd: num2 }
    } else {
      // No context, so this is a chapter reference
      if (num2 !== null) {
        // Range of chapters - just use the first
        return { chapter: num1, verseStart: null, verseEnd: null }
      }
      return { chapter: num1, verseStart: null, verseEnd: null }
    }
  }

  return null
}

/**
 * Find all scripture references in a text string
 */
export function findScriptureReferences(text: string): ScriptureMatch[] {
  const matches: ScriptureMatch[] = []
  const bookPatterns = getAllBookPatterns()

  // Build a simpler, more reliable regex that matches one reference at a time
  // This handles: "Book chapter:verse-verse" or "Book chapter:verse" or "Book chapter"
  const simpleBookGroup = `(?:${bookPatterns.join('|')})\\.?`

  // This pattern matches a book followed by chapter:verse notation
  // Including comma-separated continuations like "Daniel 10:12, 13"
  const pattern = new RegExp(
    `(${simpleBookGroup})` +                    // Book name
    `\\s*(\\d{1,3})` +                          // Chapter (required)
    `(?::(\\d{1,3})` +                          // :verse (optional)
    `(?:\\s*[-–—]\\s*(\\d{1,3}))?` +            // -endVerse (optional)
    `)?` +                                       // End optional verse group
    `(?:\\s*,\\s*` +                            // Comma-separated continuation
    `(?:(\\d{1,3}):(\\d{1,3})(?:\\s*[-–—]\\s*(\\d{1,3}))?` +  // Full chapter:verse
    `|(\\d{1,3})(?:\\s*[-–—]\\s*(\\d{1,3}))?` +               // Just verse (same chapter)
    `))*`,                                      // End continuation
    'gi'
  )

  let match: RegExpExecArray | null
  const usedRanges: Array<{ start: number; end: number }> = []

  while ((match = pattern.exec(text)) !== null) {
    const matchText = match[0]
    const startIndex = match.index
    const endIndex = startIndex + matchText.length

    // Check for overlap with existing matches
    const overlaps = usedRanges.some(
      range => !(endIndex <= range.start || startIndex >= range.end)
    )
    if (overlaps) continue

    // Parse the reference
    const refs = parseScriptureRef(matchText)
    if (refs.length > 0) {
      matches.push({
        text: matchText,
        startIndex,
        endIndex,
        refs,
      })
      usedRanges.push({ start: startIndex, end: endIndex })
    }
  }

  // Sort by position in text
  matches.sort((a, b) => a.startIndex - b.startIndex)

  return matches
}

/**
 * Generate a Blue Letter Bible URL for a verse reference
 */
export function generateBLBUrl(ref: VerseRef): string {
  const { book, chapter, verseStart } = ref
  const verse = verseStart ?? 1

  // BLB URL format: https://www.blueletterbible.org/kjv/{book}/{chapter}/{verse}/
  return `https://www.blueletterbible.org/kjv/${book.blbCode}/${chapter}/${verse}/`
}

/**
 * Generate a Blue Letter Bible Interlinear URL for a verse reference
 */
export function generateBLBInterlinearUrl(ref: VerseRef): string {
  const { book, chapter, verseStart, verseEnd } = ref
  const verse = verseStart ?? 1
  const endVerse = verseEnd ?? verse

  // BLB Interlinear URL format: /tools/interlinear/tr/{book}/{chapter}/{verseStart}-{verseEnd}/
  // Using TR (Textus Receptus) for NT, will work for OT Hebrew too
  return `https://www.blueletterbible.org/tools/interlinear/tr/${book.blbCode}/${chapter}/${verse}-${endVerse}/`
}

/**
 * Format a verse reference as a human-readable string
 */
export function formatVerseRef(ref: VerseRef): string {
  const { book, chapter, verseStart, verseEnd } = ref

  if (verseStart === null) {
    // Chapter-only reference
    return `${book.name} ${chapter}`
  }

  if (verseEnd === null) {
    // Single verse
    return `${book.name} ${chapter}:${verseStart}`
  }

  // Verse range
  return `${book.name} ${chapter}:${verseStart}-${verseEnd}`
}

/**
 * Generate a unique key for a verse reference (for database lookups)
 */
export function getVerseKey(book: string, chapter: number, verse: number): string {
  return `${book.toLowerCase()}-${chapter}-${verse}`
}
