-- Email delivery depends on this table. Its earlier GRANT ALL included TRUNCATE
-- for anon/authenticated, which bypasses row-level security.
REVOKE ALL ON public.config_email FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.config_email TO authenticated;
GRANT ALL ON public.config_email TO service_role;
