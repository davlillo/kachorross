-- Corrige la tabla eventos: la definición inicial era un placeholder incompleto.
-- Agrega las columnas que el código de agenda necesita y los índices de performance.

ALTER TABLE eventos ADD COLUMN IF NOT EXISTS mascota_id UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS consulta_id UUID REFERENCES consultas(id) ON DELETE SET NULL;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS tipo VARCHAR(30);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS fecha_hora TIMESTAMP WITH TIME ZONE;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS estado VARCHAR(30) DEFAULT 'programado';
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES perfiles(id) ON DELETE SET NULL;

-- Limpia columnas del placeholder que no se usan
ALTER TABLE eventos DROP COLUMN IF EXISTS descripcion;
ALTER TABLE eventos DROP COLUMN IF EXISTS fecha;

-- Índices de performance de la agenda
CREATE INDEX IF NOT EXISTS idx_consultas_proxima_cita
  ON consultas(veterinaria_id, proxima_cita) WHERE proxima_cita IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vacunas_proxima
  ON vacunas(veterinaria_id, fecha_proxima_dosis) WHERE fecha_proxima_dosis IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_desparas_proxima
  ON desparasitaciones(veterinaria_id, fecha_proximo_tratamiento) WHERE fecha_proximo_tratamiento IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eventos_fecha
  ON eventos(veterinaria_id, fecha_hora);
