-- =====================================================
-- 🐾 VETERINARIA KACHORRO'S - Esquema de Base de Datos
-- Base de datos: PostgreSQL (Supabase)
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Perfiles de usuario (extiende auth.users de Supabase)
CREATE TABLE perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('doctora', 'recepcion', 'admin')),
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Propietarios de mascotas
CREATE TABLE propietarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mascotas (pacientes)
CREATE TABLE mascotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL,
    especie VARCHAR(20) NOT NULL CHECK (especie IN ('perro', 'gato', 'ave', 'conejo', 'otro')),
    raza VARCHAR(50) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo VARCHAR(10) NOT NULL CHECK (sexo IN ('macho', 'hembra')),
    color VARCHAR(50),
    peso DECIMAL(5,2),
    foto TEXT,
    propietario_id UUID NOT NULL REFERENCES propietarios(id) ON DELETE CASCADE,
    alergias TEXT[],
    notas_especiales TEXT,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Catálogo de productos y servicios
CREATE TABLE catalogo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('servicio', 'vacuna', 'medicamento', 'petshop', 'laboratorio')),
    precio DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock INTEGER,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consultas médicas
CREATE TABLE consultas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mascota_id UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    motivo VARCHAR(200) NOT NULL,
    sintomas TEXT,
    diagnostico TEXT NOT NULL,
    tratamiento TEXT,
    notas TEXT,
    doctora_id UUID REFERENCES perfiles(id),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'finalizado')),
    total DECIMAL(10,2) DEFAULT 0,
    proxima_cita DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detalles de consulta (productos/servicios aplicados)
CREATE TABLE detalles_consulta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consulta_id UUID NOT NULL REFERENCES consultas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES catalogo(id),
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_aplicado DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_aplicado) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fotos de evolución del paciente
CREATE TABLE fotos_evolucion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mascota_id UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registro de vacunas
CREATE TABLE vacunas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mascota_id UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    fecha_aplicacion DATE NOT NULL,
    proxima_dosis DATE,
    lote VARCHAR(50),
    consulta_id UUID REFERENCES consultas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

CREATE INDEX idx_mascotas_propietario ON mascotas(propietario_id);
CREATE INDEX idx_mascotas_nombre ON mascotas(nombre);
CREATE INDEX idx_consultas_mascota ON consultas(mascota_id);
CREATE INDEX idx_consultas_fecha ON consultas(fecha);
CREATE INDEX idx_consultas_estado ON consultas(estado);
CREATE INDEX idx_detalles_consulta ON detalles_consulta(consulta_id);
CREATE INDEX idx_catalogo_categoria ON catalogo(categoria);
CREATE INDEX idx_catalogo_activo ON catalogo(activo);
CREATE INDEX idx_vacunas_mascota ON vacunas(mascota_id);

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_perfiles_updated_at BEFORE UPDATE ON perfiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_propietarios_updated_at BEFORE UPDATE ON propietarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mascotas_updated_at BEFORE UPDATE ON mascotas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_catalogo_updated_at BEFORE UPDATE ON catalogo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultas_updated_at BEFORE UPDATE ON consultas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER PARA ACTUALIZAR TOTAL DE CONSULTA
-- =====================================================

