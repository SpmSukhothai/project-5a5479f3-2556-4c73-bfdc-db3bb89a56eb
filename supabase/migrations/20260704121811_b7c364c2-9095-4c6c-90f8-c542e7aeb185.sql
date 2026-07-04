DROP POLICY IF EXISTS "Authenticated can read program groups" ON public.program_groups;
CREATE POLICY "Staff can read program groups" ON public.program_groups
FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));