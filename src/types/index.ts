// Tipos principales del sistema veterinario

export interface Perfil {
  id: string;
  nombre: string;
  email: string;
  rol: 'doctora' | 'recepcion' | 'admin';
  avatar?: string;
}

export interface Mascota {
  id: string;
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
}

export interface Consulta {
  id: string;
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
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: 'servicio' | 'vacuna' | 'medicamento' | 'petshop' | 'laboratorio';
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
  expedienteId: string;
  nombre: string;
  fechaAplicacion: string;
  proximaDosis?: string;
  lote?: string;
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
