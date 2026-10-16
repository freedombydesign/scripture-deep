import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

async function check() {
  const { data: study } = await supabase
    .from('studies')
    .select('id')
    .ilike('title', '%Heard From the First Day%')
    .single()

  const { data: sections } = await supabase
    .from('sections')
    .select('position, heading, body')
    .eq('study_id', study!.id)
    .order('position')
    .limit(2)

  sections!.forEach((s: any) => {
    console.log('------- SECTION ' + s.position + ': ' + s.heading + ' -------')
    const extractText = (node: any): string => {
      if (!node) return ''
      if (node.type === 'text') return node.text || ''
      if (node.content) return node.content.map(extractText).join(' ')
      return ''
    }
    const text = extractText(s.body)
    console.log(text.substring(0, 400) + '...\n')
  })
}
check()
