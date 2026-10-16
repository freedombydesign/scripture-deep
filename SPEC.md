# Bible Study App: Build Spec

**Owner:** Ruth Carpenter
**Purpose:** A ministry tool. Ruth writes KJV topical studies, publishes them to her students and fellow believers, and each person studies with linked scripture and keeps their own notes.
**Builder:** Claude Code. Ruth architects, Claude builds. Ruth does not write code, so keep setup steps explicit and choose managed services over self-hosting.

---

## 1. The problem

Ruth writes topical studies regularly (example: "Heard From the First Day", on delayed prayer and spiritual warfare). Today they live in docs. Students can't easily jump to each verse, can't dig into the Hebrew and Greek, and have nowhere to keep notes tied to the study. Every study is rebuilt by hand.

## 2. Who uses it

| Role | What they do |
| --- | --- |
| Teacher (Ruth, later other teachers she invites) | Writes studies, publishes them, shares a link or invites a group |
| Student | Opens a study, taps verses, writes private notes, comes back later |
| Visitor (no account) | Reads a public study; prompted to sign up to save notes |

## 3. Core experience

1. Ruth writes or pastes a study in a simple editor (headings, paragraphs, lists, scripture quotes).
2. The app finds every scripture reference automatically and turns it into a link. No manual linking.
3. Tapping a reference shows the KJV verse text in a popover, with a button to open it on Blue Letter Bible for Interlinear and Strong's.
4. Ruth publishes. Students open it on phone or desktop.
5. Each student writes notes per section. Notes are private to them by default and are there when they return.
6. Ruth can see which students opened the study (optional, phase 2).

## 4. MVP scope (Phase 1)

Build only this first.

**Studies**
- Create, edit, publish, unpublish a study
- Fields: title, subtitle, key verse, theme statement, ordered sections
- Section: heading, body (rich text), optional reflection questions
- Status: draft or published
- Public link per published study (readable without an account)

**Scripture linking**
- Auto-detect references in study text: full book names and common abbreviations, single verses (Daniel 10:12), ranges (Ephesians 6:10-18), chapters (Job 1), lists (Job 1:11, 2:5), numbered books (1 Kings, 2 Corinthians, 1 John)
- Default translation: KJV
- Link format to Blue Letter Bible: `https://www.blueletterbible.org/kjv/{book}/{chapter}/{verse}/ss1` using BLB's book codes (dan, jhn, 1ki, 2co, 1jo, rev, etc.). A tested lookup table already exists in the prototype page; reuse it.
- Popover with the verse text on tap (see section 6 for where the text comes from)
- Links open in a new tab

**Notes**
- One private note box per section per student, autosaved
- "My notes" view listing every study the student has notes on
- Export my notes for a study as plain text (copy button)

**Accounts**
- Email magic link sign-in (no passwords)
- Roles: teacher, student
- Ruth is the first teacher; teacher role assigned by an admin flag, not self-serve

**Design**
- Mobile first; most students will be on phones
- Readable: large body text, scripture in a distinct serif, light and dark mode
- Section jump bar at the top of each study

## 5. Phase 2 and later (do not build in MVP)

### 5.1 TOP PRIORITY: Tap Any Word for Original Language

**Goal:** Tap any word in the KJV and see the Hebrew (OT) or Greek (NT) word, its Strong's number, definition, and related verses, similar to the BLB Interlinear.

**Requirements:**
- KJV text with a Strong's number tagged on every word
- Strong's Hebrew and Greek dictionaries (James Strong, 1890, public domain)

**Before building:**
- Research sources for Strong's-tagged KJV text and confirm each license allows use in a free ministry app
- Spot-check word tagging against BLB Interlinear on 10 verses:
  - Genesis 1:1
  - Psalm 23:1
  - Isaiah 53:5
  - Daniel 10:12
  - Matthew 5:3
  - John 1:1
  - Romans 8:28
  - Ephesians 6:12
  - Hebrews 4:12
  - Revelation 19:16
- Only proceed if licenses are clear and tagging matches BLB on at least 9 of 10 test verses

**Interaction with Word Studies:**
- Teacher-written word studies (the Word Study blocks from Phase 1) always display first
- Automatic Strong's lookup fills in for words the teacher hasn't written up
- This creates a layered experience: deep teaching insight where Ruth has written it, basic lexicon data everywhere else

