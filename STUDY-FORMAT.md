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

## 7. Rules

- KJV wording only, copied exactly
- Full book names: 1 John, not 1 Jn
- No em dashes
- Every Strong's number gets checked on Blue Letter Bible before publishing. Anything unconfirmed is marked `check: yes`
