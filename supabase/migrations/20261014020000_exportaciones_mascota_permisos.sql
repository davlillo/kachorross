-- The older export migration left inherited TRUNCATE grants on anon and authenticated,
-- and did not grant SELECT to service_role, which the verified send function needs.
REVOKE ALL ON public.exportaciones_mascota FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.exportaciones_mascota TO authenticated;
GRANT ALL ON public.exportaciones_mascota TO service_role;
