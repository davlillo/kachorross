-- =====================================================
-- 🐾 VETERINARIA KACHORRO'S - Esquema para Power Designer
-- Diseñado para ingeniería inversa en Power Designer
-- =====================================================

-- Extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: perfiles
-- Descripción: Usuarios del sistema (extiende auth.users)
-- Sprint 1 / HU-27, HU-28, HU-29
-- =====================================================
CREATE TABLE perfiles (
    id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    avatar TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT pk_perfiles PRIMARY KEY (id),
    CONSTRAINT uq_perfiles_email UNIQUE (email),
    CONSTRAINT ck_perfiles_rol CHECK (rol IN ('doctora', 'recepcion', 'admin'))
);

COMMENT ON TABLE perfiles IS 'Perfiles de usuario del sistema. Se crean automáticamente al registrarse en Supabase Auth.';
COMMENT ON COLUMN perfiles.id IS 'UUID del usuario en auth.users de Supabase';
COMMENT ON COLUMN perfiles.rol IS 'Rol del usuario: doctora, recepcion o admin';
COMMENT ON COLUMN perfiles.activo IS 'Indica si la cuenta está activa o desactivada';

-- =====================================================
-- TABLA: propietarios
-- Descripción: Dueños de mascotas
-- Sprint 1-2 / HU-01, HU-06
-- =====================================================
CREATE TABLE propietarios (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT pk_propietarios PRIMARY KEY (id)
);

COMMENT ON TABLE propietarios IS 'Propietarios/ dueños de las mascotas. Una persona puede tener varias mascotas.';
COMMENT ON COLUMN propietarios.email IS 'Correo para enviar notificaciones y recordatorios';

-- =====================================================
-- TABLA: mascotas
-- Descripción: Pacientes de la veterinaria
-- Sprint 1-2 / HU-01, HU-02, HU-03
-- =====================================================
CREATE TABLE mascotas (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL,
    especie VARCHAR(20) NOT NULL,
    raza VARCHAR(50) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo VARCHAR(10) NOT NULL,
    color VARCHAR(50),
    peso DECIMAL(5,2),
    foto TEXT,
    propietario_id UUID NOT NULL,
    alergias TEXT[],
    notas_especiales TEXT,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT pk_mascotas PRIMARY KEY (id),
    CONSTRAINT fk_mascotas_propietario FOREIGN KEY (propietario_id)
        REFERENCES propietarios(id) ON DELETE RESTRICT,
    CONSTRAINT ck_mascotas_especie CHECK (especie IN ('perro', 'gato', 'ave', 'conejo', 'otro')),
    CONSTRAINT ck_mascotas_sexo CHECK (sexo IN ('macho', 'hembra'))
);

COMMENT ON TABLE mascotas IS 'Mascotas/pacientes registrados en la clínica.';
COMMENT ON COLUMN mascotas.propietario_id IS 'Relación N:1 con propietarios. ON DELETE RESTRICT evita borrar dueño con mascotas activas.';
COMMENT ON COLUMN mascotas.activo IS 'Soft-delete: false si la mascota ya no asiste a la clínica';
COMMENT ON COLUMN mascotas.alergias IS 'Arreglo de texto con alergias conocidas';

-- =====================================================
-- TABLA: catalogo
-- Descripción: Catálogo de productos y servicios
-- Sprint 1-3 / HU-10, HU-16, HU-17
-- =====================================================
CREATE TABLE catalogo (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(20) NOT NULL,
    precio DECIMAL(10,2) DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT pk_catalogo PRIMARY KEY (id),
    CONSTRAINT uq_catalogo_codigo UNIQUE (codigo),
    CONSTRAINT ck_catalogo_categoria CHECK (categoria IN ('servicio', 'vacuna', 'medicamento', 'petshop', 'laboratorio', 'peluqueria'))
);

