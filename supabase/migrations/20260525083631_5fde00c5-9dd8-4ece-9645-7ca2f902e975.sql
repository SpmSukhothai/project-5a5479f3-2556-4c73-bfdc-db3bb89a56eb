
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'finance');
CREATE TYPE public.school_type AS ENUM ('government', 'private');
CREATE TYPE public.education_level AS ENUM ('kindergarten', 'primary', 'lower_secondary', 'upper_secondary', 'vocational', 'bachelor');

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','finance'))
$$;

-- handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  -- first user becomes admin
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'finance');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- schools
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_code TEXT NOT NULL UNIQUE,
  school_name TEXT NOT NULL,
  school_type public.school_type NOT NULL DEFAULT 'government',
  province TEXT DEFAULT 'สุโขทัย',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- guardians (ผู้มีสิทธิ)
CREATE TABLE public.guardians (
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
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;

-- children (บุตร)
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- limit 3 children per guardian
CREATE OR REPLACE FUNCTION public.check_child_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.children WHERE guardian_id = NEW.guardian_id) >= 3 THEN
    RAISE EXCEPTION 'ผู้มีสิทธิ 1 คน สามารถมีบุตรใช้สิทธิได้ไม่เกิน 3 คน';
  END IF;
  IF EXTRACT(YEAR FROM age(NEW.birth_date)) > 25 THEN
    RAISE EXCEPTION 'อายุบุตรเกิน 25 ปี ไม่สามารถใช้สิทธิได้';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_check_child_limit
BEFORE INSERT ON public.children
FOR EACH ROW EXECUTE FUNCTION public.check_child_limit();

-- reimbursement rates
CREATE TABLE public.reimbursement_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_type public.school_type NOT NULL,
  education_level public.education_level NOT NULL,
  max_amount NUMERIC(12,2) NOT NULL,
  academic_year INTEGER NOT NULL DEFAULT 2569,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_type, education_level, academic_year)
);
ALTER TABLE public.reimbursement_rates ENABLE ROW LEVEL SECURITY;

-- reimbursements (ทะเบียนคุม)
CREATE TABLE public.reimbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year INTEGER NOT NULL,
  registration_no TEXT NOT NULL,
  guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE RESTRICT,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE RESTRICT,
  school_id UUID REFERENCES public.schools(id),
  education_level public.education_level NOT NULL,
  school_type public.school_type NOT NULL,
  entitled_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- semester 1
  sem1_pay_date DATE,
  sem1_doc_no TEXT,
  sem1_receipt_no TEXT,
  sem1_receipt_date DATE,
  sem1_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- semester 2
  sem2_pay_date DATE,
  sem2_doc_no TEXT,
  sem2_receipt_no TEXT,
  sem2_receipt_date DATE,
  sem2_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  remark TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(academic_year, child_id)
);
ALTER TABLE public.reimbursements ENABLE ROW LEVEL SECURITY;

-- auto registration number per year
CREATE OR REPLACE FUNCTION public.set_registration_no()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE next_no INTEGER;
BEGIN
  IF NEW.registration_no IS NULL OR NEW.registration_no = '' THEN
    SELECT COALESCE(MAX(CAST(SPLIT_PART(registration_no,'/',1) AS INTEGER)),0)+1
      INTO next_no FROM public.reimbursements WHERE academic_year = NEW.academic_year;
    NEW.registration_no := LPAD(next_no::TEXT,4,'0') || '/' || NEW.academic_year;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_set_registration_no
BEFORE INSERT ON public.reimbursements
FOR EACH ROW EXECUTE FUNCTION public.set_registration_no();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER tg_schools_u BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tg_guardians_u BEFORE UPDATE ON public.guardians FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tg_children_u BEFORE UPDATE ON public.children FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tg_reimb_u BEFORE UPDATE ON public.reimbursements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- audit log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============
-- profiles
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- user_roles: only admin
CREATE POLICY "roles_select_self_or_admin" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- schools: staff read; admin write
CREATE POLICY "schools_read" ON public.schools FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "schools_admin_write" ON public.schools FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "schools_admin_update" ON public.schools FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "schools_admin_delete" ON public.schools FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- guardians: staff CRUD
CREATE POLICY "guardians_read" ON public.guardians FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "guardians_write" ON public.guardians FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "guardians_update" ON public.guardians FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "guardians_delete" ON public.guardians FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- children
CREATE POLICY "children_read" ON public.children FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "children_write" ON public.children FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "children_update" ON public.children FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "children_delete" ON public.children FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- rates: read all staff, write admin
CREATE POLICY "rates_read" ON public.reimbursement_rates FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "rates_admin" ON public.reimbursement_rates FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- reimbursements: staff CRUD, admin delete
CREATE POLICY "reimb_read" ON public.reimbursements FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "reimb_insert" ON public.reimbursements FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "reimb_update" ON public.reimbursements FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "reimb_delete" ON public.reimbursements FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- audit
CREATE POLICY "audit_read_admin" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "audit_insert" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- default rates
INSERT INTO public.reimbursement_rates (school_type, education_level, max_amount, academic_year) VALUES
  ('government','kindergarten',5800,2569),
  ('government','primary',6000,2569),
  ('government','lower_secondary',6500,2569),
  ('government','upper_secondary',7000,2569),
  ('government','vocational',9000,2569),
  ('government','bachelor',13700,2569),
  ('private','kindergarten',8500,2569),
  ('private','primary',9000,2569),
  ('private','lower_secondary',9500,2569),
  ('private','upper_secondary',10000,2569),
  ('private','vocational',12000,2569),
  ('private','bachelor',16500,2569);

-- seed schools
INSERT INTO public.schools (school_code, school_name, school_type) VALUES
  ('1064510001','โรงเรียนสุโขทัยวิทยาคม','government'),
  ('1064510002','โรงเรียนอุดมดรุณี','government'),
  ('1064510003','โรงเรียนบ้านสวนวิทยาคม','government'),
  ('1064510004','โรงเรียนคีรีมาศพิทยาคม','government'),
  ('1064510005','โรงเรียนศรีสำโรงชนูปถัมภ์','government'),
  ('P001','โรงเรียนเอกชนสารสาสน์สุโขทัย','private'),
  ('P002','โรงเรียนเอกชนกวงฮั้ว','private');
