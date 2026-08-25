import type { TipoEvento } from '@/data/eventosData'
import type { TipoSeguimiento } from '@/types'

export type { TipoSeguimiento }

export const TIPOS_SEGUIMIENTO: { value: TipoSeguimiento; label: string }[] = [
  { value: 'control', label: 'Control' },
  { value: 'vacuna', label: 'Vacuna' },
  { value: 'desparasitacion', label: 'Desparasitación' },
  { value: 'revision_general', label: 'Revisión general' },
]

export function labelTipoSeguimiento(tipo?: string | null): string {
  return TIPOS_SEGUIMIENTO.find(t => t.value === tipo)?.label ?? 'Control'
}

export function tipoSeguimientoToEvento(tipo?: string | null): TipoEvento {
  if (tipo === 'vacuna') return 'vacuna'
  if (tipo === 'desparasitacion') return 'desparasitante'
  if (tipo === 'revision_general') return 'revision_general'
  return 'control'
}

export function tituloSeguimiento(tipo?: string | null, motivo?: string | null): string {
  const label = labelTipoSeguimiento(tipo)
  if (tipo === 'control' && motivo) return `${label}: ${motivo}`
  return label
}

/** Una sola línea para correos de recordatorio, sin repetir el tipo */
export function textoRecordatorioSeguimiento(tipo?: string | null, motivo?: string | null): string {
  return tituloSeguimiento(tipo, motivo)
}
