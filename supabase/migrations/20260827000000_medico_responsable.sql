-- Médico responsable como texto libre (sin relación a perfiles, no toca doctora_id).
-- Aplica a consultas y desparasitaciones. Vacunas ya usan aplicada_por.

ALTER TABLE consultas
  ADD COLUMN IF NOT EXISTS medico_responsable VARCHAR(150);

ALTER TABLE desparasitaciones
  ADD COLUMN IF NOT EXISTS medico_responsable VARCHAR(150);
