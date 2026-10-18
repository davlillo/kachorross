-- Impide que una mascota tenga dos estancias que se pisen en el tiempo.
--
-- El riesgo no es teórico: `crear()` y `registrarSalida()` solo miraban que la fecha
-- de salida estimada no fuera anterior al ingreso. Nada impedía abrir una segunda
-- estancia de Firulais mientras la primera seguía abierta, y al facturar las dos el
-- total del paciente quedaba duplicado sin que nada lo señalara.
--
-- Hay dos reglas, en este orden:
--
-- 1. Ninguna estancia puede solaparse con otra de la misma mascota. Los intervalos
--    se cierran con `fecha_salida_real` cuando la estancia está cerrada y con
--    `fecha_salida_estimada` mientras sigue abierta, que es lo más adelante que puede
--    llegar la primera.
--
-- 2. Mientras la mascota está en hospedaje, el único período que se puede registrar
--    es uno anterior: uno que termine antes de que empiece la estancia activa. Se
--    rechaza también el período futuro que empieza después de la salida estimada, que
--    es la lectura literal del requerimiento.
--
-- La regla vive en un trigger y no en el controller porque el controller es una capa
-- de aplicación: cualquier otro cliente (un script, la API de Supabase, un futuro
-- servicio) podría saltársela. El controller mantiene su validación para dar un
-- mensaje entendible antes de gastar un viaje a la base.

-- =====================================================
-- ÍNDICE DE SOPORTE
-- =====================================================

-- El trigger compara por mascota, así que el índice parcial sobre las estancias
-- abiertas cubre la regla 2 y el filtro por `mascota_id` cubre el solapamiento.
CREATE INDEX IF NOT EXISTS idx_hospedajes_mascota_periodo
    ON public.hospedajes (mascota_id, fecha_ingreso, fecha_salida_estimada)
    WHERE estado = 'activo';

-- =====================================================
-- VALIDACIÓN DE SOLAPAMIENTO
-- =====================================================

CREATE OR REPLACE FUNCTION public.validar_hospedaje_sin_solapamiento()
RETURNS TRIGGER AS $$
DECLARE
    v_conflicto RECORD;
    v_nuevo_fin DATE;
    v_existente_fin DATE;
BEGIN
    IF NEW.mascota_id IS NULL OR NEW.veterinaria_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- La estancia abierta se acota por la salida estimada: es lo más lejos que puede
    -- llegar. Para una ya cerrada manda la salida real.
    v_nuevo_fin := COALESCE(NEW.fecha_salida_real, NEW.fecha_salida_estimada);

    -- Se excluye la propia fila: al registrar la salida la fila que se actualiza es
    -- la que el trigger está examining, y sin este filtro toda actualización fallaría
    -- contra sí misma.
    FOR v_conflicto IN
        SELECT
            h.id,
            h.estado,
            h.fecha_ingreso,
            COALESCE(h.fecha_salida_real, h.fecha_salida_estimada) AS fin,
            h.estado_cobro
        FROM public.hospedajes h
        WHERE h.mascota_id = NEW.mascota_id
          AND h.veterinaria_id = NEW.veterinaria_id
          AND h.id <> NEW.id
        ORDER BY h.fecha_ingreso
    LOOP
        v_existente_fin := v_conflicto.fin;

        -- Regla 1: los intervalos se tocan. Se comparan cerrando ambos extremos
        -- porque el cobro cuenta el día de salida como jornada, así que dos estancias
        -- que comparten un día sí se pisan.
        IF NEW.fecha_ingreso <= v_existente_fin
           AND v_conflicto.fecha_ingreso <= v_nuevo_fin THEN
            RAISE EXCEPTION USING
                ERRCODE = 'check_violation',
                MESSAGE = format(
                    'La mascota ya tiene un hospedaje del %s al %s. '
                    'El período %s al %s se superpone.',
                    to_char(v_conflicto.fecha_ingreso, 'DD/MM/YYYY'),
                    to_char(v_existente_fin, 'DD/MM/YYYY'),
                    to_char(NEW.fecha_ingreso, 'DD/MM/YYYY'),
                    to_char(v_nuevo_fin, 'DD/MM/YYYY')
                ),
                HINT = 'Cerrá el hospedaje anterior o elegí un período que no se pise con él.';
            RETURN NULL;
        END IF;

        -- Regla 2: la mascota sigue dentro. Solo se acepta un período anterior, uno
        -- que termine antes del ingreso de la estancia activa.
        IF v_conflicto.estado = 'activo'
           AND v_nuevo_fin >= v_conflicto.fecha_ingreso THEN
            RAISE EXCEPTION USING
                ERRCODE = 'check_violation',
                MESSAGE = format(
                    'La mascota está en hospedaje desde el %s. '
                    'Solo se puede registrar un período anterior a esa fecha.',
                    to_char(v_conflicto.fecha_ingreso, 'DD/MM/YYYY')
                ),
                HINT = 'Esperá a que se registre la salida, o cargá el período como anterior.';
            RETURN NULL;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_hospedajes_sin_solapamiento ON public.hospedajes;
CREATE TRIGGER trigger_hospedajes_sin_solapamiento
    BEFORE INSERT OR UPDATE OF fecha_ingreso, fecha_salida_estimada, fecha_salida_real, estado, mascota_id
    ON public.hospedajes
    FOR EACH ROW
    EXECUTE FUNCTION public.validar_hospedaje_sin_solapamiento();

-- =====================================================
-- DIAGNÓSTICO
-- =====================================================

-- No corrige nada: solo lista las estancias que ya se pisan, para que la revisión sea
-- una decisión de la clínica y no un efecto colateral de una migración.
--
--   SELECT * FROM public.hospedajes_solapados();
--
CREATE OR REPLACE VIEW public.hospedajes_solapados AS
SELECT
    a.id                AS id_a,
    b.id                AS id_b,
    a.mascota_id        AS mascota_id,
    a.fecha_ingreso     AS ingreso_a,
    COALESCE(a.fecha_salida_real, a.fecha_salida_estimada) AS fin_a,
    a.estado            AS estado_a,
    a.estado_cobro      AS cobro_a,
    b.fecha_ingreso     AS ingreso_b,
    COALESCE(b.fecha_salida_real, b.fecha_salida_estimada) AS fin_b,
    b.estado            AS estado_b,
    b.estado_cobro      AS cobro_b
FROM public.hospedajes a
JOIN public.hospedajes b
  ON a.mascota_id = b.mascota_id
 AND a.veterinaria_id = b.veterinaria_id
 AND a.id < b.id
WHERE a.mascota_id IS NOT NULL
  AND a.fecha_ingreso <= COALESCE(b.fecha_salida_real, b.fecha_salida_estimada)
  AND b.fecha_ingreso <= COALESCE(a.fecha_salida_real, a.fecha_salida_estimada);

REVOKE ALL ON public.hospedajes_solapados FROM public;
GRANT SELECT ON public.hospedajes_solapados TO authenticated;