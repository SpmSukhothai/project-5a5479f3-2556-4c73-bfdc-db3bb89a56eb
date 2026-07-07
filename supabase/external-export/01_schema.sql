-- =============================================================================
-- ระบบทะเบียนคุมการเบิกเงินค่าการศึกษาบุตร — สพม.สุโขทัย
-- ไฟล์ที่ 1 : โครงสร้างฐานข้อมูล + ระบบสิทธิ (admin/finance) + Auth
-- ใช้กับ: Supabase project ภายนอก (SQL Editor) — รันไฟล์นี้ก่อน 02_seed_data.sql
-- ปลอดภัยต่อการรันซ้ำ (idempotent) เท่าที่ทำได้
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) ENUM TYPES
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'finance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.school_type AS ENUM ('government', 'private');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.education_level AS ENUM (
    'kindergarten', 'primary', 'lower_secondary', 'upper_secondary',
    'vocational', 'bachelor', 'vocational_certificate', 'higher_vocational'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subsidy_type AS ENUM ('subsidized', 'non_subsidized', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reimbursement_type AS ENUM ('fixed_amount', 'half_of_actual', 'percentage');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 2) ฟังก์ชันตรวจสิทธิ (security definer)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','finance'))
$$;

-- ---------------------------------------------------------------------------
-- 3) TABLES
-- ---------------------------------------------------------------------------

-- profiles ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_roles ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- schools -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_code TEXT NOT NULL UNIQUE,
  school_name TEXT NOT NULL,
  school_type public.school_type NOT NULL DEFAULT 'government',
  province TEXT DEFAULT 'สุโขทัย',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- guardians (ผู้มีสิทธิ) ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  national_id TEXT UNIQUE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  phone TEXT,
  position TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- program_groups (กลุ่มสาขาวิชา ปวช./ปวส.) ---------------------------------
CREATE TABLE IF NOT EXISTS public.program_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- children (บุตร) -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  study_place TEXT,
  education_level public.education_level,
  school_type public.school_type NOT NULL DEFAULT 'government',
  subsidy_type public.subsidy_type NOT NULL DEFAULT 'none',
  program_group_id UUID REFERENCES public.program_groups(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- guardian_affiliation_history (ประวัติต้นสังกัดผู้มีสิทธิ) -----------------
CREATE TABLE IF NOT EXISTS public.guardian_affiliation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id),
  position TEXT,
  note TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gah_guardian ON public.guardian_affiliation_history(guardian_id);

-- child_education_history (ประวัติการศึกษาบุตร) -----------------------------
CREATE TABLE IF NOT EXISTS public.child_education_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  study_place TEXT NOT NULL,
  education_level public.education_level,
  school_type public.school_type NOT NULL DEFAULT 'government',
  academic_year INTEGER,
  subsidy_type public.subsidy_type NOT NULL DEFAULT 'none',
  program_group_id UUID REFERENCES public.program_groups(id),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ceh_child ON public.child_education_history(child_id);

-- reimbursement_rates (อัตราการเบิก) ----------------------------------------
CREATE TABLE IF NOT EXISTS public.reimbursement_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_type public.school_type NOT NULL,
  education_level public.education_level NOT NULL,
  max_amount NUMERIC(12,2) NOT NULL,
  academic_year INTEGER NOT NULL DEFAULT 2569,
  subsidy_type public.subsidy_type NOT NULL DEFAULT 'none',
  program_group_id UUID REFERENCES public.program_groups(id),
  reimbursement_type public.reimbursement_type NOT NULL DEFAULT 'fixed_amount',
  reimbursement_percent NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS reimbursement_rates_unique_key
  ON public.reimbursement_rates (
    school_type, subsidy_type, education_level,
    COALESCE(program_group_id, '00000000-0000-0000-0000-000000000000'::uuid),
    academic_year
  );

