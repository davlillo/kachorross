-- Older policies on hosted databases allow every authenticated user to read
-- and update all clinics' stays. PostgreSQL combines permissive policies with OR,
-- so the tenant policies from 20261004/06/07 do not override those older ones.
DROP POLICY IF EXISTS "Hospedajes visibles para usuarios autenticados" ON public.hospedajes;
DROP POLICY IF EXISTS "Hospedajes insertables para usuarios autenticados" ON public.hospedajes;
DROP POLICY IF EXISTS "Hospedajes actualizables para usuarios autenticados" ON public.hospedajes;

-- TRUNCATE bypasses RLS. Reception marks stays as invoiced through a restricted RPC.
REVOKE ALL ON public.hospedajes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.hospedajes TO authenticated;
GRANT ALL ON public.hospedajes TO service_role;
