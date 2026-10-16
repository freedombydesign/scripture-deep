import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function check() {
  const { data: wordStudies } = await supabase
    .from('word_studies')
    .select('english_word, section_id, verse_reference')

  console.log('Total word studies:', wordStudies?.length || 0)

  if (wordStudies) {
    const withSection = wordStudies.filter(ws => ws.section_id)
    const withoutSection = wordStudies.filter(ws => !ws.section_id)
    console.log('With section_id:', withSection.length)
    console.log('Without section_id:', withoutSection.length)

    if (withSection.length > 0) {
      const sectionIds = [...new Set(withSection.map(ws => ws.section_id))]
      const { data: sections } = await supabase
        .from('sections')
        .select('id, heading, position')
        .in('id', sectionIds)
      console.log('\nSections with word studies:')
      sections?.forEach(s => console.log(`  ${s.position}. ${s.heading}`))
    }

    if (withoutSection.length > 0) {
      console.log('\nWord studies without section (first 5):')
      withoutSection.slice(0, 5).forEach(ws =>
        console.log(`  - ${ws.english_word} (${ws.verse_reference})`)
      )
    }
  }
}

check()