-- reimbursements (ทะเบียนคุมการเบิก) ----------------------------------------
CREATE TABLE IF NOT EXISTS public.reimbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year INTEGER NOT NULL,
  registration_no TEXT NOT NULL,
  guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE RESTRICT,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE RESTRICT,
  school_id UUID REFERENCES public.schools(id),
  education_level public.education_level NOT NULL,
  school_type public.school_type NOT NULL,
  study_place TEXT,
  subsidy_type public.subsidy_type NOT NULL DEFAULT 'none',
  program_group_id UUID REFERENCES public.program_groups(id),
  reimbursement_type public.reimbursement_type NOT NULL DEFAULT 'fixed_amount',
  reimbursement_percent NUMERIC,
  entitled_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  sem1_pay_date DATE,
  sem1_doc_no TEXT,
  sem1_receipt_no TEXT,
  sem1_receipt_date DATE,
  sem1_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  sem2_pay_date DATE,
  sem2_doc_no TEXT,
  sem2_receipt_no TEXT,
  sem2_receipt_date DATE,
  sem2_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  remark TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (academic_year, child_id)
);

-- audit_log -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 4) ฟังก์ชันทั่วไป + business rules
-- ---------------------------------------------------------------------------

-- อัปเดต updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- จำกัดบุตรไม่เกิน 3 คน และอายุไม่เกิน 25 ปี
CREATE OR REPLACE FUNCTION public.check_child_limit()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.children WHERE guardian_id = NEW.guardian_id) >= 3 THEN
    RAISE EXCEPTION 'ผู้มีสิทธิ 1 คน สามารถมีบุตรใช้สิทธิได้ไม่เกิน 3 คน';
  END IF;
  IF EXTRACT(YEAR FROM age(NEW.birth_date)) > 25 THEN
    RAISE EXCEPTION 'อายุบุตรเกิน 25 ปี ไม่สามารถใช้สิทธิได้';
  END IF;
  RETURN NEW;
END; $$;

-- ออกเลขทะเบียนอัตโนมัติต่อปีการศึกษา
CREATE OR REPLACE FUNCTION public.set_registration_no()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE next_no INTEGER;
BEGIN
  IF NEW.registration_no IS NULL OR NEW.registration_no = '' THEN
    SELECT COALESCE(MAX(CAST(SPLIT_PART(registration_no,'/',1) AS INTEGER)),0)+1
      INTO next_no FROM public.reimbursements WHERE academic_year = NEW.academic_year;
    NEW.registration_no := LPAD(next_no::TEXT,4,'0') || '/' || NEW.academic_year;
  END IF;
  RETURN NEW;
END; $$;

-- คงรายการต้นสังกัดปัจจุบันเพียงรายการเดียวต่อผู้มีสิทธิ
CREATE OR REPLACE FUNCTION public.close_prev_affiliation()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_current THEN
    UPDATE public.guardian_affiliation_history
      SET is_current = false,
          end_date = COALESCE(end_date, GREATEST(NEW.start_date - 1, start_date))
      WHERE guardian_id = NEW.guardian_id AND id <> NEW.id AND is_current = true;
  END IF;
  RETURN NEW;
END; $$;

-- คงรายการการศึกษาปัจจุบันเพียงรายการเดียวต่อบุตร
CREATE OR REPLACE FUNCTION public.close_prev_education()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_current THEN
    UPDATE public.child_education_history
      SET is_current = false,
          end_date = COALESCE(end_date, GREATEST(NEW.start_date - 1, start_date))
      WHERE child_id = NEW.child_id AND id <> NEW.id AND is_current = true;
  END IF;
  RETURN NEW;
END; $$;

-- บังคับระบุกลุ่มสาขาสำหรับอาชีวศึกษาเอกชน (ปวช./ปวส.)
CREATE OR REPLACE FUNCTION public.validate_program_group()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.education_level::text IN ('vocational_certificate', 'higher_vocational')
     AND NEW.school_type::text = 'private' THEN
    IF NEW.program_group_id IS NULL THEN
      RAISE EXCEPTION 'ระดับอาชีวศึกษาเอกชน (ปวช./ปวส.) ต้องระบุกลุ่มสาขาวิชา';
    END IF;
  ELSE
    NEW.program_group_id := NULL;
  END IF;
  RETURN NEW;
END; $$;

