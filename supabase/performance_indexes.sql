-- Índices compuestos para mejorar rendimiento de Kachorros
-- Ejecutar en Supabase → SQL Editor

CREATE INDEX IF NOT EXISTS idx_consultas_vet_estado
  ON consultas(veterinaria_id, estado);

CREATE INDEX IF NOT EXISTS idx_consultas_vet_mascota
  ON consultas(veterinaria_id, mascota_id);

CREATE INDEX IF NOT EXISTS idx_mascotas_vet_activo
  ON mascotas(veterinaria_id, activo);

CREATE INDEX IF NOT EXISTS idx_catalogo_vet_activo
  ON catalogo(veterinaria_id, activo);
