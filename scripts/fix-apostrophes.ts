import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function fixApostrophes() {
  // Use Unicode escapes to avoid encoding issues
  const curlyRight = '\u2019'  // RIGHT SINGLE QUOTATION MARK
  const curlyLeft = '\u2018'   // LEFT SINGLE QUOTATION MARK
  const straight = '\u0027'    // APOSTROPHE

  let fixed = 0
  let offset = 0
  const limit = 1000

  while (true) {
    const { data: verses, error } = await supabase
      .from('verses')
      .select('id, book, chapter, verse, text')
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching:', error)
      return
    }

    if (!verses || verses.length === 0) {
      break
    }

    console.log(`Checking verses ${offset + 1} to ${offset + verses.length}...`)

    for (const verse of verses) {
      if (verse.text.includes(curlyRight) || verse.text.includes(curlyLeft)) {
        const newText = verse.text
          .replace(new RegExp(curlyRight, 'g'), straight)
          .replace(new RegExp(curlyLeft, 'g'), straight)

        const { error: updateError } = await supabase
          .from('verses')
          .update({ text: newText })
          .eq('id', verse.id)

        if (updateError) {
          console.error(`Error updating ${verse.book} ${verse.chapter}:${verse.verse}:`, updateError)
        } else {
          fixed++
        }
      }
    }

    offset += limit
  }

  console.log(`\nFixed ${fixed} verses with curly apostrophes`)
}

fixApostrophes()
