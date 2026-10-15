'use client'

import { useState, useEffect } from 'react'

interface Section {
  id: string
  heading: string
}

interface SectionJumpBarProps {
  sections: Section[]
}

export function SectionJumpBar({ sections }: SectionJumpBarProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      {
        rootMargin: '-20% 0px -60% 0px',
      }
    )

    sections.forEach((section) => {
      const element = document.getElementById(section.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [sections])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <nav
      aria-label="Study sections"
      className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-scripture-border py-2 -mx-4 px-4 mb-6 overflow-x-auto"
    >
      <div className="flex gap-1 min-w-max">
        {sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition ${
              activeId === section.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
          >
            {index + 1}. {section.heading}
          </button>
        ))}
      </div>
    </nav>
  )
}
