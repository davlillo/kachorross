import { supabase } from '@/supabase/client'
import { AuthController } from './auth.controller'
import type { TipoEvento } from '@/data/eventosData'
import { fechaLocalClave } from '@/lib/utils'
import { fechaEnElSalvador, fechaClaveToIsoDia } from '@/lib/fechaAgenda'
import { tipoSeguimientoToEvento, tituloSeguimiento } from '@/lib/tipoSeguimiento'

let instance: AgendaController | null = null

export type OrigenEvento = 'control' | 'vacuna' | 'desparasitante' | 'evento'

export interface EventoAgenda {
  id: string
  origen: OrigenEvento
  origenId: string
  fecha: string
  /** Solo citas con horario (control, evento manual, urgencia). Vacuna/desparas = undefined */
  hora?: string
  titulo: string
  tipo: TipoEvento
  mascotaId: string
  mascota: string
  mascotaFoto?: string
  propietario: string
  propietarioEmail?: string
  notas?: string
  consultaId?: string
  estado?: string
}

export interface VacunaProxima {
  id: string
  vacuna: string
  mascota: string
  /** Clave 'yyyy-MM-dd' de la próxima dosis */
  fecha: string
}

type PropietarioRow = { nombre?: string; email?: string | null }
type MascotaRow = { id: string; nombre: string; foto?: string | null; propietarios?: PropietarioRow | PropietarioRow[] | null }

function resolvePropietario(mascota: MascotaRow | null | undefined): { nombre: string; email?: string } {
  if (!mascota?.propietarios) return { nombre: 'Propietario' }
  const p = Array.isArray(mascota.propietarios) ? mascota.propietarios[0] : mascota.propietarios
  return {
    nombre: p?.nombre ?? 'Propietario',
    email: p?.email ?? undefined,
  }
}

function parseFechaDia(iso: string): string {
  return fechaEnElSalvador(iso)
}

function toRangoISO(desde: Date, hasta: Date): { desde: string; hasta: string } {
  const d0 = new Date(desde)
  d0.setHours(0, 0, 0, 0)
  const d1 = new Date(hasta)
  d1.setHours(23, 59, 59, 999)
  return { desde: d0.toISOString(), hasta: d1.toISOString() }
}

function toRangoFecha(desde: Date, hasta: Date): { desde: string; hasta: string } {
  return {
    desde: fechaLocalClave(desde),
    hasta: fechaLocalClave(hasta),
  }
}

/** Citas con hora primero; vacunas/desparas (sin hora) al final del día */
export function compararEventosAgenda(a: EventoAgenda, b: EventoAgenda): number {
  const cmp = a.fecha.localeCompare(b.fecha)
  if (cmp !== 0) return cmp
  const aH = a.hora
  const bH = b.hora
  if (!aH && !bH) return a.mascota.localeCompare(b.mascota)
  if (!aH) return 1
  if (!bH) return -1
  return aH.localeCompare(bH)
}

export class AgendaController {
  static getInstance(): AgendaController {
    if (!instance) instance = new AgendaController()
    return instance
  }

  private async getVeterinariaId(): Promise<string | null> {
    const auth = AuthController.getInstance()
    const user = await auth.resolveUser()
    return user?.veterinariaId ?? null
  }

  private async getCurrentUserId(): Promise<string | null> {
    const auth = AuthController.getInstance()
    const user = await auth.resolveUser()
    return user?.id ?? null
  }

  async getPorRango(desde: Date, hasta: Date): Promise<EventoAgenda[]> {
    const veterinariaId = await this.getVeterinariaId()
    if (!veterinariaId) return []

    const [controles, vacunas, desparas, manuales] = await Promise.all([
      this.fetchControles(veterinariaId, desde, hasta),
      this.fetchVacunas(veterinariaId, desde, hasta),
      this.fetchDesparasitaciones(veterinariaId, desde, hasta),
      this.fetchEventosManuales(veterinariaId, desde, hasta),
    ])

    return [...controles, ...vacunas, ...desparas, ...manuales].sort(compararEventosAgenda)
  }

