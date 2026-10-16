'use client'

import { useState } from 'react'
import type { WordStudy } from '@/types/database'

interface WordStudyEditorProps {
  wordStudy?: Partial<WordStudy>
  onSave: (data: Partial<WordStudy>) => Promise<void>
  onCancel: () => void
}

export function WordStudyEditor({ wordStudy, onSave, onCancel }: WordStudyEditorProps) {
  const [englishWord, setEnglishWord] = useState(wordStudy?.english_word || '')
  const [verseReference, setVerseReference] = useState(wordStudy?.verse_reference || '')
  const [language, setLanguage] = useState<'Hebrew' | 'Greek'>(wordStudy?.language || 'Hebrew')
  const [originalWord, setOriginalWord] = useState(wordStudy?.original_word?.join(', ') || '')
  const [transliteration, setTransliteration] = useState(wordStudy?.transliteration || '')
  const [strongsNumbers, setStrongsNumbers] = useState(
    wordStudy?.strongs?.map(s => s.number).join(', ') || ''
  )
  const [meaning, setMeaning] = useState(wordStudy?.meaning || '')
  const [whatItChanges, setWhatItChanges] = useState(wordStudy?.what_it_changes || '')
  const [crossReferences, setCrossReferences] = useState(wordStudy?.cross_references?.join(', ') || '')
  const [needsCheck, setNeedsCheck] = useState(wordStudy?.needs_check_on_blb || false)
  const [saving, setSaving] = useState(false)

  const generateBLBUrl = (strongsNum: string): string => {
    // Extract H or G prefix and number
    const match = strongsNum.match(/^([HG])(\d+)$/i)
    if (!match) return ''

    const prefix = match[1].toUpperCase()
    const number = match[2]
    const lang = prefix === 'H' ? 'hebrew' : 'greek'

    return `https://www.blueletterbible.org/lexicon/${strongsNum.toLowerCase()}/kjv/wlc/0-1/`
  }

  const handleSave = async () => {
    if (!englishWord.trim() || !verseReference.trim()) {
      alert('Please enter the English word and verse reference')
      return
    }

    setSaving(true)

    // Parse Strong's numbers and generate BLB URLs
    const strongs = strongsNumbers
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => /^[HG]\d+$/i.test(s))
      .map(num => ({
        number: num,
        blb_url: generateBLBUrl(num),
      }))

    const data: Partial<WordStudy> = {
      english_word: englishWord.trim(),
      verse_reference: verseReference.trim(),
      language,
      original_word: originalWord.split(',').map(w => w.trim()).filter(Boolean),
      transliteration: transliteration.trim() || null,
      strongs,
      meaning: meaning.trim() || null,
      what_it_changes: whatItChanges.trim() || null,
      cross_references: crossReferences.split(',').map(r => r.trim()).filter(Boolean),
      needs_check_on_blb: needsCheck,
    }

    try {
      await onSave(data)
    } catch (error) {
      console.error('Error saving word study:', error)
      alert('Error saving word study')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-scripture-border rounded-xl p-6 bg-scripture-bg">
      <h3 className="text-lg font-semibold mb-4">
        {wordStudy?.id ? 'Edit Word Study' : 'New Word Study'}
      </h3>

      <div className="space-y-4">
        {/* English word and verse reference */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              English Word <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={englishWord}
              onChange={(e) => setEnglishWord(e.target.value)}
              placeholder="e.g., chasten thyself"
              className="w-full px-4 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Verse Reference <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={verseReference}
              onChange={(e) => setVerseReference(e.target.value)}
              placeholder="e.g., Daniel 10:12"
              className="w-full px-4 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium mb-1">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'Hebrew' | 'Greek')}
            className="w-full px-4 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="Hebrew">Hebrew (Old Testament)</option>
            <option value="Greek">Greek (New Testament)</option>
          </select>
        </div>

        {/* Original word and transliteration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Original Word(s)
            </label>
            <input
              type="text"
              value={originalWord}
              onChange={(e) => setOriginalWord(e.target.value)}
              placeholder="e.g., anah (comma-separated if multiple)"
              className="w-full px-4 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Transliteration
            </label>
            <input
              type="text"
              value={transliteration}
              onChange={(e) => setTransliteration(e.target.value)}
              placeholder="e.g., aw-naw'"
              className="w-full px-4 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Strong's numbers */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Strong&apos;s Number(s)
          </label>
          <input
            type="text"
            value={strongsNumbers}
            onChange={(e) => setStrongsNumbers(e.target.value)}
            placeholder="e.g., H6031, H6035 (comma-separated)"
            className="w-full px-4 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use H for Hebrew (e.g., H6031) or G for Greek (e.g., G25). BLB links are auto-generated.
          </p>
        </div>

        {/* Meaning */}
        <div>
          <label className="block text-sm font-medium mb-1">Meaning</label>
          <textarea
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            rows={3}
            placeholder="Definition from Strong's or lexicon..."
            className="w-full px-4 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
          />
        </div>

        {/* What it changes - teacher insight */}
        <div>
          <label className="block text-sm font-medium mb-1">
            What This Changes
            <span className="text-xs text-muted-foreground ml-2">(Your teaching insight)</span>
          </label>
          <textarea
            value={whatItChanges}
            onChange={(e) => setWhatItChanges(e.target.value)}
            rows={3}
            placeholder="How does understanding this word change how we read this passage..."
            className="w-full px-4 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y border-l-3 border-l-accent"
          />
        </div>

        {/* Cross-references */}
        <div>
          <label className="block text-sm font-medium mb-1">Cross References</label>
          <input
            type="text"
            value={crossReferences}
            onChange={(e) => setCrossReferences(e.target.value)}
            placeholder="e.g., Leviticus 16:29, Psalm 35:13 (comma-separated)"
            className="w-full px-4 py-2 border border-scripture-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Needs check flag */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="needsCheck"
            checked={needsCheck}
            onChange={(e) => setNeedsCheck(e.target.checked)}
            className="w-4 h-4 rounded border-scripture-border"
          />
          <label htmlFor="needsCheck" className="text-sm">
            Needs verification on Blue Letter Bible
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-scripture-border">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Word Study'}
        </button>
      </div>
    </div>
  )
}
