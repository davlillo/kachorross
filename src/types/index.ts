// Tipos principales del sistema veterinario

export type TipoSeguimiento = 'control' | 'vacuna' | 'desparasitacion' | 'revision_general'

export interface ClinicTheme {
  paletteId: string;
  updatedAt?: string;
}

export interface Veterinaria {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  logoUrl?: string;
  estado: 'activo' | 'suspendido';
  tema?: ClinicTheme;
  createdAt: string;
}

export interface Perfil {
  id: string;
  veterinariaId?: string;
  nombre: string;
  email: string;
  rol: 'doctora' | 'recepcion' | 'admin' | 'super_admin';
  avatar?: string;
}

export interface Mascota {
  id: string;
  veterinariaId: string;
  nombre: string;
  especie: 'perro' | 'gato' | 'ave' | 'conejo' | 'otro';
  raza: string;
  fechaNacimiento: string | null;
  sexo: 'macho' | 'hembra';
  color: string;
  peso: number;
  foto?: string;
  propietario: Propietario;
  alergias?: string[];
  notasEspeciales?: string;
  fechaRegistro: string;
}

export interface Propietario {
  id: string;
  veterinariaId: string;
  nombre: string;
  telefono: string;
  email?: string;
  direccion?: string;
}

export interface Expediente {
  id: string;
  mascotaId: string;
  mascota: Mascota;
  consultas: Consulta[];
  fotosEvolucion: FotoEvolucion[];
  vacunas: Vacuna[];
  desparasitaciones: Desparasitacion[];
  /**
   * Solo estancias ya cerradas. La de la mascota activa no llega acá porque el
   * historial clínico registra hechos consumados, no estancias en curso.
   */
  hospedajesFinalizados: Hospedaje[];
}

export interface ExpedienteResumen {
  id: string;
  mascotaId: string;
  mascota: Mascota;
  consultasCount: number;
}

export type EstadoHospedaje = 'activo' | 'finalizado';

/**
 * Ciclo de facturación, separado de `EstadoHospedaje` a propósito: la estancia
 * puede estar cerrada y todavía no cobrada. El monitor de salida usa este campo
 * para saber qué hay que facturar.
 */
export type EstadoCobroHospedaje = 'pendiente' | 'facturado';

export interface Hospedaje {
  id: string;
  veterinariaId: string;
  /** Solo se hospeda mascotas del expediente, así que la referencia es obligatoria. */
  mascotaId: string;
  /** Anida el paciente con su propietario. Nullable porque PostgREST puede omitir el embed. */
  mascota: Mascota | null;
  fechaIngreso: string;
  fechaSalidaEstimada: string;
  fechaSalidaReal: string | null;
  tarifaDiaria: number;
  totalCargo: number | null;
  observaciones?: string;
  estado: EstadoHospedaje;
  estadoCobro: EstadoCobroHospedaje;
  /**
   * Instante del cobro. Va aparte de `fechaSalidaReal` porque son días distintos:
   * la salida es cuando se fue el paciente y el cobro es cuando se cerró la caja.
   * "Consultas del Día" y el dashboard cuentan por este valor.
   */
  facturadoAt: string | null;
  consultaId?: string;
}

export interface GuardarHospedajeDTO {
  mascotaId: string;
  fechaIngreso: string;
  fechaSalidaEstimada: string;
  tarifaDiaria: number;
  observaciones?: string;
}

export type EstadoRequisitoExportacion = 'pendiente' | 'en_proceso' | 'completado';
export type EstadoExportacion = 'borrador' | 'en_proceso' | 'completado' | 'cancelado';

export interface RequisitoExportacion {
  id: string;
  nombre: string;
  descripcion?: string;
  estado: EstadoRequisitoExportacion;
  obligatorio: boolean;
}

