import { describe, it, expect } from 'vitest'
import {
  parseScriptureRef,
  findScriptureReferences,
  generateBLBUrl,
  generateBLBInterlinearUrl,
  formatVerseRef,
} from './parser'
import { findBook } from './books'

describe('Scripture Parser', () => {
  describe('findBook', () => {
    it('should find books by full name', () => {
      expect(findBook('Genesis')?.name).toBe('Genesis')
      expect(findBook('Revelation')?.name).toBe('Revelation')
      expect(findBook('1 John')?.name).toBe('1 John')
      expect(findBook('Song of Solomon')?.name).toBe('Song of Solomon')
    })

    it('should find books by abbreviation', () => {
      expect(findBook('Gen')?.name).toBe('Genesis')
      expect(findBook('Rev')?.name).toBe('Revelation')
      expect(findBook('1 Jn')?.name).toBe('1 John')
      expect(findBook('Dan')?.name).toBe('Daniel')
    })

    it('should be case-insensitive', () => {
      expect(findBook('GENESIS')?.name).toBe('Genesis')
      expect(findBook('genesis')?.name).toBe('Genesis')
      expect(findBook('GeNeSiS')?.name).toBe('Genesis')
    })

    it('should handle numbered books', () => {
      expect(findBook('1 Kings')?.name).toBe('1 Kings')
      expect(findBook('2 Kings')?.name).toBe('2 Kings')
      expect(findBook('1 Corinthians')?.name).toBe('1 Corinthians')
      expect(findBook('2 Corinthians')?.name).toBe('2 Corinthians')
      expect(findBook('1 John')?.name).toBe('1 John')
      expect(findBook('2 John')?.name).toBe('2 John')
      expect(findBook('3 John')?.name).toBe('3 John')
    })

    it('should handle alternative numbered book formats', () => {
      expect(findBook('I John')?.name).toBe('1 John')
      expect(findBook('II Corinthians')?.name).toBe('2 Corinthians')
      expect(findBook('1st John')?.name).toBe('1 John')
      expect(findBook('2nd Kings')?.name).toBe('2 Kings')
    })
  })

  describe('parseScriptureRef', () => {
    it('should parse single verse references', () => {
      const refs = parseScriptureRef('Daniel 10:12')
      expect(refs).toHaveLength(1)
      expect(refs[0].book.name).toBe('Daniel')
      expect(refs[0].chapter).toBe(10)
      expect(refs[0].verseStart).toBe(12)
      expect(refs[0].verseEnd).toBeNull()
    })

    it('should parse verse ranges', () => {
      const refs = parseScriptureRef('Ephesians 6:10-18')
      expect(refs).toHaveLength(1)
      expect(refs[0].book.name).toBe('Ephesians')
      expect(refs[0].chapter).toBe(6)
      expect(refs[0].verseStart).toBe(10)
      expect(refs[0].verseEnd).toBe(18)
    })

    it('should parse chapter-only references', () => {
      const refs = parseScriptureRef('Job 1')
      expect(refs).toHaveLength(1)
      expect(refs[0].book.name).toBe('Job')
      expect(refs[0].chapter).toBe(1)
      expect(refs[0].verseStart).toBeNull()
    })

    it('should parse comma-separated verse lists in same chapter', () => {
      const refs = parseScriptureRef('Job 1:11, 12')
      expect(refs).toHaveLength(2)
      expect(refs[0].book.name).toBe('Job')
      expect(refs[0].chapter).toBe(1)
      expect(refs[0].verseStart).toBe(11)
      expect(refs[1].book.name).toBe('Job')
      expect(refs[1].chapter).toBe(1)
      expect(refs[1].verseStart).toBe(12)
    })

    it('should parse comma-separated references across chapters', () => {
      const refs = parseScriptureRef('Job 1:11, 2:5')
      expect(refs).toHaveLength(2)
      expect(refs[0].book.name).toBe('Job')
      expect(refs[0].chapter).toBe(1)
      expect(refs[0].verseStart).toBe(11)
      expect(refs[1].book.name).toBe('Job')
      expect(refs[1].chapter).toBe(2)
      expect(refs[1].verseStart).toBe(5)
    })

    it('should parse numbered books correctly', () => {
      const refs1 = parseScriptureRef('1 Kings 19:11-12')
      expect(refs1[0].book.name).toBe('1 Kings')
      expect(refs1[0].book.blbCode).toBe('1ki')

      const refs2 = parseScriptureRef('2 Corinthians 12:9')
      expect(refs2[0].book.name).toBe('2 Corinthians')
      expect(refs2[0].book.blbCode).toBe('2co')

      const refs3 = parseScriptureRef('1 John 4:4')
      expect(refs3[0].book.name).toBe('1 John')
      expect(refs3[0].book.blbCode).toBe('1jo')
    })

    it('should handle abbreviations', () => {
      const refs = parseScriptureRef('Dan 10:12')
      expect(refs[0].book.name).toBe('Daniel')

      const refs2 = parseScriptureRef('Eph. 6:10-18')
      expect(refs2[0].book.name).toBe('Ephesians')
    })
  })

  describe('findScriptureReferences', () => {
    it('should find single references in text', () => {
      const text = 'As we read in Daniel 10:12, the angel speaks to Daniel.'
      const matches = findScriptureReferences(text)
      expect(matches).toHaveLength(1)
      expect(matches[0].text).toBe('Daniel 10:12')
      expect(matches[0].refs[0].book.name).toBe('Daniel')
    })

    it('should find multiple references in text', () => {
      const text = 'Compare John 3:16 with Romans 8:28 and Ephesians 2:8-9.'
      const matches = findScriptureReferences(text)
      expect(matches).toHaveLength(3)
      expect(matches[0].text).toBe('John 3:16')
      expect(matches[1].text).toBe('Romans 8:28')
      expect(matches[2].text).toBe('Ephesians 2:8-9')
    })

    it('should find chapter-only references', () => {
      const text = 'Read all of Job 1 to understand the context.'
      const matches = findScriptureReferences(text)
      expect(matches).toHaveLength(1)
      expect(matches[0].refs[0].chapter).toBe(1)
      expect(matches[0].refs[0].verseStart).toBeNull()
    })

    it('should find numbered book references', () => {
      const text = 'In 1 John 4:4, we learn that greater is He that is in you.'
      const matches = findScriptureReferences(text)
      expect(matches).toHaveLength(1)
      expect(matches[0].refs[0].book.name).toBe('1 John')
      expect(matches[0].refs[0].chapter).toBe(4)
      expect(matches[0].refs[0].verseStart).toBe(4)
    })

    it('should handle comma-separated verse lists', () => {
      const text = 'See Job 1:11, 2:5 for similar accusations.'
      const matches = findScriptureReferences(text)
      expect(matches).toHaveLength(1)
      expect(matches[0].refs).toHaveLength(2)
    })

    it('should return correct start and end indices', () => {
      const text = 'The verse John 3:16 is famous.'
      const matches = findScriptureReferences(text)
      expect(matches[0].startIndex).toBe(10)
      expect(matches[0].endIndex).toBe(19)
      expect(text.slice(matches[0].startIndex, matches[0].endIndex)).toBe('John 3:16')
    })

    it('should handle text with no references', () => {
      const text = 'This is just regular text without any scripture.'
      const matches = findScriptureReferences(text)
      expect(matches).toHaveLength(0)
    })
  })

  describe('generateBLBUrl', () => {
    it('should generate correct URL for single verse', () => {
      const refs = parseScriptureRef('John 3:16')
      const url = generateBLBUrl(refs[0])
      expect(url).toBe('https://www.blueletterbible.org/kjv/jhn/3/16/s_s')
    })

    it('should generate correct URL for Daniel', () => {
      const refs = parseScriptureRef('Daniel 10:12')
      const url = generateBLBUrl(refs[0])
      expect(url).toBe('https://www.blueletterbible.org/kjv/dan/10/12/s_s')
    })

    it('should generate correct URL for numbered books', () => {
      const refs = parseScriptureRef('1 Kings 19:11')
      const url = generateBLBUrl(refs[0])
      expect(url).toBe('https://www.blueletterbible.org/kjv/1ki/19/11/s_s')
    })

    it('should use verse 1 for chapter-only references', () => {
      const refs = parseScriptureRef('Job 1')
      const url = generateBLBUrl(refs[0])
      expect(url).toBe('https://www.blueletterbible.org/kjv/job/1/1/s_s')
    })
  })

  describe('generateBLBInterlinearUrl', () => {
    it('should generate Interlinear URL', () => {
      const refs = parseScriptureRef('John 1:1')
      const url = generateBLBInterlinearUrl(refs[0])
      expect(url).toBe('https://www.blueletterbible.org/kjv/jhn/1/1/t_conc')
    })
  })

  describe('formatVerseRef', () => {
    it('should format single verse', () => {
      const refs = parseScriptureRef('John 3:16')
      expect(formatVerseRef(refs[0])).toBe('John 3:16')
    })

    it('should format verse range', () => {
      const refs = parseScriptureRef('Ephesians 6:10-18')
      expect(formatVerseRef(refs[0])).toBe('Ephesians 6:10-18')
    })

    it('should format chapter-only reference', () => {
      const refs = parseScriptureRef('Job 1')
      expect(formatVerseRef(refs[0])).toBe('Job 1')
    })
  })

  describe('Edge cases from seed study', () => {
    // These are references that should appear in "Heard From the First Day"
    const seedStudyReferences = [
      'Daniel 10:12',
      'Daniel 10:13',
      'Ephesians 6:10-18',
      'Ephesians 6:12',
      'Job 1',
      'Job 1:11',
      'Job 2:5',
      '1 Kings 19:11-12',
      '2 Corinthians 12:7-10',
      '1 Peter 5:8',
      'Revelation 12:10',
    ]

    seedStudyReferences.forEach(ref => {
      it(`should parse "${ref}" correctly`, () => {
        const matches = findScriptureReferences(ref)
        expect(matches.length).toBeGreaterThan(0)
        expect(matches[0].refs.length).toBeGreaterThan(0)
      })
    })

    it('should handle en-dash in ranges', () => {
      const refs = parseScriptureRef('Ephesians 6:10–18')  // en-dash
      expect(refs[0].verseStart).toBe(10)
      expect(refs[0].verseEnd).toBe(18)
    })

    it('should handle em-dash in ranges', () => {
      const refs = parseScriptureRef('Ephesians 6:10—18')  // em-dash
      expect(refs[0].verseStart).toBe(10)
      expect(refs[0].verseEnd).toBe(18)
    })
  })

  describe('BLB book codes', () => {
    const testCases: Array<[string, string]> = [
      ['Genesis', 'gen'],
      ['Exodus', 'exo'],
      ['Daniel', 'dan'],
      ['John', 'jhn'],
      ['1 Kings', '1ki'],
      ['2 Corinthians', '2co'],
      ['1 John', '1jo'],
      ['2 John', '2jo'],
      ['3 John', '3jo'],
      ['Revelation', 'rev'],
      ['Psalms', 'psa'],
      ['Song of Solomon', 'sng'],
    ]

    testCases.forEach(([bookName, expectedCode]) => {
      it(`should have correct BLB code for ${bookName}`, () => {
        const book = findBook(bookName)
        expect(book?.blbCode).toBe(expectedCode)
      })
    })
  })
})
