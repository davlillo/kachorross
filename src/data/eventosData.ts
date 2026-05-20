export type TipoEvento = 'cita' | 'control' | 'vacuna' | 'cirugia' | 'urgencia';

export interface Evento {
  id: string;
  fecha: string; // YYYY-MM-DD
  hora: string;
  titulo: string;
  mascota: string;
  propietario: string;
  tipo: TipoEvento;
  notas?: string;
}

const hoy = new Date();
const año = hoy.getFullYear();
const mes = String(hoy.getMonth() + 1).padStart(2, '0');

const d = (day: number) => `${año}-${mes}-${String(day).padStart(2, '0')}`;

export const eventosIniciales: Evento[] = [
  { id: 'e1', fecha: d(1), hora: '09:00', titulo: 'Vacuna Pentavalente', mascota: 'Max', propietario: 'Carlos Mendoza', tipo: 'vacuna' },
  { id: 'e2', fecha: d(1), hora: '10:30', titulo: 'Consulta General', mascota: 'Luna', propietario: 'María Fernández', tipo: 'cita' },
  { id: 'e3', fecha: d(3), hora: '08:00', titulo: 'Control post-op', mascota: 'Michi', propietario: 'Carlos Mendoza', tipo: 'control', notas: 'Revisión de cicatrización' },
  { id: 'e4', fecha: d(5), hora: '11:00', titulo: 'Desparasitación', mascota: 'Rocky', propietario: 'José Ramírez', tipo: 'cita' },
  { id: 'e5', fecha: d(5), hora: '14:00', titulo: 'Cirugía dental', mascota: 'Bella', propietario: 'María Fernández', tipo: 'cirugia' },
  { id: 'e6', fecha: d(7), hora: '09:30', titulo: 'Control de peso', mascota: 'Toby', propietario: 'Pedro Castillo', tipo: 'control' },
  { id: 'e7', fecha: d(8), hora: '10:00', titulo: 'Urgencia: herida', mascota: 'Coco', propietario: 'Laura Torres', tipo: 'urgencia' },
  { id: 'e8', fecha: d(10), hora: '09:00', titulo: 'Vacuna Antirrábica', mascota: 'Rocky', propietario: 'José Ramírez', tipo: 'vacuna' },
  { id: 'e9', fecha: d(12), hora: '11:30', titulo: 'Control dermatológico', mascota: 'Max', propietario: 'Carlos Mendoza', tipo: 'control' },
  { id: 'e10', fecha: d(14), hora: '08:30', titulo: 'Consulta respiratoria', mascota: 'Pelusa', propietario: 'José Ramírez', tipo: 'cita' },
  { id: 'e11', fecha: d(15), hora: '10:00', titulo: 'Vacuna Triple Felina', mascota: 'Luna', propietario: 'María Fernández', tipo: 'vacuna' },
  { id: 'e12', fecha: d(15), hora: '15:00', titulo: 'Revisión mensual', mascota: 'Bella', propietario: 'María Fernández', tipo: 'control' },
  { id: 'e13', fecha: d(17), hora: '09:00', titulo: 'Consulta General', mascota: 'Michi', propietario: 'Carlos Mendoza', tipo: 'cita' },
  { id: 'e14', fecha: d(19), hora: '13:00', titulo: 'Cirugía esterilización', mascota: 'Coco', propietario: 'Laura Torres', tipo: 'cirugia' },
  { id: 'e15', fecha: d(20), hora: '09:00', titulo: 'Control post-op', mascota: 'Coco', propietario: 'Laura Torres', tipo: 'control', notas: 'Control día 1 post cirugía' },
  { id: 'e16', fecha: d(21), hora: '10:30', titulo: 'Desparasitación anual', mascota: 'Toby', propietario: 'Pedro Castillo', tipo: 'vacuna' },
  { id: 'e17', fecha: d(22), hora: '11:00', titulo: 'Urgencia: intoxicación', mascota: 'Max', propietario: 'Carlos Mendoza', tipo: 'urgencia' },
  { id: 'e18', fecha: d(24), hora: '09:30', titulo: 'Control cardiológico', mascota: 'Rocky', propietario: 'José Ramírez', tipo: 'control' },
  { id: 'e19', fecha: d(25), hora: '14:00', titulo: 'Consulta General', mascota: 'Pelusa', propietario: 'José Ramírez', tipo: 'cita' },
  { id: 'e20', fecha: d(27), hora: '10:00', titulo: 'Vacuna Bordetella', mascota: 'Bella', propietario: 'María Fernández', tipo: 'vacuna' },
  { id: 'e21', fecha: d(28), hora: '09:00', titulo: 'Revisión ocular', mascota: 'Michi', propietario: 'Carlos Mendoza', tipo: 'cita' },
];

export const colorEvento: Record<TipoEvento, { bg: string; text: string; dot: string; label: string }> = {
  cita:     { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500',   label: 'Cita' },
  control:  { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500', label: 'Control' },
  vacuna:   { bg: 'bg-emerald-100',text: 'text-emerald-700',dot: 'bg-emerald-500',label: 'Vacuna' },
  cirugia:  { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', label: 'Cirugía' },
  urgencia: { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Urgencia' },
};

// ── Datos de gráficas ──────────────────────────────────────────────────────────

export interface DatoConsultaDia {
  dia: string;
  consultas: number;
  ingresos: number;
}

const semana = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

export const consultasPorSemana: DatoConsultaDia[] = semana.map((dia, i) => ({
  dia,
  consultas: [5, 8, 6, 9, 7, 3, 1][i],
  ingresos: [125, 210, 160, 240, 195, 80, 25][i],
}));

export const consultasPorMes: DatoConsultaDia[] = Array.from({ length: 30 }, (_, i) => ({
  dia: String(i + 1),
  consultas: Math.floor(Math.random() * 8) + 2,
  ingresos: Math.floor(Math.random() * 300) + 50,
}));

// Servicios más frecuentes (basados en detalles de consultas)
export const serviciosFrecuentes = [
  { nombre: 'Consulta General', cantidad: 24, ingresos: 600 },
  { nombre: 'Vacuna Pentavalente', cantidad: 15, ingresos: 525 },
  { nombre: 'Desparasitación', cantidad: 12, ingresos: 180 },
  { nombre: 'Limpieza de Oídos', cantidad: 9, ingresos: 108 },
  { nombre: 'Vacuna Antirrábica', cantidad: 8, ingresos: 160 },
  { nombre: 'Corte de Uñas', cantidad: 7, ingresos: 56 },
];

// Medicamentos más prefacturados
export const medicamentosFrecuentes = [
  { nombre: 'Amoxicilina 250mg', cantidad: 18, ingresos: 333 },
  { nombre: 'Metronidazol 500mg', cantidad: 14, ingresos: 308 },
  { nombre: 'Ivermectina', cantidad: 11, ingresos: 132 },
  { nombre: 'Dexametasona', cantidad: 9, ingresos: 135 },
  { nombre: 'Shampoo Medicado', cantidad: 7, ingresos: 112 },
];