export interface CostoExportacion {
  id: string;
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface ExportacionMascota {
  id: string;
  veterinariaId: string;
  mascotaId: string;
  paisDestino: string;
  destinoDetalle?: string;
  fechaTramiteProgramada: string;
  fechaViaje?: string;
  estado: EstadoExportacion;
  requisitos: RequisitoExportacion[];
  costos: CostoExportacion[];
  moneda: string;
  veterinarioResponsable: string;
  responsableId?: string;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuardarExportacionMascotaDTO {
  mascotaId: string;
  paisDestino: string;
  destinoDetalle?: string;
  fechaTramiteProgramada: string;
  fechaViaje?: string;
  estado: EstadoExportacion;
  requisitos: RequisitoExportacion[];
  costos: CostoExportacion[];
  moneda?: string;
  veterinarioResponsable: string;
  observaciones?: string;
}

export interface Consulta {
  id: string;
  veterinariaId: string;
  mascotaId: string;
  fecha: string;
  motivo: string;
  sintomas: string;
  diagnostico: string;
  tratamiento: string;
  notas: string;
  doctora: string;
  /** Médico responsable registrado como texto libre */
  medicoResponsable?: string;
  estado: 'pendiente' | 'finalizado';
  total: number;
  detalles: DetalleConsulta[];
  proximaCita?: string;
  /** Tipo de cita de seguimiento (solo fecha, sin hora fija) */
  tipoSeguimiento?: TipoSeguimiento;
}

export interface DetalleConsulta {
  id: string;
  consultaId: string;
  productoId: string;
  producto: Producto;
  cantidad: number;
  precioAplicado: number;
  subtotal: number;
}

export interface Producto {
  id: string;
  veterinariaId: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: 'consulta' | 'farmacia' | 'peluqueria' | 'petshop';
  precio: number;
  stock?: number;
  activo: boolean;
}

export interface FotoEvolucion {
  id: string;
  expedienteId: string;
  url: string;
  fecha: string;
  descripcion: string;
  /** Consulta a la que pertenece. Las fotos previas a la HU no tienen. */
  consultaId?: string;
  /** MIME real del archivo; los PDF no se pueden renderizar con <img>. */
  tipoArchivo?: string;
}

export interface Vacuna {
  id: string;
  mascotaId: string;
  expedienteId: string;
  nombre: string;
  fechaAplicacion: string;
  dosis?: string;
  proximaDosis?: string;
  lote?: string;
  aplicadaPor?: string;
}

export interface Desparasitacion {
  id: string;
  mascotaId: string;
  expedienteId: string;
  tipo: string;
  viaAdministracion: string;
  fechaAplicacion: string;
  fechaProximoTratamiento?: string;
  /** Médico responsable registrado como texto libre */
  medicoResponsable?: string;
}

interface BaseMonitorSalida {
  /** Id de la fila de origen: la consulta en un caso, el hospedaje en el otro. */
  id: string;
  mascota: Mascota;
  horaTermino: string;
  total: number;
  estado: 'listo' | 'pagando' | 'entregado';
}

/**
 * El monitor mezcla consultas pendientes de facturar con hospedajes ya cerrados
 * que aún no se cobraron, así que el origen va discriminado: el detalle y la
 * acción de cierre dependen de cuál sea.
 */
export type MonitorSalida =
  | (BaseMonitorSalida & { origen: 'consulta'; consulta: Consulta })
  | (BaseMonitorSalida & { origen: 'hospedaje'; hospedaje: Hospedaje });

/**
 * Una fila de la pestaña "Consultas del Día": consultas finalizadas más hospedajes
 * ya facturados.
 *
 * No reutiliza `MonitorSalida` porque el monitor y el cierre de caja son cosas
 * distintas: acá no hay estado de "listo/pagando" porque todo lo que aparece ya se
 * procesó, y `hora` es la del cobro en hospedajes, no la salida.
 */
export interface ProcesadoSalida {
  origen: 'consulta' | 'hospedaje';
  /** Id de la fila de origen, como en `MonitorSalida`. */
  id: string;
  /** Instante que define el día: `fecha` en consultas, `facturado_at` en hospedajes. */
  hora: string;
  motivo: string;
  /** Médico en consultas, raza en hospedajes. */
  responsable: string;
  total: number;
  consulta: Consulta | null;
  hospedaje: Hospedaje | null;
}

export interface DashboardStats {
  pacientesHoy: number;
  pacientesEspera: number;
  ingresosHoy: number;
  consultasPendientes: number;
}

// ─── DTOs para creación ───

export interface CrearPropietarioDTO {
  nombre: string;
  telefono: string;
  email?: string;
  direccion?: string;
}

export interface CrearMascotaDTO {
  nombre: string;
  especie: Mascota['especie'];
  raza: string;
  fechaNacimiento?: string | null;
  sexo: Mascota['sexo'];
  color?: string;
  peso?: number;
  foto?: string;
  alergias?: string[];
  notasEspeciales?: string;
}

export interface RegistrarExpedienteDTO {
  propietario: CrearPropietarioDTO;
  mascota: CrearMascotaDTO;
}

export interface EmailConfig {
  id: string;
  veterinariaId: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromName?: string;
  fromEmail?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegistroEnvio {
  id: string;
  veterinariaId: string;
  destinatarioEmail: string;
  tipoNotificacion: 'invitacion' | 'receta' | 'recordatorio' | 'confirmacion' | 'personalizado';
  fechaEnvio: string;
  estado: 'enviado' | 'entregado' | 'fallido' | 'pendiente';
  codigoError?: string;
  consultaId?: string;
  mascotaId?: string;
}