  async getVacunasProximas(desdeKey: string, hastaKey: string): Promise<VacunaProxima[]> {
    const veterinariaId = await this.getVeterinariaId()
    if (!veterinariaId) return []

    const { data, error } = await supabase
      .from('vacunas')
      .select('id, nombre, fecha_proxima_dosis, mascotas(id, nombre)')
      .eq('veterinaria_id', veterinariaId)
      .not('fecha_proxima_dosis', 'is', null)
      .gte('fecha_proxima_dosis', desdeKey)
      .lte('fecha_proxima_dosis', hastaKey)
      .order('fecha_proxima_dosis')

    if (error) throw new Error(`No se pudieron cargar vacunas próximas: ${error.message}`)

    return (data ?? []).flatMap(row => {
      if (!row.fecha_proxima_dosis) return []
      const mascota = row.mascotas as unknown as MascotaRow | null
      return [{
        id: row.id,
        vacuna: row.nombre,
        mascota: mascota?.nombre ?? 'Mascota',
        fecha: row.fecha_proxima_dosis,
      }]
    })
  }

  private async fetchControles(vetId: string, desde: Date, hasta: Date): Promise<EventoAgenda[]> {
    const { desde: d0, hasta: d1 } = toRangoISO(desde, hasta)

    const { data, error } = await supabase
      .from('consultas')
      .select('id, mascota_id, motivo, proxima_cita, tipo_seguimiento, notas, mascotas(id, nombre, foto, propietarios(nombre, email))')
      .eq('veterinaria_id', vetId)
      .not('proxima_cita', 'is', null)
      .gte('proxima_cita', d0)
      .lte('proxima_cita', d1)

    if (error) throw new Error(`No se pudieron cargar controles: ${error.message}`)

    return (data ?? []).flatMap(row => {
      if (!row.proxima_cita) return []
      const mascota = row.mascotas as unknown as MascotaRow | null
      const prop = resolvePropietario(mascota)
      const tipo = tipoSeguimientoToEvento(row.tipo_seguimiento)
      return [{
        id: `ctrl-${row.id}`,
        origen: 'control' as const,
        origenId: row.id,
        fecha: parseFechaDia(row.proxima_cita),
        titulo: tituloSeguimiento(row.tipo_seguimiento, row.motivo),
        tipo,
        mascotaId: row.mascota_id,
        mascota: mascota?.nombre ?? 'Mascota',
        mascotaFoto: mascota?.foto ?? undefined,
        propietario: prop.nombre,
        propietarioEmail: prop.email,
        notas: row.notas ?? undefined,
        consultaId: row.id,
      }]
    })
  }

  private async fetchVacunas(vetId: string, desde: Date, hasta: Date): Promise<EventoAgenda[]> {
    const { desde: d0, hasta: d1 } = toRangoFecha(desde, hasta)

    const { data, error } = await supabase
      .from('vacunas')
      .select('id, mascota_id, nombre, fecha_proxima_dosis, mascotas(id, nombre, foto, propietarios(nombre, email))')
      .eq('veterinaria_id', vetId)
      .not('fecha_proxima_dosis', 'is', null)
      .gte('fecha_proxima_dosis', d0)
      .lte('fecha_proxima_dosis', d1)

    if (error) throw new Error(`No se pudieron cargar vacunas: ${error.message}`)

    return (data ?? []).flatMap(row => {
      if (!row.fecha_proxima_dosis) return []
      const mascota = row.mascotas as unknown as MascotaRow | null
      const prop = resolvePropietario(mascota)
      return [{
        id: `vac-${row.id}`,
        origen: 'vacuna' as const,
        origenId: row.id,
        fecha: row.fecha_proxima_dosis,
        titulo: `Vacuna: ${row.nombre}`,
        tipo: 'vacuna' as TipoEvento,
        mascotaId: row.mascota_id,
        mascota: mascota?.nombre ?? 'Mascota',
        mascotaFoto: mascota?.foto ?? undefined,
        propietario: prop.nombre,
        propietarioEmail: prop.email,
      }]
    })
  }

  private async fetchDesparasitaciones(vetId: string, desde: Date, hasta: Date): Promise<EventoAgenda[]> {
    const { desde: d0, hasta: d1 } = toRangoFecha(desde, hasta)

    const { data, error } = await supabase
      .from('desparasitaciones')
      .select('id, mascota_id, tipo, fecha_proximo_tratamiento, mascotas(id, nombre, foto, propietarios(nombre, email))')
      .eq('veterinaria_id', vetId)
      .not('fecha_proximo_tratamiento', 'is', null)
      .gte('fecha_proximo_tratamiento', d0)
      .lte('fecha_proximo_tratamiento', d1)

    if (error) throw new Error(`No se pudieron cargar desparasitaciones: ${error.message}`)

    return (data ?? []).flatMap(row => {
      if (!row.fecha_proximo_tratamiento) return []
      const mascota = row.mascotas as unknown as MascotaRow | null
      const prop = resolvePropietario(mascota)
      return [{
        id: `desp-${row.id}`,
        origen: 'desparasitante' as const,
        origenId: row.id,
        fecha: row.fecha_proximo_tratamiento,
        titulo: `Desparasitación: ${row.tipo}`,
        tipo: 'desparasitante' as TipoEvento,
        mascotaId: row.mascota_id,
        mascota: mascota?.nombre ?? 'Mascota',
        mascotaFoto: mascota?.foto ?? undefined,
        propietario: prop.nombre,
        propietarioEmail: prop.email,
      }]
    })
  }

