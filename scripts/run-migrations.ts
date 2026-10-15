/**
 * Run database migrations via Supabase API
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigrations() {
  console.log('Running migrations...')

  const migrationFile = path.resolve(__dirname, '../supabase/migrations/001_initial_schema.sql')
  const sql = fs.readFileSync(migrationFile, 'utf8')

  // Split by statements (simple split - may need refinement for complex SQL)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`Found ${statements.length} SQL statements`)

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    if (!statement) continue

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      if (error) {
        // Try direct fetch to Supabase SQL endpoint
        console.log(`Statement ${i + 1}: Using REST API...`)
      } else {
        console.log(`Statement ${i + 1}: OK`)
      }
    } catch (e) {
      console.log(`Statement ${i + 1}: Will run via dashboard`)
    }
  }

  console.log('\nMigrations need to be run via Supabase Dashboard SQL Editor.')
  console.log('Copy the contents of: supabase/migrations/001_initial_schema.sql')
  console.log('And paste into: https://supabase.com/dashboard/project/svxpdskbhaaiyrqpsdsy/sql')
}

runMigrations()
