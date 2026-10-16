'use client'

import { LinkedText } from '@/components/scripture'
import type { Json } from '@/types/database'

interface StudySectionProps {
  id: string
  heading: string
  body: Json
  reflectionQuestions: string[] | null
  position: number
}

interface TiptapNode {
  type: string
  content?: TiptapNode[]
  text?: string
  attrs?: Record<string, unknown>
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
}

// Simple rich text renderer - converts Tiptap JSON to HTML with linked scripture
function RichTextContent({ content }: { content: Json }) {
  // Handle string content (plain text)
  if (typeof content === 'string') {
    return (
      <p>
        <LinkedText text={content} />
      </p>
    )
  }

  // Handle Tiptap JSON format
  if (content && typeof content === 'object' && !Array.isArray(content) && 'type' in content) {
    return <TiptapRenderer node={content as unknown as TiptapNode} />
  }

  // Handle array of nodes
  if (Array.isArray(content)) {
    return (
      <>
        {content.map((node, index) => (
          <TiptapRenderer key={index} node={node as unknown as TiptapNode} />
        ))}
      </>
    )
  }

  return null
}

function TiptapRenderer({ node }: { node: TiptapNode }) {
  // Text node
  if (node.type === 'text' && node.text) {
    let content: React.ReactNode = <LinkedText text={node.text} />

    // Apply marks (bold, italic, etc.)
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold':
            content = <strong>{content}</strong>
            break
          case 'italic':
            content = <em>{content}</em>
            break
          case 'underline':
            content = <u>{content}</u>
            break
        }
      }
    }

    return <>{content}</>
  }

  // Container nodes
  const children = node.content?.map((child, index) => (
    <TiptapRenderer key={index} node={child} />
  ))

  switch (node.type) {
    case 'doc':
      return <>{children}</>
    case 'paragraph':
      return <p className="mb-4">{children}</p>
    case 'heading': {
      const level = (node.attrs?.level as number) || 2
      if (level === 2) return <h2 className="text-xl font-semibold mt-6 mb-3">{children}</h2>
      if (level === 3) return <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>
      return <h4 className="font-semibold mt-3 mb-2">{children}</h4>
    }
    case 'bulletList':
      return <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
    case 'orderedList':
      return <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
    case 'listItem':
      // Extract text directly from paragraph children to avoid block-level wrapping
      const listContent = node.content?.map((child, index) => {
        if (child.type === 'paragraph' && child.content) {
          // Render paragraph contents inline, not as block
          return child.content.map((innerChild, innerIndex) => (
            <TiptapRenderer key={`${index}-${innerIndex}`} node={innerChild} />
          ))
        }
        return <TiptapRenderer key={index} node={child} />
      })
      return <li>{listContent}</li>
    case 'blockquote':
      return (
        <blockquote className="scripture-text border-l-4 border-primary bg-scripture-bg pl-4 py-2 my-4 rounded-r">
          {children}
        </blockquote>
      )
    case 'hardBreak':
      return <br />
    case 'table':
      return (
        <div className="overflow-x-auto my-6">
          <table className="min-w-full border-collapse border border-scripture-border">
            <tbody>{children}</tbody>
          </table>
        </div>
      )
    case 'tableRow':
      return <tr className="border-b border-scripture-border">{children}</tr>
    case 'tableHeader': {
      const headerContent = node.content?.map((child, index) => {
        if (child.type === 'paragraph' && child.content) {
          return child.content.map((innerChild, innerIndex) => (
            <TiptapRenderer key={`${index}-${innerIndex}`} node={innerChild} />
          ))
        }
        return <TiptapRenderer key={index} node={child} />
      })
      return (
        <th className="bg-muted px-4 py-2 text-left font-semibold border border-scripture-border">
          {headerContent}
        </th>
      )
    }
    case 'tableCell': {
      const cellContent = node.content?.map((child, index) => {
        if (child.type === 'paragraph' && child.content) {
          return child.content.map((innerChild, innerIndex) => (
            <TiptapRenderer key={`${index}-${innerIndex}`} node={innerChild} />
          ))
        }
        return <TiptapRenderer key={index} node={child} />
      })
      return (
        <td className="px-4 py-2 border border-scripture-border">
          {cellContent}
        </td>
      )
    }
    default:
      return <>{children}</>
  }
}

export function StudySection({
  id,
  heading,
  body,
  reflectionQuestions,
  position,
}: StudySectionProps) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="text-2xl font-semibold mb-4">
        <span className="text-primary mr-2">{position}.</span>
        {heading}
      </h2>

      <div className="prose-study">
        <RichTextContent content={body} />
      </div>

      {reflectionQuestions && reflectionQuestions.length > 0 && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-3">Reflection Questions</h3>
          <ol className="list-decimal list-inside space-y-2">
            {reflectionQuestions.map((question, index) => (
              <li key={index} className="text-foreground">
                <LinkedText text={question} />
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
