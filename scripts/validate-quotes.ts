import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Book name mappings for database lookup
const bookAliases: Record<string, string> = {
  'gen': 'genesis', 'genesis': 'genesis',
  'exod': 'exodus', 'exodus': 'exodus', 'ex': 'exodus',
  'lev': 'leviticus', 'leviticus': 'leviticus',
  'num': 'numbers', 'numbers': 'numbers',
  'deut': 'deuteronomy', 'deuteronomy': 'deuteronomy',
  'josh': 'joshua', 'joshua': 'joshua',
  'judg': 'judges', 'judges': 'judges',
  'ruth': 'ruth',
  '1sam': '1 samuel', '1 sam': '1 samuel', '1 samuel': '1 samuel',
  '2sam': '2 samuel', '2 sam': '2 samuel', '2 samuel': '2 samuel',
  '1kgs': '1 kings', '1 kings': '1 kings',
  '2kgs': '2 kings', '2 kings': '2 kings',
  '1chr': '1 chronicles', '1 chronicles': '1 chronicles',
  '2chr': '2 chronicles', '2 chronicles': '2 chronicles',
  'ezra': 'ezra',
  'neh': 'nehemiah', 'nehemiah': 'nehemiah',
  'esth': 'esther', 'esther': 'esther',
  'job': 'job',
  'ps': 'psalms', 'psa': 'psalms', 'psalm': 'psalms', 'psalms': 'psalms',
  'prov': 'proverbs', 'proverbs': 'proverbs',
  'eccl': 'ecclesiastes', 'ecclesiastes': 'ecclesiastes',
  'song': 'song of solomon', 'song of solomon': 'song of solomon',
  'isa': 'isaiah', 'isaiah': 'isaiah',
  'jer': 'jeremiah', 'jeremiah': 'jeremiah',
  'lam': 'lamentations', 'lamentations': 'lamentations',
  'ezek': 'ezekiel', 'ezekiel': 'ezekiel',
  'dan': 'daniel', 'daniel': 'daniel',
  'hos': 'hosea', 'hosea': 'hosea',
  'joel': 'joel',
  'amos': 'amos',
  'obad': 'obadiah', 'obadiah': 'obadiah',
  'jonah': 'jonah',
  'mic': 'micah', 'micah': 'micah',
  'nah': 'nahum', 'nahum': 'nahum',
  'hab': 'habakkuk', 'habakkuk': 'habakkuk',
  'zeph': 'zephaniah', 'zephaniah': 'zephaniah',
  'hag': 'haggai', 'haggai': 'haggai',
  'zech': 'zechariah', 'zechariah': 'zechariah',
  'mal': 'malachi', 'malachi': 'malachi',
  'matt': 'matthew', 'matthew': 'matthew', 'mat': 'matthew',
  'mark': 'mark', 'mk': 'mark',
  'luke': 'luke', 'lk': 'luke',
  'john': 'john', 'jn': 'john',
  'acts': 'acts',
  'rom': 'romans', 'romans': 'romans',
  '1cor': '1 corinthians', '1 cor': '1 corinthians', '1 corinthians': '1 corinthians',
  '2cor': '2 corinthians', '2 cor': '2 corinthians', '2 corinthians': '2 corinthians',
  'gal': 'galatians', 'galatians': 'galatians',
  'eph': 'ephesians', 'ephesians': 'ephesians',
  'phil': 'philippians', 'philippians': 'philippians',
  'col': 'colossians', 'colossians': 'colossians',
  '1thess': '1 thessalonians', '1 thess': '1 thessalonians', '1 thessalonians': '1 thessalonians',
  '2thess': '2 thessalonians', '2 thess': '2 thessalonians', '2 thessalonians': '2 thessalonians',
  '1tim': '1 timothy', '1 tim': '1 timothy', '1 timothy': '1 timothy',
  '2tim': '2 timothy', '2 tim': '2 timothy', '2 timothy': '2 timothy',
  'titus': 'titus',
  'phlm': 'philemon', 'philemon': 'philemon',
  'heb': 'hebrews', 'hebrews': 'hebrews',
  'jas': 'james', 'james': 'james',
  '1pet': '1 peter', '1 peter': '1 peter',
  '2pet': '2 peter', '2 peter': '2 peter',
  '1john': '1 john', '1 jn': '1 john', '1 john': '1 john',
  '2john': '2 john', '2 jn': '2 john', '2 john': '2 john',
  '3john': '3 john', '3 jn': '3 john', '3 john': '3 john',
  'jude': 'jude',
  'rev': 'revelation', 'revelation': 'revelation',
}

interface Quote {
  text: string
  reference: string
  lineNumber: number
}

interface QuoteValidation {
  reference: string
  quoteText: string
  expectedText: string
  matches: boolean
  issues: string[]
  lineNumber: number
}

function parseQuotes(content: string): Quote[] {
  const quotes: Quote[] = []
  const lines = content.split('\n')

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('> ')) {
      const startLine = i + 1
      const quoteLines: string[] = []

      // Collect all quote lines
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].substring(2))
        i++
      }

      // Check if last line is a reference [Book Chapter:Verse]
      if (quoteLines.length > 0) {
        const lastLine = quoteLines[quoteLines.length - 1].trim()
        const refMatch = lastLine.match(/^\[(.+)\]$/)

        if (refMatch) {
          const reference = refMatch[1]
          const quoteText = quoteLines.slice(0, -1).join(' ').trim()

          quotes.push({
            text: quoteText,
            reference,
            lineNumber: startLine
          })
        }
      }
      continue
    }
    i++
  }

  return quotes
}

