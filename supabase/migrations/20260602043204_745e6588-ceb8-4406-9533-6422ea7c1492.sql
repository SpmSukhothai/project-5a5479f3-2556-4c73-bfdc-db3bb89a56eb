ALTER TABLE public.children
  ADD COLUMN study_place text,
  ADD COLUMN education_level public.education_level,
  ADD COLUMN school_type public.school_type NOT NULL DEFAULT 'government';