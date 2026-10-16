-- =============================================
-- COMBINED MIGRATION FOR SCRIPTURE DEEP
-- Run this in the Supabase Dashboard SQL Editor
-- =============================================

-- ======================
-- 1. Section Release Feature
-- ======================

-- Create release mode enum (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'release_mode') THEN
    CREATE TYPE release_mode AS ENUM ('all_open', 'release_as_we_go');
  END IF;
END $$;

-- Add release_mode to studies table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='studies' AND column_name='release_mode') THEN
    ALTER TABLE public.studies ADD COLUMN release_mode release_mode NOT NULL DEFAULT 'all_open';
  END IF;
END $$;

-- Add released flag to sections table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sections' AND column_name='released') THEN
    ALTER TABLE public.sections ADD COLUMN released BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;

-- ======================
-- 2. Study-Level Reflection
-- ======================

-- Add study_notes to studies table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='studies' AND column_name='study_notes') THEN
    ALTER TABLE public.studies ADD COLUMN study_notes TEXT;
  END IF;
END $$;

-- Add reflection_questions to studies table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='studies' AND column_name='reflection_questions') THEN
    ALTER TABLE public.studies ADD COLUMN reflection_questions TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- ======================
-- 3. Word Studies Table
-- ======================

-- Create word_studies table if not exists
CREATE TABLE IF NOT EXISTS public.word_studies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_id UUID NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,

  -- Word identification
  english_word TEXT NOT NULL,
  verse_reference TEXT NOT NULL,

  -- Original language data
  language TEXT NOT NULL CHECK (language IN ('Hebrew', 'Greek')),
  original_word TEXT[] NOT NULL DEFAULT '{}',
  transliteration TEXT,

  -- Strong's numbers with BLB links
  strongs JSONB NOT NULL DEFAULT '[]',

  -- Teacher content
  meaning TEXT,
  what_it_changes TEXT,

  -- Cross-references
  cross_references TEXT[] NOT NULL DEFAULT '{}',

  -- Verification flag
  needs_check_on_blb BOOLEAN NOT NULL DEFAULT FALSE,

  -- Ordering within a section
  position INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_word_studies_study ON public.word_studies(study_id);
CREATE INDEX IF NOT EXISTS idx_word_studies_section ON public.word_studies(section_id);
CREATE INDEX IF NOT EXISTS idx_word_studies_word ON public.word_studies(english_word);

-- Create update trigger for word_studies
DROP TRIGGER IF EXISTS trigger_word_studies_updated_at ON public.word_studies;
CREATE TRIGGER trigger_word_studies_updated_at
  BEFORE UPDATE ON public.word_studies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS on word_studies
ALTER TABLE public.word_studies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Anyone can read word studies of published studies" ON public.word_studies;
DROP POLICY IF EXISTS "Authors can read own word studies" ON public.word_studies;
DROP POLICY IF EXISTS "Authors can insert word studies" ON public.word_studies;
DROP POLICY IF EXISTS "Authors can update word studies" ON public.word_studies;
DROP POLICY IF EXISTS "Authors can delete word studies" ON public.word_studies;

-- Anyone can read word studies of published studies
CREATE POLICY "Anyone can read word studies of published studies"
  ON public.word_studies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.studies
      WHERE studies.id = word_studies.study_id
      AND studies.status = 'published'
    )
  );

-- Authors can read their own study's word studies
CREATE POLICY "Authors can read own word studies"
  ON public.word_studies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.studies
      WHERE studies.id = word_studies.study_id
      AND studies.author_id = auth.uid()
    )
  );

-- Authors can manage word studies
CREATE POLICY "Authors can insert word studies"
  ON public.word_studies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.studies
      WHERE studies.id = word_studies.study_id
      AND studies.author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update word studies"
  ON public.word_studies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.studies
      WHERE studies.id = word_studies.study_id
      AND studies.author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete word studies"
  ON public.word_studies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.studies
      WHERE studies.id = word_studies.study_id
      AND studies.author_id = auth.uid()
    )
  );

-- Success message
SELECT 'All migrations completed successfully!' AS status;