CREATE OR REPLACE FUNCTION update_consulta_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE consultas 
    SET total = (
        SELECT COALESCE(SUM(subtotal), 0) 
        FROM detalles_consulta 
        WHERE consulta_id = COALESCE(NEW.consulta_id, OLD.consulta_id)
    )
    WHERE id = COALESCE(NEW.consulta_id, OLD.consulta_id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_consulta_total_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON detalles_consulta
    FOR EACH ROW EXECUTE FUNCTION update_consulta_total();

-- =====================================================
-- DATOS INICIALES (SEED)
-- =====================================================

-- Insertar catálogo de productos y servicios
INSERT INTO catalogo (codigo, nombre, descripcion, categoria, precio, stock) VALUES
-- Servicios
('CONS-GEN', 'Consulta General', 'Evaluación médica completa del paciente', 'servicio', 25.00, NULL),
('CONS-ESP', 'Consulta Especializada', 'Consulta con especialista', 'servicio', 45.00, NULL),
('DESP', 'Desparasitación', 'Aplicación de antiparasitario', 'servicio', 15.00, NULL),
('CORT-UNI', 'Corte de Uñas', 'Corte y limado de uñas', 'servicio', 8.00, NULL),
('LIMP-ODO', 'Limpieza de Oídos', 'Limpieza profunda de conducto auditivo', 'servicio', 12.00, NULL),
-- Vacunas
('VAC-PENT', 'Vacuna Pentavalente', 'Protección contra 5 enfermedades', 'vacuna', 35.00, 50),
('VAC-RABI', 'Vacuna Antirrábica', 'Protección contra rabia', 'vacuna', 20.00, 40),
('VAC-BORD', 'Vacuna Bordetella', 'Protección contra tos de las perreras', 'vacuna', 28.00, 25),
('VAC-TRIP', 'Vacuna Triple Felina', 'Protección para gatos', 'vacuna', 30.00, 30),
-- Medicamentos
('MED-AMOX', 'Amoxicilina 250mg', 'Antibiótico de amplio espectro', 'medicamento', 18.50, 100),
('MED-METO', 'Metronidazol 500mg', 'Antiprotozoario y antibacteriano', 'medicamento', 22.00, 80),
('MED-DEXA', 'Dexametasona', 'Antiinflamatorio esteroideo', 'medicamento', 15.00, 60),
('MED-IVER', 'Ivermectina', 'Antiparasitario interno y externo', 'medicamento', 12.00, 75),
-- PetShop
('PS-ALIM-AD', 'Alimento Adulto Premium 4kg', 'Alimento balanceado para perros adultos', 'petshop', 45.00, 30),
('PS-ALIM-CT', 'Alimento Gato Premium 3kg', 'Alimento balanceado para gatos', 'petshop', 38.00, 25),
('PS-SHAM', 'Shampoo Medicado', 'Shampoo para pieles sensibles', 'petshop', 16.00, 40),
('PS-COLL', 'Collar Antipulgas', 'Protección de 8 meses', 'petshop', 28.00, 35),
-- Laboratorio
('LAB-HEMO', 'Hemograma Completo', 'Análisis de sangre completo', 'laboratorio', 55.00, NULL),
('LAB-PERF', 'Perfil Bioquímico', 'Evaluación de órganos y sistemas', 'laboratorio', 85.00, NULL),
('LAB-ORIN', 'Uroanálisis', 'Análisis de orina completo', 'laboratorio', 35.00, NULL);

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE propietarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE mascotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_consulta ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_evolucion ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacunas ENABLE ROW LEVEL SECURITY;

-- Políticas para perfiles (todos pueden leer, solo admin puede modificar)
CREATE POLICY "Perfiles visibles para usuarios autenticados" ON perfiles
    FOR SELECT TO authenticated USING (true);

-- Políticas para propietarios
CREATE POLICY "Propietarios visibles para usuarios autenticados" ON propietarios
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Propietarios insertables para usuarios autenticados" ON propietarios
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Propietarios actualizables para usuarios autenticados" ON propietarios
    FOR UPDATE TO authenticated USING (true);

-- Políticas para mascotas
CREATE POLICY "Mascotas visibles para usuarios autenticados" ON mascotas
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Mascotas insertables para usuarios autenticados" ON mascotas
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Mascotas actualizables para usuarios autenticados" ON mascotas
    FOR UPDATE TO authenticated USING (true);

-- Políticas para catálogo
CREATE POLICY "Catálogo visible para todos" ON catalogo
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Catálogo modificable por doctora y admin" ON catalogo
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('doctora', 'admin'))
    );

-- Políticas para consultas
CREATE POLICY "Consultas visibles para usuarios autenticados" ON consultas
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Consultas insertables para doctora" ON consultas
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'doctora')
    );
CREATE POLICY "Consultas actualizables para usuarios autenticados" ON consultas
    FOR UPDATE TO authenticated USING (true);

-- Políticas para detalles de consulta
CREATE POLICY "Detalles visibles para usuarios autenticados" ON detalles_consulta
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Detalles insertables para doctora" ON detalles_consulta
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'doctora')
    );

-- Políticas para fotos
CREATE POLICY "Fotos visibles para usuarios autenticados" ON fotos_evolucion
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Fotos insertables para doctora" ON fotos_evolucion
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'doctora')
    );

-- Políticas para vacunas
CREATE POLICY "Vacunas visibles para usuarios autenticados" ON vacunas
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Vacunas insertables para doctora" ON vacunas
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'doctora')
    );

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener estadísticas del dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats(fecha_consulta DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    pacientes_hoy BIGINT,
    pacientes_espera BIGINT,
    ingresos_hoy NUMERIC,
    consultas_pendientes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(DISTINCT mascota_id) FROM consultas WHERE DATE(fecha) = fecha_consulta)::BIGINT,
        (SELECT COUNT(*) FROM consultas WHERE estado = 'pendiente' AND DATE(fecha) = fecha_consulta)::BIGINT,
        (SELECT COALESCE(SUM(total), 0) FROM consultas WHERE estado = 'finalizado' AND DATE(fecha) = fecha_consulta)::NUMERIC,
        (SELECT COUNT(*) FROM consultas WHERE estado = 'pendiente')::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para buscar expedientes
CREATE OR REPLACE FUNCTION buscar_expedientes(query TEXT)
RETURNS TABLE (
    mascota_id UUID,
    mascota_nombre VARCHAR,
    mascota_especie VARCHAR,
    mascota_raza VARCHAR,
    propietario_nombre VARCHAR,
    propietario_telefono VARCHAR,
    total_consultas BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.nombre,
        m.especie,
        m.raza,
        p.nombre,
        p.telefono,
        (SELECT COUNT(*) FROM consultas WHERE mascota_id = m.id)::BIGINT
    FROM mascotas m
    JOIN propietarios p ON m.propietario_id = p.id
    WHERE 
        m.nombre ILIKE '%' || query || '%' OR
        p.nombre ILIKE '%' || query || '%' OR
        p.telefono ILIKE '%' || query || '%' OR
        m.raza ILIKE '%' || query || '%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CONFIGURACIÓN DE REALTIME (para actualizaciones en vivo)
-- =====================================================

-- Habilitar publicación para realtime
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

-- Agregar tablas a la publicación
ALTER PUBLICATION supabase_realtime ADD TABLE consultas;
ALTER PUBLICATION supabase_realtime ADD TABLE detalles_consulta;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
