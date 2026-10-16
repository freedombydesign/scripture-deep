import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function fixUrls() {
  // Get all word studies
  const { data: wordStudies, error } = await supabase
    .from('word_studies')
    .select('id, strongs, language')

  if (error) {
    console.log('Error fetching:', error)
    return
  }

  console.log('Found', wordStudies.length, 'word studies to check')

  let updated = 0
  for (const ws of wordStudies) {
    if (!ws.strongs || ws.strongs.length === 0) continue

    // Fix each strongs entry
    const fixedStrongs = ws.strongs.map((s: { number: string; blb_url: string }) => {
      const textType = s.number.startsWith('H') ? 'wlc' : 'tr'
      const correctUrl = `https://www.blueletterbible.org/lexicon/${s.number.toLowerCase()}/kjv/${textType}/0-1/`

      return { number: s.number, blb_url: correctUrl }
    })

    // Check if any URLs changed
    const needsUpdate = ws.strongs.some((s: { blb_url: string }, i: number) =>
      s.blb_url !== fixedStrongs[i].blb_url
    )

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('word_studies')
        .update({ strongs: fixedStrongs })
        .eq('id', ws.id)

      if (updateError) {
        console.log('Error updating', ws.id, ':', updateError)
      } else {
        updated++
      }
    }
  }

  console.log('Updated', updated, 'word studies')

  // Test Hebrew example
  console.log('\nTest Hebrew (H8269 - prince):')
  const { data: testH } = await supabase
    .from('word_studies')
    .select('english_word, strongs')
    .eq('english_word', 'prince')
    .limit(1)

  if (testH && testH[0]) {
    console.log('  Word:', testH[0].english_word)
    const h8269 = testH[0].strongs.find((s: { number: string }) => s.number === 'H8269')
    if (h8269) {
      console.log('  H8269 URL:', h8269.blb_url)
    }
  }

  // Test Greek example - find any Greek word study
  console.log('\nTest Greek:')
  const { data: testG } = await supabase
    .from('word_studies')
    .select('english_word, strongs, language')
    .eq('language', 'Greek')
    .limit(1)

  if (testG && testG[0]) {
    console.log('  Word:', testG[0].english_word)
    console.log('  Strongs:', testG[0].strongs[0]?.number)
    console.log('  URL:', testG[0].strongs[0]?.blb_url)
  } else {
    console.log('  No Greek word studies found in this study')
  }
}

fixUrls()
