-- Default function privileges grant EXECUTE to anon even after revoking PUBLIC.
-- These billing RPCs must only be callable with an authenticated user.
REVOKE ALL ON FUNCTION public.marcar_hospedaje_facturado(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ajustar_hospedaje_cargo(UUID, NUMERIC, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marcar_hospedaje_facturado(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ajustar_hospedaje_cargo(UUID, NUMERIC, NUMERIC) TO authenticated;

-- Both functions are invoked by triggers; a fixed path avoids schema shadowing.
ALTER FUNCTION public.update_hospedaje_cargo() SET search_path = public, pg_temp;
ALTER FUNCTION public.validar_hospedaje_sin_solapamiento() SET search_path = public, pg_temp;
