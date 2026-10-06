-- Cierra el ciclo de facturación: registra cuándo se cobró cada hospedaje y permite
-- que recepción vea los ya facturados para mostrarlos en "Consultas del Día".
--
-- Por qué una columna nueva y no reusar `fecha_salida_real`: esa fecha es el día en
-- que el paciente salió, no el día en que se cobró. Si recepción cierra la caja un
-- martes y factura un hospedaje que salió el lunes, el ingreso pertenece al martes.
-- Mezclar ambos conceptos descuadra el total del día y el de la semana.
--
-- Por qué `timestamp with time zone`: el filtro por día se hace con rangos UTC
-- calculados en `America/El_Salvador` (ver `rangoUtcDeDiaLocal`), no con un `date`
-- pelado que interpretaría el servidor en UTC y correría el corte seis horas.

-- =====================================================
-- COLUMNA
-- =====================================================

ALTER TABLE public.hospedajes
    ADD COLUMN IF NOT EXISTS facturado_at TIMESTAMPTZ NULL;

-- Backfill para hospedajes ya facturados antes de esta migración. No hay una marca
-- real del cobro, así que se usa la salida como ancla aproximada. En una base
-- migrada desde esta migración en adelante, `facturado_at` lo pone la RPC.
UPDATE public.hospedajes
SET facturado_at = fecha_salida_real::TIMESTAMPTZ
WHERE estado_cobro = 'facturado'
  AND facturado_at IS NULL
  AND fecha_salida_real IS NOT NULL;

-- Cualquier facturado huérfano queda fuera del constraint en vez de romper la
-- validación: son datos inconsistentes, no un motivo para abortar la migración.
ALTER TABLE public.hospedajes
    DROP CONSTRAINT IF EXISTS hospedajes_facturado_con_fecha;
ALTER TABLE public.hospedajes
    ADD CONSTRAINT hospedajes_facturado_con_fecha
    CHECK (estado_cobro <> 'facturado' OR facturado_at IS NOT NULL) NOT VALID;

-- El dashboard agrupa por día en un rango de fechas acotado, así que el índice
-- parcial cubre esa lectura y no toca el histórico pendiente de cobro.
CREATE INDEX IF NOT EXISTS idx_hospedajes_facturado_at
    ON public.hospedajes (veterinaria_id, facturado_at)
    WHERE estado_cobro = 'facturado';

-- =====================================================
-- RLS
-- =====================================================

-- Recepción pasa a ver los hospedajes cerrados de su veterinaria, estén pendientes
-- de cobro o ya facturados: los primeros para facturarlos en el monitor y los
-- segundos para poder mostrarlos en "Consultas del Día". La escritura sigue igual,
-- solo la RPC, porque RLS no filtra por columna y un UPDATE le dejaría tocar
-- `tarifa_diaria`. Lo que sigue viendo restringido son las estancias activas.
DROP POLICY IF EXISTS "Hospedajes visibles para usuarios de la misma veterinaria"
    ON public.hospedajes;
CREATE POLICY "Hospedajes visibles para usuarios de la misma veterinaria"
    ON public.hospedajes
    FOR SELECT TO authenticated
    USING (
        veterinaria_id = public.current_user_veterinaria()
        AND (
            public.current_user_rol() IN ('doctora', 'admin')
            OR (
                public.current_user_rol() = 'recepcion'
                AND estado = 'finalizado'
            )
        )
    );

-- =====================================================
-- RPC DE COBRO
-- =====================================================

-- La función ahora sella la hora del cobro. Sigue siendo la única vía de escritura
-- para recepción y sigue siendo idempotente: si la estancia ya estaba facturada, el
-- WHERE no matchea y devuelve false sin pisar el `facturado_at` original.
DROP FUNCTION IF EXISTS public.marcar_hospedaje_facturado(UUID);
CREATE FUNCTION public.marcar_hospedaje_facturado(p_hospedaje_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_afectadas INTEGER;
BEGIN
    UPDATE public.hospedajes
    SET estado_cobro = 'facturado',
        facturado_at = now()
    WHERE id = p_hospedaje_id
      AND veterinaria_id = public.current_user_veterinaria()
      AND estado = 'finalizado'
      AND estado_cobro = 'pendiente';

    GET DIAGNOSTICS v_afectadas = ROW_COUNT;
    RETURN v_afectadas > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.marcar_hospedaje_facturado(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.marcar_hospedaje_facturado(UUID) TO authenticated;