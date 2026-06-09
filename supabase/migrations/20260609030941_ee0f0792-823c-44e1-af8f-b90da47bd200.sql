-- Replace outdated unique constraint that ignored subsidy_type and program_group_id
ALTER TABLE public.reimbursement_rates
  DROP CONSTRAINT IF EXISTS reimbursement_rates_school_type_education_level_academic_ye_key;

-- New uniqueness across the full 5-key lookup, using a sentinel for NULL program_group_id
CREATE UNIQUE INDEX IF NOT EXISTS reimbursement_rates_unique_key
  ON public.reimbursement_rates (
    school_type,
    subsidy_type,
    education_level,
    COALESCE(program_group_id, '00000000-0000-0000-0000-000000000000'::uuid),
    academic_year
  );