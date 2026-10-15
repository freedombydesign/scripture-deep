// Bible book data with names, abbreviations, and Blue Letter Bible codes
// BLB codes from: https://www.blueletterbible.org

export interface BookData {
  name: string
  abbrevs: string[]
  blbCode: string
  chapters: number
  testament: 'OT' | 'NT'
}

export const BOOKS: BookData[] = [
  // Old Testament
  { name: 'Genesis', abbrevs: ['Gen', 'Ge', 'Gn'], blbCode: 'gen', chapters: 50, testament: 'OT' },
  { name: 'Exodus', abbrevs: ['Exod', 'Exo', 'Ex'], blbCode: 'exo', chapters: 40, testament: 'OT' },
  { name: 'Leviticus', abbrevs: ['Lev', 'Le', 'Lv'], blbCode: 'lev', chapters: 27, testament: 'OT' },
  { name: 'Numbers', abbrevs: ['Num', 'Nu', 'Nm', 'Nb'], blbCode: 'num', chapters: 36, testament: 'OT' },
  { name: 'Deuteronomy', abbrevs: ['Deut', 'Deu', 'De', 'Dt'], blbCode: 'deu', chapters: 34, testament: 'OT' },
  { name: 'Joshua', abbrevs: ['Josh', 'Jos', 'Jsh'], blbCode: 'jos', chapters: 24, testament: 'OT' },
  { name: 'Judges', abbrevs: ['Judg', 'Jdg', 'Jg', 'Jdgs'], blbCode: 'jdg', chapters: 21, testament: 'OT' },
  { name: 'Ruth', abbrevs: ['Rth', 'Ru'], blbCode: 'rth', chapters: 4, testament: 'OT' },
  { name: '1 Samuel', abbrevs: ['1 Sam', '1Sam', '1Sa', '1 Sa', 'I Sam', 'I Samuel', '1st Samuel', '1st Sam'], blbCode: '1sa', chapters: 31, testament: 'OT' },
  { name: '2 Samuel', abbrevs: ['2 Sam', '2Sam', '2Sa', '2 Sa', 'II Sam', 'II Samuel', '2nd Samuel', '2nd Sam'], blbCode: '2sa', chapters: 24, testament: 'OT' },
  { name: '1 Kings', abbrevs: ['1 Kgs', '1Kgs', '1Ki', '1 Ki', 'I Kgs', 'I Kings', '1st Kings', '1st Kgs'], blbCode: '1ki', chapters: 22, testament: 'OT' },
  { name: '2 Kings', abbrevs: ['2 Kgs', '2Kgs', '2Ki', '2 Ki', 'II Kgs', 'II Kings', '2nd Kings', '2nd Kgs'], blbCode: '2ki', chapters: 25, testament: 'OT' },
  { name: '1 Chronicles', abbrevs: ['1 Chr', '1Chr', '1Ch', '1 Ch', 'I Chr', 'I Chronicles', '1st Chronicles', '1st Chr'], blbCode: '1ch', chapters: 29, testament: 'OT' },
  { name: '2 Chronicles', abbrevs: ['2 Chr', '2Chr', '2Ch', '2 Ch', 'II Chr', 'II Chronicles', '2nd Chronicles', '2nd Chr'], blbCode: '2ch', chapters: 36, testament: 'OT' },
  { name: 'Ezra', abbrevs: ['Ezr', 'Ez'], blbCode: 'ezr', chapters: 10, testament: 'OT' },
  { name: 'Nehemiah', abbrevs: ['Neh', 'Ne'], blbCode: 'neh', chapters: 13, testament: 'OT' },
  { name: 'Esther', abbrevs: ['Est', 'Esth', 'Es'], blbCode: 'est', chapters: 10, testament: 'OT' },
  { name: 'Job', abbrevs: ['Jb'], blbCode: 'job', chapters: 42, testament: 'OT' },
  { name: 'Psalms', abbrevs: ['Ps', 'Psalm', 'Psa', 'Psm', 'Pss'], blbCode: 'psa', chapters: 150, testament: 'OT' },
  { name: 'Proverbs', abbrevs: ['Prov', 'Pro', 'Prv', 'Pr'], blbCode: 'pro', chapters: 31, testament: 'OT' },
  { name: 'Ecclesiastes', abbrevs: ['Eccl', 'Ecc', 'Ec', 'Qoh'], blbCode: 'ecc', chapters: 12, testament: 'OT' },
  { name: 'Song of Solomon', abbrevs: ['Song', 'SOS', 'Song of Songs', 'Cant', 'Canticles', 'SS'], blbCode: 'sng', chapters: 8, testament: 'OT' },
  { name: 'Isaiah', abbrevs: ['Isa', 'Is'], blbCode: 'isa', chapters: 66, testament: 'OT' },
  { name: 'Jeremiah', abbrevs: ['Jer', 'Je', 'Jr'], blbCode: 'jer', chapters: 52, testament: 'OT' },
  { name: 'Lamentations', abbrevs: ['Lam', 'La'], blbCode: 'lam', chapters: 5, testament: 'OT' },
  { name: 'Ezekiel', abbrevs: ['Ezek', 'Eze', 'Ezk'], blbCode: 'ezk', chapters: 48, testament: 'OT' },
  { name: 'Daniel', abbrevs: ['Dan', 'Da', 'Dn'], blbCode: 'dan', chapters: 12, testament: 'OT' },
  { name: 'Hosea', abbrevs: ['Hos', 'Ho'], blbCode: 'hos', chapters: 14, testament: 'OT' },
  { name: 'Joel', abbrevs: ['Jl', 'Joe'], blbCode: 'joe', chapters: 3, testament: 'OT' },
  { name: 'Amos', abbrevs: ['Am'], blbCode: 'amo', chapters: 9, testament: 'OT' },
  { name: 'Obadiah', abbrevs: ['Obad', 'Ob', 'Oba'], blbCode: 'oba', chapters: 1, testament: 'OT' },
  { name: 'Jonah', abbrevs: ['Jon', 'Jnh'], blbCode: 'jon', chapters: 4, testament: 'OT' },
  { name: 'Micah', abbrevs: ['Mic', 'Mc'], blbCode: 'mic', chapters: 7, testament: 'OT' },
  { name: 'Nahum', abbrevs: ['Nah', 'Na'], blbCode: 'nah', chapters: 3, testament: 'OT' },
  { name: 'Habakkuk', abbrevs: ['Hab', 'Hb'], blbCode: 'hab', chapters: 3, testament: 'OT' },
  { name: 'Zephaniah', abbrevs: ['Zeph', 'Zep', 'Zp'], blbCode: 'zep', chapters: 3, testament: 'OT' },
  { name: 'Haggai', abbrevs: ['Hag', 'Hg'], blbCode: 'hag', chapters: 2, testament: 'OT' },
  { name: 'Zechariah', abbrevs: ['Zech', 'Zec', 'Zc'], blbCode: 'zec', chapters: 14, testament: 'OT' },
  { name: 'Malachi', abbrevs: ['Mal', 'Ml'], blbCode: 'mal', chapters: 4, testament: 'OT' },

  // New Testament
  { name: 'Matthew', abbrevs: ['Matt', 'Mat', 'Mt'], blbCode: 'mat', chapters: 28, testament: 'NT' },
  { name: 'Mark', abbrevs: ['Mrk', 'Mar', 'Mk', 'Mr'], blbCode: 'mar', chapters: 16, testament: 'NT' },
  { name: 'Luke', abbrevs: ['Luk', 'Lk', 'Lu'], blbCode: 'luk', chapters: 24, testament: 'NT' },
  { name: 'John', abbrevs: ['Joh', 'Jhn', 'Jn'], blbCode: 'jhn', chapters: 21, testament: 'NT' },
  { name: 'Acts', abbrevs: ['Act', 'Ac'], blbCode: 'act', chapters: 28, testament: 'NT' },
  { name: 'Romans', abbrevs: ['Rom', 'Ro', 'Rm'], blbCode: 'rom', chapters: 16, testament: 'NT' },
  { name: '1 Corinthians', abbrevs: ['1 Cor', '1Cor', '1Co', '1 Co', 'I Cor', 'I Corinthians', '1st Corinthians', '1st Cor'], blbCode: '1co', chapters: 16, testament: 'NT' },
  { name: '2 Corinthians', abbrevs: ['2 Cor', '2Cor', '2Co', '2 Co', 'II Cor', 'II Corinthians', '2nd Corinthians', '2nd Cor'], blbCode: '2co', chapters: 13, testament: 'NT' },
  { name: 'Galatians', abbrevs: ['Gal', 'Ga'], blbCode: 'gal', chapters: 6, testament: 'NT' },
  { name: 'Ephesians', abbrevs: ['Eph', 'Ephes'], blbCode: 'eph', chapters: 6, testament: 'NT' },
  { name: 'Philippians', abbrevs: ['Phil', 'Php', 'Pp'], blbCode: 'php', chapters: 4, testament: 'NT' },
  { name: 'Colossians', abbrevs: ['Col', 'Co'], blbCode: 'col', chapters: 4, testament: 'NT' },
  { name: '1 Thessalonians', abbrevs: ['1 Thess', '1Thess', '1Th', '1 Th', 'I Thess', 'I Thessalonians', '1st Thessalonians', '1st Thess'], blbCode: '1th', chapters: 5, testament: 'NT' },
  { name: '2 Thessalonians', abbrevs: ['2 Thess', '2Thess', '2Th', '2 Th', 'II Thess', 'II Thessalonians', '2nd Thessalonians', '2nd Thess'], blbCode: '2th', chapters: 3, testament: 'NT' },
  { name: '1 Timothy', abbrevs: ['1 Tim', '1Tim', '1Ti', '1 Ti', 'I Tim', 'I Timothy', '1st Timothy', '1st Tim'], blbCode: '1ti', chapters: 6, testament: 'NT' },
  { name: '2 Timothy', abbrevs: ['2 Tim', '2Tim', '2Ti', '2 Ti', 'II Tim', 'II Timothy', '2nd Timothy', '2nd Tim'], blbCode: '2ti', chapters: 4, testament: 'NT' },
  { name: 'Titus', abbrevs: ['Tit', 'Ti'], blbCode: 'tit', chapters: 3, testament: 'NT' },
  { name: 'Philemon', abbrevs: ['Phlm', 'Phm', 'Philem'], blbCode: 'phm', chapters: 1, testament: 'NT' },
  { name: 'Hebrews', abbrevs: ['Heb', 'He'], blbCode: 'heb', chapters: 13, testament: 'NT' },
  { name: 'James', abbrevs: ['Jas', 'Jm', 'Jam'], blbCode: 'jas', chapters: 5, testament: 'NT' },
  { name: '1 Peter', abbrevs: ['1 Pet', '1Pet', '1Pe', '1 Pe', 'I Pet', 'I Peter', '1st Peter', '1st Pet'], blbCode: '1pe', chapters: 5, testament: 'NT' },
  { name: '2 Peter', abbrevs: ['2 Pet', '2Pet', '2Pe', '2 Pe', 'II Pet', 'II Peter', '2nd Peter', '2nd Pet'], blbCode: '2pe', chapters: 3, testament: 'NT' },
  { name: '1 John', abbrevs: ['1 Jn', '1Jn', '1Jo', '1 Jo', 'I Jn', 'I John', '1st John', '1st Jn'], blbCode: '1jo', chapters: 5, testament: 'NT' },
  { name: '2 John', abbrevs: ['2 Jn', '2Jn', '2Jo', '2 Jo', 'II Jn', 'II John', '2nd John', '2nd Jn'], blbCode: '2jo', chapters: 1, testament: 'NT' },
  { name: '3 John', abbrevs: ['3 Jn', '3Jn', '3Jo', '3 Jo', 'III Jn', 'III John', '3rd John', '3rd Jn'], blbCode: '3jo', chapters: 1, testament: 'NT' },
  { name: 'Jude', abbrevs: ['Jud', 'Jd'], blbCode: 'jud', chapters: 1, testament: 'NT' },
  { name: 'Revelation', abbrevs: ['Rev', 'Re', 'Rv', 'Apoc', 'Apocalypse'], blbCode: 'rev', chapters: 22, testament: 'NT' },
]

// Build lookup maps for efficient parsing
const bookLookup = new Map<string, BookData>()

for (const book of BOOKS) {
  // Add full name (case-insensitive)
  bookLookup.set(book.name.toLowerCase(), book)

  // Add all abbreviations
  for (const abbrev of book.abbrevs) {
    bookLookup.set(abbrev.toLowerCase(), book)
  }
}

export function findBook(name: string): BookData | undefined {
  // Normalize: trim, lowercase, remove trailing period
  const normalized = name.trim().toLowerCase().replace(/\.$/, '')
  return bookLookup.get(normalized)
}

// Get all possible book name patterns for regex building
export function getAllBookPatterns(): string[] {
  const patterns: string[] = []

  for (const book of BOOKS) {
    // Escape special regex characters and add word boundaries
    patterns.push(escapeRegex(book.name))
    for (const abbrev of book.abbrevs) {
      patterns.push(escapeRegex(abbrev))
    }
  }

  // Sort by length descending so longer matches are tried first
  // (e.g., "1 Samuel" before "Samuel")
  return patterns.sort((a, b) => b.length - a.length)
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
