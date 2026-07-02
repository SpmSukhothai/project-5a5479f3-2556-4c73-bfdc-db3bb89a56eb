-- ให้ผู้ใช้สิทธิ (admin/finance) อ่านข้อมูลโปรไฟล์และสิทธิของผู้ใช้ทุกคนได้ เพื่อแสดงรายชื่อสิทธิในหน้าตั้งค่า

CREATE POLICY "profiles_staff_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "roles_staff_select" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));