COMMENT ON TABLE catalogo IS 'Catálogo completo de servicios, vacunas, medicamentos, petshop y peluquería.';
COMMENT ON COLUMN catalogo.codigo IS 'Código único del item (ej: CON-0100, FAR-0004, PEL-0001, PTS-0001)';
COMMENT ON COLUMN catalogo.activo IS 'Soft-delete: false si el item está dado de baja';
COMMENT ON COLUMN catalogo.precio IS 'Precio unitario. NULL si el precio no está definido aún.';

-- =====================================================
-- TABLA: consultas
-- Descripción: Consultas médicas realizadas
-- Sprint 1-3 / HU-11, HU-13, HU-14, HU-15, HU-18
-- =====================================================
CREATE TABLE consultas (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    mascota_id UUID NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    motivo VARCHAR(200) NOT NULL,
    sintomas TEXT,
    diagnostico TEXT NOT NULL,
    tratamiento TEXT,
    notas TEXT,
    observaciones_factura TEXT,
    doctora_id UUID,
    estado VARCHAR(20) DEFAULT 'pendiente',
    total DECIMAL(10,2) DEFAULT 0,
    proxima_cita TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT pk_consultas PRIMARY KEY (id),
    CONSTRAINT fk_consultas_mascota FOREIGN KEY (mascota_id)
        REFERENCES mascotas(id) ON DELETE CASCADE,
    CONSTRAINT fk_consultas_doctora FOREIGN KEY (doctora_id)
        REFERENCES perfiles(id),
    CONSTRAINT ck_consultas_estado CHECK (estado IN ('pendiente', 'en_recepcion', 'pagada', 'finalizado'))
);

COMMENT ON TABLE consultas IS 'Registro de cada consulta médica realizada a una mascota.';
COMMENT ON COLUMN consultas.mascota_id IS 'Relación N:1 con mascotas. ON DELETE CASCADE: al borrar mascota se borran sus consultas.';
COMMENT ON COLUMN consultas.doctora_id IS 'Relación N:1 con perfiles (la doctora que atendió)';
COMMENT ON COLUMN consultas.estado IS 'Estado del flujo: pendiente → en_recepcion → pagada → finalizado';
COMMENT ON COLUMN consultas.total IS 'Total calculado automáticamente por trigger desde detalles_consulta';
COMMENT ON COLUMN consultas.proxima_cita IS 'Fecha y hora de la próxima cita de seguimiento (HU-18)';

-- =====================================================
-- TABLA: detalles_consulta
-- Descripción: Items facturados en cada consulta
-- Sprint 1-3 / HU-11, HU-12
-- =====================================================
CREATE TABLE detalles_consulta (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    consulta_id UUID NOT NULL,
    producto_id UUID,
    nombre_personalizado VARCHAR(100),
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_aplicado DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_aplicado) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT pk_detalles_consulta PRIMARY KEY (id),
    CONSTRAINT fk_detalles_consulta FOREIGN KEY (consulta_id)
        REFERENCES consultas(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalles_producto FOREIGN KEY (producto_id)
        REFERENCES catalogo(id)
);

COMMENT ON TABLE detalles_consulta IS 'Line items de cada consulta: productos/servicios aplicados.';
COMMENT ON COLUMN detalles_consulta.producto_id IS 'Nullable para permitir items no catalogados (HU-12)';
COMMENT ON COLUMN detalles_consulta.nombre_personalizado IS 'Nombre del item cuando no está en catálogo (HU-12)';
COMMENT ON COLUMN detalles_consulta.subtotal IS 'Calculado automáticamente: cantidad × precio_aplicado';
COMMENT ON COLUMN detalles_consulta.precio_aplicado IS 'Precio al momento de la consulta (puede diferir del precio actual del catálogo)';

