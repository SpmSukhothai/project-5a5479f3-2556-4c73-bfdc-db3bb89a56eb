-- ===== ตารางประวัติต้นสังกัดของผู้มีสิทธิ =====
CREATE TABLE public.guardian_affiliation_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guardian_id uuid NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id),
  position text,
  note text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guardian_affiliation_history TO authenticated;
GRANT ALL ON public.guardian_affiliation_history TO service_role;

ALTER TABLE public.guardian_affiliation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff manage guardian affiliation history"
ON public.guardian_affiliation_history FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX idx_gah_guardian ON public.guardian_affiliation_history(guardian_id);

CREATE TRIGGER trg_gah_updated_at
BEFORE UPDATE ON public.guardian_affiliation_history
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== ตารางประวัติการศึกษาของบุตร =====
CREATE TABLE public.child_education_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  study_place text NOT NULL,
  education_level public.education_level,
  school_type public.school_type NOT NULL DEFAULT 'government',
  academic_year integer,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_education_history TO authenticated;
GRANT ALL ON public.child_education_history TO service_role;

ALTER TABLE public.child_education_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff manage child education history"
ON public.child_education_history FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX idx_ceh_child ON public.child_education_history(child_id);

CREATE TRIGGER trg_ceh_updated_at
BEFORE UPDATE ON public.child_education_history
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Trigger: คงรายการปัจจุบันเพียงรายการเดียวต่อ guardian =====
CREATE OR REPLACE FUNCTION public.close_prev_affiliation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_current THEN
    UPDATE public.guardian_affiliation_history
      SET is_current = false,
          end_date = COALESCE(end_date, GREATEST(NEW.start_date - 1, start_date))
      WHERE guardian_id = NEW.guardian_id
        AND id <> NEW.id
        AND is_current = true;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_close_prev_affiliation
AFTER INSERT ON public.guardian_affiliation_history
FOR EACH ROW EXECUTE FUNCTION public.close_prev_affiliation();

-- ===== Trigger: คงรายการปัจจุบันเพียงรายการเดียวต่อ child =====
CREATE OR REPLACE FUNCTION public.close_prev_education()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_current THEN
    UPDATE public.child_education_history
      SET is_current = false,
          end_date = COALESCE(end_date, GREATEST(NEW.start_date - 1, start_date))
      WHERE child_id = NEW.child_id
        AND id <> NEW.id
        AND is_current = true;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_close_prev_education
AFTER INSERT ON public.child_education_history
FOR EACH ROW EXECUTE FUNCTION public.close_prev_education();