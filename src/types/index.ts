// Tipos principales del sistema veterinario

export interface Veterinaria {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  logoUrl?: string;
  estado: 'activo' | 'suspendido';
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
  fechaNacimiento: string;
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
}

export interface ExpedienteResumen {
  id: string;
  mascotaId: string;
  mascota: Mascota;
  consultasCount: number;
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
  estado: 'pendiente' | 'finalizado';
  total: number;
  detalles: DetalleConsulta[];
  proximaCita?: string;
  /** HH:mm — al crear consulta con próximo control */
  proximaCitaHora?: string;
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
}

export interface Desparasitacion {
  id: string;
  mascotaId: string;
  expedienteId: string;
  tipo: string;
  viaAdministracion: string;
  fechaAplicacion: string;
  fechaProximoTratamiento?: string;
}

export interface MonitorSalida {
  consultaId: string;
  mascota: Mascota;
  horaTermino: string;
  total: number;
  estado: 'listo' | 'pagando' | 'entregado';
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
  fechaNacimiento: string;
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
}