-- =====================================================
-- TABLA: fotos_evolucion
-- Descripción: Fotografías del historial clínico
-- Sprint 2-3 / HU-07, HU-08
-- =====================================================
CREATE TABLE fotos_evolucion (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    mascota_id UUID NOT NULL,
    consulta_id UUID,
    url TEXT NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT pk_fotos_evolucion PRIMARY KEY (id),
    CONSTRAINT fk_fotos_mascota FOREIGN KEY (mascota_id)
        REFERENCES mascotas(id) ON DELETE CASCADE,
    CONSTRAINT fk_fotos_consulta FOREIGN KEY (consulta_id)
        REFERENCES consultas(id) ON DELETE SET NULL
);

COMMENT ON TABLE fotos_evolucion IS 'Fotografías asociadas a la evolución de una mascota.';
COMMENT ON COLUMN fotos_evolucion.consulta_id IS 'Nullable: al borrar la consulta, las fotos no se pierden (SET NULL)';

-- =====================================================
-- TABLA: vacunas
-- Descripción: Registro de vacunas aplicadas
-- Sprint 2 / HU-04
-- =====================================================
CREATE TABLE vacunas (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    mascota_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    fecha_aplicacion DATE NOT NULL,
    dosis VARCHAR(50),
    lote VARCHAR(50),
    fecha_proxima_dosis DATE,
    consulta_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT pk_vacunas PRIMARY KEY (id),
    CONSTRAINT fk_vacunas_mascota FOREIGN KEY (mascota_id)
        REFERENCES mascotas(id) ON DELETE CASCADE,
    CONSTRAINT fk_vacunas_consulta FOREIGN KEY (consulta_id)
        REFERENCES consultas(id) ON DELETE SET NULL
);

COMMENT ON TABLE vacunas IS 'Vacunas aplicadas a cada mascota.';
COMMENT ON COLUMN vacunas.fecha_proxima_dosis IS 'Fecha del próximo refuerzo para generar alertas';
COMMENT ON COLUMN vacunas.consulta_id IS 'Consulta donde se aplicó la vacuna. SET NULL si se borra la consulta.';

-- =====================================================
-- TABLA: desparasitaciones
-- Descripción: Tratamientos de desparasitación
-- Sprint 2 / HU-05
-- =====================================================
CREATE TABLE desparasitaciones (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    mascota_id UUID NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    via_administracion VARCHAR(50) NOT NULL,
    fecha_aplicacion DATE NOT NULL,
    fecha_proximo_tratamiento DATE,
    consulta_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT pk_desparasitaciones PRIMARY KEY (id),
    CONSTRAINT fk_desparasitaciones_mascota FOREIGN KEY (mascota_id)
        REFERENCES mascotas(id) ON DELETE CASCADE,
    CONSTRAINT fk_desparasitaciones_consulta FOREIGN KEY (consulta_id)
        REFERENCES consultas(id) ON DELETE SET NULL
);

COMMENT ON TABLE desparasitaciones IS 'Tratamientos de desparasitación aplicados. Tabla separada de vacunas porque los campos difieren.';
COMMENT ON COLUMN desparasitaciones.fecha_proximo_tratamiento IS 'Fecha del próximo tratamiento para generar alertas';

-- =====================================================
-- TABLA: notificaciones
-- Descripción: Bitácora de notificaciones enviadas
-- Sprint 2 / HU-19, HU-20, HU-21
-- =====================================================
CREATE TABLE notificaciones (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    consulta_id UUID,
    mascota_id UUID,
    destinatario_email VARCHAR(100) NOT NULL,
    tipo_notificacion VARCHAR(30) NOT NULL,
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(20) NOT NULL,
    codigo_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT pk_notificaciones PRIMARY KEY (id),
    CONSTRAINT fk_notificaciones_consulta FOREIGN KEY (consulta_id)
        REFERENCES consultas(id) ON DELETE SET NULL,
    CONSTRAINT fk_notificaciones_mascota FOREIGN KEY (mascota_id)
        REFERENCES mascotas(id) ON DELETE SET NULL,
    CONSTRAINT ck_notificaciones_tipo CHECK (tipo_notificacion IN ('recordatorio', 'confirmacion', 'personalizado')),
    CONSTRAINT ck_notificaciones_estado CHECK (estado IN ('enviado', 'entregado', 'fallido', 'pendiente'))
);

