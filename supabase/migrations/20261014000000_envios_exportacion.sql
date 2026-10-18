-- Delivery attempts for export documents, scoped to the clinic and pet record.
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
CREATE POLICY "Envios visibles al personal clinico de la veterinaria"
    ON public.envios_exportacion FOR SELECT TO authenticated
    USING (
        veterinaria_id = public.current_user_veterinaria()
        AND public.current_user_rol() IN ('doctora', 'admin')
    );

-- Only the dedicated Edge Function, after checking the caller and ownership, writes attempts.
GRANT SELECT ON public.envios_exportacion TO authenticated;
GRANT ALL ON public.envios_exportacion TO service_role;
