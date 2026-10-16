import { describe, it, expect } from 'vitest'
import {
  parseFrontmatter,
  parseWordStudy,
  parseSection,
  parseReflection,
  parseStudy,
  bodyToTiptap,
  generateSlug,
  type ParsedStudy,
  type WordStudy,
} from './study-parser'

describe('Study Parser', () => {
  describe('parseFrontmatter', () => {
    it('should parse valid frontmatter', () => {
      const content = `---
title: Heard From the First Day
subtitle: Delay, spiritual warfare, and the faithfulness of God
key_verse: Daniel 10:12
theme: God hears our prayers from the first day
release: all-open
---

## 1. The Question`

      const { frontmatter, body, errors } = parseFrontmatter(content)

      expect(frontmatter).not.toBeNull()
      expect(frontmatter?.title).toBe('Heard From the First Day')
      expect(frontmatter?.subtitle).toBe('Delay, spiritual warfare, and the faithfulness of God')
      expect(frontmatter?.key_verse).toBe('Daniel 10:12')
      expect(frontmatter?.theme).toBe('God hears our prayers from the first day')
      expect(frontmatter?.release).toBe('all-open')
      expect(body).toBe('## 1. The Question')
      expect(errors.filter(e => e.severity === 'error')).toHaveLength(0)
    })

    it('should parse release-as-we-go mode', () => {
      const content = `---
title: Test Study
release: release-as-we-go
---

Body`

      const { frontmatter, errors } = parseFrontmatter(content)
      expect(frontmatter?.release).toBe('release-as-we-go')
      expect(errors.filter(e => e.severity === 'error')).toHaveLength(0)
    })

    it('should error on missing frontmatter', () => {
      const content = `## 1. The Question

Some content`

      const { frontmatter, errors } = parseFrontmatter(content)
      expect(frontmatter).toBeNull()
      expect(errors.some(e => e.message.includes('Missing frontmatter'))).toBe(true)
    })

    it('should error on missing title', () => {
      const content = `---
subtitle: Some subtitle
release: all-open
---

Body`

      const { frontmatter, errors } = parseFrontmatter(content)
      expect(frontmatter).toBeNull()
      expect(errors.some(e => e.message.includes('Missing required field: title'))).toBe(true)
    })

    it('should error on missing release', () => {
      const content = `---
title: Test Study
---

Body`

      const { frontmatter, errors } = parseFrontmatter(content)
      expect(frontmatter).toBeNull()
      expect(errors.some(e => e.message.includes('release'))).toBe(true)
    })

    it('should error on invalid release value', () => {
      const content = `---
title: Test Study
release: invalid-mode
---

Body`

      const { frontmatter, errors } = parseFrontmatter(content)
      expect(frontmatter).toBeNull()
      expect(errors.some(e => e.message.includes('Invalid release value'))).toBe(true)
    })

    it('should warn on invalid key_verse reference', () => {
      const content = `---
title: Test Study
key_verse: NotABook 99:99
release: all-open
---

Body`

      const { frontmatter, errors } = parseFrontmatter(content)
      expect(frontmatter).not.toBeNull()
      expect(errors.some(e => e.message.includes('Invalid key_verse reference') && e.severity === 'warning')).toBe(true)
    })

    it('should handle optional fields', () => {
      const content = `---
title: Minimal Study
release: all-open
---

Body`

      const { frontmatter, errors } = parseFrontmatter(content)
      expect(frontmatter).not.toBeNull()
      expect(frontmatter?.title).toBe('Minimal Study')
      expect(frontmatter?.subtitle).toBeUndefined()
      expect(frontmatter?.key_verse).toBeUndefined()
      expect(frontmatter?.theme).toBeUndefined()
      expect(errors.filter(e => e.severity === 'error')).toHaveLength(0)
    })
  })

  describe('parseWordStudy', () => {
    it('should parse a valid word study', () => {
      const block = `:::word
word: prince
verse: Daniel 10:13
language: Hebrew
original: sar
strongs: H8269
meaning: Prince, captain, chief, ruler.
changes: The SAME word describes Michael in the same verse.
cross: Daniel 10:20; Daniel 12:1
check: no
:::`

      const { wordStudy, errors } = parseWordStudy(block, 1)

      expect(wordStudy).not.toBeNull()
      expect(wordStudy?.word).toBe('prince')
      expect(wordStudy?.verse).toBe('Daniel 10:13')
      expect(wordStudy?.language).toBe('Hebrew')
      expect(wordStudy?.original).toEqual(['sar'])
      expect(wordStudy?.strongs).toEqual(['H8269'])
      expect(wordStudy?.meaning).toBe('Prince, captain, chief, ruler.')
      expect(wordStudy?.changes).toBe('The SAME word describes Michael in the same verse.')
      expect(wordStudy?.cross).toEqual(['Daniel 10:20', 'Daniel 12:1'])
      expect(wordStudy?.check).toBe(false)
      expect(errors.filter(e => e.severity === 'error')).toHaveLength(0)
    })

    it('should parse multiple Strong\'s numbers', () => {
      const block = `:::word
word: rock
verse: Isaiah 26:4
language: Hebrew
original: tsur, sela
strongs: H6697, H5553
meaning: Rock, cliff, crag.
changes: Both words mean rock but with different emphasis.
cross:
check: no
:::`

      const { wordStudy, errors } = parseWordStudy(block, 1)

      expect(wordStudy?.original).toEqual(['tsur', 'sela'])
      expect(wordStudy?.strongs).toEqual(['H6697', 'H5553'])
    })

    it('should handle Greek words', () => {
      const block = `:::word
word: angel
verse: Daniel 10:13
language: Greek
original: angelos
strongs: G32
meaning: Messenger.
changes: Used in LXX translation.
cross:
check: no
:::`

      const { wordStudy, errors } = parseWordStudy(block, 1)
      expect(wordStudy?.language).toBe('Greek')
    })

    it('should error on missing required fields', () => {
      const block = `:::word
word: prince
verse: Daniel 10:13
:::`

      const { wordStudy, errors } = parseWordStudy(block, 1)
      expect(wordStudy).toBeNull()
      expect(errors.some(e => e.message.includes('missing required field: language'))).toBe(true)
      expect(errors.some(e => e.message.includes('missing required field: strongs'))).toBe(true)
    })

    it('should error on invalid language', () => {
      const block = `:::word
word: prince
verse: Daniel 10:13
language: Latin
original: princeps
strongs: L123
meaning: Leader
changes: Test
cross:
check: no
:::`

      const { wordStudy, errors } = parseWordStudy(block, 1)
      expect(wordStudy).toBeNull()
      expect(errors.some(e => e.message.includes('Invalid language'))).toBe(true)
    })

    it('should warn on invalid Strong\'s format', () => {
      const block = `:::word
word: prince
verse: Daniel 10:13
language: Hebrew
original: sar
strongs: 8269
meaning: Prince
changes: Test
cross:
check: no
:::`

      const { wordStudy, errors } = parseWordStudy(block, 1)
      expect(wordStudy).not.toBeNull()
      expect(errors.some(e => e.message.includes("Invalid Strong's number format"))).toBe(true)
    })

    it('should warn when check: yes', () => {
      const block = `:::word
word: prince
verse: Daniel 10:13
language: Hebrew
original: sar
strongs: H8269
meaning: Prince
changes: Test
cross:
check: yes
:::`

      const { wordStudy, errors } = parseWordStudy(block, 1)
      expect(wordStudy).not.toBeNull()
      expect(wordStudy?.check).toBe(true)
      expect(errors.some(e => e.message.includes("needs Strong's verification"))).toBe(true)
    })

    it('should handle empty cross references', () => {
      const block = `:::word
word: prince
verse: Daniel 10:13
language: Hebrew
original: sar
strongs: H8269
meaning: Prince
changes: Test
cross:
check: no
:::`

      const { wordStudy, errors } = parseWordStudy(block, 1)
      expect(wordStudy?.cross).toEqual([])
    })
  })

  describe('parseSection', () => {
    it('should parse a valid section', () => {
      const content = `## 1. The Question

Point: Daniel prayed and fasted three weeks.

Some body text here.

> Scripture quote here.
> [Daniel 10:12]`

      const { section, errors } = parseSection(content, 1, 1)

      expect(section).not.toBeNull()
      expect(section?.position).toBe(1)
      expect(section?.heading).toBe('The Question')
      expect(section?.point).toBe('Daniel prayed and fasted three weeks.')
      expect(section?.body).toContain('Some body text here.')
      expect(section?.body).toContain('> Scripture quote here.')
      expect(errors.filter(e => e.severity === 'error')).toHaveLength(0)
    })

    it('should extract word studies from section', () => {
      const content = `## 2. Know the Enemy

Point: Satan has many names.

Some intro text.

:::word
word: devil
verse: Matthew 4:1
language: Greek
original: diabolos
strongs: G1228
meaning: False accuser, slanderer.
changes: The name reveals his method.
cross: Revelation 12:10
check: no
:::

More text after word study.`

      const { section, errors } = parseSection(content, 2, 1)

      expect(section?.wordStudies).toHaveLength(1)
      expect(section?.wordStudies[0].word).toBe('devil')
      // Body should NOT contain the word study block
      expect(section?.body).not.toContain(':::word')
    })

    it('should extract questions from section', () => {
      const content = `## 3. Application

Point: Apply what we learned.

Study the text.

Questions:
1. Where have you seen delay turn to protection?
2. What did Daniel keep doing?`

      const { section, errors } = parseSection(content, 3, 1)

      expect(section?.questions).toHaveLength(2)
      expect(section?.questions[0]).toBe('Where have you seen delay turn to protection?')
      expect(section?.questions[1]).toBe('What did Daniel keep doing?')
    })

    it('should warn on missing Point line', () => {
      const content = `## 1. No Point Section

Body text without a point line.`

      const { section, errors } = parseSection(content, 1, 1)

      expect(section).not.toBeNull()
      expect(section?.point).toBe('')
      expect(errors.some(e => e.message.includes('missing Point:'))).toBe(true)
    })

    it('should error on invalid heading format', () => {
      const content = `## Invalid Heading Without Number

Point: This won't work.`

      const { section, errors } = parseSection(content, 1, 1)
      expect(section).toBeNull()
      expect(errors.some(e => e.message.includes('Invalid section heading'))).toBe(true)
    })
  })

  describe('parseReflection', () => {
    it('should parse reflection with clarifications and questions', () => {
      const content = `
Clarifications:
- **Armageddon** is a place, not a name of Satan (Revelation 16:16).
- **Daniel's prayer** wasn't blocked. It was heard day one.

Questions:
1. What have I been praying about that feels delayed?
2. Which piece of the armour am I neglecting?`

      const { reflection, errors } = parseReflection(content, 1)

      expect(reflection).not.toBeNull()
      expect(reflection?.clarifications).toHaveLength(2)
      expect(reflection?.clarifications[0].term).toBe('Armageddon')
      expect(reflection?.clarifications[0].explanation).toContain('is a place')
      expect(reflection?.questions).toHaveLength(2)
      expect(reflection?.questions[0]).toBe('What have I been praying about that feels delayed?')
    })

    it('should handle reflection with only questions', () => {
      const content = `
Questions:
1. First question?
2. Second question?`

      const { reflection, errors } = parseReflection(content, 1)

      expect(reflection?.clarifications).toHaveLength(0)
      expect(reflection?.questions).toHaveLength(2)
    })

    it('should handle reflection with only clarifications', () => {
      const content = `
Clarifications:
- **Term1** explanation one.
- **Term2** explanation two.`

      const { reflection, errors } = parseReflection(content, 1)

      expect(reflection?.clarifications).toHaveLength(2)
      expect(reflection?.questions).toHaveLength(0)
    })
  })

  describe('parseStudy (full integration)', () => {
    it('should parse a complete minimal study', () => {
      const content = `---
title: Test Study
release: all-open
---

## 1. Introduction

Point: This is the introduction.

Welcome to the study.

## 2. Main Content

Point: The main teaching.

Here is the content.

## Reflection

Questions:
1. What did you learn?`

      const { study, errors } = parseStudy(content)

      expect(study).not.toBeNull()
      expect(study?.frontmatter.title).toBe('Test Study')
      expect(study?.sections).toHaveLength(2)
      expect(study?.sections[0].heading).toBe('Introduction')
      expect(study?.sections[1].heading).toBe('Main Content')
      expect(study?.reflection?.questions).toHaveLength(1)
    })

    it('should count word studies across sections', () => {
      const content = `---
title: Word Study Test
release: all-open
---

## 1. Section One

Point: First section.

Text.

:::word
word: word1
verse: John 1:1
language: Greek
original: logos
strongs: G3056
meaning: Word
changes: Test
cross:
check: no
:::

## 2. Section Two

Point: Second section.

:::word
word: word2
verse: Genesis 1:1
language: Hebrew
original: reshith
strongs: H7225
meaning: Beginning
changes: Test
cross:
check: no
:::

:::word
word: word3
verse: Genesis 1:1
language: Hebrew
original: elohim
strongs: H430
meaning: God
changes: Test
cross:
check: no
:::`

      const { study, errors } = parseStudy(content)

      expect(study?.sections[0].wordStudies).toHaveLength(1)
      expect(study?.sections[1].wordStudies).toHaveLength(2)

      const totalWordStudies = study?.sections.reduce((sum, s) => sum + s.wordStudies.length, 0)
      expect(totalWordStudies).toBe(3)
    })

    it('should collect all errors and warnings', () => {
      const content = `---
title: Error Test
release: all-open
---

## 1. Section One

Point: First section.

:::word
word: incomplete
verse: BadRef 99:99
language: Hebrew
original: test
strongs: invalid
meaning: Test
changes: Test
cross: AlsoBad 1:1
check: yes
:::`

      const { study, errors } = parseStudy(content)

      // Should have warnings for invalid verse, invalid strongs, invalid cross ref, and check: yes
      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(e => e.message.includes('Invalid verse reference'))).toBe(true)
      expect(errors.some(e => e.message.includes("Invalid Strong's number"))).toBe(true)
      expect(errors.some(e => e.message.includes('needs Strong'))).toBe(true)
    })
  })

  describe('bodyToTiptap', () => {
    it('should convert paragraphs', () => {
      const body = 'First paragraph.\n\nSecond paragraph.'
      const result = bodyToTiptap(body)

      expect(result).toHaveProperty('type', 'doc')
      expect((result as any).content).toHaveLength(2)
      expect((result as any).content[0].type).toBe('paragraph')
    })

    it('should convert blockquotes', () => {
      const body = `> This is a quote.
> [John 3:16]`
      const result = bodyToTiptap(body)

      expect((result as any).content[0].type).toBe('blockquote')
    })

    it('should convert bullet lists', () => {
      const body = `- Item one
- Item two
- Item three`
      const result = bodyToTiptap(body)

      expect((result as any).content[0].type).toBe('bulletList')
      expect((result as any).content[0].content).toHaveLength(3)
    }),

    it('should convert numbered lists', () => {
      const body = `1. First
2. Second
3. Third`
      const result = bodyToTiptap(body)

      expect((result as any).content[0].type).toBe('orderedList')
      expect((result as any).content[0].content).toHaveLength(3)
    })

    it('should convert tables', () => {
      const body = `| Name | Reference |
|------|-----------|
| Satan | Adversary |
| Devil | Slanderer |`
      const result = bodyToTiptap(body)

      expect((result as any).content[0].type).toBe('table')
      expect((result as any).content[0].content).toHaveLength(3) // header + 2 rows
    })

    it('should handle bold text', () => {
      const body = 'This is **bold** text.'
      const result = bodyToTiptap(body)

      const paragraph = (result as any).content[0]
      expect(paragraph.content).toHaveLength(3)
      expect(paragraph.content[0].text).toBe('This is ')
      expect(paragraph.content[1].text).toBe('bold')
      expect(paragraph.content[1].marks[0].type).toBe('bold')
      expect(paragraph.content[2].text).toBe(' text.')
    })

    it('should convert subheadings', () => {
      const body = '### Subheading Here'
      const result = bodyToTiptap(body)

      expect((result as any).content[0].type).toBe('heading')
      expect((result as any).content[0].attrs.level).toBe(3)
    })
  })

  describe('generateSlug', () => {
    it('should generate slug from title', () => {
      expect(generateSlug('Heard From the First Day')).toBe('heard-from-the-first-day')
    })

    it('should handle special characters', () => {
      expect(generateSlug('God\'s Promise: A Study')).toBe('gods-promise-a-study')
    })

    it('should handle multiple spaces', () => {
      expect(generateSlug('Title  With   Spaces')).toBe('title-with-spaces')
    })

    it('should handle numbers', () => {
      expect(generateSlug('1 John Study')).toBe('1-john-study')
    })
  })

  describe('Heard From the First Day study parsing', () => {
    // Test with the actual study format from STUDY-FORMAT.md example
    it('should parse the example from STUDY-FORMAT.md', () => {
      const content = `---
title: Heard From the First Day
subtitle: Delay, spiritual warfare, and the faithfulness of God
key_verse: Daniel 10:12
theme: God hears our prayers from the first day. Delays are real, the enemy is real, and yet the enemy is limited and every prayer is kept.
release: release-as-we-go
---

## 1. The Question

Point: Daniel prayed and fasted three weeks. Heaven answered on day one, and yet the answer took 21 days to arrive. Why?

Body text goes here. Normal Markdown works: paragraphs, **bold**, bullet lists, numbered lists.

> But the prince of the kingdom of Persia withstood me one and twenty days: but, lo, Michael, one of the chief princes, came to help me; and I remained there with the kings of Persia.
> [Daniel 10:13]

:::word
word: prince
verse: Daniel 10:13
language: Hebrew
original: sar
strongs: H8269
meaning: Prince, captain, chief, ruler.
changes: The SAME word describes Michael in the same verse. So the prince of Persia isn't the human king. He's a spiritual ruler on Michael's level.
cross: Daniel 10:20; Daniel 12:1
check: no
:::

## Reflection

Clarifications:
- **Armageddon** is a place, not a name of Satan (Revelation 16:16).
- **Daniel's prayer** wasn't blocked. It was heard day one.

Questions:
1. What have I been praying about that feels delayed?
2. Which piece of the armour am I neglecting?`

      const { study, errors } = parseStudy(content)

      expect(study).not.toBeNull()
      expect(study?.frontmatter.title).toBe('Heard From the First Day')
      expect(study?.frontmatter.release).toBe('release-as-we-go')
      expect(study?.sections).toHaveLength(1)
      expect(study?.sections[0].wordStudies).toHaveLength(1)
      expect(study?.sections[0].wordStudies[0].word).toBe('prince')
      expect(study?.sections[0].wordStudies[0].strongs).toEqual(['H8269'])
      expect(study?.reflection?.clarifications).toHaveLength(2)
      expect(study?.reflection?.questions).toHaveLength(2)

      // Should have no errors (only minor warnings at most)
      expect(errors.filter(e => e.severity === 'error')).toHaveLength(0)
    })
  })
})
