-- Earlier default grants gave authenticated more than SELECT on new tables.
-- TRUNCATE and other table-level privileges are not restricted by row-level security.
REVOKE ALL ON public.envios_exportacion FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.envios_exportacion TO authenticated;
GRANT ALL ON public.envios_exportacion TO service_role;
