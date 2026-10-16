/**
 * Study Format Parser
 *
 * Parses markdown files in the STUDY-FORMAT.md specification into structured data
 * for import into Supabase.
 */

import { findScriptureReferences } from './scripture/parser'

// Types
export interface StudyFrontmatter {
  title: string
  subtitle?: string
  key_verse?: string
  theme?: string
  release: 'all-open' | 'release-as-we-go'
}

export interface WordStudy {
  word: string
  verse: string
  language: 'Hebrew' | 'Greek'
  original: string[]
  strongs: string[]
  meaning: string
  changes: string
  cross: string[]
  check: boolean
}

export interface StudySection {
  position: number
  heading: string
  point: string
  body: string
  wordStudies: WordStudy[]
  questions: string[]
}

export interface StudyReflection {
  clarifications: Array<{ term: string; explanation: string }>
  questions: string[]
}

export interface ParsedStudy {
  frontmatter: StudyFrontmatter
  sections: StudySection[]
  reflection: StudyReflection | null
}

export interface ParseError {
  line: number
  message: string
  severity: 'error' | 'warning'
}

export interface ParseResult {
  study: ParsedStudy | null
  errors: ParseError[]
}

// Parse YAML frontmatter
export function parseFrontmatter(content: string): { frontmatter: StudyFrontmatter | null; body: string; errors: ParseError[] } {
  const errors: ParseError[] = []

  // Check for frontmatter delimiters
  if (!content.startsWith('---')) {
    errors.push({ line: 1, message: 'Missing frontmatter: file must start with ---', severity: 'error' })
    return { frontmatter: null, body: content, errors }
  }

  const endIndex = content.indexOf('\n---', 3)
  if (endIndex === -1) {
    errors.push({ line: 1, message: 'Missing frontmatter closing delimiter (---)', severity: 'error' })
    return { frontmatter: null, body: content, errors }
  }

  const frontmatterText = content.slice(4, endIndex)
  const body = content.slice(endIndex + 4).trim()

  // Parse YAML manually (simple key: value format)
  const lines = frontmatterText.split('\n')
  const data: Record<string, string> = {}

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) {
      errors.push({ line: i + 2, message: `Invalid frontmatter line: ${line}`, severity: 'error' })
      continue
    }

    const key = line.slice(0, colonIndex).trim()
    const value = line.slice(colonIndex + 1).trim()
    data[key] = value
  }

  // Validate required fields
  if (!data.title) {
    errors.push({ line: 1, message: 'Missing required field: title', severity: 'error' })
  }

  if (!data.release) {
    errors.push({ line: 1, message: 'Missing required field: release (must be "all-open" or "release-as-we-go")', severity: 'error' })
  } else if (data.release !== 'all-open' && data.release !== 'release-as-we-go') {
    errors.push({ line: 1, message: `Invalid release value: "${data.release}". Must be "all-open" or "release-as-we-go"`, severity: 'error' })
  }

  // Validate key_verse reference if provided
  if (data.key_verse) {
    const refs = findScriptureReferences(data.key_verse)
    if (refs.length === 0) {
      errors.push({ line: 1, message: `Invalid key_verse reference: "${data.key_verse}"`, severity: 'warning' })
    }
  }

  if (errors.some(e => e.severity === 'error')) {
    return { frontmatter: null, body, errors }
  }

  return {
    frontmatter: {
      title: data.title,
      subtitle: data.subtitle || undefined,
      key_verse: data.key_verse || undefined,
      theme: data.theme || undefined,
      release: data.release as 'all-open' | 'release-as-we-go'
    },
    body,
    errors
  }
}

// Parse a word study block
export function parseWordStudy(block: string, lineOffset: number): { wordStudy: WordStudy | null; errors: ParseError[] } {
  const errors: ParseError[] = []
  const lines = block.split('\n')
  const data: Record<string, string> = {}

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line === ':::word' || line === ':::') continue

    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    const value = line.slice(colonIndex + 1).trim()
    data[key] = value
  }

  // Validate required fields
  const required = ['word', 'verse', 'language', 'original', 'strongs', 'meaning', 'changes']
  for (const field of required) {
    if (!data[field]) {
      errors.push({ line: lineOffset, message: `Word study missing required field: ${field}`, severity: 'error' })
    }
  }

  // Validate language
  if (data.language && data.language !== 'Hebrew' && data.language !== 'Greek') {
    errors.push({ line: lineOffset, message: `Invalid language: "${data.language}". Must be "Hebrew" or "Greek"`, severity: 'error' })
  }

  // Validate Strong's numbers format
  const strongsNumbers = data.strongs ? data.strongs.split(',').map(s => s.trim()) : []
  for (const num of strongsNumbers) {
    if (num && !/^[HG]\d+$/.test(num)) {
      errors.push({ line: lineOffset, message: `Invalid Strong's number format: "${num}". Must be H#### or G####`, severity: 'warning' })
    }
  }

  // Validate verse reference
  if (data.verse) {
    const refs = findScriptureReferences(data.verse)
    if (refs.length === 0) {
      errors.push({ line: lineOffset, message: `Invalid verse reference: "${data.verse}"`, severity: 'warning' })
    }
  }

  // Parse cross references
  const crossRefs = data.cross ? data.cross.split(';').map(s => s.trim()).filter(Boolean) : []
  for (const ref of crossRefs) {
    const matches = findScriptureReferences(ref)
    if (matches.length === 0) {
      errors.push({ line: lineOffset, message: `Invalid cross reference: "${ref}"`, severity: 'warning' })
    }
  }

  // Check flag
  const needsCheck = data.check === 'yes'
  if (needsCheck) {
    errors.push({ line: lineOffset, message: `Word study "${data.word}" needs Strong's verification (check: yes)`, severity: 'warning' })
  }

  if (errors.some(e => e.severity === 'error')) {
    return { wordStudy: null, errors }
  }

  return {
    wordStudy: {
      word: data.word,
      verse: data.verse,
      language: data.language as 'Hebrew' | 'Greek',
      original: data.original.split(',').map(s => s.trim()),
      strongs: strongsNumbers,
      meaning: data.meaning,
      changes: data.changes,
      cross: crossRefs,
      check: needsCheck
    },
    errors
  }
}

