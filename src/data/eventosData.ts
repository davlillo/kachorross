export type TipoEvento = 'control' | 'vacuna' | 'desparasitante' | 'urgencia';

export interface Evento {
  id: string;
  fecha: string;
  hora: string;
  titulo: string;
  mascota: string;
  propietario: string;
  tipo: TipoEvento;
  notas?: string;
  origen?: 'control' | 'vacuna' | 'desparasitante' | 'evento';
}

export const colorEvento: Record<TipoEvento, { bg: string; text: string; dot: string; label: string; border: string }> = {
  control:        { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500', label: 'Control', border: 'border-l-violet-500' },
  vacuna:         { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Vacuna', border: 'border-l-emerald-500' },
  desparasitante: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500', label: 'Desparasitante', border: 'border-l-teal-500' },
  urgencia:       { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Urgencia', border: 'border-l-red-500' },
};

// ── Datos de gráficas (mock legacy — dashboard usa consultas reales) ──────────

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

export const serviciosFrecuentes = [
  { nombre: 'Consulta General', cantidad: 24, ingresos: 600 },
  { nombre: 'Vacuna Pentavalente', cantidad: 15, ingresos: 525 },
  { nombre: 'Desparasitación', cantidad: 12, ingresos: 180 },
  { nombre: 'Limpieza de Oídos', cantidad: 9, ingresos: 108 },
  { nombre: 'Vacuna Antirrábica', cantidad: 8, ingresos: 160 },
  { nombre: 'Corte de Uñas', cantidad: 7, ingresos: 56 },
];

export const medicamentosFrecuentes = [
  { nombre: 'Amoxicilina 250mg', cantidad: 18, ingresos: 333 },
  { nombre: 'Metronidazol 500mg', cantidad: 14, ingresos: 308 },
  { nombre: 'Ivermectina', cantidad: 11, ingresos: 132 },
  { nombre: 'Dexametasona', cantidad: 9, ingresos: 135 },
  { nombre: 'Shampoo Medicado', cantidad: 7, ingresos: 112 },
];
