-- Permite que el admin de una clínica actualice los datos de SU veterinaria (nombre, dirección, logo_url, etc.)
-- Ejecutar en el SQL Editor de Supabase si la configuración de clínica falla con:
-- "Cannot coerce the result to a single JSON object"

DROP POLICY IF EXISTS "Veterinarias actualizables por admin de la misma clínica" ON veterinarias;
CREATE POLICY "Veterinarias actualizables por admin de la misma clínica" ON veterinarias
    FOR UPDATE TO authenticated USING (
        id = (SELECT veterinaria_id FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
    )
    WITH CHECK (
        id = (SELECT veterinaria_id FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
    );
