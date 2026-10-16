-- Section Release Feature
-- Allows teachers to release sections one at a time during a study

-- Create enum for release mode
CREATE TYPE release_mode AS ENUM ('all_open', 'release_as_we_go');

-- Add release_mode to studies table
ALTER TABLE public.studies
ADD COLUMN release_mode release_mode NOT NULL DEFAULT 'all_open';

-- Add released flag to sections table
-- Default true so existing sections remain open
ALTER TABLE public.sections
ADD COLUMN released BOOLEAN NOT NULL DEFAULT TRUE;

-- Comment for documentation
COMMENT ON COLUMN public.studies.release_mode IS 'all_open: all sections visible. release_as_we_go: teacher unlocks sections progressively';
COMMENT ON COLUMN public.sections.released IS 'Whether this section is released for students to read (only applies when study.release_mode = release_as_we_go)';