// Parse a numbered section
export function parseSection(content: string, position: number, startLine: number): { section: StudySection | null; errors: ParseError[] } {
  const errors: ParseError[] = []
  const lines = content.split('\n')

  // Extract heading from first line (## 1. Heading)
  const headingMatch = lines[0].match(/^##\s*\d+\.\s*(.+)$/)
  if (!headingMatch) {
    errors.push({ line: startLine, message: 'Invalid section heading format. Expected "## N. Heading"', severity: 'error' })
    return { section: null, errors }
  }
  const heading = headingMatch[1].trim()

  // Find Point line
  let point = ''
  let bodyStartIndex = 1

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    if (line.startsWith('Point:')) {
      point = line.slice(6).trim()
      bodyStartIndex = i + 1
      break
    }

    // If we hit content before Point:, warn
    if (line && !line.startsWith('Point:')) {
      errors.push({ line: startLine + i, message: 'Section should start with "Point:" line after heading', severity: 'warning' })
      bodyStartIndex = i
      break
    }
  }

  if (!point) {
    errors.push({ line: startLine, message: `Section "${heading}" is missing Point: line`, severity: 'warning' })
  }

  // Extract word studies and questions from body
  const wordStudies: WordStudy[] = []
  const questions: string[] = []
  const bodyLines: string[] = []

  let i = bodyStartIndex
  while (i < lines.length) {
    const line = lines[i]

    // Word study block
    if (line.trim() === ':::word') {
      const blockStart = i
      let blockEnd = i + 1
      while (blockEnd < lines.length && lines[blockEnd].trim() !== ':::') {
        blockEnd++
      }

      const block = lines.slice(blockStart, blockEnd + 1).join('\n')
      const { wordStudy, errors: wsErrors } = parseWordStudy(block, startLine + blockStart)
      errors.push(...wsErrors)
      if (wordStudy) {
        wordStudies.push(wordStudy)
      }

      i = blockEnd + 1
      continue
    }

    // Questions block
    if (line.trim() === 'Questions:') {
      i++
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        questions.push(lines[i].trim().replace(/^\d+\.\s*/, ''))
        i++
      }
      continue
    }

    bodyLines.push(line)
    i++
  }

  // Build body (without word studies)
  const body = bodyLines.join('\n').trim()

  // Validate scripture references in body
  const refs = findScriptureReferences(body)
  // Just informational - we don't error on references in body

  return {
    section: {
      position,
      heading,
      point,
      body,
      wordStudies,
      questions
    },
    errors
  }
}

// Parse the Reflection section
export function parseReflection(content: string, startLine: number): { reflection: StudyReflection | null; errors: ParseError[] } {
  const errors: ParseError[] = []
  const clarifications: Array<{ term: string; explanation: string }> = []
  const questions: string[] = []

  const lines = content.split('\n')
  let inClarifications = false
  let inQuestions = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line === 'Clarifications:') {
      inClarifications = true
      inQuestions = false
      continue
    }

    if (line === 'Questions:') {
      inClarifications = false
      inQuestions = true
      continue
    }

    if (inClarifications && line.startsWith('- **')) {
      // Parse clarification: - **Term** explanation
      const match = line.match(/^-\s*\*\*([^*]+)\*\*\s*(.+)$/)
      if (match) {
        clarifications.push({ term: match[1], explanation: match[2] })
      } else {
        errors.push({ line: startLine + i, message: `Invalid clarification format: ${line}`, severity: 'warning' })
      }
    }

    if (inQuestions && /^\d+\.\s/.test(line)) {
      questions.push(line.replace(/^\d+\.\s*/, ''))
    }
  }

  return {
    reflection: {
      clarifications,
      questions
    },
    errors
  }
}

