/**
 * Import word studies from JSON file into the database
 * Run with: npx tsx scripts/import-word-studies.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Section name mapping from JSON to database headings
const SECTION_MAPPING: Record<string, string[]> = {
  'Daniel 10': ['Daniel', 'Question', 'Setting', 'First Day'],
  'Names of the enemy': ['Enemy', 'Names', 'Satan'],
  'Job and Peter': ['Job', 'Peter', 'Limits'],
  'Ephesians 6': ['Ephesians', 'Battle', 'Armour', 'Warfare', 'Weapons'],
  'The delays': ['Delays', 'Persistence', 'Application'],
  'Revelation': ['Revelation', 'Cry', 'Kept', 'Victory', 'Close', 'Conclusion'],
}

interface WordStudyJSON {
  section: string
  word: string
  verse: string
  language: 'Hebrew' | 'Greek'
  original: string[]
  strongs: { number: string; blb_url: string }[]
  meaning: string
  what_it_changes: string
  cross_references: string[]
  needs_check_on_blb: boolean
}

interface StudyJSON {
  study: string
  translation: string
  word_studies: WordStudyJSON[]
}

async function importWordStudies() {
  console.log('Importing word studies...')

  // Read the JSON file
  const jsonPath = path.resolve(process.cwd(), 'heard-from-the-first-day-word-studies.json')
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as StudyJSON

  console.log(`Found ${jsonData.word_studies.length} word studies in JSON`)

  // Find the study
  const { data: studies, error: studyError } = await supabase
    .from('studies')
    .select('id, title')
    .ilike('title', '%Heard From the First Day%')
    .limit(1)

  if (studyError || !studies || studies.length === 0) {
    console.error('Study not found:', studyError?.message || 'No results')
    console.log('Make sure the "Heard From the First Day" study exists in the database')
    process.exit(1)
  }

  const study = studies[0]
  console.log(`Found study: "${study.title}" (${study.id})`)

  // Get all sections for this study
  const { data: sections, error: sectionsError } = await supabase
    .from('sections')
    .select('id, heading, position')
    .eq('study_id', study.id)
    .order('position')

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError.message)
    process.exit(1)
  }

  console.log(`Found ${sections?.length || 0} sections`)

  // Create a mapping of section names to section IDs
  const sectionIdMap: Record<string, string> = {}
  if (sections) {
    for (const section of sections) {
      for (const [jsonSection, keywords] of Object.entries(SECTION_MAPPING)) {
        for (const keyword of keywords) {
          if (section.heading.toLowerCase().includes(keyword.toLowerCase())) {
            if (!sectionIdMap[jsonSection]) {
              sectionIdMap[jsonSection] = section.id
            }
          }
        }
      }
    }
  }

  console.log('Section mapping:', sectionIdMap)

  // Delete existing word studies for this study
  const { error: deleteError } = await supabase
    .from('word_studies')
    .delete()
    .eq('study_id', study.id)

  if (deleteError) {
    console.log('Note: Could not delete existing word studies (table may not exist yet)')
  } else {
    console.log('Cleared existing word studies')
  }

  // Import each word study
  let imported = 0
  let needsCheck = 0

  for (let i = 0; i < jsonData.word_studies.length; i++) {
    const ws = jsonData.word_studies[i]

    const wordStudy = {
      study_id: study.id,
      section_id: sectionIdMap[ws.section] || null,
      english_word: ws.word,
      verse_reference: ws.verse,
      language: ws.language,
      original_word: ws.original || [],
      transliteration: null,
      strongs: ws.strongs || [],
      meaning: ws.meaning || null,
      what_it_changes: ws.what_it_changes || null,
      cross_references: ws.cross_references || [],
      needs_check_on_blb: ws.needs_check_on_blb || false,
      position: i + 1,
    }

    const { error: insertError } = await supabase
      .from('word_studies')
      .insert(wordStudy)

    if (insertError) {
      console.error(`Error importing "${ws.word}":`, insertError.message)
    } else {
      imported++
      if (ws.needs_check_on_blb) {
        needsCheck++
        console.log(`  ⚠️  "${ws.word}" (${ws.verse}) - NEEDS CHECK ON BLB`)
      }
    }
  }

  console.log(`\n✅ Import complete!`)
  console.log(`   - Imported: ${imported}/${jsonData.word_studies.length} word studies`)
  console.log(`   - Flagged for BLB check: ${needsCheck}`)

  // List the ones that need checking
  const needsCheckList = jsonData.word_studies.filter(ws => ws.needs_check_on_blb)
  if (needsCheckList.length > 0) {
    console.log(`\n⚠️  Word studies flagged for BLB verification:`)
    for (const ws of needsCheckList) {
      console.log(`   - "${ws.word}" (${ws.verse})`)
    }
  }
}

importWordStudies().catch(console.error)
