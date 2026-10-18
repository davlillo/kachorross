-- Permite corregir el subtotal y aplicar un descuento porcentual al hospedaje.

ALTER TABLE public.hospedajes
    ADD COLUMN IF NOT EXISTS subtotal_cargo DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS descuento_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0;

-- Conserva los ajustes monetarios existentes convirtiéndolos a porcentaje.
UPDATE public.hospedajes
SET subtotal_cargo = GREATEST(fecha_salida_real - fecha_ingreso, 1) * tarifa_diaria,
    descuento_porcentaje = CASE
        WHEN GREATEST(fecha_salida_real - fecha_ingreso, 1) * tarifa_diaria > 0
        THEN ROUND(
            (GREATEST(fecha_salida_real - fecha_ingreso, 1) * tarifa_diaria - total_cargo)
            / (GREATEST(fecha_salida_real - fecha_ingreso, 1) * tarifa_diaria) * 100,
            2
        )
        ELSE 0
    END
WHERE estado = 'finalizado'
  AND fecha_salida_real IS NOT NULL
  AND subtotal_cargo IS NULL;

ALTER TABLE public.hospedajes
    ALTER COLUMN subtotal_cargo SET DEFAULT 0;

ALTER TABLE public.hospedajes
    DROP CONSTRAINT IF EXISTS hospedajes_descuento_porcentaje_check,
    DROP CONSTRAINT IF EXISTS hospedajes_subtotal_cargo_check;
ALTER TABLE public.hospedajes
    ADD CONSTRAINT hospedajes_descuento_porcentaje_check CHECK (descuento_porcentaje BETWEEN 0 AND 100),
    ADD CONSTRAINT hospedajes_subtotal_cargo_check CHECK (subtotal_cargo >= 0);

CREATE OR REPLACE FUNCTION public.update_hospedaje_cargo()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado_cobro = 'facturado'
       AND (
           NEW.total_cargo IS DISTINCT FROM OLD.total_cargo
           OR NEW.subtotal_cargo IS DISTINCT FROM OLD.subtotal_cargo
           OR NEW.descuento_porcentaje IS DISTINCT FROM OLD.descuento_porcentaje
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
        NEW.subtotal_cargo = GREATEST(NEW.fecha_salida_real - NEW.fecha_ingreso, 1) * NEW.tarifa_diaria;
        NEW.descuento_porcentaje = 0;
        NEW.total_cargo = NEW.subtotal_cargo;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS public.ajustar_hospedaje_cargo(UUID, NUMERIC);
DROP FUNCTION IF EXISTS public.ajustar_hospedaje_cargo(UUID, NUMERIC, NUMERIC);
CREATE FUNCTION public.ajustar_hospedaje_cargo(
    p_hospedaje_id UUID,
    p_subtotal_cargo NUMERIC,
    p_descuento_porcentaje NUMERIC
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

    IF p_subtotal_cargo IS NULL OR p_subtotal_cargo < 0 THEN
        RAISE EXCEPTION 'El subtotal debe ser mayor o igual a cero';
    END IF;
    IF p_descuento_porcentaje IS NULL OR p_descuento_porcentaje < 0 OR p_descuento_porcentaje > 100 THEN
        RAISE EXCEPTION 'El descuento debe estar entre 0 y 100 por ciento';
    END IF;

    UPDATE public.hospedajes
    SET subtotal_cargo = p_subtotal_cargo,
        descuento_porcentaje = p_descuento_porcentaje,
        total_cargo = ROUND(p_subtotal_cargo * (1 - p_descuento_porcentaje / 100), 2)
    WHERE id = p_hospedaje_id
      AND veterinaria_id = public.current_user_veterinaria()
      AND estado = 'finalizado'
      AND estado_cobro = 'pendiente';

    GET DIAGNOSTICS v_afectadas = ROW_COUNT;
    RETURN v_afectadas > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.ajustar_hospedaje_cargo(UUID, NUMERIC, NUMERIC) FROM public;
GRANT EXECUTE ON FUNCTION public.ajustar_hospedaje_cargo(UUID, NUMERIC, NUMERIC) TO authenticated;
