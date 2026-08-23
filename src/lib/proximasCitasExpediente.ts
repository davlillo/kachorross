import type { Expediente } from '@/types'
import { labelTipoSeguimiento, tipoSeguimientoToEvento } from '@/lib/tipoSeguimiento'
import { colorEvento, type TipoEvento } from '@/data/eventosData'
import { fechaLocalClave, formatDateLocal, todayLocal } from '@/lib/utils'

export interface CitaPendienteExpediente {
  id: string
  fecha: string
  tipo: TipoEvento
  label: string
}

export function obtenerProximasCitas(expediente: Expediente): CitaPendienteExpediente[] {
  const hoy = todayLocal()
  const map = new Map<string, CitaPendienteExpediente>()

  const add = (fecha: string, tipo: TipoEvento, label: string, id: string) => {
    if (fecha < hoy) return
    const key = `${fecha}:${tipo}`
    if (!map.has(key)) {
      map.set(key, { id, fecha, tipo, label })
    }
  }

  for (const c of expediente.consultas) {
    if (!c.proximaCita) continue
    const fecha = fechaLocalClave(c.proximaCita)
    const tipo = tipoSeguimientoToEvento(c.tipoSeguimiento)
    const base = labelTipoSeguimiento(c.tipoSeguimiento)
    const label = c.tipoSeguimiento === 'control' && c.motivo ? `${base}: ${c.motivo}` : base
    add(fecha, tipo, label, `ctrl-${c.id}`)
  }

  for (const v of expediente.vacunas) {
    if (!v.proximaDosis) continue
    add(v.proximaDosis, 'vacuna', `Vacuna: ${v.nombre}`, `vac-${v.id}`)
  }

  for (const d of expediente.desparasitaciones) {
    if (!d.fechaProximoTratamiento) continue
    add(d.fechaProximoTratamiento, 'desparasitante', `Desparasitación: ${d.tipo}`, `desp-${d.id}`)
  }

  return [...map.values()].sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function formatFechaCita(fecha: string): string {
  return formatDateLocal(fecha)
}

export function colorCita(tipo: TipoEvento) {
  return colorEvento[tipo]
}