-- เขียน audit log แบบ server-side เท่านั้น
CREATE OR REPLACE FUNCTION public.write_audit_log(
  _action text, _table_name text, _record_id uuid DEFAULT NULL,
  _details jsonb DEFAULT NULL, _user_id uuid DEFAULT auth.uid()
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, table_name, record_id, details)
  VALUES (_user_id, _action, _table_name, _record_id, _details);
END; $$;

-- สร้าง profile + กำหนดสิทธิเมื่อสมัครสมาชิก (คนแรก = admin, คนต่อไป = finance)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'finance');
  END IF;
  RETURN NEW;
END; $$;

-- ---------------------------------------------------------------------------
-- 5) TRIGGERS
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS tg_schools_u ON public.schools;
CREATE TRIGGER tg_schools_u BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tg_guardians_u ON public.guardians;
CREATE TRIGGER tg_guardians_u BEFORE UPDATE ON public.guardians FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tg_children_u ON public.children;
CREATE TRIGGER tg_children_u BEFORE UPDATE ON public.children FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_check_child_limit ON public.children;
CREATE TRIGGER trg_check_child_limit BEFORE INSERT ON public.children FOR EACH ROW EXECUTE FUNCTION public.check_child_limit();

DROP TRIGGER IF EXISTS trg_children_validate_program_group ON public.children;
CREATE TRIGGER trg_children_validate_program_group BEFORE INSERT OR UPDATE ON public.children FOR EACH ROW EXECUTE FUNCTION public.validate_program_group();

DROP TRIGGER IF EXISTS trg_program_groups_updated_at ON public.program_groups;
CREATE TRIGGER trg_program_groups_updated_at BEFORE UPDATE ON public.program_groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_gah_updated_at ON public.guardian_affiliation_history;
CREATE TRIGGER trg_gah_updated_at BEFORE UPDATE ON public.guardian_affiliation_history FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_close_prev_affiliation ON public.guardian_affiliation_history;
CREATE TRIGGER trg_close_prev_affiliation AFTER INSERT ON public.guardian_affiliation_history FOR EACH ROW EXECUTE FUNCTION public.close_prev_affiliation();

DROP TRIGGER IF EXISTS trg_ceh_updated_at ON public.child_education_history;
CREATE TRIGGER trg_ceh_updated_at BEFORE UPDATE ON public.child_education_history FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_close_prev_education ON public.child_education_history;
CREATE TRIGGER trg_close_prev_education AFTER INSERT ON public.child_education_history FOR EACH ROW EXECUTE FUNCTION public.close_prev_education();

DROP TRIGGER IF EXISTS trg_edu_history_validate_program_group ON public.child_education_history;
CREATE TRIGGER trg_edu_history_validate_program_group BEFORE INSERT OR UPDATE ON public.child_education_history FOR EACH ROW EXECUTE FUNCTION public.validate_program_group();

DROP TRIGGER IF EXISTS trg_rates_validate_program_group ON public.reimbursement_rates;
CREATE TRIGGER trg_rates_validate_program_group BEFORE INSERT OR UPDATE ON public.reimbursement_rates FOR EACH ROW EXECUTE FUNCTION public.validate_program_group();

DROP TRIGGER IF EXISTS tg_reimb_u ON public.reimbursements;
CREATE TRIGGER tg_reimb_u BEFORE UPDATE ON public.reimbursements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_registration_no ON public.reimbursements;
CREATE TRIGGER trg_set_registration_no BEFORE INSERT ON public.reimbursements FOR EACH ROW EXECUTE FUNCTION public.set_registration_no();

-- ---------------------------------------------------------------------------
-- 6) GRANTS (Data API) — จำเป็นสำหรับ Supabase PostgREST
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guardians TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.children TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guardian_affiliation_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_education_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reimbursement_rates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reimbursements TO authenticated;
GRANT SELECT ON public.audit_log TO authenticated;

GRANT ALL ON public.profiles, public.user_roles, public.schools, public.guardians,
  public.program_groups, public.children, public.guardian_affiliation_history,
  public.child_education_history, public.reimbursement_rates, public.reimbursements,
  public.audit_log TO service_role;

