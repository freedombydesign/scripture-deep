'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function RichTextEditor({ content, onChange, placeholder = 'Start writing...' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()))
    },
    editorProps: {
      attributes: {
        class: 'prose-study min-h-[200px] focus:outline-none',
      },
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="border border-scripture-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-scripture-border bg-muted">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('bold') ? 'bg-primary text-primary-foreground' : 'hover:bg-background'
          }`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('italic') ? 'bg-primary text-primary-foreground' : 'hover:bg-background'
          }`}
        >
          <em>I</em>
        </button>
        <span className="w-px h-6 bg-scripture-border mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-background'
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('heading', { level: 3 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-background'
          }`}
        >
          H3
        </button>
        <span className="w-px h-6 bg-scripture-border mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('bulletList') ? 'bg-primary text-primary-foreground' : 'hover:bg-background'
          }`}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('orderedList') ? 'bg-primary text-primary-foreground' : 'hover:bg-background'
          }`}
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive('blockquote') ? 'bg-primary text-primary-foreground' : 'hover:bg-background'
          }`}
        >
          &ldquo; Quote
        </button>
      </div>

      {/* Editor */}
      <div className="p-4 bg-background">
        <EditorContent editor={editor} />
      </div>

      {/* Help text */}
      <div className="px-4 py-2 bg-muted border-t border-scripture-border text-xs text-muted-foreground">
        Scripture references (e.g., John 3:16, Ephesians 6:10-18) will be automatically linked when published.
      </div>
    </div>
  )
}
