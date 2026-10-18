-- Reversión de la parte "mascota registrada (sin expediente)" de la migración
-- 20261004000000. El hospedaje solo admite mascotas del expediente, así que la
-- base vuelve a exigir `mascota_id`.
--
-- Se conservan intactos el cobro por día facturable, los CHECK de fechas, el índice
-- y el RLS por rol, que siguen siendo válidos.

-- =====================================================
-- QUITAR CAPTURA DIRECTA
-- =====================================================

-- El CHECK admitía una estancia con `mascota_id IS NULL` siempre que vinieran los
-- cuatro datos capturados. Ya no aplica.
ALTER TABLE public.hospedajes
    DROP CONSTRAINT IF EXISTS hospedajes_mascota_registrada_check;

ALTER TABLE public.hospedajes
    DROP COLUMN IF EXISTS mascota_nombre,
    DROP COLUMN IF EXISTS mascota_raza,
    DROP COLUMN IF EXISTS propietario_nombre,
    DROP COLUMN IF EXISTS propietario_telefono;

-- Sólo se restaura el NOT NULL si no hay estancias huérfanas, para no romper un
-- entorno que ya tenga filas capturadas sin expediente.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.hospedajes WHERE mascota_id IS NULL
    ) THEN
        ALTER TABLE public.hospedajes
            ALTER COLUMN mascota_id SET NOT NULL;
    END IF;
END $$;

-- =====================================================
-- RLS
-- =====================================================
-- La plantilla anterior daba el mismo trato a `mascota_id IS NULL`. Ahora toda
-- estancia referencia una mascota, así que la validación es directa.

DROP POLICY IF EXISTS "Hospedajes insertables para usuarios de la misma veterinaria"
    ON public.hospedajes;
CREATE POLICY "Hospedajes insertables para usuarios de la misma veterinaria"
    ON public.hospedajes
    FOR INSERT TO authenticated
    WITH CHECK (
        veterinaria_id = public.current_user_veterinaria()
        AND public.current_user_rol() IN ('doctora', 'admin')
        AND EXISTS (
            SELECT 1
            FROM public.mascotas m
            WHERE m.id = mascota_id
              AND m.veterinaria_id = public.current_user_veterinaria()
        )
    );