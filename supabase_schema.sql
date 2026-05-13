-- =====================================================
-- 🐾 VETERINARIA KACHORRO'S - Esquema de Base de Datos
-- Base de datos: PostgreSQL (Supabase)
-- Compatible con ejecución múltiple (idempotente)
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Perfiles de usuario (extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('doctora', 'recepcion', 'admin')),
    avatar TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Propietarios de mascotas
CREATE TABLE IF NOT EXISTS propietarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mascotas (pacientes)
CREATE TABLE IF NOT EXISTS mascotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL,
    especie VARCHAR(20) NOT NULL CHECK (especie IN ('perro', 'gato', 'ave', 'conejo', 'otro')),
    raza VARCHAR(50) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo VARCHAR(10) NOT NULL CHECK (sexo IN ('macho', 'hembra')),
    color VARCHAR(50),
    peso DECIMAL(5,2),
    foto TEXT,
    propietario_id UUID NOT NULL REFERENCES propietarios(id) ON DELETE RESTRICT,
    alergias TEXT[],
    notas_especiales TEXT,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Catálogo de productos y servicios
CREATE TABLE IF NOT EXISTS catalogo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('servicio', 'vacuna', 'medicamento', 'petshop', 'laboratorio', 'peluqueria')),
    precio DECIMAL(10,2) DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consultas médicas
CREATE TABLE IF NOT EXISTS consultas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mascota_id UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    motivo VARCHAR(200) NOT NULL,
    sintomas TEXT,
    diagnostico TEXT NOT NULL,
    tratamiento TEXT,
    notas TEXT,
    observaciones_factura TEXT,
    doctora_id UUID REFERENCES perfiles(id),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_recepcion', 'pagada', 'finalizado')),
    total DECIMAL(10,2) DEFAULT 0,
    proxima_cita TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detalles de consulta (productos/servicios aplicados)