function parseReference(ref: string): { book: string; chapter: number; verseStart: number; verseEnd: number } | null {
  // Handle formats like "John 5:5-6", "Psalm 40:1-2", "Revelation 6:9-11"
  const match = ref.match(/^(\d?\s*[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/)
  if (!match) return null

  const bookName = match[1].trim().toLowerCase()
  const book = bookAliases[bookName]
  if (!book) return null

  const chapter = parseInt(match[2])
  const verseStart = parseInt(match[3])
  const verseEnd = match[4] ? parseInt(match[4]) : verseStart

  return { book, chapter, verseStart, verseEnd }
}

async function fetchVerseText(book: string, chapter: number, verseStart: number, verseEnd: number): Promise<string> {
  const { data, error } = await supabase
    .from('verses')
    .select('verse, text')
    .eq('book', book)
    .eq('chapter', chapter)
    .gte('verse', verseStart)
    .lte('verse', verseEnd)
    .order('verse')

  if (error || !data || data.length === 0) {
    return ''
  }

  // Combine verses into expected text
  return data.map(v => v.text).join(' ')
}

function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .trim()
    .toLowerCase()
}

function findMissingWords(quoteText: string, expectedText: string): string[] {
  const quoteWords = new Set(normalizeText(quoteText).split(' ').filter(w => w.length > 2))
  const expectedWords = normalizeText(expectedText).split(' ').filter(w => w.length > 2)

  const missing: string[] = []
  for (const word of expectedWords) {
    if (!quoteWords.has(word)) {
      missing.push(word)
    }
  }

  return missing.slice(0, 10) // Limit to first 10
}

async function validateQuotes(filePath: string): Promise<QuoteValidation[]> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const quotes = parseQuotes(content)

  console.log(`Found ${quotes.length} scripture quotes\n`)

  const validations: QuoteValidation[] = []

  for (const quote of quotes) {
    const parsed = parseReference(quote.reference)

    if (!parsed) {
      validations.push({
        reference: quote.reference,
        quoteText: quote.text.substring(0, 50) + '...',
        expectedText: '',
        matches: false,
        issues: ['Could not parse reference'],
        lineNumber: quote.lineNumber
      })
      continue
    }

    const expectedText = await fetchVerseText(
      parsed.book,
      parsed.chapter,
      parsed.verseStart,
      parsed.verseEnd
    )

    if (!expectedText) {
      validations.push({
        reference: quote.reference,
        quoteText: quote.text.substring(0, 50) + '...',
        expectedText: '',
        matches: false,
        issues: ['Verse not found in database'],
        lineNumber: quote.lineNumber
      })
      continue
    }

    const normalizedQuote = normalizeText(quote.text)
    const normalizedExpected = normalizeText(expectedText)

    const issues: string[] = []

    // Check exact match
    const exactMatch = normalizedQuote === normalizedExpected

    if (!exactMatch) {
      // Check if quote is subset (shortened)
      const quoteLength = normalizedQuote.length
      const expectedLength = normalizedExpected.length

      if (quoteLength < expectedLength * 0.9) {
        issues.push(`Quote is ${Math.round((1 - quoteLength/expectedLength) * 100)}% shorter than full text`)

        // Find missing words
        const missing = findMissingWords(normalizedQuote, normalizedExpected)
        if (missing.length > 0) {
          issues.push(`Missing words: ${missing.join(', ')}`)
        }
      } else if (quoteLength > expectedLength * 1.1) {
        issues.push('Quote is longer than expected verse text')
      } else {
        // Similar length but different - check for word differences
        const missing = findMissingWords(normalizedQuote, normalizedExpected)
        if (missing.length > 0) {
          issues.push(`Text differs. Missing: ${missing.join(', ')}`)
        }
      }
    }

    validations.push({
      reference: quote.reference,
      quoteText: quote.text.substring(0, 80) + (quote.text.length > 80 ? '...' : ''),
      expectedText: expectedText.substring(0, 80) + (expectedText.length > 80 ? '...' : ''),
      matches: exactMatch || issues.length === 0,
      issues,
      lineNumber: quote.lineNumber
    })
  }

  return validations
}

async function main() {
  const filePath = process.argv[2] || 'studies/heard-from-the-first-day.md'

  console.log(`Validating scripture quotes in: ${filePath}\n`)
  console.log('='.repeat(80))

  const validations = await validateQuotes(filePath)

  const issues = validations.filter(v => !v.matches)
  const passed = validations.filter(v => v.matches)

  console.log(`\n${'='.repeat(80)}`)
  console.log(`RESULTS: ${passed.length} passed, ${issues.length} issues\n`)

  if (issues.length > 0) {
    console.log('ISSUES FOUND:\n')
    for (const v of issues) {
      console.log(`Line ${v.lineNumber}: ${v.reference}`)
      console.log(`  Quote: "${v.quoteText}"`)
      if (v.expectedText) {
        console.log(`  Expected: "${v.expectedText}"`)
      }
      for (const issue of v.issues) {
        console.log(`  - ${issue}`)
      }
      console.log()
    }
  }

  console.log('\nAll validated quotes:')
  for (const v of validations) {
    const status = v.matches ? '✓' : '✗'
    console.log(`  ${status} ${v.reference}${v.issues.length ? ' - ' + v.issues[0] : ''}`)
  }
}

main()
