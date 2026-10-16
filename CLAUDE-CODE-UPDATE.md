# Update for the Bible Study App

Read this whole file before changing anything. It replaces every separate instruction Ruth pasted earlier. Two files go with it in the project folder:

- `Heard-From-the-First-Day.md` (the full study text)
- `heard-from-the-first-day-word-studies.json` (37 word studies for that study)

Work through the sections in order. When you finish, give Ruth the checklist in section 7 with each item marked done or not done.

---

## 1. Verse popover: build our own

Decision: build our own popover from stored KJV text. Don't use ScriptTagger.

- KJV source: `aruljohn/Bible-kjv` on GitHub (the KJV text is public domain)
- Before you use it:
  - Check the repo's open issues for typos or missing verses
  - Confirm the import comes to exactly **31,102 verses**. If it doesn't, stop and tell Ruth
  - Spot-check 10 verses against Blue Letter Bible, including Daniel 10:12, Psalm 119:176, 3 John 1:14, and Revelation 22:21
- Every popover gets two links:
  - **Open in Blue Letter Bible**: the verse in the KJV
  - **Original language**: the same verse on BLB, so the student can tap Interlinear

## 2. Section release (Phase 1)

- Each study has a setting: **All open** or **Release as we go**
- In Release as we go, the teacher marks the current stopping point
- Sections after it show their heading and "Coming up next session" until the teacher unlocks them
- Students can still tap **Read ahead anyway**
- Only the teacher controls release, separately for each study

## 3. Word Study block (Phase 1)

An editor block the teacher writes by hand. Fields:

- English word, highlighted in the verse with a small marker
- Verse reference
- Language (Hebrew or Greek)
- Original word and its transliteration
- One or more Strong's numbers, each linking to its entry on Blue Letter Bible
- Meaning
- **What it changes**: the teacher's insight. Style it differently from Meaning so students can tell lexicon from teaching
- Cross-references, linked like all scripture
- A "check on BLB" flag the teacher can turn on while a number is still unconfirmed

Tapping a highlighted word in the study opens its word study. Also add a Word Studies section at the end of each study that lists them all, grouped by section.

## 4. Fix "Heard From the First Day"

Two sections are missing from the app. They're at the end of `Heard-From-the-First-Day.md`:

- **7. Close: Back to Daniel**
- **Study Notes and Reflection**: clarifications plus 6 numbered reflection questions

Add both. Support a Reflection section for the whole study, with a notes box, in addition to the reflection questions inside each section.

Then show Ruth every heading in the app next to every heading in the file, so she can confirm nothing else is missing.

## 5. Import the word studies

Import `heard-from-the-first-day-word-studies.json` as Word Study blocks on "Heard From the First Day":

- 37 word studies across 6 sections
- Each entry has: section, word, verse, language, original, strongs (number plus BLB link), meaning, what_it_changes, cross_references, needs_check_on_blb
- Highlight each word in the verse it belongs to where that verse is quoted in the study. If the verse isn't quoted, the word study still appears in the Word Studies section
- Two entries are flagged `needs_check_on_blb: true`: **greatly beloved** and **tarry**. Show the flag until Ruth clears it
- Confirm all 37 imported and every BLB link opens the right Strong's entry

## 6. Phase 2: tap any word for the original language

Put this first in line for Phase 2. Don't build it yet.

- The goal: tap any word in the KJV and see the Hebrew or Greek, its Strong's number and definition, like the BLB Interlinear
- Needs:
  - KJV text with a Strong's number tagged on every word
  - The Strong's Hebrew and Greek dictionaries (published 1890, public domain)
- Before building:
  - Research sources and confirm each license allows a free ministry app
  - Spot-check the word tagging against the BLB Interlinear on 10 verses
- Teacher-written word studies (section 3) always show first. Automatic lookup fills in the words she hasn't written up

## 7. Checklist to report back

- [ ] KJV import totals 31,102 verses, and the 10 spot-checks match BLB
- [ ] Popover shows the verse, with "Open in Blue Letter Bible" and "Original language" links
- [ ] Section release works: lock, unlock, Read ahead anyway
- [ ] Word Study block can be created, edited, and opened by tapping the highlighted word
- [ ] "Close: Back to Daniel" and "Study Notes and Reflection" are in the app
- [ ] Heading comparison between app and file shown to Ruth
- [ ] All 37 word studies imported, with 2 flagged for checking
- [ ] Phase 2 tap-a-word feature is added to the spec, not built
