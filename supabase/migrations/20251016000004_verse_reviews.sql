-- Verse Reviews table
-- Tracks which verses have been reviewed for word study coverage

CREATE TABLE public.verse_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_id UUID NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  verse_reference TEXT NOT NULL,
  reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(study_id, verse_reference)
);

CREATE INDEX idx_verse_reviews_study ON public.verse_reviews(study_id);
CREATE INDEX idx_verse_reviews_reviewed ON public.verse_reviews(study_id, reviewed);

-- RLS policies
ALTER TABLE public.verse_reviews ENABLE ROW LEVEL SECURITY;

-- Teachers can see all verse reviews for their studies
CREATE POLICY "Teachers can view verse reviews for their studies"
  ON public.verse_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.studies s
      JOIN public.users u ON s.author_id = u.id
      WHERE s.id = verse_reviews.study_id
      AND u.id = auth.uid()
      AND u.role = 'teacher'
    )
  );

-- Teachers can insert verse reviews for their studies
CREATE POLICY "Teachers can insert verse reviews"
  ON public.verse_reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.studies s
      JOIN public.users u ON s.author_id = u.id
      WHERE s.id = verse_reviews.study_id
      AND u.id = auth.uid()
      AND u.role = 'teacher'
    )
  );

-- Teachers can update verse reviews for their studies
CREATE POLICY "Teachers can update verse reviews"
  ON public.verse_reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.studies s
      JOIN public.users u ON s.author_id = u.id
      WHERE s.id = verse_reviews.study_id
      AND u.id = auth.uid()
      AND u.role = 'teacher'
    )
  );

-- Teachers can delete verse reviews for their studies
CREATE POLICY "Teachers can delete verse reviews"
  ON public.verse_reviews FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.studies s
      JOIN public.users u ON s.author_id = u.id
      WHERE s.id = verse_reviews.study_id
      AND u.id = auth.uid()
      AND u.role = 'teacher'
    )
  );
