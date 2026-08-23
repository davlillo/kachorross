-- Permitir que admin también cree consultas (la ruta /consulta/nueva lo autoriza en frontend).
-- Usa funciones SECURITY DEFINER para evitar recursión RLS en perfiles.

DROP POLICY IF EXISTS "Consultas visibles para usuarios de la misma veterinaria" ON consultas;
CREATE POLICY "Consultas visibles para usuarios de la misma veterinaria" ON consultas
    FOR SELECT TO authenticated USING (
        veterinaria_id = public.current_user_veterinaria()
    );

DROP POLICY IF EXISTS "Consultas insertables para doctora de la misma veterinaria" ON consultas;
DROP POLICY IF EXISTS "Consultas insertables para doctora y admin de la misma veterinaria" ON consultas;
CREATE POLICY "Consultas insertables para doctora y admin de la misma veterinaria" ON consultas
    FOR INSERT TO authenticated WITH CHECK (
        veterinaria_id = public.current_user_veterinaria()
        AND public.current_user_rol() IN ('doctora', 'admin')
    );

DROP POLICY IF EXISTS "Consultas actualizables para usuarios de la misma veterinaria" ON consultas;
CREATE POLICY "Consultas actualizables para usuarios de la misma veterinaria" ON consultas
    FOR UPDATE TO authenticated USING (
        veterinaria_id = public.current_user_veterinaria()
    );

DROP POLICY IF EXISTS "Detalles visibles para usuarios de la misma veterinaria" ON detalles_consulta;
CREATE POLICY "Detalles visibles para usuarios de la misma veterinaria" ON detalles_consulta
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM consultas
            WHERE id = detalles_consulta.consulta_id
              AND veterinaria_id = public.current_user_veterinaria()
        )
    );

DROP POLICY IF EXISTS "Detalles insertables para doctora de la misma veterinaria" ON detalles_consulta;
DROP POLICY IF EXISTS "Detalles insertables para doctora y admin de la misma veterinaria" ON detalles_consulta;
CREATE POLICY "Detalles insertables para doctora y admin de la misma veterinaria" ON detalles_consulta
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM consultas
            WHERE id = detalles_consulta.consulta_id
              AND veterinaria_id = public.current_user_veterinaria()
        )
        AND public.current_user_rol() IN ('doctora', 'admin')
    );