// Main parser function
export function parseStudy(content: string): ParseResult {
  const allErrors: ParseError[] = []

  // Parse frontmatter
  const { frontmatter, body, errors: frontmatterErrors } = parseFrontmatter(content)
  allErrors.push(...frontmatterErrors)

  if (!frontmatter) {
    return { study: null, errors: allErrors }
  }

  // Split body into sections
  const lines = body.split('\n')
  const sections: StudySection[] = []
  let reflection: StudyReflection | null = null

  let currentSectionStart = -1
  let currentSectionLines: string[] = []
  let lineNumber = content.indexOf(body) > 0 ? content.slice(0, content.indexOf(body)).split('\n').length : 1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Numbered section header
    if (/^##\s*\d+\./.test(line)) {
      // Save previous section
      if (currentSectionLines.length > 0) {
        const { section, errors } = parseSection(
          currentSectionLines.join('\n'),
          sections.length + 1,
          currentSectionStart
        )
        allErrors.push(...errors)
        if (section) {
          sections.push(section)
        }
      }

      currentSectionStart = lineNumber + i
      currentSectionLines = [line]
      continue
    }

    // Reflection section
    if (line.trim() === '## Reflection') {
      // Save previous section
      if (currentSectionLines.length > 0) {
        const { section, errors } = parseSection(
          currentSectionLines.join('\n'),
          sections.length + 1,
          currentSectionStart
        )
        allErrors.push(...errors)
        if (section) {
          sections.push(section)
        }
      }

      // Parse reflection (rest of file)
      const reflectionContent = lines.slice(i + 1).join('\n')
      const { reflection: r, errors } = parseReflection(reflectionContent, lineNumber + i)
      allErrors.push(...errors)
      reflection = r
      break
    }

    // Add to current section
    if (currentSectionStart !== -1) {
      currentSectionLines.push(line)
    }
  }

  // Save last section if no reflection
  if (currentSectionLines.length > 0 && !reflection) {
    const { section, errors } = parseSection(
      currentSectionLines.join('\n'),
      sections.length + 1,
      currentSectionStart
    )
    allErrors.push(...errors)
    if (section) {
      sections.push(section)
    }
  }

  // Validate we have at least one section
  if (sections.length === 0) {
    allErrors.push({ line: 1, message: 'Study must have at least one numbered section', severity: 'error' })
  }

  return {
    study: {
      frontmatter,
      sections,
      reflection
    },
    errors: allErrors
  }
}

// Utility to convert parsed study to Tiptap JSON for body storage
export function bodyToTiptap(body: string): object {
  const lines = body.split('\n')
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
      const quoteText = quoteLines.join(' ')
      content.push({
        type: 'blockquote',
        content: [{
          type: 'paragraph',
          content: parseInlineMarkdown(quoteText)
        }]
      })
      continue
    }

    // Table
    if (line.startsWith('|')) {
      const tableRows: string[][] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        const row = lines[i]
        if (!row.includes('---')) {
          const cells = row.split('|').slice(1, -1).map(c => c.trim())
          tableRows.push(cells)
        }
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
                content: [{ type: 'paragraph', content: parseInlineMarkdown(cell) }]
              }))
            },
            ...dataRows.map(row => ({
              type: 'tableRow',
              content: row.map(cell => ({
                type: 'tableCell',
                content: [{ type: 'paragraph', content: parseInlineMarkdown(cell) }]
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
        content: parseInlineMarkdown(line.substring(4))
      })
      i++
      continue
    }

    // Bullet list
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
          content: [{ type: 'paragraph', content: parseInlineMarkdown(item) }]
        }))
      })
      continue
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      content.push({
        type: 'orderedList',
        content: listItems.map(item => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInlineMarkdown(item) }]
        }))
      })
      continue
    }

    // Regular paragraph
    content.push({
      type: 'paragraph',
      content: parseInlineMarkdown(line)
    })
    i++
  }

  return { type: 'doc', content }
}

// Parse inline markdown (bold, italic) into Tiptap text nodes
function parseInlineMarkdown(text: string): any[] {
  const nodes: any[] = []
  const parts: Array<{ text: string; bold?: boolean }> = []
  let cursor = 0

  const boldMatches = [...text.matchAll(/\*\*(.+?)\*\*/g)]

  if (boldMatches.length === 0) {
    return text ? [{ type: 'text', text }] : []
  }

  for (const match of boldMatches) {
    if (match.index! > cursor) {
      parts.push({ text: text.slice(cursor, match.index) })
    }
    parts.push({ text: match[1], bold: true })
    cursor = match.index! + match[0].length
  }

  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor) })
  }

  for (const part of parts) {
    if (part.text) {
      const node: any = { type: 'text', text: part.text }
      if (part.bold) {
        node.marks = [{ type: 'bold' }]
      }
      nodes.push(node)
    }
  }

  return nodes
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