  private async fetchEventosManuales(vetId: string, desde: Date, hasta: Date): Promise<EventoAgenda[]> {
    const { desde: d0, hasta: d1 } = toRangoISO(desde, hasta)

    const { data, error } = await supabase
      .from('eventos')
      .select('id, mascota_id, consulta_id, titulo, tipo, fecha_hora, notas, estado, mascotas(id, nombre, foto, propietarios(nombre, email))')
      .eq('veterinaria_id', vetId)
      .gte('fecha_hora', d0)
      .lte('fecha_hora', d1)

    if (error) throw new Error(`No se pudieron cargar eventos: ${error.message}`)

    return (data ?? []).map(row => {
      const mascota = row.mascotas as unknown as MascotaRow | null
      const prop = resolvePropietario(mascota)
      const fecha = parseFechaDia(row.fecha_hora)
      const tipo = (['control', 'vacuna', 'desparasitante', 'revision_general', 'urgencia'].includes(row.tipo)
        ? row.tipo
        : 'control') as TipoEvento

      return {
        id: `ev-${row.id}`,
        origen: 'evento' as const,
        origenId: row.id,
        fecha,
        titulo: row.titulo,
        tipo,
        mascotaId: row.mascota_id,
        mascota: mascota?.nombre ?? 'Mascota',
        mascotaFoto: mascota?.foto ?? undefined,
        propietario: prop.nombre,
        propietarioEmail: prop.email,
        notas: row.notas ?? undefined,
        consultaId: row.consulta_id ?? undefined,
        estado: row.estado ?? undefined,
      }
    })
  }

  /** @deprecated Las citas son solo por día; se mantiene por compatibilidad */
  async verificarConflicto(_fecha: string, _hora: string): Promise<{ conflicto: boolean; detalle?: string }> {
    return { conflicto: false }
  }

  async crearManual(data: {
    mascotaId: string
    titulo: string
    tipo: TipoEvento
    fecha: string
    notas?: string
  }): Promise<EventoAgenda> {
    const veterinariaId = await this.getVeterinariaId()
    const createdBy = await this.getCurrentUserId()
    if (!veterinariaId) throw new Error('No hay veterinaria activa')

    const fechaHora = fechaClaveToIsoDia(data.fecha)

    const { data: inserted, error } = await supabase
      .from('eventos')
      .insert({
        veterinaria_id: veterinariaId,
        mascota_id: data.mascotaId,
        titulo: data.titulo,
        tipo: data.tipo,
        fecha_hora: fechaHora,
        notas: data.notas || null,
        estado: 'programado',
        created_by: createdBy,
      })
      .select('id, mascota_id, consulta_id, titulo, tipo, fecha_hora, notas, estado, mascotas(id, nombre, foto, propietarios(nombre, email))')
      .single()

    if (error) throw new Error(`No se pudo crear evento: ${error.message}`)

    const mascota = inserted.mascotas as unknown as MascotaRow | null
    const prop = resolvePropietario(mascota)
    const fecha = parseFechaDia(inserted.fecha_hora)

    return {
      id: `ev-${inserted.id}`,
      origen: 'evento',
      origenId: inserted.id,
      fecha,
      titulo: inserted.titulo,
      tipo: inserted.tipo as TipoEvento,
      mascotaId: inserted.mascota_id,
      mascota: mascota?.nombre ?? 'Mascota',
      propietario: prop.nombre,
      propietarioEmail: prop.email,
      notas: inserted.notas ?? undefined,
      consultaId: inserted.consulta_id ?? undefined,
      estado: inserted.estado ?? undefined,
    }
  }

  async eliminarManual(id: string): Promise<void> {
    if (!id.startsWith('ev-')) {
      throw new Error('Solo se pueden eliminar eventos creados manualmente')
    }
    const eventoId = id.slice(3)
    const { error } = await supabase.from('eventos').delete().eq('id', eventoId)
    if (error) throw new Error(`No se pudo eliminar evento: ${error.message}`)
  }
}
