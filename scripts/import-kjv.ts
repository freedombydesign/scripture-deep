/**
 * KJV Import Script
 *
 * Downloads and imports KJV Bible text from the public domain dataset:
 * https://github.com/aruljohn/Bible-kjv (MIT License, KJV text is public domain)
 *
 * Usage: npx tsx scripts/import-kjv.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Book file names in the aruljohn/Bible-kjv repository
const BOOK_FILES = [
  // Old Testament
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
  'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  // New Testament
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation'
]

// URL-safe book names for the GitHub raw URLs
// The repository uses no spaces in filenames (e.g., "1Samuel" not "1 Samuel")
function getBookFileName(book: string): string {
  return book.replace(/ /g, '')
}

interface VerseData {
  book: string
  chapter: number
  verse: number
  text: string
}

async function fetchBook(bookName: string): Promise<VerseData[]> {
  const fileName = getBookFileName(bookName)
  const url = `https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/${fileName}.json`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${bookName}: ${response.statusText}`)
  }

  const data = await response.json()
  const verses: VerseData[] = []

  // The JSON format is: { chapters: [ { chapter: 1, verses: [ { verse: 1, text: "..." } ] } ] }
  for (const chapter of data.chapters) {
    for (const verse of chapter.verses) {
      verses.push({
        book: bookName.toLowerCase(),
        chapter: chapter.chapter,
        verse: verse.verse,
        text: verse.text,
      })
    }
  }

  return verses
}

async function importKJV() {
  console.log('Starting KJV import...')
  console.log(`Supabase URL: ${SUPABASE_URL}`)

  // Clear existing verses
  console.log('Clearing existing verses...')
  const { error: deleteError } = await supabase
    .from('verses')
    .delete()
    .neq('id', 0) // Delete all rows

  if (deleteError) {
    console.error('Error clearing verses:', deleteError)
    // Continue anyway - table might be empty
  }

  let totalVerses = 0
  const batchSize = 500 // Supabase recommends batches of ~500

  for (const bookName of BOOK_FILES) {
    process.stdout.write(`Importing ${bookName}... `)

    try {
      const verses = await fetchBook(bookName)

      // Insert in batches
      for (let i = 0; i < verses.length; i += batchSize) {
        const batch = verses.slice(i, i + batchSize)
        const { error } = await supabase.from('verses').insert(batch)

        if (error) {
          console.error(`\nError inserting batch for ${bookName}:`, error)
          throw error
        }
      }

      totalVerses += verses.length
      console.log(`${verses.length} verses`)
    } catch (error) {
      console.error(`\nFailed to import ${bookName}:`, error)
      throw error
    }
  }

  console.log(`\nImport complete! ${totalVerses} verses imported.`)
}

// Run the import
importKJV().catch((error) => {
  console.error('Import failed:', error)
  process.exit(1)
})
