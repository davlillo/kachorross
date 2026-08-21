-- Fix RLS recursion: las policies de "perfiles" hacían subselect sobre la
-- misma tabla "perfiles" (SELECT ... FROM perfiles WHERE id = auth.uid()).
-- PostgREST detecta la auto-referencia como recursión infinita al evaluar
-- cualquier policy que dependa de "perfiles".
--
-- Solución estándar de Supabase: funciones SECURITY DEFINER que encapsulan el
-- acceso a "perfiles" (el dueño bypasea RLS, no hay re-evaluación recursiva).

CREATE OR REPLACE FUNCTION public.current_user_veterinaria()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT veterinaria_id FROM public.perfiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_user_rol()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol::text FROM public.perfiles WHERE id = auth.uid()
$$;

DROP POLICY IF EXISTS "Perfiles visibles para usuarios de la misma veterinaria o super_admin" ON perfiles;
CREATE POLICY "Perfiles visibles para usuarios de la misma veterinaria o super_admin" ON perfiles
    FOR SELECT TO authenticated USING (
        veterinaria_id = public.current_user_veterinaria()
        OR public.current_user_rol() = 'super_admin'
    );

DROP POLICY IF EXISTS "Perfiles modificables por super_admin" ON perfiles;
CREATE POLICY "Perfiles modificables por super_admin" ON perfiles
    FOR ALL TO authenticated USING (
        public.current_user_rol() = 'super_admin'
    );