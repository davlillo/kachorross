-- La fecha de nacimiento de la mascota deja de ser obligatoria (HU ajuste).
-- Cuando no se registra, la UI muestra "—" en Nacimiento y Edad.

ALTER TABLE mascotas
  ALTER COLUMN fecha_nacimiento DROP NOT NULL;
