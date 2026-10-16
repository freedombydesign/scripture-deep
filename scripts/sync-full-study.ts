import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface WordStudyParsed {
  word: string
  verse: string
  language: 'Hebrew' | 'Greek'
  original: string[]
  strongs: string[]
  meaning: string
  changes: string
  cross: string[]
  check: boolean
  sectionNum: number
}

function parseMarkdownWordStudies(content: string): WordStudyParsed[] {
  const wordStudies: WordStudyParsed[] = []
  let currentSection = 0

  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Track section numbers
    if (line.startsWith('## ')) {
      const match = line.match(/^## (\d+)\./)
      if (match) {
        currentSection = parseInt(match[1])
      }
    }

    // Parse word study blocks
    if (line.trim() === ':::word') {
      const ws: Partial<WordStudyParsed> = { sectionNum: currentSection }
      i++

      while (i < lines.length && lines[i].trim() !== ':::') {
        const wsLine = lines[i].trim()
        if (wsLine.startsWith('word:')) {
          ws.word = wsLine.slice(5).trim()
        } else if (wsLine.startsWith('verse:')) {
          ws.verse = wsLine.slice(6).trim()
        } else if (wsLine.startsWith('language:')) {
          ws.language = wsLine.slice(9).trim() as 'Hebrew' | 'Greek'
        } else if (wsLine.startsWith('original:')) {
          ws.original = wsLine.slice(9).trim().split(',').map(s => s.trim())
        } else if (wsLine.startsWith('strongs:')) {
          ws.strongs = wsLine.slice(8).trim().split(',').map(s => s.trim())
        } else if (wsLine.startsWith('meaning:')) {
          ws.meaning = wsLine.slice(8).trim()
        } else if (wsLine.startsWith('changes:')) {
          ws.changes = wsLine.slice(8).trim()
        } else if (wsLine.startsWith('cross:')) {
          const crossText = wsLine.slice(6).trim()
          ws.cross = crossText ? crossText.split(';').map(s => s.trim()) : []
        } else if (wsLine.startsWith('check:')) {
          ws.check = wsLine.slice(6).trim().toLowerCase() === 'yes'
        }
        i++
      }

      if (ws.word && ws.verse && ws.language) {
        wordStudies.push(ws as WordStudyParsed)
      }
    }
  }

  return wordStudies
}

function generateStrongsArray(strongs: string[]) {
  return strongs.map(num => {
    const textType = num.startsWith('H') ? 'wlc' : 'tr'
    return {
      number: num,
      blb_url: `https://www.blueletterbible.org/lexicon/${num.toLowerCase()}/kjv/${textType}/0-1/`
    }
  })
}

async function syncStudy() {
  // Read the markdown file
  const content = fs.readFileSync('studies/heard-from-the-first-day.md', 'utf-8')
  const parsedWordStudies = parseMarkdownWordStudies(content)

  console.log('Parsed', parsedWordStudies.length, 'word studies from markdown')

  // Get the study
  const { data: study, error: studyError } = await supabase
    .from('studies')
    .select('id, title')
    .eq('slug', 'heard-from-the-first-day')
    .single()

  if (studyError || !study) {
    console.log('Study not found:', studyError)
    return
  }

  console.log('Found study:', study.title, '(ID:', study.id, ')')

  // Get sections
  const { data: sections } = await supabase
    .from('sections')
    .select('id, position, heading')
    .eq('study_id', study.id)
    .order('position')

  if (!sections) {
    console.log('No sections found')
    return
  }

  console.log('Found', sections.length, 'sections')

  // Create section map by position
  const sectionMap: Record<number, string> = {}
  sections.forEach(s => {
    sectionMap[s.position] = s.id
  })

  // Get existing word studies
  const { data: existingWs } = await supabase
    .from('word_studies')
    .select('id, english_word, verse_reference, section_id')
    .eq('study_id', study.id)

  const existingMap = new Map<string, { id: string; section_id: string }>()
  existingWs?.forEach(ws => {
    const key = `${ws.english_word}|${ws.verse_reference}`
    existingMap.set(key, { id: ws.id, section_id: ws.section_id })
  })

  console.log('Existing word studies:', existingWs?.length || 0)

  // Track which existing ones we've matched
  const matchedIds = new Set<string>()
  let added = 0
  let updated = 0
  let position = 1

  for (const ws of parsedWordStudies) {
    const sectionId = sectionMap[ws.sectionNum]
    if (!sectionId) {
      console.log('Warning: No section found for position', ws.sectionNum)
      continue
    }

    const key = `${ws.word}|${ws.verse}`
    const existing = existingMap.get(key)

    const strongsArray = generateStrongsArray(ws.strongs)

    const wordStudyData = {
      study_id: study.id,
      section_id: sectionId,
      english_word: ws.word,
      verse_reference: ws.verse,
      language: ws.language,
      original_word: ws.original,
      strongs: strongsArray,
      meaning: ws.meaning,
      what_it_changes: ws.changes,
      cross_references: ws.cross.length > 0 ? ws.cross : [],
      needs_check_on_blb: ws.check,
      position: position++,
    }

    if (existing) {
      matchedIds.add(existing.id)
      // Update existing
      const { error: updateError } = await supabase
        .from('word_studies')
        .update(wordStudyData)
        .eq('id', existing.id)

      if (updateError) {
        console.log('Error updating', ws.word, ':', updateError.message)
      } else {
        updated++
      }
    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from('word_studies')
        .insert(wordStudyData)

      if (insertError) {
        console.log('Error inserting', ws.word, ':', insertError.message)
      } else {
        added++
      }
    }
  }

  // Delete word studies that no longer exist in markdown
  const toDelete = existingWs?.filter(ws => !matchedIds.has(ws.id)) || []
  if (toDelete.length > 0) {
    console.log('\nDeleting', toDelete.length, 'removed word studies:')
    for (const ws of toDelete) {
      console.log('  -', ws.english_word)
    }

    const deleteIds = toDelete.map(ws => ws.id)
    await supabase
      .from('word_studies')
      .delete()
      .in('id', deleteIds)
  }

  // Final count
  const { count } = await supabase
    .from('word_studies')
    .select('*', { count: 'exact', head: true })
    .eq('study_id', study.id)

  console.log('\n=== RESULTS ===')
  console.log('Added:', added)
  console.log('Updated:', updated)
  console.log('Deleted:', toDelete.length)
  console.log('Final word study count:', count)

  // Test specific Strong's numbers
  console.log('\n--- Testing BLB links ---')

  const { data: princeWs } = await supabase
    .from('word_studies')
    .select('english_word, strongs')
    .eq('study_id', study.id)
    .eq('english_word', 'prince')
    .single()

  if (princeWs) {
    const h8269 = princeWs.strongs?.find((s: any) => s.number === 'H8269')
    console.log('H8269 (prince):', h8269?.blb_url)
  }

  const { data: madePerfectWs } = await supabase
    .from('word_studies')
    .select('english_word, strongs')
    .eq('study_id', study.id)
    .eq('english_word', 'made perfect')
    .single()

  if (madePerfectWs) {
    console.log('made perfect strongs:', madePerfectWs.strongs?.map((s: any) => s.number).join(', '))
    const g5048 = madePerfectWs.strongs?.find((s: any) => s.number === 'G5048')
    console.log('G5048 (made perfect):', g5048?.blb_url)
  }

  // Check notes
  console.log('\n--- Checking notes ---')
  const sectionIds = sections.map(s => s.id)
  const { count: notesCount } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .in('section_id', sectionIds)

  console.log('Notes attached to sections:', notesCount)
}

syncStudy()