### 5.2 Other Phase 2 Features

- Groups: Ruth creates a group, invites by email, publishes a study to that group only
- Shared discussion per section (comments visible to the group)
- Teacher view: who opened, who wrote notes (counts only, never note content)
- Study library with tags (prayer, spiritual warfare, names of Satan) and search
- Reading plans: release one section per day
- Native app wrapper for iOS and Android
- Other translations (only after checking licenses; KJV stays the default)

## 6. Scripture text and Strong's: where the data comes from

- **KJV text is public domain** in Canada and the US, so the app can store and display it. Use a reputable public-domain KJV dataset in JSON (verse-level), loaded into the database once. Claude Code: propose a source and confirm it's public domain before importing.
- **Do not scrape Blue Letter Bible.** Link to it. BLB's Interlinear and Strong's are the deep-study destination.
- **Blue Letter Bible ScriptTagger** (free, blueletterbible.org/scripttagger) adds hover popovers to references on any web page and can be set to KJV. Option A for MVP: use ScriptTagger for popovers instead of building our own. Option B: our own popover from stored KJV text. Claude Code: recommend one, with the tradeoff (ScriptTagger is faster to ship; our own popover works offline and matches the design).
- **Strong's numbers in-app (phase 2+)**: only from openly licensed datasets. Confirm the license allows use in a free ministry app before importing anything.

## 7. Suggested stack

Claude Code may propose an alternative, with reasons.

- **Frontend:** Next.js (React), deployed on Vercel
- **Backend and database:** Supabase (Postgres, auth with magic links, row-level security so notes stay private)
- **Editor:** a simple rich-text editor (for example Tiptap) with a "scripture quote" block
- **Why:** managed hosting, free tiers fit a ministry budget, one place for auth and data, Ruth doesn't maintain servers

## 8. Data model (starting point)

| Table | Key fields |
| --- | --- |
| users | id, email, display_name, role (teacher/student), created_at |
| studies | id, author_id, title, subtitle, slug, key_verse_ref, theme, status, published_at |
| sections | id, study_id, position, heading, body (rich text JSON), reflection_questions |
| notes | id, user_id, section_id, body, shared_with_teacher, updated_at (unique on user_id + section_id) |
| verses | book, chapter, verse, text (KJV) |
| groups (phase 2) | id, owner_id, name |
| group_members (phase 2) | group_id, user_id |

Security rules: a note is readable and writable only by its owner (unless shared_with_teacher is true, then teacher can read). A draft study is visible only to its author. A published public study is readable by anyone.

## 9. First content

Seed the app with "Heard From the First Day" (7 sections plus study notes and reflection questions). The full KJV content exists in Ruth's Markdown export of that study; she will paste it in. Use it as the end-to-end test: every one of its 101 references must link correctly.

## 10. Acceptance criteria for MVP

- [ ] Ruth can sign in, write a study with 7 sections, and publish it in under 15 minutes without help
- [ ] Every reference in the seed study links to the correct KJV verse on Blue Letter Bible
- [ ] Ranges, chapter-only references and "1 John" style books parse correctly; add automated tests for the parser
- [ ] Tapping a reference on a phone shows the verse text, then BLB is one more tap
- [ ] A student can write notes on a phone, close the browser, and find them on another device after signing in
- [ ] A visitor can read a public study without an account
- [ ] Nobody can read another person's notes unless they opt to share with teacher (test this explicitly)
- [ ] Works at 375px wide, in light and dark mode

## 11. Configuration decisions

| Decision | Answer |
|----------|--------|
| App name | Scripture Deep |
| Pricing | Always free (no payment infrastructure) |
| Default visibility | Public (anyone with link can read) |
| Teachers | Just Ruth for MVP |
| Note sharing | Opt-in (student can share with teacher) |

## 12. How to start in Claude Code

1. Create an empty project folder and save this file in it as `SPEC.md`.
2. Open Claude Code in that folder and say: "Read SPEC.md. Ask me the open questions in section 11, then propose a build plan for Phase 1 before writing code."
3. Approve the plan, then build in this order: scripture parser with tests, database and auth, study reader, notes, study editor, seed study.
