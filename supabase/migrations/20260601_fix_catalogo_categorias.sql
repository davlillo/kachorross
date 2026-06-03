-- Migrar catálogo a 4 categorías del volante: consulta, farmacia, peluqueria, petshop
-- Ejecutar ANTES o junto con 20260601_fix_catalogo_descriptions.sql

BEGIN;

-- 1. Quitar constraint viejo PRIMERO (consulta/farmacia no existían en el CHECK anterior)
ALTER TABLE catalogo DROP CONSTRAINT IF EXISTS catalogo_categoria_check;

-- 2. Actualizar categorías
UPDATE catalogo SET categoria = 'consulta'   WHERE codigo LIKE 'CON-%';
UPDATE catalogo SET categoria = 'farmacia'   WHERE codigo LIKE 'FAR-%';
UPDATE catalogo SET categoria = 'peluqueria' WHERE codigo LIKE 'PEL-%';
UPDATE catalogo SET categoria = 'petshop'    WHERE codigo LIKE 'PTS-%';

UPDATE catalogo SET categoria = 'consulta'   WHERE categoria IN ('servicio', 'vacuna', 'laboratorio');
UPDATE catalogo SET categoria = 'farmacia'   WHERE categoria = 'medicamento';

-- 3. Constraint nuevo
ALTER TABLE catalogo ADD CONSTRAINT catalogo_categoria_check
  CHECK (categoria IN ('consulta', 'farmacia', 'peluqueria', 'petshop'));

COMMIT;
