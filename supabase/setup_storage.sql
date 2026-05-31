-- =========================================================================
-- SCRIPT PARA CONFIGURAR STORAGE (logos, mascotas, fotos de evolución)
-- =========================================================================
-- Ejecuta este script en el SQL Editor de Supabase
-- =========================================================================

-- 1. Columnas faltantes en tablas existentes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='veterinarias' AND column_name='logo_url') THEN
        ALTER TABLE veterinarias ADD COLUMN logo_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mascotas' AND column_name='foto') THEN
        ALTER TABLE mascotas ADD COLUMN foto TEXT;
    END IF;
END $$;

-- 2. Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('logos_veterinarias', 'logos_veterinarias', true),
    ('mascotas', 'mascotas', true),
    ('fotos_evolucion', 'fotos_evolucion', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas: logos_veterinarias
DROP POLICY IF EXISTS "Logos visibles para todos" ON storage.objects;
CREATE POLICY "Logos visibles para todos" ON storage.objects
    FOR SELECT USING (bucket_id = 'logos_veterinarias');

DROP POLICY IF EXISTS "Usuarios autenticados pueden subir logos" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden subir logos" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'logos_veterinarias');

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar logos" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden actualizar logos" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'logos_veterinarias');

DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar logos" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden eliminar logos" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'logos_veterinarias');

-- 4. Políticas: mascotas (foto de perfil del paciente)
DROP POLICY IF EXISTS "Fotos mascota visibles para todos" ON storage.objects;
CREATE POLICY "Fotos mascota visibles para todos" ON storage.objects
    FOR SELECT USING (bucket_id = 'mascotas');

DROP POLICY IF EXISTS "Usuarios autenticados pueden subir fotos mascota" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden subir fotos mascota" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'mascotas');

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar fotos mascota" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden actualizar fotos mascota" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'mascotas');

DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar fotos mascota" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden eliminar fotos mascota" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'mascotas');

-- 5. Políticas: fotos_evolucion (seguimiento clínico)
DROP POLICY IF EXISTS "Fotos evolucion visibles para todos" ON storage.objects;
CREATE POLICY "Fotos evolucion visibles para todos" ON storage.objects
    FOR SELECT USING (bucket_id = 'fotos_evolucion');

DROP POLICY IF EXISTS "Usuarios autenticados pueden subir fotos evolucion" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden subir fotos evolucion" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fotos_evolucion');

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar fotos evolucion" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden actualizar fotos evolucion" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'fotos_evolucion');

DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar fotos evolucion" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden eliminar fotos evolucion" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'fotos_evolucion');

DO $$
BEGIN
    RAISE NOTICE 'Configuración de Storage completada (logos, mascotas, fotos_evolucion).';
END $$;

-- 6. RLS: permitir que doctora y admin inserten fotos de evolución
DROP POLICY IF EXISTS "Fotos insertables para doctora de la misma veterinaria" ON fotos_evolucion;
DROP POLICY IF EXISTS "Fotos insertables para doctora y admin de la misma veterinaria" ON fotos_evolucion;
CREATE POLICY "Fotos insertables para doctora y admin de la misma veterinaria" ON fotos_evolucion
    FOR INSERT TO authenticated WITH CHECK (
        veterinaria_id = (SELECT veterinaria_id FROM perfiles WHERE id = auth.uid()) AND
        EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('doctora', 'admin'))
    );