-- ฟังก์ชันตรวจสิทธิ: ให้เฉพาะ authenticated เรียกได้
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;

-- ฟังก์ชันที่ต้องเรียกจาก server/trigger เท่านั้น
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.write_audit_log(text, text, uuid, jsonb, uuid) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7) ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_affiliation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_education_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursement_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS profiles_self_select ON public.profiles;
CREATE POLICY profiles_self_select ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS profiles_staff_select ON public.profiles;
CREATE POLICY profiles_staff_select ON public.profiles FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- user_roles
DROP POLICY IF EXISTS roles_select_self_or_admin ON public.user_roles;
CREATE POLICY roles_select_self_or_admin ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS roles_staff_select ON public.user_roles;
CREATE POLICY roles_staff_select ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS roles_admin_all ON public.user_roles;
CREATE POLICY roles_admin_all ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- schools
DROP POLICY IF EXISTS schools_read ON public.schools;
CREATE POLICY schools_read ON public.schools FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS schools_admin_write ON public.schools;
CREATE POLICY schools_admin_write ON public.schools FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS schools_admin_update ON public.schools;
CREATE POLICY schools_admin_update ON public.schools FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS schools_admin_delete ON public.schools;
CREATE POLICY schools_admin_delete ON public.schools FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- guardians
DROP POLICY IF EXISTS guardians_read ON public.guardians;
CREATE POLICY guardians_read ON public.guardians FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS guardians_write ON public.guardians;
CREATE POLICY guardians_write ON public.guardians FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS guardians_update ON public.guardians;
CREATE POLICY guardians_update ON public.guardians FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS guardians_delete ON public.guardians;
CREATE POLICY guardians_delete ON public.guardians FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- program_groups
DROP POLICY IF EXISTS "Staff can read program groups" ON public.program_groups;
CREATE POLICY "Staff can read program groups" ON public.program_groups FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Admins can insert program groups" ON public.program_groups;
CREATE POLICY "Admins can insert program groups" ON public.program_groups FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can update program groups" ON public.program_groups;
CREATE POLICY "Admins can update program groups" ON public.program_groups FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can delete program groups" ON public.program_groups;
CREATE POLICY "Admins can delete program groups" ON public.program_groups FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- children
DROP POLICY IF EXISTS children_read ON public.children;
CREATE POLICY children_read ON public.children FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS children_write ON public.children;
CREATE POLICY children_write ON public.children FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS children_update ON public.children;
CREATE POLICY children_update ON public.children FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS children_delete ON public.children;
CREATE POLICY children_delete ON public.children FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- guardian_affiliation_history
DROP POLICY IF EXISTS "staff manage guardian affiliation history" ON public.guardian_affiliation_history;
CREATE POLICY "staff manage guardian affiliation history" ON public.guardian_affiliation_history FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- child_education_history
DROP POLICY IF EXISTS "staff manage child education history" ON public.child_education_history;
CREATE POLICY "staff manage child education history" ON public.child_education_history FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- reimbursement_rates
DROP POLICY IF EXISTS rates_read ON public.reimbursement_rates;
CREATE POLICY rates_read ON public.reimbursement_rates FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS rates_admin ON public.reimbursement_rates;
CREATE POLICY rates_admin ON public.reimbursement_rates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- reimbursements
DROP POLICY IF EXISTS reimb_read ON public.reimbursements;
CREATE POLICY reimb_read ON public.reimbursements FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS reimb_insert ON public.reimbursements;
CREATE POLICY reimb_insert ON public.reimbursements FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS reimb_update ON public.reimbursements;
CREATE POLICY reimb_update ON public.reimbursements FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS reimb_delete ON public.reimbursements;
CREATE POLICY reimb_delete ON public.reimbursements FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- audit_log (อ่านได้เฉพาะ admin, เขียนผ่านฟังก์ชัน server เท่านั้น)
DROP POLICY IF EXISTS audit_read_admin ON public.audit_log;
CREATE POLICY audit_read_admin ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- =============================================================================
-- จบไฟล์โครงสร้าง — ต่อไปรัน 02_seed_data.sql เพื่อนำเข้าข้อมูลจริง
-- =============================================================================
