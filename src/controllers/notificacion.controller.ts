import { supabase } from '@/supabase/client'
import type { RegistroEnvio } from '@/types'
import { AuthController } from './auth.controller'

let instance: NotificacionController | null = null

export type FiltroNotificaciones = {
  busqueda?: string
  estado?: RegistroEnvio['estado'] | 'todos'
  tipo?: RegistroEnvio['tipoNotificacion'] | 'todos'
  limite?: number
}

export class NotificacionController {
  static getInstance(): NotificacionController {
    if (!instance) instance = new NotificacionController()
    return instance
  }

  private mapRow(row: Record<string, unknown>): RegistroEnvio {
    return {
      id: row.id as string,
      veterinariaId: row.veterinaria_id as string,
      destinatarioEmail: row.destinatario_email as string,
      tipoNotificacion: row.tipo_notificacion as RegistroEnvio['tipoNotificacion'],
      fechaEnvio: row.fecha_envio as string,
      estado: row.estado as RegistroEnvio['estado'],
      codigoError: (row.codigo_error as string | null) ?? undefined,
      consultaId: (row.consulta_id as string | null) ?? undefined,
      mascotaId: (row.mascota_id as string | null) ?? undefined,
    }
  }

  async listar(filtros: FiltroNotificaciones = {}): Promise<RegistroEnvio[]> {
    const auth = AuthController.getInstance()
    const user = await auth.resolveUser()
    if (!user?.veterinariaId) return []

    let query = supabase
      .from('notificaciones')
      .select('id,veterinaria_id,destinatario_email,tipo_notificacion,fecha_envio,estado,codigo_error,consulta_id,mascota_id')
      .eq('veterinaria_id', user.veterinariaId)
      .order('fecha_envio', { ascending: false })

    if (filtros.estado && filtros.estado !== 'todos') {
      query = query.eq('estado', filtros.estado)
    }

    if (filtros.tipo && filtros.tipo !== 'todos') {
      query = query.eq('tipo_notificacion', filtros.tipo)
    }

    if (filtros.limite) {
      query = query.limit(filtros.limite)
    }

    const { data, error } = await query
    if (error) throw new Error(`No se pudo cargar el historial de notificaciones: ${error.message}`)

    let rows = (data ?? []).map(row => this.mapRow(row as Record<string, unknown>))

    const q = filtros.busqueda?.trim().toLowerCase()
    if (q) {
      rows = rows.filter(r =>
        r.destinatarioEmail.toLowerCase().includes(q) ||
        r.tipoNotificacion.includes(q) ||
        (r.codigoError?.toLowerCase().includes(q) ?? false),
      )
    }

    return rows
  }
}
