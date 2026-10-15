'use client'

interface ExportButtonProps {
  studyTitle: string
  notes: Array<{
    body: string
    sectionHeading: string
    sectionPosition: number
  }>
}

export function ExportButton({ studyTitle, notes }: ExportButtonProps) {
  const handleExport = () => {
    const text = [
      `Notes on: ${studyTitle}`,
      `Exported: ${new Date().toLocaleDateString()}`,
      '',
      ...notes.map((note) => [
        `--- ${note.sectionPosition}. ${note.sectionHeading} ---`,
        note.body,
        '',
      ]).flat(),
    ].join('\n')

    navigator.clipboard.writeText(text).then(() => {
      alert('Notes copied to clipboard!')
    })
  }

  return (
    <button
      onClick={handleExport}
      className="text-sm text-primary hover:underline"
    >
      Copy notes to clipboard
    </button>
  )
}