CREATE TABLE IF NOT EXISTS detalles_consulta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consulta_id UUID NOT NULL REFERENCES consultas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES catalogo(id),
    nombre_personalizado VARCHAR(100),
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_aplicado DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_aplicado) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fotos de evolución del paciente
CREATE TABLE IF NOT EXISTS fotos_evolucion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mascota_id UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    consulta_id UUID REFERENCES consultas(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registro de vacunas
CREATE TABLE IF NOT EXISTS vacunas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mascota_id UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    fecha_aplicacion DATE NOT NULL,
    dosis VARCHAR(50),
    lote VARCHAR(50),
    fecha_proxima_dosis DATE,
    consulta_id UUID REFERENCES consultas(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registro de desparasitaciones (HU-05)
CREATE TABLE IF NOT EXISTS desparasitaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mascota_id UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    tipo VARCHAR(100) NOT NULL,
    via_administracion VARCHAR(50) NOT NULL,
    fecha_aplicacion DATE NOT NULL,
    fecha_proximo_tratamiento DATE,
    consulta_id UUID REFERENCES consultas(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registro de notificaciones enviadas (HU-19, HU-20, HU-21)
CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consulta_id UUID REFERENCES consultas(id) ON DELETE SET NULL,
    mascota_id UUID REFERENCES mascotas(id) ON DELETE SET NULL,
    destinatario_email VARCHAR(100) NOT NULL,
    tipo_notificacion VARCHAR(30) NOT NULL CHECK (tipo_notificacion IN ('recordatorio', 'confirmacion', 'personalizado')),
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('enviado', 'entregado', 'fallido', 'pendiente')),
    codigo_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Servicio de hospedaje de mascotas (HU-25, HU-26)
CREATE TABLE IF NOT EXISTS hospedajes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mascota_id UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_salida_estimada DATE NOT NULL,
    fecha_salida_real DATE,
    tarifa_diaria DECIMAL(10,2) NOT NULL,
    total_cargo DECIMAL(10,2),
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'finalizado')),
    consulta_id UUID REFERENCES consultas(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TRIGGER: CREAR PERFIL AUTOMÁTICAMENTE AL REGISTRARSE
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO perfiles (id, nombre, email, rol)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'rol', 'recepcion')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_mascotas_propietario ON mascotas(propietario_id);
CREATE INDEX IF NOT EXISTS idx_mascotas_nombre ON mascotas(nombre);
CREATE INDEX IF NOT EXISTS idx_mascotas_activo ON mascotas(activo);
CREATE INDEX IF NOT EXISTS idx_consultas_mascota ON consultas(mascota_id);
CREATE INDEX IF NOT EXISTS idx_consultas_fecha ON consultas(fecha);
CREATE INDEX IF NOT EXISTS idx_consultas_estado ON consultas(estado);
CREATE INDEX IF NOT EXISTS idx_detalles_consulta ON detalles_consulta(consulta_id);
CREATE INDEX IF NOT EXISTS idx_catalogo_categoria ON catalogo(categoria);
CREATE INDEX IF NOT EXISTS idx_catalogo_activo ON catalogo(activo);
CREATE INDEX IF NOT EXISTS idx_vacunas_mascota ON vacunas(mascota_id);
CREATE INDEX IF NOT EXISTS idx_desparasitaciones_mascota ON desparasitaciones(mascota_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_estado ON notificaciones(estado);
CREATE INDEX IF NOT EXISTS idx_notificaciones_fecha ON notificaciones(fecha_envio);
CREATE INDEX IF NOT EXISTS idx_hospedajes_mascota ON hospedajes(mascota_id);
CREATE INDEX IF NOT EXISTS idx_hospedajes_estado ON hospedajes(estado);
CREATE INDEX IF NOT EXISTS idx_fotos_mascota ON fotos_evolucion(mascota_id);
CREATE INDEX IF NOT EXISTS idx_fotos_consulta ON fotos_evolucion(consulta_id);

-- =====================================================
-- FUNCIONES PARA TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR TIMESTAMPS
-- =====================================================

DROP TRIGGER IF EXISTS update_perfiles_updated_at ON perfiles;
CREATE TRIGGER update_perfiles_updated_at BEFORE UPDATE ON perfiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_propietarios_updated_at ON propietarios;
CREATE TRIGGER update_propietarios_updated_at BEFORE UPDATE ON propietarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mascotas_updated_at ON mascotas;
CREATE TRIGGER update_mascotas_updated_at BEFORE UPDATE ON mascotas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_catalogo_updated_at ON catalogo;
CREATE TRIGGER update_catalogo_updated_at BEFORE UPDATE ON catalogo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consultas_updated_at ON consultas;
CREATE TRIGGER update_consultas_updated_at BEFORE UPDATE ON consultas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hospedajes_updated_at ON hospedajes;
CREATE TRIGGER update_hospedajes_updated_at BEFORE UPDATE ON hospedajes
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

DROP TRIGGER IF EXISTS update_consulta_total_trigger ON detalles_consulta;
CREATE TRIGGER update_consulta_total_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON detalles_consulta
    FOR EACH ROW EXECUTE FUNCTION update_consulta_total();

-- =====================================================
-- TRIGGER PARA ACTUALIZAR CARGO DE HOSPEDAJE (HU-26)
-- =====================================================

CREATE OR REPLACE FUNCTION update_hospedaje_cargo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'finalizado' AND NEW.fecha_salida_real IS NOT NULL THEN
        NEW.total_cargo = (NEW.fecha_salida_real - NEW.fecha_ingreso) * NEW.tarifa_diaria;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_hospedaje_cargo_trigger ON hospedajes;
CREATE TRIGGER update_hospedaje_cargo_trigger
    BEFORE UPDATE ON hospedajes
    FOR EACH ROW
    WHEN (NEW.estado = 'finalizado' AND NEW.fecha_salida_real IS NOT NULL)
    EXECUTE FUNCTION update_hospedaje_cargo();

-- =====================================================
-- DATOS INICIALES (SEED)
-- =====================================================
-- Catálogo completo extraído de Codigo Vete.pdf
-- Secciones: CON (consultas/procedimientos), FAR (farmacia),
--            PEL (peluquería), PTS (petshop)

INSERT INTO catalogo (codigo, nombre, descripcion, categoria, precio) VALUES
('CON-0001', 'Administración de medicamentos parenteral Dosis de Ankofen', 'Administración de medicamentos parenteral Dosis de Ankofen', 'servicio', 5.50),
('CON-0002', 'Dosis de Algen LD', 'Dosis de Algen LD', 'servicio', 5.50),
('CON-0003', 'Dosis de Atriben', 'Dosis de Atriben', 'servicio', 5.50),
('CON-0004', 'Dosis de Atropina', 'Dosis de Atropina', 'servicio', 10.00),
('CON-0005', 'Dosis de Bronquivet', 'Dosis de Bronquivet', 'servicio', 5.50),
('CON-0006', 'Dosis de Cerenia', 'Dosis de Cerenia', 'servicio', 8.50),
('CON-0007', 'Dosis de Diuravet', 'Dosis de Diuravet', 'servicio', 5.50),
('CON-0008', 'Dosis de Dolfen', 'Dosis de Dolfen', 'servicio', 5.50),
('CON-0009', 'Dosis de Doramectina 1%', 'Dosis de Doramectina 1%', 'servicio', 5.50),
('CON-0010', 'Dosis de Dufamox 15%', 'Dosis de Dufamox 15%', 'servicio', 5.50),
('CON-0011', 'Dosis de Endovet', 'Dosis de Endovet', 'servicio', 5.50),
('CON-0012', 'Dosis de Estimulante Inmunologico Calox', 'Dosis de Estimulante Inmunologico Calox', 'servicio', 5.50),
('CON-0013', 'Dosis de Histamacin', 'Dosis de Histamacin', 'servicio', 5.50),
('CON-0014', 'Dosis de Imidofin', 'Dosis de Imidofin', 'servicio', 5.50),
('CON-0015', 'Dosis de MarcoWitt B12', 'Dosis de MarcoWitt B12', 'servicio', 5.50),
('CON-0016', 'Dosis de Meloxivet', 'Dosis de Meloxivet', 'servicio', 5.50),
('CON-0017', 'Dosis de Nexum', 'Dosis de Nexum', 'servicio', 5.50),
('CON-0018', 'Dosis de Pileran', 'Dosis de Pileran', 'servicio', 5.50),
('CON-0019', 'Dosis de Progesterona', 'Dosis de Progesterona', 'servicio', 5.50),
('CON-0020', 'Dosis de Quercetol Vet', 'Dosis de Quercetol Vet', 'servicio', 5.50),
('CON-0021', 'Dosis de Sertal Compuesto', 'Dosis de Sertal Compuesto', 'servicio', 5.50),
('CON-0022', 'Dosis de Sulfatrim', 'Dosis de Sulfatrim', 'servicio', 5.50),
('CON-0023', 'Dosis de Trim/Sul D', 'Dosis de Trim/Sul D', 'servicio', 5.50),
('CON-0024', 'Dosis de Vincristina', 'Dosis de Vincristina', 'servicio', 5.50),
('CON-0025', 'Dosis de Warit- B', 'Dosis de Warit- B', 'servicio', 5.50),
('CON-0026', 'Administración de sueros', 'Administración de sueros', 'servicio', 25.00),
('CON-0027', 'Amputacion de uñas Talla pequeña (1 - 10 kg)', 'Amputacion de uñas Talla pequeña (1 - 10 kg)', 'servicio', 80.00),
('CON-0028', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 100.00),
('CON-0029', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 120.00),
('CON-0030', 'Aplicación de medicamentos parenterales (Externos)', 'Aplicación de medicamentos parenterales (Externos)', 'servicio', 3.50),
('CON-0031', 'Aplicación de vacunas Vacuna contra Giardiasis canina', 'Aplicación de vacunas Vacuna contra Giardiasis canina', 'vacuna', 20.00),
('CON-0032', 'Vacuna contra la Rabia', 'Vacuna contra la Rabia', 'vacuna', 12.50),
('CON-0033', 'Vacuna contra Leucemia felina', 'Vacuna contra Leucemia felina', 'vacuna', 20.00),
('CON-0034', 'Vacuna contra Parvorisosis canina', 'Vacuna contra Parvorisosis canina', 'vacuna', 12.50),
('CON-0035', 'Vacuna contra Tos de las perreras', 'Vacuna contra Tos de las perreras', 'vacuna', 20.00),
('CON-0036', 'Vacuna Quintuple canina', 'Vacuna Quintuple canina', 'vacuna', 18.00),
('CON-0037', 'Vacuna Quintuple felina', 'Vacuna Quintuple felina', 'vacuna', 38.00),
('CON-0038', 'Vacuna Sextuple canina', 'Vacuna Sextuple canina', 'vacuna', 20.00),
('CON-0039', 'Vacuna Triple felina', 'Vacuna Triple felina', 'vacuna', 18.00),
('CON-0040', 'Cateterización urinaria Felino', 'Cateterización urinaria Felino', 'servicio', 50.00),
('CON-0041', 'Canino Talla pequeña (1 - 10 kg)', 'Canino Talla pequeña (1 - 10 kg)', 'servicio', 50.00),
('CON-0042', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 100.00),
('CON-0043', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 150.00),
('CON-0044', 'Cirugias de emergencia Eviseracion Felino', 'Cirugias de emergencia Eviseracion Felino', 'servicio', 250.00),
('CON-0045', 'Canino Talla pequeña (1 - 10 kg)', 'Canino Talla pequeña (1 - 10 kg)', 'servicio', 300.00),
('CON-0046', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 400.00),
('CON-0047', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 500.00),
('CON-0048', 'Amputacion de cola Felino', 'Amputacion de cola Felino', 'servicio', 100.00),
('CON-0049', 'Canino Talla pequeña (1 - 10 kg)', 'Canino Talla pequeña (1 - 10 kg)', 'servicio', 150.00),
('CON-0050', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 200.00),
('CON-0051', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 250.00),
('CON-0052', 'Cirugias electivas Castracion Felino', 'Cirugias electivas Castracion Felino', 'servicio', 115.00),
('CON-0053', 'Canino Talla pequeña (1 - 10 kg)', 'Canino Talla pequeña (1 - 10 kg)', 'servicio', 150.00),
('CON-0054', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 200.00),
('CON-0055', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 250.00),
('CON-0056', 'Criptorquidectomia Felino Monorquido Inguinal', 'Criptorquidectomia Felino Monorquido Inguinal', 'servicio', 150.00),
('CON-0057', 'Monorquido Abdominal', 'Monorquido Abdominal', 'servicio', 250.00),
('CON-0058', 'Criptorquido Inguinal', 'Criptorquido Inguinal', 'servicio', 200.00),
('CON-0059', 'Criptorquido Abdominal', 'Criptorquido Abdominal', 'servicio', 250.00),
('CON-0060', 'Canino Monorquido Inguinal Talla pequeña (1 - 10 kg)', 'Canino Monorquido Inguinal Talla pequeña (1 - 10 kg)', 'servicio', 200.00),
('CON-0061', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 250.00),
('CON-0062', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 300.00),
('CON-0063', 'Monorquido Abdominal Talla pequeña (1 - 10 kg)', 'Monorquido Abdominal Talla pequeña (1 - 10 kg)', 'servicio', 250.00),
('CON-0064', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 300.00),
('CON-0065', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 350.00),
('CON-0066', 'Criptorquido Inguinal Talla pequeña (1 - 10 kg)', 'Criptorquido Inguinal Talla pequeña (1 - 10 kg)', 'servicio', 250.00),
('CON-0067', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 300.00),
('CON-0068', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 350.00),
('CON-0069', 'Criptorquido Abdominal Talla pequeña (1 - 10 kg)', 'Criptorquido Abdominal Talla pequeña (1 - 10 kg)', 'servicio', 300.00),
('CON-0070', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 350.00),
('CON-0071', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 400.00),
('CON-0072', 'OVH Felino OVH Electiva', 'OVH Felino OVH Electiva', 'servicio', 200.00),
('CON-0073', 'OVH por Piometra', 'OVH por Piometra', 'servicio', 250.00),
('CON-0074', 'Canino OVH Electiva Talla pequeña (1 - 10 kg)', 'Canino OVH Electiva Talla pequeña (1 - 10 kg)', 'servicio', 250.00),
('CON-0075', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 300.00),
('CON-0076', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 400.00),
('CON-0077', 'OVH por Piometra Talla pequeña (1 - 10 kg)', 'OVH por Piometra Talla pequeña (1 - 10 kg)', 'servicio', 300.00),
('CON-0078', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 350.00),
('CON-0079', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 450.00),
('CON-0080', 'Reseccion de Tumores Felino Leve', 'Reseccion de Tumores Felino Leve', 'servicio', 100.00),
('CON-0081', 'Moderado', 'Moderado', 'servicio', 150.00),
('CON-0082', 'Grave', 'Grave', 'servicio', 200.00),
('CON-0083', 'Canino Leve Talla pequeña (1 - 10 kg)', 'Canino Leve Talla pequeña (1 - 10 kg)', 'servicio', 80.00),
('CON-0084', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 125.00),
('CON-0085', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 150.00),
('CON-0086', 'Moderada Talla pequeña (1 - 10 kg)', 'Moderada Talla pequeña (1 - 10 kg)', 'servicio', 150.00),
('CON-0087', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 200.00),
('CON-0088', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 250.00),
('CON-0089', 'Grave Talla pequeña (1 - 10 kg)', 'Grave Talla pequeña (1 - 10 kg)', 'servicio', 200.00),
('CON-0090', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 250.00),
('CON-0091', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 300.00),
('CON-0092', 'Cistotomia Felino', 'Cistotomia Felino', 'servicio', 300.00),
('CON-0093', 'Canino Talla pequeña (1 - 10 kg)', 'Canino Talla pequeña (1 - 10 kg)', 'servicio', 300.00),
('CON-0094', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 350.00),
('CON-0095', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 400.00),
('CON-0096', 'Enucleacion Felino', 'Enucleacion Felino', 'servicio', 150.00),
('CON-0097', 'Canino Talla pequeña (1 - 10 kg)', 'Canino Talla pequeña (1 - 10 kg)', 'servicio', 150.00),
('CON-0098', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 200.00),
('CON-0099', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 250.00),
('CON-0100', 'Consulta', 'Consulta', 'servicio', 15.00),
('CON-0101', 'Curaciones Leve', 'Curaciones Leve', 'servicio', 3.50),
('CON-0102', 'Moderado', 'Moderado', 'servicio', 5.00),
('CON-0103', 'Desparasitaciones Talla pequeña (1 - 10 kg)', 'Desparasitaciones Talla pequeña (1 - 10 kg)', 'servicio', 8.50),
('CON-0104', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 10.50),
('CON-0105', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 12.50),
('CON-0106', 'Dreno de abseceso Leve Felino', 'Dreno de abseceso Leve Felino', 'servicio', 80.00),
('CON-0107', 'Canino Talla pequeña (1 - 10 kg)', 'Canino Talla pequeña (1 - 10 kg)', 'servicio', 75.00),
('CON-0108', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 100.00),
('CON-0109', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 125.00),
('CON-0110', 'Moderado Felino', 'Moderado Felino', 'servicio', 125.00),
('CON-0111', 'Canino Talla pequeña (1 - 10 kg)', 'Canino Talla pequeña (1 - 10 kg)', 'servicio', 100.00),
('CON-0112', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 125.00),
('CON-0113', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 150.00),
('CON-0114', 'Enemas Felino', 'Enemas Felino', 'servicio', 50.00),
('CON-0115', 'Canino Talla pequeña (1 - 10 kg)', 'Canino Talla pequeña (1 - 10 kg)', 'servicio', 50.00),
('CON-0116', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 100.00),
('CON-0117', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 150.00),
('CON-0118', 'Eutanasia Felino', 'Eutanasia Felino', 'servicio', 50.00),
('CON-0119', 'Canino Talla pequeña (1 - 10 kg)', 'Canino Talla pequeña (1 - 10 kg)', 'servicio', 75.00),
('CON-0120', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 100.00),
('CON-0121', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 150.00),
('CON-0122', 'Hospitalizaciones', 'Hospitalizaciones', 'servicio', 25.00),
('CON-0123', 'Profilaxis dental + Medicamento Felino', 'Profilaxis dental + Medicamento Felino', 'servicio', 60.00),
('CON-0124', 'Canino Talla pequeña (1 - 10 kg)', 'Canino Talla pequeña (1 - 10 kg)', 'servicio', 60.00),
('CON-0125', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 80.00),
('CON-0126', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 100.00),
('CON-0127', 'Quimioterapia Talla pequeña (1 - 10 kg)', 'Quimioterapia Talla pequeña (1 - 10 kg)', 'servicio', 35.00),
('CON-0128', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 40.00),
('CON-0129', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 50.00),
('CON-0130', 'Retiro de puntos Sutura pequeña', 'Retiro de puntos Sutura pequeña', 'servicio', 5.00),
('CON-0131', 'Sutura grande', 'Sutura grande', 'servicio', 10.00),
('CON-0132', 'Sedaciones Felino', 'Sedaciones Felino', 'servicio', 10.00),
('CON-0133', 'Canino Talla pequeña (1 - 10 kg)', 'Canino Talla pequeña (1 - 10 kg)', 'servicio', 15.00),
('CON-0134', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 20.00),
('CON-0135', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 25.00),
('CON-0136', 'Servicios de laboratorio Coprologia General de heces', 'Servicios de laboratorio Coprologia General de heces', 'laboratorio', 12.00),
('CON-0137', 'Coprocultivo', 'Coprocultivo', 'laboratorio', 15.00),
('CON-0138', 'Hematologia Frotis + hemograma', 'Hematologia Frotis + hemograma', 'laboratorio', 20.00),
('CON-0139', 'Inmunocromatografia Kit de Sida/ Leucemia + frotis de sangre', 'Inmunocromatografia Kit de Sida/ Leucemia + frotis de sangre', 'laboratorio', 60.00),
('CON-0140', 'Kit de parvovirus', 'Kit de parvovirus', 'laboratorio', 30.00),
('CON-0141', 'Kit de moquillo', 'Kit de moquillo', 'laboratorio', 40.00),
('CON-0142', 'Perfiles Perfil Hepatico', 'Perfiles Perfil Hepatico', 'laboratorio', 45.00),
('CON-0143', 'Perfil Pre-quirurgico', 'Perfil Pre-quirurgico', 'laboratorio', 40.00),
('CON-0144', 'Perfil Renal', 'Perfil Renal', 'laboratorio', 40.00),
('CON-0145', 'Perfil Tiroideo', 'Perfil Tiroideo', 'laboratorio', 80.00),
('CON-0146', 'Perfin Diabetico', 'Perfin Diabetico', 'laboratorio', 80.00),
('CON-0147', 'Urologia General de orina', 'Urologia General de orina', 'laboratorio', 12.00),
('CON-0148', 'Urocultivo', 'Urocultivo', 'laboratorio', 15.00),
('CON-0149', 'Sutura de heridas Leve Felino', 'Sutura de heridas Leve Felino', 'servicio', 100.00),
('CON-0150', 'Canino Talla pequeña (1 - 10 kg)', 'Canino Talla pequeña (1 - 10 kg)', 'servicio', 100.00),
('CON-0151', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 150.00),
('CON-0152', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 200.00),
('CON-0153', 'Moderado Felino', 'Moderado Felino', 'servicio', 150.00),
('CON-0154', 'Canino Talla pequeña (1 - 10 kg)', 'Canino Talla pequeña (1 - 10 kg)', 'servicio', 200.00),
('CON-0155', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 250.00),
('CON-0156', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 300.00),
('CON-0157', 'Transfuciones de sangre Canino Talla pequeña (1 - 10 kg)', 'Transfuciones de sangre Canino Talla pequeña (1 - 10 kg)', 'servicio', 125.00),
('CON-0158', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 175.00),
('CON-0159', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 225.00),
('CON-0160', 'Vendaje Robert Jones Felino', 'Vendaje Robert Jones Felino', 'servicio', 100.00),
('CON-0161', 'Canino Talla pequeña (1 - 10 kg)', 'Canino Talla pequeña (1 - 10 kg)', 'servicio', 150.00),
('CON-0162', 'Talla mediana (10 - 20 kg)', 'Talla mediana (10 - 20 kg)', 'servicio', 200.00),
('CON-0163', 'Talla grande (+20 kg)', 'Talla grande (+20 kg)', 'servicio', 250.00),
('FAR-0001', 'Algen tabletas', 'Algen tabletas', 'medicamento', 1.25),
('FAR-0002', 'Amoxipet Plus 250', 'Amoxipet Plus 250', 'medicamento', NULL), -- TODO: verificar precio
('FAR-0003', 'Amoxipet Plus 500', 'Amoxipet Plus 500', 'medicamento', NULL), -- TODO: verificar precio
('FAR-0004', 'Ankofen tabletas', 'Ankofen tabletas', 'medicamento', 1.00),
('FAR-0005', 'ANXIVET Caja', 'ANXIVET Caja', 'medicamento', 30.00),
('FAR-0006', 'ANXIVET Tableta', 'ANXIVET Tableta', 'medicamento', 1.00),
('FAR-0007', 'Anxocare', 'Anxocare', 'medicamento', 14.00),
('FAR-0008', 'Apetikan', 'Apetikan', 'medicamento', 10.50),
('FAR-0009', 'Aprax Suspensión Oral', 'Aprax Suspensión Oral', 'medicamento', NULL), -- TODO: verificar precio
('FAR-0010', 'Aprax Tableta 10 kg', 'Aprax Tableta 10 kg', 'medicamento', 6.50),
('FAR-0011', 'Aprax Tableta 20 kg', 'Aprax Tableta 20 kg', 'medicamento', 7.50),
('FAR-0012', 'Artro Tabs', 'Artro Tabs', 'medicamento', 20.00),
('FAR-0013', 'Calcipet Tabs', 'Calcipet Tabs', 'medicamento', 12.00),
('FAR-0014', 'Cephapet 250', 'Cephapet 250', 'medicamento', 14.50),
('FAR-0015', 'CLOREXIVET PLUS', 'CLOREXIVET PLUS', 'medicamento', 20.00),
('FAR-0016', 'Credelio 1.3 a 2.5 kg', 'Credelio 1.3 a 2.5 kg', 'medicamento', 18.00),
('FAR-0017', 'Credelio 11 a 22 kg', 'Credelio 11 a 22 kg', 'medicamento', 21.00),
('FAR-0018', 'Credelio 2.5 a 5.5 kg', 'Credelio 2.5 a 5.5 kg', 'medicamento', 19.00),
('FAR-0019', 'Credelio 22 a 45 kg', 'Credelio 22 a 45 kg', 'medicamento', 22.00),
('FAR-0020', 'Credelio 5.5 a 11 kg', 'Credelio 5.5 a 11 kg', 'medicamento', 20.00),
('FAR-0021', 'Crema Saniderm', 'Crema Saniderm', 'medicamento', 11.00),
('FAR-0022', 'DERMATRYL JABÓN', 'DERMATRYL JABÓN', 'medicamento', 8.00),
('FAR-0023', 'DERMATRYL SHAMPOO', 'DERMATRYL SHAMPOO', 'medicamento', NULL), -- TODO: verificar precio
('FAR-0024', 'DERMATRYL SPA', 'DERMATRYL SPA', 'medicamento', 15.00),
('FAR-0025', 'Doxiciclina Calox 100 mg', 'Doxiciclina Calox 100 mg', 'medicamento', 1.00),
('FAR-0026', 'Doxiciclina Calox 50 mg', 'Doxiciclina Calox 50 mg', 'medicamento', 0.60),
('FAR-0027', 'Doximicina 200 mg', 'Doximicina 200 mg', 'medicamento', 2.00),
('FAR-0028', 'Enrocilina tabletas', 'Enrocilina tabletas', 'medicamento', 1.10),
('FAR-0029', 'Feline Full Sport 2.1 a 5 kg', 'Feline Full Sport 2.1 a 5 kg', 'medicamento', 23.00),
('FAR-0030', 'Feline Full Spot +5 kg', 'Feline Full Spot +5 kg', 'medicamento', 25.00),
('FAR-0031', 'Feline Full Spot 1 a 2 kg', 'Feline Full Spot 1 a 2 kg', 'medicamento', 18.00),
('FAR-0032', 'Ferox 1000 mg', 'Ferox 1000 mg', 'medicamento', 38.00),
('FAR-0033', 'Ferox 112.5 mg', 'Ferox 112.5 mg', 'medicamento', 32.00),
('FAR-0034', 'Ferox 1400 mg', 'Ferox 1400 mg', 'medicamento', 40.00),
('FAR-0035', 'Ferox 250 mg', 'Ferox 250 mg', 'medicamento', 34.00),
('FAR-0036', 'Ferox 500 mg', 'Ferox 500 mg', 'medicamento', 36.00),
('FAR-0037', 'Frontline Plus 40 a 60 kg', 'Frontline Plus 40 a 60 kg', 'medicamento', 27.50),
('FAR-0038', 'Garrafin', 'Garrafin', 'medicamento', 5.50),
('FAR-0039', 'Gentanazol Spray', 'Gentanazol Spray', 'medicamento', 14.50),
('FAR-0040', 'Gentayn oftalmico', 'Gentayn oftalmico', 'medicamento', 8.00),
('FAR-0041', 'HEMOFER-B12', 'HEMOFER-B12', 'medicamento', 28.00),
('FAR-0042', 'HEPATOCAN', 'HEPATOCAN', 'medicamento', 32.00),
('FAR-0043', 'HEPATOVET Caja', 'HEPATOVET Caja', 'medicamento', 18.00),
('FAR-0044', 'HEPATOVET Tableta', 'HEPATOVET Tableta', 'medicamento', 0.60),
('FAR-0045', 'Imidofin tabletas', 'Imidofin tabletas', 'medicamento', 2.00),
('FAR-0046', 'Inmunol', 'Inmunol', 'medicamento', 14.00),
('FAR-0047', 'IQ 180', 'IQ 180', 'medicamento', 0.60),
('FAR-0048', 'KANNES - Shampoo Insecticida', 'KANNES - Shampoo Insecticida', 'medicamento', 15.50),
('FAR-0049', 'KAOLIN VET', 'KAOLIN VET', 'medicamento', 5.50),
('FAR-0050', 'KirOftal AzitroKir', 'KirOftal AzitroKir', 'medicamento', 14.50),
('FAR-0051', 'KirOftal Dexa', 'KirOftal Dexa', 'medicamento', 9.50),
('FAR-0052', 'KirOftal Diclo', 'KirOftal Diclo', 'medicamento', 12.50),
('FAR-0053', 'KirOftal UngÚento', 'KirOftal UngÚento', 'medicamento', NULL), -- TODO: verificar precio
('FAR-0054', 'Lagrivet SC', 'Lagrivet SC', 'medicamento', 17.00),
('FAR-0055', 'Limpiador bucal', 'Limpiador bucal', 'medicamento', 13.50),
('FAR-0056', 'Liv. 52', 'Liv. 52', 'medicamento', 13.00),
('FAR-0057', 'Meloxivet 1 mg', 'Meloxivet 1 mg', 'medicamento', 1.25),
('FAR-0058', 'Meloxivet 2.5 mg', 'Meloxivet 2.5 mg', 'medicamento', 2.50),
('FAR-0059', 'Meloxivet 4 mg', 'Meloxivet 4 mg', 'medicamento', 3.75),
('FAR-0060', 'Micofin tabletas', 'Micofin tabletas', 'medicamento', 1.50),
('FAR-0061', 'Microflox 150', 'Microflox 150', 'medicamento', 3.75),
('FAR-0062', 'Microflox 50', 'Microflox 50', 'medicamento', 1.50),
('FAR-0063', 'MV DERVA - Shampoo Antimicótico y Antiséptico', 'MV DERVA - Shampoo Antimicótico y Antiséptico', 'medicamento', NULL), -- TODO: verificar precio
('FAR-0064', 'MV DERVA - Shampoo Antipuriginoso', 'MV DERVA - Shampoo Antipuriginoso', 'medicamento', 22.50),
('FAR-0065', 'MV DERVA - Shampoo Antiseborreico y Queratolíico', 'MV DERVA - Shampoo Antiseborreico y Queratolítico', 'medicamento', NULL), -- TODO: verificar precio
('FAR-0066', 'MV DERVA - Shampoo Piel sencible', 'MV DERVA - Shampoo Piel sencible', 'medicamento', NULL), -- TODO: verificar precio
('FAR-0067', 'Nefrotec', 'Nefrotec', 'medicamento', 15.00),
('FAR-0068', 'Neosept Spray', 'Neosept Spray', 'medicamento', 10.50),
('FAR-0069', 'Omega Tabs', 'Omega Tabs', 'medicamento', NULL), -- TODO: verificar precio
('FAR-0070', 'OMEGA Vet', 'OMEGA Vet', 'medicamento', 23.00),
('FAR-0071', 'OTIKO', 'OTIKO', 'medicamento', 14.00),
('FAR-0072', 'Pileran gotas', 'Pileran gotas', 'medicamento', 13.00),
('FAR-0073', 'Protech 1 a 4 kg', 'Protech 1 a 4 kg', 'medicamento', 18.00),
('FAR-0074', 'Protech 11 a 25 kg', 'Protech 11 a 25 kg', 'medicamento', 23.00),
('FAR-0075', 'Protech 26 a 40 kg', 'Protech 26 a 40 kg', 'medicamento', 25.00),
('FAR-0076', 'Protech 5 a 10 kg', 'Protech 5 a 10 kg', 'medicamento', 20.00),
('FAR-0077', 'PROVIOVET Capsula', 'PROVIOVET Capsula', 'medicamento', 2.00),
('FAR-0078', 'Quercetol Vet', 'Quercetol Vet', 'medicamento', NULL), -- TODO: verificar precio
('FAR-0079', 'Ranipet Oral', 'Ranipet Oral', 'medicamento', 10.50),
('FAR-0080', 'RELAY C', 'RELAY C', 'medicamento', 7.25),
('FAR-0081', 'Revolution 12% 10.1 a 20 kg - Perro', 'Revolution 12% 10.1 a 20 kg - Perro', 'medicamento', 22.00),
('FAR-0082', 'Revolution 12% 20.1 a 40 kg -Perro', 'Revolution 12% 20.1 a 40 kg -Perro', 'medicamento', 23.00),
('FAR-0083', 'Revolution 12% 5.1 a 10 kg - Perro', 'Revolution 12% 5.1 a 10 kg - Perro', 'medicamento', 20.00),
('FAR-0084', 'Revolution Plus 1.25 a 2.5 kg - Gato', 'Revolution Plus 1.25 a 2.5 kg - Gato', 'medicamento', 21.50),
('FAR-0085', 'Revolution Plus 2.5 a 5 kg - Gato', 'Revolution Plus 2.5 a 5 kg - Gato', 'medicamento', 23.00),
('FAR-0086', 'Rimadyl', 'Rimadyl', 'medicamento', 4.50),
('FAR-0087', 'Solubron 20', 'Solubron 20', 'medicamento', 2.00),
('FAR-0088', 'Stomorgyl 10', 'Stomorgyl 10', 'medicamento', NULL), -- TODO: verificar precio
('FAR-0089', 'Stomorgyl 2', 'Stomorgyl 2', 'medicamento', NULL), -- TODO: verificar precio
('FAR-0090', 'Stomorgyl 20', 'Stomorgyl 20', 'medicamento', NULL), -- TODO: verificar precio
('FAR-0091', 'TONANVIT', 'TONANVIT', 'medicamento', 14.50),
('FAR-0092', 'Total Full CG Suspensión', 'Total Full CG Suspensión', 'medicamento', 25.00),
('FAR-0093', 'URIVET', 'URIVET', 'medicamento', NULL), -- TODO: verificar precio
('FAR-0094', 'Viyo Fortalece - Gato', 'Viyo Fortalece - Gato', 'medicamento', 4.50),
('FAR-0095', 'Viyo Fortalece - Perro', 'Viyo Fortalece - Perro', 'medicamento', 4.50),
('FAR-0096', 'Viyo Recuperation - Gato', 'Viyo Recuperation - Gato', 'medicamento', 22.00),
('FAR-0097', 'Viyo Recuperation - Perro', 'Viyo Recuperation - Perro', 'medicamento', 22.00),
('PEL-0001', 'Baño Talla pequeña (1 - 10 kg) Normal', 'Baño Talla pequeña (1 - 10 kg) Normal', 'peluqueria', 10.00),
('PEL-0002', 'Medicado', 'Medicado', 'peluqueria', 12.00),
('PEL-0003', 'Talla mediana (10 - 20 kg) Normal', 'Talla mediana (10 - 20 kg) Normal', 'peluqueria', 12.00),
('PEL-0004', 'Medicado', 'Medicado', 'peluqueria', 14.00),
('PEL-0005', 'Talla grande (+20 kg) Normal', 'Talla grande (+20 kg) Normal', 'peluqueria', 15.00),
('PEL-0006', 'Medicado', 'Medicado', 'peluqueria', 18.00),
('PEL-0007', 'Baño + Deslanado Normal', 'Baño + Deslanado Normal', 'peluqueria', 25.00),
('PEL-0008', 'Medicado', 'Medicado', 'peluqueria', 30.00),
('PEL-0009', 'Baño + Limpieza Pequeño', 'Baño + Limpieza Pequeño', 'peluqueria', 13.00),
('PEL-0010', 'Mediano', 'Mediano', 'peluqueria', 15.00),
('PEL-0011', 'Grande', 'Grande', 'peluqueria', 19.00),
('PEL-0012', 'Corte + Baño Normal Talla pequeña (1 - 10 kg) Normal', 'Corte + Baño Normal Talla pequeña (1 - 10 kg) Normal', 'peluqueria', 13.00),
('PEL-0013', 'Normal Medicado', 'Normal Medicado', 'peluqueria', 13.00),
('PEL-0014', 'Nudoso leve Normal', 'Nudoso leve Normal', 'peluqueria', 15.00),
('PEL-0015', 'Nudoso leve Medicado', 'Nudoso leve Medicado', 'peluqueria', 15.00),
('PEL-0016', 'Nudoso moderado Normal', 'Nudoso moderado Normal', 'peluqueria', 18.00),
('PEL-0017', 'Nudoso moderado Medicado', 'Nudoso moderado Medicado', 'peluqueria', 18.00),
('PEL-0018', 'Nudoso grave Normal', 'Nudoso grave Normal', 'peluqueria', 20.00),
('PEL-0019', 'Nudoso grave Medicado', 'Nudoso grave Medicado', 'peluqueria', 20.00),
('PEL-0020', 'Rebajado Normal', 'Rebajado Normal', 'peluqueria', 15.00),
('PEL-0021', 'Rebajado Medicado', 'Rebajado Medicado', 'peluqueria', 15.00),
('PEL-0022', 'Normal Talla mediana (10 - 20 kg) Normal', 'Normal Talla mediana (10 - 20 kg) Normal', 'peluqueria', 15.00),
('PEL-0023', 'Normal Medicado', 'Normal Medicado', 'peluqueria', 15.00),
('PEL-0024', 'Nudoso leve Normal', 'Nudoso leve Normal', 'peluqueria', 16.00),
('PEL-0025', 'Nudoso leve Medicado', 'Nudoso leve Medicado', 'peluqueria', 16.00),
('PEL-0026', 'Nudoso moderado Normal', 'Nudoso moderado Normal', 'peluqueria', 17.00),
('PEL-0027', 'Nudoso moderado Medicado', 'Nudoso moderado Medicado', 'peluqueria', 17.00),
('PEL-0028', 'Nudoso grave Normal', 'Nudoso grave Normal', 'peluqueria', 18.00),
('PEL-0029', 'Nudoso grave Medicado', 'Nudoso grave Medicado', 'peluqueria', 18.00),
('PEL-0030', 'Rebajado Normal', 'Rebajado Normal', 'peluqueria', 18.00),
('PEL-0031', 'Rebajado Medicado', 'Rebajado Medicado', 'peluqueria', 18.00),
('PEL-0032', 'Normal Talla grande (+20 kg) Normal', 'Normal Talla grande (+20 kg) Normal', 'peluqueria', 18.00),
('PEL-0033', 'Normal Medicado', 'Normal Medicado', 'peluqueria', 18.00),
('PEL-0034', 'Nudoso leve Normal', 'Nudoso leve Normal', 'peluqueria', 20.00),
('PEL-0035', 'Nudoso leve Medicado', 'Nudoso leve Medicado', 'peluqueria', 20.00),
('PEL-0036', 'Nudoso moderado Normal', 'Nudoso moderado Normal', 'peluqueria', 22.00),
('PEL-0037', 'Nudoso moderado Medicado', 'Nudoso moderado Medicado', 'peluqueria', 22.00),
('PEL-0038', 'Nudoso grave Normal', 'Nudoso grave Normal', 'peluqueria', 25.00),
('PEL-0039', 'Nudoso grave Medicado', 'Nudoso grave Medicado', 'peluqueria', 25.00),
('PEL-0040', 'Rebajado Normal', 'Rebajado Normal', 'peluqueria', 20.00),
('PEL-0041', 'Rebajado Medicado', 'Rebajado Medicado', 'peluqueria', 20.00),
('PEL-0042', 'Corte especial + baño Normal Normal', 'Corte especial + baño Normal Normal', 'peluqueria', 15.00),
('PEL-0043', 'Normal Medicado', 'Normal Medicado', 'peluqueria', 15.00),
('PEL-0044', 'Nudoso Normal', 'Nudoso Normal', 'peluqueria', 18.00),
('PEL-0045', 'Nudoso Medicado', 'Nudoso Medicado', 'peluqueria', 18.00),
('PEL-0046', 'Corte de uñas Pequeño', 'Corte de uñas Pequeño', 'peluqueria', 5.00),
('PEL-0047', 'Mediano', 'Mediano', 'peluqueria', 8.00),
('PEL-0048', 'Grande', 'Grande', 'peluqueria', 10.00),
('PTS-0001', 'Advance Neo Clean/Lavanda - 4.15 kg', 'Advance Neo Clean/Lavanda - 4.15 kg', 'petshop', 6.00),
('PTS-0002', 'Advance Neo Clean/Sin aroma - 4.15 kg', 'Advance Neo Clean/Sin aroma - 4.15 kg', 'petshop', 5.50),
('PTS-0003', 'Advance Urinary Gato - 1.5 kg', 'Advance Urinary Gato - 1.5 kg', 'petshop', 24.50),
('PTS-0004', 'Arnes Azul Talla L', 'Arnes Azul Talla L', 'petshop', 6.00),
('PTS-0005', 'Arnes Gris Talla L', 'Arnes Gris Talla L', 'petshop', 6.00),
('PTS-0006', 'Arnes Talla L - Variedad', 'Arnes Talla L - Variedad', 'petshop', 6.50),
('PTS-0007', 'Arnes Talla M - Traje', 'Arnes Talla M - Traje', 'petshop', 7.50),
('PTS-0008', 'Arnes Talla M - Variedad', 'Arnes Talla M - Variedad', 'petshop', 6.00),
('PTS-0009', 'Arnes Talla S - Traje', 'Arnes Talla S - Traje', 'petshop', 6.50),
('PTS-0010', 'Bolsa de juguete de lazo', 'Bolsa de juguete de lazo', 'petshop', 5.00),
('PTS-0011', 'Bozal Azul Talla S - Tela', 'Bozal Azul Talla S - Tela', 'petshop', 4.50),
('PTS-0012', 'Bozal Negro Talla M - Tela', 'Bozal Negro Talla M - Tela', 'petshop', 5.00),
('PTS-0013', 'Cadena de Ahorque', 'Cadena de Ahorque', 'petshop', 12.00),
('PTS-0014', 'Cama para mascotas - Talla M', 'Cama para mascotas - Talla M', 'petshop', 16.50),
('PTS-0015', 'Cepillo de silicon / Variedad', 'Cepillo de silicon / Variedad', 'petshop', 3.00),
('PTS-0016', 'Cepillo Ovalado - gris mediano', 'Cepillo Ovalado - gris mediano', 'petshop', 12.00),
('PTS-0017', 'Cepillo Ovalado - gris pequeño', 'Cepillo Ovalado - gris pequeño', 'petshop', 10.00),
('PTS-0018', 'Cepillo Ovalado - Variedad', 'Cepillo Ovalado - Variedad', 'petshop', 3.50),
('PTS-0019', 'Cepillo Rectangular - Variedad', 'Cepillo Rectangular - Variedad', 'petshop', 3.50),
('PTS-0020', 'Collar Isabelino - Talla 0', 'Collar Isabelino - Talla 0', 'petshop', NULL), -- TODO: verificar precio
('PTS-0021', 'Collar Isabelino - Talla 1', 'Collar Isabelino - Talla 1', 'petshop', NULL), -- TODO: verificar precio
('PTS-0022', 'Collar Isabelino - Talla 2', 'Collar Isabelino - Talla 2', 'petshop', NULL), -- TODO: verificar precio
('PTS-0023', 'Collar Isabelino - Talla 3', 'Collar Isabelino - Talla 3', 'petshop', NULL), -- TODO: verificar precio
('PTS-0024', 'Collar Isabelino - Talla 4', 'Collar Isabelino - Talla 4', 'petshop', NULL), -- TODO: verificar precio
('PTS-0025', 'Collar Isabelino - Talla 5', 'Collar Isabelino - Talla 5', 'petshop', NULL), -- TODO: verificar precio
('PTS-0026', 'Collar Isabelino - Talla 6', 'Collar Isabelino - Talla 6', 'petshop', NULL), -- TODO: verificar precio
('PTS-0027', 'Collar Isabelino - Talla 7', 'Collar Isabelino - Talla 7', 'petshop', NULL), -- TODO: verificar precio
('PTS-0028', 'Collar Luz led - Variedad', 'Collar Luz led - Variedad', 'petshop', 13.50),
('PTS-0029', 'Collar reflectivo - Variedad', 'Collar reflectivo - Variedad', 'petshop', 4.00),
('PTS-0030', 'Correa + collar Talla M Neon', 'Correa + collar Talla M Neon', 'petshop', 6.50),
('PTS-0031', 'Correa Luz led / Variedad', 'Correa Luz led / Variedad', 'petshop', 6.00),
('PTS-0032', 'Correas - Variedad', 'Correas - Variedad', 'petshop', 7.50),
('PTS-0033', 'Dona Talla S', 'Dona Talla S', 'petshop', 15.00),
('PTS-0034', 'Guantes para cepillar - Variedad', 'Guantes para cepillar - Variedad', 'petshop', 2.50),
('PTS-0035', 'Hills Adult 1 a 6 Small Bites Perro - 4.4 lbs', 'Hills Adult 1 a 6 Small Bites Perro - 4.4 lbs', 'petshop', 25.00),
('PTS-0036', 'Hills Adult 1-6 Gato - 4 lbs', 'Hills Adult 1-6 Gato - 4 lbs', 'petshop', 25.00),
('PTS-0037', 'Hills Adult 1-6 Perro - 6.6 lbs', 'Hills Adult 1-6 Perro - 6.6 lbs', 'petshop', 31.50),
('PTS-0038', 'Hills Adult 7+ Perro - 6.6 lbs', 'Hills Adult 7+ Perro - 6.6 lbs', 'petshop', 40.00),
('PTS-0039', 'Hills Kitten Gato - 3.5 lbs', 'Hills Kitten Gato - 3.5 lbs', 'petshop', 25.00),
('PTS-0040', 'Hills Multibenefit W/D Gato - 4 lbs', 'Hills Multibenefit W/D Gato - 4 lbs', 'petshop', 32.50),
('PTS-0041', 'Hills Puppy Small Bites Perro - 4.5 lbs', 'Hills Puppy Small Bites Perro - 4.5 lbs', 'petshop', 25.00),
('PTS-0042', 'Hills Urinary Care C/D Gato - 4 lbs', 'Hills Urinary Care C/D Gato - 4 lbs', 'petshop', 32.50),
('PTS-0043', 'Hills Urinary Care C/D Perro 3.3 lbs', 'Hills Urinary Care C/D Perro 3.3 lbs', 'petshop', 25.00),
('PTS-0044', 'Hills Weight Loss R/D Gato - 4 lbs', 'Hills Weight Loss R/D Gato - 4 lbs', 'petshop', 32.00),
('PTS-0045', 'Hills Weight Loss R/D Perro 8.5 lbs', 'Hills Weight Loss R/D Perro 8.5 lbs', 'petshop', 51.00),
('PTS-0046', 'Hueso de Goma - Variedad', 'Hueso de Goma - Variedad', 'petshop', 1.00),
('PTS-0047', 'Juguete de lazo unidad - Variedad', 'Juguete de lazo unidad - Variedad', 'petshop', 1.00),
('PTS-0048', 'Lata Grande Hills Digestive Care I/D Perro', 'Lata Grande Hills Digestive Care I/D Perro', 'petshop', 8.00),
('PTS-0049', 'Lata Hills ONC Care Gata', 'Lata Hills ONC Care Gata', 'petshop', 3.75),
('PTS-0050', 'Lata pequema Hills Digestive Care I/D Gato', 'Lata pequeña Hills Digestive Care I/D Gato', 'petshop', 6.00),
('PTS-0051', 'Lata peque a Hills Digestive Care I/D Perro', 'Lata pequeña Hills Digestive Care I/D Perro', 'petshop', 6.00),
('PTS-0052', 'Lata peque a Hills Urgent Care A/D Perro-Gato', 'Lata pequeña Hills Urgent Care A/D Perro-Gato', 'petshop', 6.00),
('PTS-0053', 'Mochila para mascota - Grande', 'Mochila para mascota - Grande', 'petshop', 22.00),
('PTS-0054', 'Mochila para mascota - Medina', 'Mochila para mascota - Medina', 'petshop', 20.00),
('PTS-0055', 'Mochila para mascota - Pequeña', 'Mochila para mascota - Pequeña', 'petshop', 18.00),
('PTS-0056', 'Naill Clippers for cats', 'Naill Clippers for cats', 'petshop', 13.50),
('PTS-0057', 'Naill Clippers small dog', 'Naill Clippers small dog', 'petshop', 15.00),
('PTS-0058', 'Pechera + Correa smoking anaranjado', 'Pechera + Correa smoking anaranjado', 'petshop', 7.25),
('PTS-0059', 'Pechera + Correa tipo jeans mediana', 'Pechera + Correa tipo jeans mediana', 'petshop', 6.50),
('PTS-0060', 'Pechera + Correa tipo jeans pequeña', 'Pechera + Correa tipo jeans pequeña', 'petshop', 5.00),
('PTS-0061', 'Pelota de Goma / Grande - Variedad', 'Pelota de Goma / Grande - Variedad', 'petshop', 2.00),
('PTS-0062', 'Pelota de Goma / Mediana - Variedad', 'Pelota de Goma / Mediana - Variedad', 'petshop', 1.50),
('PTS-0063', 'Pelota de Goma / Pequeña - Variedad', 'Pelota de Goma / Pequeña - Variedad', 'petshop', 1.00),
('PTS-0064', 'Peluche de vaca - Variedad', 'Peluche de vaca - Variedad', 'petshop', 3.50),
('PTS-0065', 'Plato de Aluminio', 'Plato de Aluminio', 'petshop', 2.50),
('PTS-0066', 'Plato entrenador - Variado', 'Plato entrenador - Variado', 'petshop', 5.00),
('PTS-0067', 'Platos Plegables', 'Platos Plegables', 'petshop', 3.50),
('PTS-0068', 'Pollo Grande', 'Pollo Grande', 'petshop', 3.75),
('PTS-0069', 'Pollo Mediano', 'Pollo Mediano', 'petshop', 2.75),
('PTS-0070', 'Pollo pequeño', 'Pollo pequeño', 'petshop', 1.75),
('PTS-0071', 'Poop Bags - Ecofriendly Caja', 'Poop Bags - Ecofriendly Caja', 'petshop', 5.00),
('PTS-0072', 'Poop Bags - Ecofriendly Unidad', 'Poop Bags - Ecofriendly Unidad', 'petshop', 1.00),
('PTS-0073', 'Purina Proplan Raza Pequeña Puppy Perro - 1 kg', 'Purina Proplan Raza Pequea Puppy Perro - 1 kg', 'petshop', 13.00),
('PTS-0074', 'Set de cepillos', 'Set de cepillos', 'petshop', 20.00),
('PTS-0075', 'Small Naill Clippers', 'Small Naill Clippers', 'petshop', 17.50),
('PTS-0076', 'Sobre Purina Porplan Gato Adulto Urinary - Pollo en salsa', 'Sobre Purina Porplan Gato Adulto Urinary - Pollo en salsa', 'petshop', 1.75),
('PTS-0077', 'Sobre Purina Proplan Adult- Carne en salsa', 'Sobre Purina Proplan Adult- Carne en salsa', 'petshop', 1.75),
('PTS-0078', 'Sobre Purina Proplan Gato Adulto - Salmon en salsa', 'Sobre Purina Proplan Gato Adulto - Salmon en salsa', 'petshop', 1.75),
('PTS-0079', 'Sobre Purina Proplan Puppy - Pollo en salsa', 'Sobre Purina Proplan Puppy - Pollo en salsa', 'petshop', 1.75),
('PTS-0080', 'Sueter Talla XL - Variedad', 'Sueter Talla XL - Variedad', 'petshop', 6.00),
('PTS-0081', 'Touch Light / Variedad', 'Touch Light / Variedad', 'petshop', 12.00)
ON CONFLICT (codigo) DO NOTHING;

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
ALTER TABLE desparasitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospedajes ENABLE ROW LEVEL SECURITY;

-- Perfiles
DROP POLICY IF EXISTS "Perfiles visibles para usuarios autenticados" ON perfiles;
CREATE POLICY "Perfiles visibles para usuarios autenticados" ON perfiles
    FOR SELECT TO authenticated USING (true);

-- Propietarios
DROP POLICY IF EXISTS "Propietarios visibles para usuarios autenticados" ON propietarios;
CREATE POLICY "Propietarios visibles para usuarios autenticados" ON propietarios
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Propietarios insertables para usuarios autenticados" ON propietarios;
CREATE POLICY "Propietarios insertables para usuarios autenticados" ON propietarios
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Propietarios actualizables para usuarios autenticados" ON propietarios;
CREATE POLICY "Propietarios actualizables para usuarios autenticados" ON propietarios
    FOR UPDATE TO authenticated USING (true);

-- Mascotas
DROP POLICY IF EXISTS "Mascotas visibles para usuarios autenticados" ON mascotas;
CREATE POLICY "Mascotas visibles para usuarios autenticados" ON mascotas
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Mascotas insertables para usuarios autenticados" ON mascotas;
CREATE POLICY "Mascotas insertables para usuarios autenticados" ON mascotas
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Mascotas actualizables para usuarios autenticados" ON mascotas;
CREATE POLICY "Mascotas actualizables para usuarios autenticados" ON mascotas
    FOR UPDATE TO authenticated USING (true);

-- Catálogo
DROP POLICY IF EXISTS "Catálogo visible para todos" ON catalogo;
CREATE POLICY "Catálogo visible para todos" ON catalogo
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Catálogo modificable por doctora y admin" ON catalogo;
CREATE POLICY "Catálogo modificable por doctora y admin" ON catalogo
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('doctora', 'admin'))
    );

