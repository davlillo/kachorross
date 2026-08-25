-- Registrar el médico encargado de aplicar la vacuna (texto libre, opcional).

ALTER TABLE vacunas
  ADD COLUMN IF NOT EXISTS aplicada_por VARCHAR(100);
