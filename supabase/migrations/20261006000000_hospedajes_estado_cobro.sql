-- Agrega el ciclo de facturación al hospedaje y abre el monitor de prefacturación
-- a recepción.
--
-- `estado` ya significa "la estancia" (activo / finalizado) y no puede reutilizarse
-- para la facturación: al registrar la salida la estancia ya queda cerrada, así que
-- no existe un estado intermedio "pendiente de facturar", que es justo lo que el
-- monitor de salida necesita para listar lo que hay que cobrar.
--
-- Por eso `estado_cobro` vive aparte. Al registrar la salida queda 'pendiente' y
-- recepción la marca 'facturado' cuando la cobra, con lo que la estancia sale del
-- monitor.

-- =====================================================
-- COLUMNA Y RESTRICCIONES
-- =====================================================

ALTER TABLE public.hospedajes
    ADD COLUMN IF NOT EXISTS estado_cobro VARCHAR(20) NOT NULL DEFAULT 'pendiente';

ALTER TABLE public.hospedajes
    DROP CONSTRAINT IF EXISTS hospedajes_estado_cobro_check;
ALTER TABLE public.hospedajes
    ADD CONSTRAINT hospedajes_estado_cobro_check
    CHECK (estado_cobro IN ('pendiente', 'facturado'));

-- No se puede cobrar una estancia que sigue en curso: si no está cerrada, todavía
-- no se conoce el total.
ALTER TABLE public.hospedajes
    DROP CONSTRAINT IF EXISTS hospedajes_facturado_requiere_salida;
ALTER TABLE public.hospedajes
    ADD CONSTRAINT hospedajes_facturado_requiere_salida
    CHECK (estado_cobro <> 'facturado' OR estado = 'finalizado');

-- El monitor siempre lee estado_cobro = 'pendiente' junto a estado = 'finalizado',
-- así que el índice parcial cubre esa consulta y no crece con el histórico.
CREATE INDEX IF NOT EXISTS idx_hospedajes_prefacturacion
    ON public.hospedajes (veterinaria_id, estado, estado_cobro)
    WHERE estado_cobro = 'pendiente';

-- =====================================================
-- RLS
-- =====================================================

-- Lectura escalonada. doctora y admin siguen viendo todo; recepción ve únicamente
-- lo que está cerrado y pendiente de cobro, que es lo que necesita para facturar.
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
                AND estado_cobro = 'pendiente'
            )
        )
    );

-- =====================================================
-- RPC DE COBRO
-- =====================================================

-- Recepción marca la estancia como facturada desde el monitor. Se hace por función
-- y no abriendo UPDATE a recepcion porque RLS no filtra por columna: con UPDATE
-- podría alterar `tarifa_diaria` o `fecha_salida_real` de la fila y cambiar lo que
-- se factura. Esta función expone una sola operación y valida que la fila sea de su
-- veterinaria y esté en el estado correcto.
--
-- El search_path fijo es obligatorio: sin él la función resuelve objetos por
-- búsqueda de esquema y queda expuesta.
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
    SET estado_cobro = 'facturado'
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