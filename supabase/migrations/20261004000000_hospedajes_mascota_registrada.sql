-- HU-25, HU-26: hospedajes con mascota registrada (sin expediente), cobro por
-- día facturable y políticas alineadas con los roles que la UI permite.

-- =====================================================
-- MASCOTA REGISTRADA (SIN EXPEDIENTE)
-- =====================================================
-- La mascota que se hospeda no siempre tiene expediente. En ese caso se guardan
-- los datos capturados en el registro y `mascota_id` queda NULL.

ALTER TABLE public.hospedajes
    ALTER COLUMN mascota_id DROP NOT NULL;

ALTER TABLE public.hospedajes
    ADD COLUMN IF NOT EXISTS mascota_nombre VARCHAR(50),
    ADD COLUMN IF NOT EXISTS mascota_raza VARCHAR(50),
    ADD COLUMN IF NOT EXISTS propietario_nombre VARCHAR(100),
    ADD COLUMN IF NOT EXISTS propietario_telefono VARCHAR(20);

-- Debe existir una mascota del expediente o los cuatro datos capturados.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'hospedajes_mascota_registrada_check'
          AND conrelid = 'public.hospedajes'::regclass
    ) THEN
        ALTER TABLE public.hospedajes
            ADD CONSTRAINT hospedajes_mascota_registrada_check CHECK (
                mascota_id IS NOT NULL
                OR (
                    mascota_nombre IS NOT NULL
                    AND mascota_raza IS NOT NULL
                    AND propietario_nombre IS NOT NULL
                    AND propietario_telefono IS NOT NULL
                )
            );
    END IF;
END $$;

-- =====================================================
-- COBRO POR DÍA FACTURABLE (HU-26)
-- =====================================================
-- El mismo día de ingreso y salida cuenta como una jornada: sin este mínimo un
-- huésped que entra y sale el mismo día quedaba en $0.00.

CREATE OR REPLACE FUNCTION public.update_hospedaje_cargo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'finalizado' AND NEW.fecha_salida_real IS NOT NULL THEN
        NEW.total_cargo = GREATEST(NEW.fecha_salida_real - NEW.fecha_ingreso, 1) * NEW.tarifa_diaria;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INTEGRIDAD DE FECHAS
-- =====================================================
-- Se agregan sólo si ninguna fila existente las incumple, para no romper una base
-- que ya tenga estancias cargadas.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.hospedajes WHERE fecha_salida_real IS NOT NULL AND fecha_salida_real < fecha_ingreso
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'hospedajes_salida_posterior_ingreso'
          AND conrelid = 'public.hospedajes'::regclass
    ) THEN
        ALTER TABLE public.hospedajes
            ADD CONSTRAINT hospedajes_salida_posterior_ingreso
            CHECK (fecha_salida_real IS NULL OR fecha_salida_real >= fecha_ingreso);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.hospedajes WHERE fecha_salida_estimada < fecha_ingreso
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'hospedajes_salida_estimada_posterior_ingreso'
          AND conrelid = 'public.hospedajes'::regclass
    ) THEN
        ALTER TABLE public.hospedajes
            ADD CONSTRAINT hospedajes_salida_estimada_posterior_ingreso
            CHECK (fecha_salida_estimada >= fecha_ingreso);
    END IF;
END $$;

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_hospedajes_veterinaria_estado
    ON public.hospedajes(veterinaria_id, estado);

-- =====================================================
-- RLS
-- =====================================================
-- La UI sólo expone el módulo a doctora y admin. Sin el requisito de rol, un
-- usuario de recepción podía escribir en la tabla aunque la ruta lo bloqueara.

DROP POLICY IF EXISTS "Hospedajes visibles para usuarios de la misma veterinaria"
    ON public.hospedajes;
CREATE POLICY "Hospedajes visibles para usuarios de la misma veterinaria"
    ON public.hospedajes
    FOR SELECT TO authenticated
    USING (
        veterinaria_id = public.current_user_veterinaria()
        AND public.current_user_rol() IN ('doctora', 'admin')
    );

DROP POLICY IF EXISTS "Hospedajes insertables para usuarios de la misma veterinaria"
    ON public.hospedajes;
CREATE POLICY "Hospedajes insertables para usuarios de la misma veterinaria"
    ON public.hospedajes
    FOR INSERT TO authenticated
    WITH CHECK (
        veterinaria_id = public.current_user_veterinaria()
        AND public.current_user_rol() IN ('doctora', 'admin')
        AND (
            mascota_id IS NULL
            OR EXISTS (
                SELECT 1
                FROM public.mascotas m
                WHERE m.id = mascota_id
                  AND m.veterinaria_id = public.current_user_veterinaria()
            )
        )
    );

DROP POLICY IF EXISTS "Hospedajes actualizables para usuarios de la misma veterinaria"
    ON public.hospedajes;
CREATE POLICY "Hospedajes actualizables para usuarios de la misma veterinaria"
    ON public.hospedajes
    FOR UPDATE TO authenticated
    USING (
        veterinaria_id = public.current_user_veterinaria()
        AND public.current_user_rol() IN ('doctora', 'admin')
    )
    WITH CHECK (
        veterinaria_id = public.current_user_veterinaria()
        AND public.current_user_rol() IN ('doctora', 'admin')
    );

-- Nota: no se crea política DELETE. Borrar una estancia elimina su registro de
-- cobro, así que queda bloqueado hasta que exista una acción de borrado en la UI.

GRANT SELECT, INSERT, UPDATE ON public.hospedajes TO authenticated;