-- Consultas
DROP POLICY IF EXISTS "Consultas visibles para usuarios autenticados" ON consultas;
CREATE POLICY "Consultas visibles para usuarios autenticados" ON consultas
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Consultas insertables para doctora" ON consultas;
CREATE POLICY "Consultas insertables para doctora" ON consultas
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'doctora')
    );

DROP POLICY IF EXISTS "Consultas actualizables para usuarios autenticados" ON consultas;
CREATE POLICY "Consultas actualizables para usuarios autenticados" ON consultas
    FOR UPDATE TO authenticated USING (true);

-- Detalles de consulta
DROP POLICY IF EXISTS "Detalles visibles para usuarios autenticados" ON detalles_consulta;
CREATE POLICY "Detalles visibles para usuarios autenticados" ON detalles_consulta
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Detalles insertables para doctora" ON detalles_consulta;
CREATE POLICY "Detalles insertables para doctora" ON detalles_consulta
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'doctora')
    );

-- Fotos
DROP POLICY IF EXISTS "Fotos visibles para usuarios autenticados" ON fotos_evolucion;
CREATE POLICY "Fotos visibles para usuarios autenticados" ON fotos_evolucion
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Fotos insertables para doctora" ON fotos_evolucion;
CREATE POLICY "Fotos insertables para doctora" ON fotos_evolucion
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'doctora')
    );

