-- Add study-level reflection questions and notes
-- These are separate from section-level reflection questions

-- Add reflection_questions to studies table
ALTER TABLE public.studies
ADD COLUMN reflection_questions TEXT[] DEFAULT '{}';

-- Add study_notes (for Study Notes clarifications)
ALTER TABLE public.studies
ADD COLUMN study_notes TEXT;

COMMENT ON COLUMN public.studies.reflection_questions IS 'Study-wide reflection questions shown at the end';
COMMENT ON COLUMN public.studies.study_notes IS 'Study notes and clarifications shown before reflection questions';
