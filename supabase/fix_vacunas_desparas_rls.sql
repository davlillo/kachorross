-- =============================================================================
-- Fix RLS: permitir crear vacunas y desparasitaciones (expediente)
-- Ejecutar en Supabase → SQL Editor → Run
-- Error típico: "new row violates row-level security policy for table vacunas"
-- =============================================================================

-- Vacunas: lectura
DROP POLICY IF EXISTS "Vacunas visibles para usuarios de la misma veterinaria" ON vacunas;
CREATE POLICY "Vacunas visibles para usuarios de la misma veterinaria" ON vacunas
  FOR SELECT TO authenticated
  USING (
    veterinaria_id = (SELECT veterinaria_id FROM perfiles WHERE id = auth.uid())
  );

-- Vacunas: insertar (misma clínica + mascota de esa clínica)
DROP POLICY IF EXISTS "Vacunas insertables para usuarios de la misma veterinaria" ON vacunas;
DROP POLICY IF EXISTS "Vacunas insertables para doctora de la misma veterinaria" ON vacunas;
CREATE POLICY "Vacunas insertables para usuarios de la misma veterinaria" ON vacunas
  FOR INSERT TO authenticated
  WITH CHECK (
    veterinaria_id = (SELECT veterinaria_id FROM perfiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM mascotas m
      WHERE m.id = mascota_id
        AND m.veterinaria_id = (SELECT veterinaria_id FROM perfiles WHERE id = auth.uid())
    )
  );

-- Vacunas: actualizar / eliminar (misma clínica)
DROP POLICY IF EXISTS "Vacunas actualizables para usuarios de la misma veterinaria" ON vacunas;
CREATE POLICY "Vacunas actualizables para usuarios de la misma veterinaria" ON vacunas
  FOR UPDATE TO authenticated
  USING (
    veterinaria_id = (SELECT veterinaria_id FROM perfiles WHERE id = auth.uid())
  )
  WITH CHECK (
    veterinaria_id = (SELECT veterinaria_id FROM perfiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Vacunas eliminables para usuarios de la misma veterinaria" ON vacunas;
CREATE POLICY "Vacunas eliminables para usuarios de la misma veterinaria" ON vacunas
  FOR DELETE TO authenticated
  USING (
    veterinaria_id = (SELECT veterinaria_id FROM perfiles WHERE id = auth.uid())
  );

-- Desparasitaciones: insertar (mismo criterio)
DROP POLICY IF EXISTS "Desparasitaciones visibles para usuarios de la misma veterinaria" ON desparasitaciones;
CREATE POLICY "Desparasitaciones visibles para usuarios de la misma veterinaria" ON desparasitaciones
  FOR SELECT TO authenticated
  USING (
    veterinaria_id = (SELECT veterinaria_id FROM perfiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Desparasitaciones insertables para usuarios de la misma veterinaria" ON desparasitaciones;
DROP POLICY IF EXISTS "Desparasitaciones insertables para doctora de la misma veterinaria" ON desparasitaciones;
CREATE POLICY "Desparasitaciones insertables para usuarios de la misma veterinaria" ON desparasitaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    veterinaria_id = (SELECT veterinaria_id FROM perfiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM mascotas m
      WHERE m.id = mascota_id
        AND m.veterinaria_id = (SELECT veterinaria_id FROM perfiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Desparasitaciones actualizables para usuarios de la misma veterinaria" ON desparasitaciones;
CREATE POLICY "Desparasitaciones actualizables para usuarios de la misma veterinaria" ON desparasitaciones
  FOR UPDATE TO authenticated
  USING (
    veterinaria_id = (SELECT veterinaria_id FROM perfiles WHERE id = auth.uid())
  )
  WITH CHECK (
    veterinaria_id = (SELECT veterinaria_id FROM perfiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Desparasitaciones eliminables para usuarios de la misma veterinaria" ON desparasitaciones;
CREATE POLICY "Desparasitaciones eliminables para usuarios de la misma veterinaria" ON desparasitaciones
  FOR DELETE TO authenticated
  USING (
    veterinaria_id = (SELECT veterinaria_id FROM perfiles WHERE id = auth.uid())
  );
