-- ============ NEW ENUMS ============
CREATE TYPE public.subsidy_type AS ENUM ('subsidized', 'non_subsidized', 'none');
CREATE TYPE public.reimbursement_type AS ENUM ('fixed_amount', 'half_of_actual', 'percentage');

-- ============ EXTEND education_level ============
ALTER TYPE public.education_level ADD VALUE IF NOT EXISTS 'vocational_certificate';
ALTER TYPE public.education_level ADD VALUE IF NOT EXISTS 'higher_vocational';

-- ============ NEW TABLE program_groups ============
CREATE TABLE public.program_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_groups TO authenticated;
GRANT ALL ON public.program_groups TO service_role;

ALTER TABLE public.program_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read program groups"
  ON public.program_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert program groups"
  ON public.program_groups FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update program groups"
  ON public.program_groups FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete program groups"
  ON public.program_groups FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_program_groups_updated_at
  BEFORE UPDATE ON public.program_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.program_groups (code, name) VALUES
  ('business_administration', 'พาณิชยกรรม'),
  ('industrial', 'ช่างอุตสาหกรรม'),
  ('agriculture', 'เกษตรกรรม'),
  ('tourism', 'ท่องเที่ยว'),
  ('home_economics', 'คหกรรม'),
  ('fisheries', 'ประมง'),
  ('fine_arts', 'ศิลปกรรม'),
  ('textile', 'สิ่งทอ');

-- ============ EXTEND reimbursement_rates ============
ALTER TABLE public.reimbursement_rates
  ADD COLUMN subsidy_type public.subsidy_type NOT NULL DEFAULT 'none',
  ADD COLUMN program_group_id uuid REFERENCES public.program_groups(id),
  ADD COLUMN reimbursement_type public.reimbursement_type NOT NULL DEFAULT 'fixed_amount',
  ADD COLUMN reimbursement_percent numeric;

-- existing 12 rows already get defaults (none / fixed_amount / null) automatically

CREATE UNIQUE INDEX reimbursement_rates_lookup_uniq ON public.reimbursement_rates (
  school_type,
  subsidy_type,
  education_level,
  COALESCE(program_group_id, '00000000-0000-0000-0000-000000000000'::uuid),
  academic_year
);

-- ============ EXTEND child + reimbursement tables ============
ALTER TABLE public.children
  ADD COLUMN subsidy_type public.subsidy_type NOT NULL DEFAULT 'none',
  ADD COLUMN program_group_id uuid REFERENCES public.program_groups(id);

ALTER TABLE public.child_education_history
  ADD COLUMN subsidy_type public.subsidy_type NOT NULL DEFAULT 'none',
  ADD COLUMN program_group_id uuid REFERENCES public.program_groups(id);

ALTER TABLE public.reimbursements
  ADD COLUMN subsidy_type public.subsidy_type NOT NULL DEFAULT 'none',
  ADD COLUMN program_group_id uuid REFERENCES public.program_groups(id),
  ADD COLUMN reimbursement_type public.reimbursement_type NOT NULL DEFAULT 'fixed_amount',
  ADD COLUMN reimbursement_percent numeric;

-- ============ VALIDATION TRIGGER ============
CREATE OR REPLACE FUNCTION public.validate_program_group()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.education_level::text IN ('vocational_certificate', 'higher_vocational') THEN
    IF NEW.program_group_id IS NULL THEN
      RAISE EXCEPTION 'ระดับอาชีวศึกษา (ปวช./ปวส.) ต้องระบุกลุ่มสาขาวิชา';
    END IF;
  ELSE
    NEW.program_group_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_rates_validate_program_group
  BEFORE INSERT OR UPDATE ON public.reimbursement_rates
  FOR EACH ROW EXECUTE FUNCTION public.validate_program_group();

CREATE TRIGGER trg_children_validate_program_group
  BEFORE INSERT OR UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.validate_program_group();

CREATE TRIGGER trg_edu_history_validate_program_group
  BEFORE INSERT OR UPDATE ON public.child_education_history
  FOR EACH ROW EXECUTE FUNCTION public.validate_program_group();