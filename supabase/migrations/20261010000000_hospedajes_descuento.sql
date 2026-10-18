-- Registra el descuento aplicado a un hospedaje y calcula el total final en la base.

ALTER TABLE public.hospedajes
    ADD COLUMN IF NOT EXISTS descuento_cargo DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.hospedajes
    DROP CONSTRAINT IF EXISTS hospedajes_descuento_cargo_check;
ALTER TABLE public.hospedajes
    ADD CONSTRAINT hospedajes_descuento_cargo_check
    CHECK (descuento_cargo >= 0);

CREATE OR REPLACE FUNCTION public.update_hospedaje_cargo()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado_cobro = 'facturado'
       AND (
           NEW.total_cargo IS DISTINCT FROM OLD.total_cargo
           OR NEW.descuento_cargo IS DISTINCT FROM OLD.descuento_cargo
       ) THEN
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
        NEW.descuento_cargo = 0;
        NEW.total_cargo = GREATEST(NEW.fecha_salida_real - NEW.fecha_ingreso, 1) * NEW.tarifa_diaria;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS public.ajustar_hospedaje_cargo(UUID, NUMERIC);
CREATE FUNCTION public.ajustar_hospedaje_cargo(
    p_hospedaje_id UUID,
    p_descuento_cargo NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_afectadas INTEGER;
    v_total_base NUMERIC;
    v_fecha_ingreso DATE;
    v_fecha_salida DATE;
    v_tarifa_diaria NUMERIC;
BEGIN
    IF public.current_user_rol() NOT IN ('recepcion', 'doctora', 'admin') THEN
        RAISE EXCEPTION 'No tiene permisos para ajustar el cargo del hospedaje';
    END IF;

    IF p_descuento_cargo IS NULL OR p_descuento_cargo < 0 THEN
        RAISE EXCEPTION 'El descuento debe ser mayor o igual a cero';
    END IF;

    SELECT fecha_ingreso, fecha_salida_real, tarifa_diaria
    INTO v_fecha_ingreso, v_fecha_salida, v_tarifa_diaria
    FROM public.hospedajes
    WHERE id = p_hospedaje_id
      AND veterinaria_id = public.current_user_veterinaria()
      AND estado = 'finalizado'
      AND estado_cobro = 'pendiente';

    IF NOT FOUND OR v_fecha_salida IS NULL THEN
        RETURN FALSE;
    END IF;

    v_total_base = GREATEST(v_fecha_salida - v_fecha_ingreso, 1) * v_tarifa_diaria;
    IF p_descuento_cargo > v_total_base THEN
        RAISE EXCEPTION 'El descuento no puede superar el subtotal del hospedaje';
    END IF;

    UPDATE public.hospedajes
    SET descuento_cargo = p_descuento_cargo,
        total_cargo = v_total_base - p_descuento_cargo
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
