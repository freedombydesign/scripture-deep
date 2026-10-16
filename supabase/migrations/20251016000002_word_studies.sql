-- Word Studies Feature
-- Teacher-created word studies that provide insight into original languages

-- Create word_studies table
CREATE TABLE public.word_studies (
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
  -- Format: [{ "number": "H6031", "blb_url": "https://..." }, ...]

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

-- Indexes
CREATE INDEX idx_word_studies_study ON public.word_studies(study_id);
CREATE INDEX idx_word_studies_section ON public.word_studies(section_id);
CREATE INDEX idx_word_studies_word ON public.word_studies(english_word);

-- Update trigger
CREATE TRIGGER trigger_word_studies_updated_at
  BEFORE UPDATE ON public.word_studies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE public.word_studies ENABLE ROW LEVEL SECURITY;

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
