-- Cita de seguimiento al finalizar consulta (solo día, sin hora fija)
ALTER TABLE consultas
  ADD COLUMN IF NOT EXISTS tipo_seguimiento VARCHAR(30)
    CHECK (tipo_seguimiento IS NULL OR tipo_seguimiento IN (
      'control', 'vacuna', 'desparasitacion', 'revision_general'
    ));

COMMENT ON COLUMN consultas.tipo_seguimiento IS
  'Tipo de cita de seguimiento programada desde la consulta (HU seguimiento)';
