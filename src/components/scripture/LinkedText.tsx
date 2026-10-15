'use client'

import { useMemo } from 'react'
import { findScriptureReferences } from '@/lib/scripture'
import { ScriptureLink } from './ScriptureLink'

interface LinkedTextProps {
  text: string
  className?: string
}

/**
 * Renders text with scripture references automatically linked
 */
export function LinkedText({ text, className = '' }: LinkedTextProps) {
  const parts = useMemo(() => {
    const matches = findScriptureReferences(text)

    if (matches.length === 0) {
      return [{ type: 'text' as const, content: text }]
    }

    const result: Array<
      | { type: 'text'; content: string }
      | { type: 'ref'; content: string; refs: typeof matches[0]['refs'] }
    > = []

    let lastIndex = 0

    for (const match of matches) {
      // Add text before this match
      if (match.startIndex > lastIndex) {
        result.push({
          type: 'text',
          content: text.slice(lastIndex, match.startIndex),
        })
      }

      // Add the scripture reference
      result.push({
        type: 'ref',
        content: match.text,
        refs: match.refs,
      })

      lastIndex = match.endIndex
    }

    // Add remaining text after last match
    if (lastIndex < text.length) {
      result.push({
        type: 'text',
        content: text.slice(lastIndex),
      })
    }

    return result
  }, [text])

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.type === 'text' ? (
          <span key={index}>{part.content}</span>
        ) : (
          <ScriptureLink key={index} text={part.content} refs={part.refs} />
        )
      )}
    </span>
  )
}
