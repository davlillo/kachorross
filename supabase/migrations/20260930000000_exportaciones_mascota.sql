-- HU-30: seguimiento formal de trámites de exportación de mascotas.

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
            SELECT 1
            FROM public.mascotas m
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
            SELECT 1
            FROM public.mascotas m
            WHERE m.id = mascota_id
              AND m.veterinaria_id = public.current_user_veterinaria()
              AND m.activo = TRUE
        )
    );

GRANT SELECT, INSERT, UPDATE ON public.exportaciones_mascota TO authenticated;