-- Vacunas
DROP POLICY IF EXISTS "Vacunas visibles para usuarios autenticados" ON vacunas;
CREATE POLICY "Vacunas visibles para usuarios autenticados" ON vacunas
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Vacunas insertables para doctora" ON vacunas;
CREATE POLICY "Vacunas insertables para doctora" ON vacunas
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'doctora')
    );

-- Desparasitaciones
DROP POLICY IF EXISTS "Desparasitaciones visibles para usuarios autenticados" ON desparasitaciones;
CREATE POLICY "Desparasitaciones visibles para usuarios autenticados" ON desparasitaciones
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Desparasitaciones insertables para doctora" ON desparasitaciones;
CREATE POLICY "Desparasitaciones insertables para doctora" ON desparasitaciones
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'doctora')
    );

-- Notificaciones
DROP POLICY IF EXISTS "Notificaciones visibles para admin y doctora" ON notificaciones;
CREATE POLICY "Notificaciones visibles para admin y doctora" ON notificaciones
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('admin', 'doctora'))
    );

DROP POLICY IF EXISTS "Notificaciones insertables por el sistema" ON notificaciones;
CREATE POLICY "Notificaciones insertables por el sistema" ON notificaciones
    FOR INSERT TO authenticated WITH CHECK (true);

-- Hospedajes
DROP POLICY IF EXISTS "Hospedajes visibles para usuarios autenticados" ON hospedajes;
CREATE POLICY "Hospedajes visibles para usuarios autenticados" ON hospedajes
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Hospedajes insertables para usuarios autenticados" ON hospedajes;
CREATE POLICY "Hospedajes insertables para usuarios autenticados" ON hospedajes
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Hospedajes actualizables para usuarios autenticados" ON hospedajes;
CREATE POLICY "Hospedajes actualizables para usuarios autenticados" ON hospedajes
    FOR UPDATE TO authenticated USING (true);

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
        (SELECT COALESCE(SUM(total), 0) FROM consultas WHERE estado = 'pagada' AND DATE(fecha) = fecha_consulta)::NUMERIC,
        (SELECT COUNT(*) FROM consultas WHERE estado IN ('pendiente', 'en_recepcion'))::BIGINT;
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
        m.activo = true AND (
            m.nombre ILIKE '%' || query || '%' OR
            p.nombre ILIKE '%' || query || '%' OR
            p.telefono ILIKE '%' || query || '%' OR
            m.raza ILIKE '%' || query || '%'
        )
    ORDER BY m.nombre;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener historial completo de una mascota para PDF (HU-09)
