-- Scripture Deep Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('teacher', 'student');
CREATE TYPE study_status AS ENUM ('draft', 'published');

-- ============================================
-- TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Studies table
CREATE TABLE public.studies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT NOT NULL UNIQUE,
  key_verse_ref TEXT,
  theme TEXT,
  status study_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for looking up studies by slug
CREATE INDEX idx_studies_slug ON public.studies(slug);
CREATE INDEX idx_studies_author ON public.studies(author_id);
CREATE INDEX idx_studies_status ON public.studies(status);

-- Sections table (parts of a study)
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_id UUID NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  heading TEXT NOT NULL,
  body JSONB NOT NULL DEFAULT '{}',
  reflection_questions TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(study_id, position)
);

CREATE INDEX idx_sections_study ON public.sections(study_id);

-- Notes table (private notes per user per section)
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  body TEXT NOT NULL DEFAULT '',
  shared_with_teacher BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, section_id)
);

CREATE INDEX idx_notes_user ON public.notes(user_id);
CREATE INDEX idx_notes_section ON public.notes(section_id);

-- Verses table (KJV text)
CREATE TABLE public.verses (
  id SERIAL PRIMARY KEY,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  UNIQUE(book, chapter, verse)
);

CREATE INDEX idx_verses_book_chapter ON public.verses(book, chapter);
CREATE INDEX idx_verses_lookup ON public.verses(book, chapter, verse);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_studies_updated_at
  BEFORE UPDATE ON public.studies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verses ENABLE ROW LEVEL SECURITY;

-- USERS policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Teachers can view all users (for seeing who has shared notes)
CREATE POLICY "Teachers can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- STUDIES policies
-- Anyone can read published studies (public access)
CREATE POLICY "Anyone can read published studies"
  ON public.studies FOR SELECT
  USING (status = 'published');

-- Authors can read their own drafts
CREATE POLICY "Authors can read own drafts"
  ON public.studies FOR SELECT
  USING (auth.uid() = author_id);

-- Teachers can create studies
CREATE POLICY "Teachers can create studies"
  ON public.studies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Authors can update their own studies
CREATE POLICY "Authors can update own studies"
  ON public.studies FOR UPDATE
  USING (auth.uid() = author_id);

-- Authors can delete their own studies
CREATE POLICY "Authors can delete own studies"
  ON public.studies FOR DELETE
  USING (auth.uid() = author_id);

-- SECTIONS policies
-- Anyone can read sections of published studies
CREATE POLICY "Anyone can read sections of published studies"
  ON public.sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.studies
      WHERE studies.id = sections.study_id
      AND studies.status = 'published'
    )
  );

-- Authors can read sections of their own studies
CREATE POLICY "Authors can read own study sections"
  ON public.sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.studies
      WHERE studies.id = sections.study_id
      AND studies.author_id = auth.uid()
    )
  );

-- Authors can manage sections of their own studies
CREATE POLICY "Authors can insert sections"
  ON public.sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.studies
      WHERE studies.id = sections.study_id
      AND studies.author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update sections"
  ON public.sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.studies
      WHERE studies.id = sections.study_id
      AND studies.author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete sections"
  ON public.sections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.studies
      WHERE studies.id = sections.study_id
      AND studies.author_id = auth.uid()
    )
  );

-- NOTES policies
-- Users can CRUD their own notes
CREATE POLICY "Users can read own notes"
  ON public.notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON public.notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON public.notes FOR DELETE
  USING (auth.uid() = user_id);

-- Teachers can read notes shared with them
CREATE POLICY "Teachers can read shared notes"
  ON public.notes FOR SELECT
  USING (
    shared_with_teacher = TRUE
    AND EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- VERSES policies
-- Anyone can read verses (KJV is public domain)
CREATE POLICY "Anyone can read verses"
  ON public.verses FOR SELECT
  USING (TRUE);

-- ============================================
-- INITIAL DATA
-- ============================================

-- This will be populated by the KJV import script
