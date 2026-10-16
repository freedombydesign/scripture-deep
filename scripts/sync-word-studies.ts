import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Word studies to REMOVE (8 removed from original 37)
const wordsToRemove = [
  'heard',
  'greatly beloved',
  'be strong',
  'sift',
  'wrestle',
  'faint',
  'incense',
  'Abaddon / Apollyon'
]

async function syncWordStudies() {
  // 1. Get the study
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

  // 2. Get current word studies
  const { data: wordStudies, error: wsError } = await supabase
    .from('word_studies')
    .select('id, english_word, strongs')
    .eq('study_id', study.id)

  if (wsError) {
    console.log('Error fetching word studies:', wsError)
    return
  }

  console.log('\nCurrent word study count:', wordStudies?.length)

  // 3. Delete the removed word studies
  const toDelete = wordStudies?.filter(ws =>
    wordsToRemove.includes(ws.english_word)
  ) || []

  console.log('\nWord studies to delete:', toDelete.length)
  for (const ws of toDelete) {
    console.log('  -', ws.english_word)
  }

  if (toDelete.length > 0) {
    const deleteIds = toDelete.map(ws => ws.id)
    const { error: deleteError } = await supabase
      .from('word_studies')
      .delete()
      .in('id', deleteIds)

    if (deleteError) {
      console.log('Error deleting:', deleteError)
    } else {
      console.log('Deleted', toDelete.length, 'word studies')
    }
  }

  // 4. Fix BLB URLs for remaining word studies
  const { data: remaining, error: remainingError } = await supabase
    .from('word_studies')
    .select('id, english_word, strongs')
    .eq('study_id', study.id)

  if (remainingError) {
    console.log('Error fetching remaining:', remainingError)
    return
  }

  console.log('\nFixing BLB URLs for', remaining?.length, 'word studies...')

  let fixedCount = 0
  for (const ws of remaining || []) {
    if (!ws.strongs || ws.strongs.length === 0) continue

    const fixedStrongs = ws.strongs.map((s: { number: string; blb_url: string }) => {
      // Hebrew uses wlc, Greek uses tr
      const textType = s.number.startsWith('H') ? 'wlc' : 'tr'
      const correctUrl = `https://www.blueletterbible.org/lexicon/${s.number.toLowerCase()}/kjv/${textType}/0-1/`
      return { number: s.number, blb_url: correctUrl }
    })

    // Check if any URLs need fixing
    const needsUpdate = ws.strongs.some((s: { blb_url: string }, i: number) =>
      s.blb_url !== fixedStrongs[i].blb_url
    )

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('word_studies')
        .update({ strongs: fixedStrongs })
        .eq('id', ws.id)

      if (!updateError) fixedCount++
    }
  }

  console.log('Fixed BLB URLs for', fixedCount, 'word studies')

  // 5. Final count
  const { count, error: countError } = await supabase
    .from('word_studies')
    .select('*', { count: 'exact', head: true })
    .eq('study_id', study.id)

  console.log('\n=== FINAL WORD STUDY COUNT:', count, '===')

  // 6. Test H8269 (prince) and G3345 (transformed)
  console.log('\n--- Testing specific word studies ---')

  const { data: princeWs } = await supabase
    .from('word_studies')
    .select('english_word, strongs')
    .eq('study_id', study.id)
    .eq('english_word', 'prince')
    .single()

  if (princeWs) {
    const h8269 = princeWs.strongs?.find((s: { number: string }) => s.number === 'H8269')
    console.log('\nH8269 (prince):')
    console.log('  Word:', princeWs.english_word)
    console.log('  URL:', h8269?.blb_url)
    console.log('  Expected: https://www.blueletterbible.org/lexicon/h8269/kjv/wlc/0-1/')
    console.log('  Match:', h8269?.blb_url === 'https://www.blueletterbible.org/lexicon/h8269/kjv/wlc/0-1/')
  }

  const { data: transformedWs } = await supabase
    .from('word_studies')
    .select('english_word, strongs')
    .eq('study_id', study.id)
    .eq('english_word', 'transformed')
    .single()

  if (transformedWs) {
    const g3345 = transformedWs.strongs?.find((s: { number: string }) => s.number === 'G3345')
    console.log('\nG3345 (transformed):')
    console.log('  Word:', transformedWs.english_word)
    console.log('  URL:', g3345?.blb_url)
    console.log('  Expected: https://www.blueletterbible.org/lexicon/g3345/kjv/tr/0-1/')
    console.log('  Match:', g3345?.blb_url === 'https://www.blueletterbible.org/lexicon/g3345/kjv/tr/0-1/')
  }

  // 7. Check notes still exist
  console.log('\n--- Checking student notes ---')

  const { data: sections } = await supabase
    .from('sections')
    .select('id, heading')
    .eq('study_id', study.id)

  if (sections && sections.length > 0) {
    const sectionIds = sections.map(s => s.id)
    const { data: notes, count: notesCount } = await supabase
      .from('notes')
      .select('*', { count: 'exact' })
      .in('section_id', sectionIds)

    console.log('Sections:', sections.length)
    console.log('Notes attached to sections:', notesCount)

    if (notes && notes.length > 0) {
      console.log('Notes still exist!')
    } else {
      console.log('No notes found (may be none were created yet)')
    }
  }

  console.log('\n=== SYNC COMPLETE ===')
}

syncWordStudies()