CREATE OR REPLACE FUNCTION get_historial_completo(p_mascota_id UUID)
RETURNS TABLE (
    mascota_nombre VARCHAR,
    mascota_especie VARCHAR,
    mascota_raza VARCHAR,
    mascota_sexo VARCHAR,
    mascota_fecha_nacimiento DATE,
    propietario_nombre VARCHAR,
    propietario_telefono VARCHAR,
    propietario_email VARCHAR,
    propietario_direccion TEXT,
    total_consultas BIGINT,
    ultima_consulta_fecha TIMESTAMP WITH TIME ZONE,
    vacunas_info JSON,
    desparasitaciones_info JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.nombre,
        m.especie,
        m.raza,
        m.sexo,
        m.fecha_nacimiento,
        p.nombre,
        p.telefono,
        p.email,
        p.direccion,
        (SELECT COUNT(*) FROM consultas WHERE mascota_id = m.id)::BIGINT,
        (SELECT MAX(fecha) FROM consultas WHERE mascota_id = m.id),
        (SELECT COALESCE(json_agg(json_build_object('nombre', v.nombre, 'fecha', v.fecha_aplicacion, 'proxima_dosis', v.fecha_proxima_dosis)), '[]'::json) 
         FROM vacunas v WHERE v.mascota_id = m.id),
        (SELECT COALESCE(json_agg(json_build_object('tipo', d.tipo, 'fecha', d.fecha_aplicacion, 'proximo_tratamiento', d.fecha_proximo_tratamiento)), '[]'::json) 
         FROM desparasitaciones d WHERE d.mascota_id = m.id)
    FROM mascotas m
    JOIN propietarios p ON m.propietario_id = p.id
    WHERE m.id = p_mascota_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener reporte de atenciones por rango de fechas (HU-23)
CREATE OR REPLACE FUNCTION get_reporte_atenciones(p_fecha_inicio DATE, p_fecha_fin DATE)
RETURNS TABLE (
    fecha DATE,
    total_atenciones BIGINT,
    total_ingresos NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(c.fecha),
        COUNT(DISTINCT c.id)::BIGINT,
        COALESCE(SUM(c.total), 0)::NUMERIC
    FROM consultas c
    WHERE DATE(c.fecha) BETWEEN p_fecha_inicio AND p_fecha_fin
        AND c.estado = 'finalizado'
    GROUP BY DATE(c.fecha)
    ORDER BY DATE(c.fecha);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener citas del día para dashboard (HU-22)
CREATE OR REPLACE FUNCTION get_citas_dia(p_fecha DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    consulta_id UUID,
    mascota_nombre VARCHAR,
    mascota_especie VARCHAR,
    propietario_nombre VARCHAR,
    hora_programada TIMESTAMP WITH TIME ZONE,
    tipo_atencion VARCHAR,
    estado VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        m.nombre,
        m.especie,
        p.nombre,
        c.fecha,
        c.motivo,
        c.estado
    FROM consultas c
    JOIN mascotas m ON c.mascota_id = m.id
    JOIN propietarios p ON m.propietario_id = p.id
    WHERE DATE(c.fecha) = p_fecha
    ORDER BY c.fecha;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CONFIGURACIÓN DE REALTIME (para actualizaciones en vivo)
-- =====================================================

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE consultas;
ALTER PUBLICATION supabase_realtime ADD TABLE detalles_consulta;
ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE hospedajes;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
