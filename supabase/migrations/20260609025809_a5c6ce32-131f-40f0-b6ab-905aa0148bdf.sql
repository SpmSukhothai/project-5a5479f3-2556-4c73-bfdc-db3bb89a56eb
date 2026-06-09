-- 1. Remove the permissive client-facing INSERT policy on audit_log.
-- The audit log must only be written by trusted server-side (SECURITY DEFINER) code,
-- never by arbitrary authenticated users forging entries.
DROP POLICY IF EXISTS audit_insert ON public.audit_log;

-- Provide a controlled, server-side audit writer (SECURITY DEFINER bypasses RLS).
-- Not granted to client roles; intended for use by triggers / trusted server functions.
CREATE OR REPLACE FUNCTION public.write_audit_log(
  _action text,
  _table_name text,
  _record_id uuid DEFAULT NULL,
  _details jsonb DEFAULT NULL,
  _user_id uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, table_name, record_id, details)
  VALUES (_user_id, _action, _table_name, _record_id, _details);
END;
$$;

REVOKE ALL ON FUNCTION public.write_audit_log(text, text, uuid, jsonb, uuid) FROM PUBLIC, anon, authenticated;

-- 2. Lock down SECURITY DEFINER functions that should never be called directly via the API.
-- handle_new_user runs only as an auth trigger; users must not be able to invoke it.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;