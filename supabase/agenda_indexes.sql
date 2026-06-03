-- Índices de performance para la agenda (ejecutar en Supabase SQL Editor si no existen)

CREATE TABLE IF NOT EXISTS eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mascota_id UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    consulta_id UUID REFERENCES consultas(id) ON DELETE SET NULL,
    titulo VARCHAR(200) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    notas TEXT,
    estado VARCHAR(30) NOT NULL DEFAULT 'programado',
    created_by UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    veterinaria_id UUID REFERENCES veterinarias(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_consultas_proxima_cita
  ON consultas(veterinaria_id, proxima_cita) WHERE proxima_cita IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vacunas_proxima
  ON vacunas(veterinaria_id, fecha_proxima_dosis) WHERE fecha_proxima_dosis IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_desparas_proxima
  ON desparasitaciones(veterinaria_id, fecha_proximo_tratamiento) WHERE fecha_proximo_tratamiento IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_eventos_fecha
  ON eventos(veterinaria_id, fecha_hora);
