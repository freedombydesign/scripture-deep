'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { parseStudy, generateSlug, bodyToTiptap, type ParseResult } from '@/lib/study-parser'
import { createClient } from '@/lib/supabase/client'
import type { Json, Database } from '@/types/database'

type SupabaseClient = ReturnType<typeof createClient>

interface ImportStudyFormProps {
  userId: string
}

export function ImportStudyForm({ userId }: ImportStudyFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [content, setContent] = useState('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<{ studyId: string; slug: string } | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    setContent(text)
    handleParse(text)
  }

  const handlePaste = () => {
    handleParse(content)
  }

  const handleParse = (text: string) => {
    setImportError(null)
    setImportSuccess(null)

    if (!text.trim()) {
      setParseResult(null)
      return
    }

    const result = parseStudy(text)
    setParseResult(result)
  }

  const handleImport = async () => {
    if (!parseResult?.study) return

    setIsImporting(true)
    setImportError(null)

    try {
      const supabase = createClient()
      const { frontmatter, sections, reflection } = parseResult.study

      // Generate slug
      const slug = generateSlug(frontmatter.title)

      // Check if slug exists
      const { data: existing } = await supabase
        .from('studies')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existing) {
        setImportError(`A study with slug "${slug}" already exists. Change the title or delete the existing study.`)
        setIsImporting(false)
        return
      }

      // Create study - using type assertion for Supabase insert
      const studyInsert = {
        title: frontmatter.title,
        subtitle: frontmatter.subtitle || null,
        slug,
        key_verse_ref: frontmatter.key_verse || null,
        theme: frontmatter.theme || null,
        author_id: userId,
        status: 'draft' as const,
        release_mode: frontmatter.release === 'all-open' ? 'all_open' : 'release_as_we_go',
        reflection_questions: reflection?.questions || [],
      } satisfies Database['public']['Tables']['studies']['Insert']

      const { data: study, error: studyError } = await supabase
        .from('studies')
        .insert(studyInsert as any)
        .select('id')
        .single()

      if (studyError || !study) {
        throw new Error(studyError?.message || 'Failed to create study')
      }

      const studyId = (study as { id: string }).id
      let wordStudyPosition = 1

      // Insert sections
      for (const section of sections) {
        const tiptapBody = bodyToTiptap(section.body) as Json

        const sectionInsert = {
          study_id: studyId,
          position: section.position,
          heading: section.heading,
          body: tiptapBody,
          reflection_questions: section.questions.length > 0 ? section.questions : null,
          released: frontmatter.release === 'all-open',
        } satisfies Database['public']['Tables']['sections']['Insert']

        const { data: insertedSection, error: sectionError } = await supabase
          .from('sections')
          .insert(sectionInsert as any)
          .select('id')
          .single()

        if (sectionError || !insertedSection) {
          console.error('Section error:', sectionError)
          continue
        }

        const sectionId = (insertedSection as { id: string }).id

        // Insert word studies
        for (const ws of section.wordStudies) {
          const strongsArray = ws.strongs.map(num => {
            // Hebrew uses wlc (Westminster Leningrad Codex), Greek uses tr (Textus Receptus)
            const textType = num.startsWith('H') ? 'wlc' : 'tr'
            return {
              number: num,
              blb_url: `https://www.blueletterbible.org/lexicon/${num.toLowerCase()}/kjv/${textType}/0-1/`
            }
          })

          const wordStudyInsert = {
            study_id: studyId,
            section_id: sectionId,
            english_word: ws.word,
            verse_reference: ws.verse,
            language: ws.language as 'Hebrew' | 'Greek',
            original_word: ws.original,
            strongs: strongsArray,
            meaning: ws.meaning,
            what_it_changes: ws.changes,
            cross_references: ws.cross,
            needs_check_on_blb: ws.check,
            position: wordStudyPosition++,
          } satisfies Database['public']['Tables']['word_studies']['Insert']

          const { error: wsError } = await supabase
            .from('word_studies')
            .insert(wordStudyInsert as any)

          if (wsError) {
            console.error('Word study error:', wsError)
          }
        }
      }

      setImportSuccess({ studyId, slug })
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  const errors = parseResult?.errors.filter(e => e.severity === 'error') || []
  const warnings = parseResult?.errors.filter(e => e.severity === 'warning') || []
  const hasBlockingErrors = errors.length > 0

  // Count word studies
  const wordStudyCount = parseResult?.study?.sections.reduce(
    (sum, s) => sum + s.wordStudies.length, 0
  ) || 0

  // Count word studies needing verification
  const needsVerificationCount = parseResult?.study?.sections.reduce(
    (sum, s) => sum + s.wordStudies.filter(ws => ws.check).length, 0
  ) || 0

  return (
    <div className="space-y-8">
      {/* File Upload */}
      <div className="premium-card p-6">
        <h2 className="text-lg font-semibold mb-4">Upload File</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-scripture-border rounded-xl p-8 text-center hover:border-accent/50 hover:bg-muted/30 transition"
        >
          <svg className="w-10 h-10 mx-auto mb-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-muted-foreground">Click to upload a .md file</p>
        </button>
      </div>

      {/* Or Paste */}
      <div className="premium-card p-6">
        <h2 className="text-lg font-semibold mb-4">Or Paste Markdown</h2>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your study markdown here..."
          className="w-full h-64 p-4 bg-muted/30 border border-scripture-border rounded-xl font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <button
          onClick={handlePaste}
          disabled={!content.trim()}
          className="mt-4 px-6 py-2.5 bg-muted hover:bg-muted/70 border border-scripture-border rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Parse Content
        </button>
      </div>

      {/* Preview */}
      {parseResult && (
        <div className="premium-card p-6">
          <h2 className="text-lg font-semibold mb-4">Preview</h2>

          {parseResult.study ? (
            <div className="space-y-6">
              {/* Study Info */}
              <div className="space-y-3">
                <h3 className="text-2xl font-serif font-semibold">
                  {parseResult.study.frontmatter.title}
                </h3>
                {parseResult.study.frontmatter.subtitle && (
                  <p className="text-muted-foreground">
                    {parseResult.study.frontmatter.subtitle}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 text-sm">
                  {parseResult.study.frontmatter.key_verse && (
                    <span className="px-3 py-1 bg-accent/10 text-accent rounded-full">
                      Key: {parseResult.study.frontmatter.key_verse}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-muted rounded-full">
                    Mode: {parseResult.study.frontmatter.release}
                  </span>
                </div>
              </div>

              {/* Sections */}
              <div>
                <h4 className="font-semibold mb-3">Sections ({parseResult.study.sections.length})</h4>
                <div className="space-y-2">
                  {parseResult.study.sections.map((section) => (
                    <div
                      key={section.position}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div>
                        <span className="font-medium">{section.position}. {section.heading}</span>
                        {section.wordStudies.length > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({section.wordStudies.length} word {section.wordStudies.length === 1 ? 'study' : 'studies'})
                          </span>
                        )}
                      </div>
                      {!section.point && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">
                          Missing Point
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Word Studies Summary */}
              <div className="flex items-center gap-6 p-4 bg-muted/30 rounded-xl">
                <div>
                  <span className="text-2xl font-bold">{wordStudyCount}</span>
                  <span className="text-sm text-muted-foreground ml-2">Word Studies</span>
                </div>
                {needsVerificationCount > 0 && (
                  <div className="text-yellow-600 dark:text-yellow-400">
                    <span className="text-2xl font-bold">{needsVerificationCount}</span>
                    <span className="text-sm ml-2">Need Verification</span>
                  </div>
                )}
              </div>

              {/* Reflection */}
              {parseResult.study.reflection && (
                <div>
                  <h4 className="font-semibold mb-2">Reflection</h4>
                  <div className="text-sm text-muted-foreground">
                    {parseResult.study.reflection.clarifications.length > 0 && (
                      <p>{parseResult.study.reflection.clarifications.length} clarifications</p>
                    )}
                    {parseResult.study.reflection.questions.length > 0 && (
                      <p>{parseResult.study.reflection.questions.length} reflection questions</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-red-600 dark:text-red-400">
              <p className="font-semibold">Cannot parse study</p>
              <p className="text-sm">Fix the errors below and try again</p>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">
                Errors ({errors.length})
              </h4>
              <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
                {errors.map((error, i) => (
                  <li key={i}>
                    Line {error.line}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <h4 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">
                Warnings ({warnings.length})
              </h4>
              <ul className="space-y-1 text-sm text-yellow-600 dark:text-yellow-400">
                {warnings.map((warning, i) => (
                  <li key={i}>
                    Line {warning.line}: {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Import Button */}
          {parseResult.study && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Study will be saved as <strong>draft</strong>. Publish from the edit page.
              </p>
              <button
                onClick={handleImport}
                disabled={hasBlockingErrors || isImporting}
                className="btn-accent px-6 py-2.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Importing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import as Draft
                  </>
                )}
              </button>
            </div>
          )}

          {/* Import Error */}
          {importError && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
              {importError}
            </div>
          )}

          {/* Import Success */}
          {importSuccess && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <p className="text-green-700 dark:text-green-300 font-semibold mb-2">
                Study imported successfully!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/dashboard/${importSuccess.studyId}`)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Edit Study
                </button>
                <button
                  onClick={() => {
                    setContent('')
                    setParseResult(null)
                    setImportSuccess(null)
                  }}
                  className="px-4 py-2 bg-muted hover:bg-muted/70 border border-scripture-border rounded-lg text-sm font-medium transition"
                >
                  Import Another
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
