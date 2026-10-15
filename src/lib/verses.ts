import { createClient } from '@/lib/supabase/client'
import type { VerseRef } from '@/lib/scripture'

export interface Verse {
  book: string
  chapter: number
  verse: number
  text: string
}

/**
 * Fetch a single verse from the database
 */
export async function fetchVerse(
  book: string,
  chapter: number,
  verse: number
): Promise<Verse | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('verses')
    .select('book, chapter, verse, text')
    .eq('book', book.toLowerCase())
    .eq('chapter', chapter)
    .eq('verse', verse)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Fetch multiple verses (for a range)
 */
export async function fetchVerseRange(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number
): Promise<Verse[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('verses')
    .select('book, chapter, verse, text')
    .eq('book', book.toLowerCase())
    .eq('chapter', chapter)
    .gte('verse', verseStart)
    .lte('verse', verseEnd)
    .order('verse')

  if (error || !data) {
    return []
  }

  return data
}

/**
 * Fetch all verses for a chapter
 */
export async function fetchChapter(
  book: string,
  chapter: number
): Promise<Verse[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('verses')
    .select('book, chapter, verse, text')
    .eq('book', book.toLowerCase())
    .eq('chapter', chapter)
    .order('verse')

  if (error || !data) {
    return []
  }

  return data
}

/**
 * Fetch verses for a VerseRef (handles single verse, range, or chapter)
 */
export async function fetchVersesForRef(ref: VerseRef): Promise<Verse[]> {
  const bookName = ref.book.name.toLowerCase()

  if (ref.verseStart === null) {
    // Chapter-only reference - fetch first few verses as preview
    return fetchVerseRange(bookName, ref.chapter, 1, 5)
  }

  if (ref.verseEnd === null) {
    // Single verse
    const verse = await fetchVerse(bookName, ref.chapter, ref.verseStart)
    return verse ? [verse] : []
  }

  // Verse range
  return fetchVerseRange(bookName, ref.chapter, ref.verseStart, ref.verseEnd)
}

/**
 * Format verses as a readable string
 */
export function formatVerses(verses: Verse[]): string {
  return verses.map((v) => `${v.verse} ${v.text}`).join(' ')
}
