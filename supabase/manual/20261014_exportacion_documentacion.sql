-- Kachorros · Exportación de mascotas / envío de documentación
--
-- Para ejecución única desde Supabase Dashboard > SQL Editor.
-- Requiere que las migraciones base ya hayan creado:
--   public.veterinarias, public.mascotas, public.perfiles,
--   public.update_updated_at_column(), public.current_user_veterinaria(),
--   public.current_user_rol() y public.config_email.
--
-- Este archivo agrupa las migraciones 20260930000000 y
-- 20261014000000–20261014030000.
-- Conservamos los archivos individuales en supabase/migrations para instalaciones
-- reproducibles con la CLI. No pegues este bundle y luego ejecutes db push sin
-- revisar `supabase migration list --linked`.

BEGIN;

CREATE TABLE IF NOT EXISTS public.exportaciones_mascota (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    veterinaria_id UUID NOT NULL REFERENCES public.veterinarias(id) ON DELETE CASCADE,
    mascota_id UUID NOT NULL REFERENCES public.mascotas(id) ON DELETE CASCADE,
    pais_destino VARCHAR(100) NOT NULL,
    destino_detalle VARCHAR(180),
    fecha_tramite_programada DATE NOT NULL,
    fecha_viaje DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador'
        CHECK (estado IN ('borrador', 'en_proceso', 'completado', 'cancelado')),
    requisitos JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(requisitos) = 'array'),
    costos JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(costos) = 'array'),
    moneda VARCHAR(3) NOT NULL DEFAULT 'USD',
    veterinario_responsable VARCHAR(150) NOT NULL,
    responsable_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exportaciones_mascota_veterinaria
    ON public.exportaciones_mascota(veterinaria_id);
CREATE INDEX IF NOT EXISTS idx_exportaciones_mascota_paciente
    ON public.exportaciones_mascota(veterinaria_id, mascota_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exportaciones_mascota_fecha
    ON public.exportaciones_mascota(veterinaria_id, fecha_tramite_programada);

DROP TRIGGER IF EXISTS update_exportaciones_mascota_updated_at
    ON public.exportaciones_mascota;
CREATE TRIGGER update_exportaciones_mascota_updated_at
    BEFORE UPDATE ON public.exportaciones_mascota
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.exportaciones_mascota ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Exportaciones visibles para usuarios de la misma veterinaria"
    ON public.exportaciones_mascota;
CREATE POLICY "Exportaciones visibles para usuarios de la misma veterinaria"
    ON public.exportaciones_mascota
    FOR SELECT TO authenticated
    USING (veterinaria_id = public.current_user_veterinaria());

DROP POLICY IF EXISTS "Exportaciones insertables por personal clinico"
    ON public.exportaciones_mascota;
CREATE POLICY "Exportaciones insertables por personal clinico"
    ON public.exportaciones_mascota
    FOR INSERT TO authenticated
    WITH CHECK (
        veterinaria_id = public.current_user_veterinaria()
        AND public.current_user_rol() IN ('doctora', 'admin')
        AND EXISTS (
            SELECT 1 FROM public.mascotas m
            WHERE m.id = mascota_id
              AND m.veterinaria_id = public.current_user_veterinaria()
              AND m.activo = TRUE
        )
    );

DROP POLICY IF EXISTS "Exportaciones actualizables por personal clinico"
    ON public.exportaciones_mascota;
CREATE POLICY "Exportaciones actualizables por personal clinico"
    ON public.exportaciones_mascota
    FOR UPDATE TO authenticated
    USING (
        veterinaria_id = public.current_user_veterinaria()
        AND public.current_user_rol() IN ('doctora', 'admin')
    )
    WITH CHECK (
        veterinaria_id = public.current_user_veterinaria()
        AND public.current_user_rol() IN ('doctora', 'admin')
        AND EXISTS (
            SELECT 1 FROM public.mascotas m
            WHERE m.id = mascota_id
              AND m.veterinaria_id = public.current_user_veterinaria()
              AND m.activo = TRUE
        )
    );

CREATE TABLE IF NOT EXISTS public.envios_exportacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    veterinaria_id UUID NOT NULL REFERENCES public.veterinarias(id) ON DELETE CASCADE,
    exportacion_id UUID NOT NULL REFERENCES public.exportaciones_mascota(id) ON DELETE CASCADE,
    mascota_id UUID NOT NULL REFERENCES public.mascotas(id) ON DELETE CASCADE,
    destinatario_email VARCHAR(255) NOT NULL,
    documentos TEXT[] NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'enviado', 'fallido')),
    fecha_envio TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_envios_exportacion_tramite
    ON public.envios_exportacion (exportacion_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_envios_exportacion_expediente
    ON public.envios_exportacion (veterinaria_id, mascota_id, created_at DESC);

ALTER TABLE public.envios_exportacion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Envios visibles al personal clinico de la veterinaria"
    ON public.envios_exportacion;
CREATE POLICY "Envios visibles al personal clinico de la veterinaria"
    ON public.envios_exportacion FOR SELECT TO authenticated
    USING (
        veterinaria_id = public.current_user_veterinaria()
        AND public.current_user_rol() IN ('doctora', 'admin')
    );

-- RLS no limita privilegios de tabla como TRUNCATE. Revoke inherited grants explicitly.
REVOKE ALL ON public.envios_exportacion FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.envios_exportacion TO authenticated;
GRANT ALL ON public.envios_exportacion TO service_role;

-- The Edge Function reads the export record with service_role and validates tenant,
-- pet, owner, status, and recipient before sending.
REVOKE ALL ON public.exportaciones_mascota FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.exportaciones_mascota TO authenticated;
GRANT ALL ON public.exportaciones_mascota TO service_role;

-- Email credentials are read by the Edge Function and managed through RLS in the app.
REVOKE ALL ON public.config_email FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.config_email TO authenticated;
GRANT ALL ON public.config_email TO service_role;

COMMIT;
