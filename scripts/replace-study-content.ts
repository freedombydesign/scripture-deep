/**
 * Replace the "Heard From the First Day" study content with the correct markdown
 * Run with: npx tsx scripts/replace-study-content.ts
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

// Convert markdown to Tiptap JSON
function markdownToTiptap(markdown: string): object {
  const lines = markdown.split('\n')
  const content: any[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Skip empty lines
    if (line.trim() === '') {
      i++
      continue
    }

    // Blockquote (scripture quote)
    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].substring(2))
        i++
      }
      content.push({
        type: 'blockquote',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: quoteLines.join(' ') }]
        }]
      })
      continue
    }

    // Table
    if (line.startsWith('|')) {
      const tableRows: string[][] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        const row = lines[i]
        // Skip separator row
        if (row.includes('---')) {
          i++
          continue
        }
        const cells = row.split('|').slice(1, -1).map(c => c.trim())
        tableRows.push(cells)
        i++
      }

      if (tableRows.length > 0) {
        const headerRow = tableRows[0]
        const dataRows = tableRows.slice(1)

        content.push({
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: headerRow.map(cell => ({
                type: 'tableHeader',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: cell }] }]
              }))
            },
            ...dataRows.map(row => ({
              type: 'tableRow',
              content: row.map(cell => ({
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: cell }] }]
              }))
            }))
          ]
        })
      }
      continue
    }

    // Subheading (### )
    if (line.startsWith('### ')) {
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: line.substring(4) }]
      })
      i++
      continue
    }

    // Bold paragraph (**text**)
    if (line.startsWith('**') && line.endsWith('**')) {
      content.push({
        type: 'paragraph',
        content: [{
          type: 'text',
          marks: [{ type: 'bold' }],
          text: line.slice(2, -2)
        }]
      })
      i++
      continue
    }

    // List item
    if (line.startsWith('- ')) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        listItems.push(lines[i].substring(2))
        i++
      }
      content.push({
        type: 'bulletList',
        content: listItems.map(item => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }]
        }))
      })
      continue
    }

    // Numbered list
    if (/^\d+\. /.test(line)) {
      const listItems: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      content.push({
        type: 'orderedList',
        content: listItems.map(item => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }]
        }))
      })
      continue
    }

    // Regular paragraph
    content.push({
      type: 'paragraph',
      content: [{ type: 'text', text: line }]
    })
    i++
  }

  return { type: 'doc', content }
}

// Parse the markdown into sections
function parseMarkdownSections(markdown: string): Array<{
  heading: string
  body: string
  reflectionQuestions?: string[]
}> {
  const sections: Array<{ heading: string; body: string; reflectionQuestions?: string[] }> = []

  // Split by ## headers (section headers)
  const sectionRegex = /^## (\d+\. .+|Theme|Study Notes and Reflection)$/gm
  const parts = markdown.split(sectionRegex)

  // parts[0] is before first ##, then alternating: header, content, header, content...
  for (let i = 1; i < parts.length; i += 2) {
    const heading = parts[i].trim()
    const body = parts[i + 1]?.trim() || ''

    // Skip Theme section - that goes in study metadata
    if (heading === 'Theme') continue

    // Handle Study Notes and Reflection specially
    if (heading === 'Study Notes and Reflection') {
      // Extract reflection questions
      const questionsMatch = body.match(/\*\*Reflection questions:\*\*\n\n([\s\S]+)$/)
      const clarifications = body.replace(/\*\*Reflection questions:\*\*\n\n[\s\S]+$/, '').trim()

      const questions = questionsMatch
        ? questionsMatch[1].split('\n').filter(l => /^\d+\./.test(l)).map(l => l.replace(/^\d+\.\s*/, ''))
        : []

      sections.push({
        heading: 'Study Notes and Reflection',
        body: clarifications,
        reflectionQuestions: questions
      })
    } else {
      sections.push({ heading, body })
    }
  }

  return sections
}

async function replaceStudyContent() {
  console.log('Reading markdown file...')

  const mdPath = path.resolve(process.env.HOME || '', 'Downloads/Heard From the First Day.md')
  const markdown = fs.readFileSync(mdPath, 'utf8')

  // Parse sections
  const parsedSections = parseMarkdownSections(markdown)
  console.log(`Found ${parsedSections.length} sections in markdown:`)
  parsedSections.forEach((s, i) => console.log(`  ${i + 1}. ${s.heading}`))

  // Find the study
  const { data: study, error: studyError } = await supabase
    .from('studies')
    .select('id, title')
    .ilike('title', '%Heard From the First Day%')
    .single()

  if (studyError || !study) {
    console.error('Study not found:', studyError?.message)
    process.exit(1)
  }

  console.log(`\nFound study: "${study.title}" (${study.id})`)

  // Delete existing sections
  const { error: deleteError } = await supabase
    .from('sections')
    .delete()
    .eq('study_id', study.id)

  if (deleteError) {
    console.error('Error deleting sections:', deleteError.message)
    process.exit(1)
  }

  console.log('Deleted old sections')

  // Insert new sections
  for (let i = 0; i < parsedSections.length; i++) {
    const section = parsedSections[i]
    const tiptapBody = markdownToTiptap(section.body)

    const { error: insertError } = await supabase
      .from('sections')
      .insert({
        study_id: study.id,
        position: i + 1,
        heading: section.heading,
        body: tiptapBody,
        reflection_questions: section.reflectionQuestions || null,
        released: true
      })

    if (insertError) {
      console.error(`Error inserting section "${section.heading}":`, insertError.message)
    } else {
      console.log(`  ✓ ${i + 1}. ${section.heading}`)
    }
  }

  // Update study metadata (theme, key verse, reflection questions)
  const themeMatch = markdown.match(/## Theme\n\n([\s\S]+?)\n\n\*\*Key verse/)
  const theme = themeMatch ? themeMatch[1].trim() : null

  // Get reflection questions from last section
  const lastSection = parsedSections[parsedSections.length - 1]
  const studyReflectionQuestions = lastSection?.reflectionQuestions || []

  const { error: updateError } = await supabase
    .from('studies')
    .update({
      theme: theme,
      reflection_questions: studyReflectionQuestions
    })
    .eq('id', study.id)

  if (updateError) {
    console.error('Error updating study metadata:', updateError.message)
  } else {
    console.log('\n✓ Updated study theme and reflection questions')
  }

  console.log('\n✅ Study content replaced successfully!')
}

replaceStudyContent().catch(console.error)