COMMENT ON TABLE notificaciones IS 'Registro de todos los correos electrónicos enviados por el sistema.';
COMMENT ON COLUMN notificaciones.tipo_notificacion IS 'Tipo: recordatorio de cita, confirmación o personalizado';
COMMENT ON COLUMN notificaciones.estado IS 'Estado del envío: enviado, entregado, fallido o pendiente';
COMMENT ON COLUMN notificaciones.codigo_error IS 'Código de error devuelto por Resend en caso de fallo';

-- =====================================================
-- TABLA: hospedajes
-- Descripción: Servicio de hospedaje de mascotas
-- Sprint 3 / HU-25, HU-26
-- =====================================================
CREATE TABLE hospedajes (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    mascota_id UUID NOT NULL,
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_salida_estimada DATE NOT NULL,
    fecha_salida_real DATE,
    tarifa_diaria DECIMAL(10,2) NOT NULL,
    total_cargo DECIMAL(10,2),
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'activo',
    consulta_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT pk_hospedajes PRIMARY KEY (id),
    CONSTRAINT fk_hospedajes_mascota FOREIGN KEY (mascota_id)
        REFERENCES mascotas(id) ON DELETE CASCADE,
    CONSTRAINT fk_hospedajes_consulta FOREIGN KEY (consulta_id)
        REFERENCES consultas(id) ON DELETE SET NULL,
    CONSTRAINT ck_hospedajes_estado CHECK (estado IN ('activo', 'finalizado'))
);

COMMENT ON TABLE hospedajes IS 'Registro de ingresos y egresos del servicio de hospedaje.';
COMMENT ON COLUMN hospedajes.tarifa_diaria IS 'Precio por día de hospedaje';
COMMENT ON COLUMN hospedajes.total_cargo IS 'Calculado por trigger al finalizar: (fecha_salida_real - fecha_ingreso) × tarifa_diaria';
COMMENT ON COLUMN hospedajes.estado IS 'activo = mascota alojada, finalizado = mascota retirada';

-- =====================================================
-- RELACIONES RESUMEN
-- =====================================================
--
-- perfiles (1) ──< consultas (N)       : Una doctora atiende muchas consultas
-- propietarios (1) ──< mascotas (N)    : Un dueño tiene varias mascotas (RESTRICT)
-- mascotas (1) ──< consultas (N)       : Una mascota tiene varias consultas (CASCADE)
-- mascotas (1) ──< vacunas (N)         : Una mascota tiene varias vacunas (CASCADE)
-- mascotas (1) ──< desparasitaciones (N): Una mascota tiene varias desparasitaciones (CASCADE)
-- mascotas (1) ──< fotos_evolucion (N) : Una mascota tiene varias fotos (CASCADE)
-- mascotas (1) ──< hospedajes (N)      : Una mascota tiene varios hospedajes (CASCADE)
-- consultas (1) ──< detalles_consulta (N): Una consulta tiene varios items (CASCADE)
-- consultas (1) ──< fotos_evolucion (N) : Una consulta tiene varias fotos (SET NULL)
-- consultas (1) ──< vacunas (N)         : Una consulta puede registrar vacunas (SET NULL)
-- consultas (1) ──< desparasitaciones (N): Una consulta puede registrar desparasitaciones (SET NULL)
-- consultas (1) ──< notificaciones (N)  : Una consulta genera notificaciones (SET NULL)
-- consultas (1) ──< hospedajes (N)      : Una consulta puede tener hospedaje asociado (SET NULL)
-- catalogo (1) ──< detalles_consulta (N): Un producto aparece en varios detalles
-- mascotas (1) ──< notificaciones (N)   : Una mascota recibe notificaciones (SET NULL)
