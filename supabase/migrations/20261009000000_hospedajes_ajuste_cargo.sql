-- Permite ajustar el total de un hospedaje antes de cobrarlo.
-- El cálculo automático sigue siendo la fuente inicial del cargo al registrar la salida.

-- =====================================================
-- CÁLCULO AUTOMÁTICO SIN SOBRESCRIBIR AJUSTES
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_hospedaje_cargo()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado_cobro = 'facturado'
       AND NEW.total_cargo IS DISTINCT FROM OLD.total_cargo THEN
        RAISE EXCEPTION 'No se puede modificar el cargo de un hospedaje facturado';
    END IF;

    IF NEW.estado = 'finalizado'
       AND NEW.fecha_salida_real IS NOT NULL
       AND (
           OLD.estado IS DISTINCT FROM NEW.estado
           OR OLD.fecha_salida_real IS DISTINCT FROM NEW.fecha_salida_real
           OR OLD.fecha_ingreso IS DISTINCT FROM NEW.fecha_ingreso
           OR OLD.tarifa_diaria IS DISTINCT FROM NEW.tarifa_diaria
       ) THEN
        NEW.total_cargo = GREATEST(NEW.fecha_salida_real - NEW.fecha_ingreso, 1) * NEW.tarifa_diaria;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RPC DE AJUSTE MANUAL
-- =====================================================

DROP FUNCTION IF EXISTS public.ajustar_hospedaje_cargo(UUID, NUMERIC);
CREATE FUNCTION public.ajustar_hospedaje_cargo(
    p_hospedaje_id UUID,
    p_total_cargo NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_afectadas INTEGER;
BEGIN
    IF public.current_user_rol() NOT IN ('recepcion', 'doctora', 'admin') THEN
        RAISE EXCEPTION 'No tiene permisos para ajustar el cargo del hospedaje';
    END IF;

    IF p_total_cargo IS NULL OR p_total_cargo < 0 THEN
        RAISE EXCEPTION 'El total del hospedaje debe ser mayor o igual a cero';
    END IF;

    UPDATE public.hospedajes
    SET total_cargo = p_total_cargo
    WHERE id = p_hospedaje_id
      AND veterinaria_id = public.current_user_veterinaria()
      AND estado = 'finalizado'
      AND estado_cobro = 'pendiente';

    GET DIAGNOSTICS v_afectadas = ROW_COUNT;
    RETURN v_afectadas > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.ajustar_hospedaje_cargo(UUID, NUMERIC) FROM public;
GRANT EXECUTE ON FUNCTION public.ajustar_hospedaje_cargo(UUID, NUMERIC) TO authenticated;
