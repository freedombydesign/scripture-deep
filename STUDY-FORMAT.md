# Study File Format

Every study is one Markdown file in this format, saved in `studies/` (for example `studies/heard-from-the-first-day.md`). The app imports these files. Claude writes them, Ruth checks them, and the app publishes them.

All scripture is King James Version, quoted word for word.

---

## 1. Header

The file starts with this block:

```
---
title: Heard From the First Day
subtitle: Delay, spiritual warfare, and the faithfulness of God
key_verse: Daniel 10:12
theme: God hears our prayers from the first day. Delays are real, the enemy is real, and yet the enemy is limited and every prayer is kept.
release: release-as-we-go
---
```

- `release` is `all-open` or `release-as-we-go`
- Everything else is plain text

## 2. Sections

Each section starts with a numbered heading, then a `Point:` line saying what the section is for in one sentence.

```
## 1. The Question

Point: Daniel prayed and fasted three weeks. Heaven answered on day one, and yet the answer took 21 days to arrive. Why?

Body text goes here. Normal Markdown works: paragraphs, **bold**, bullet lists, numbered lists.
```

The last numbered section is the close. A study-level reflection section comes after it (see 6).

## 3. Scripture quotes

A quote is a blockquote. Its last line is the reference in square brackets.

```
> But the prince of the kingdom of Persia withstood me one and twenty days: but, lo, Michael, one of the chief princes, came to help me; and I remained there with the kings of Persia.
> [Daniel 10:13]
```

References written inside regular text (Job 1:10, Ephesians 6:10-18) are linked automatically. Write the book name in full.

## 4. Word studies

A word study sits inside the section it belongs to, after the verse it explains.

**Which words get a word study.** Only words where the original says something the KJV English can't show. Each one must pass at least one of these:

1. **Hidden link:** the same original word appears somewhere that changes the reading (sar is used for both Michael and the prince of Persia)
2. **Lost nuance:** the English flattens the meaning (transformed in 2 Corinthians 11:14 means a disguise, not a change of nature)
3. **Hidden meaning in a name:** the name itself teaches something. This covers EVERY person and place named in the study, not just the obvious ones (Tyrus means rock, Bethesda means house of mercy, Simon means hearing, Sarah means princess)
4. **The English hides what the text literally says:** curse in Job 1:11 is literally "bless"

If the original only says what the English already says, leave it out. Frame each one as what the English can't show, not as the KJV being wrong.

```
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
```

- `strongs` can list more than one, separated by commas: `H6865, H6697`
- `original` can list more than one the same way, in the same order
- `meaning` is the lexicon. `changes` is the teaching. Keep them separate
- `cross` lists references separated by semicolons
- `check: yes` means the Strong's number still needs confirming on Blue Letter Bible. The app shows the flag until Ruth clears it

## 5. Discussion questions in a section (optional)

```
Questions:
1. Where have you seen a delay that turned out to be protection?
2. What did Daniel keep doing during the 21 days?
```

## 6. Reflection (end of study)

```
## Reflection

Clarifications:
- **Armageddon** is a place, not a name of Satan (Revelation 16:16).
- **Daniel's prayer** wasn't blocked. It was heard day one.

Questions:
1. What have I been praying about that feels delayed?
2. Which piece of the armour am I neglecting?
```

## 7. Audit before delivery

Word studies get missed when only the quoted words are checked. So every study is audited in two passes before it's delivered, and the audit goes to Ruth with the file:

1. **Names pass:** list every person and place in the study, including names only in the story around a quote (Bethesda is named in John 5:2, not in the quoted verses). Each gets a word study, or a one-line reason it doesn't.
2. **Verse pass:** go through every quoted verse word by word against the four tests. Each verse gets its word studies, or "nothing the English doesn't already show."

Quotes are also checked against the full KJV text of their reference: a range like John 5:5-6 must include every verse in it.

## 8. Rules

- KJV wording only, copied exactly
- Full book names: 1 John, not 1 Jn
- No em dashes
- Every word study passes the rule in section 4
- The audit in section 7 is done and shared before publishing
- Every Strong's number gets checked on Blue Letter Bible before publishing. Anything unconfirmed is marked `check: yes`
