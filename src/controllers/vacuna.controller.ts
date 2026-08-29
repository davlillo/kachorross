import { supabase } from '@/supabase/client'
import type { Vacuna, Desparasitacion } from '@/types'
import { AuthController } from './auth.controller'

let instance: VacunaController | null = null

type VacunaRow = {
  id: string
  mascota_id: string
  veterinaria_id: string
  nombre: string
  fecha_aplicacion: string
  dosis: string | null
  lote: string | null
  fecha_proxima_dosis: string | null
  aplicada_por: string | null
  consulta_id: string | null
  created_at: string | null
}

type DesparasitacionRow = {
  id: string
  mascota_id: string
  veterinaria_id: string
  tipo: string
  via_administracion: string
  fecha_aplicacion: string
  fecha_proximo_tratamiento: string | null
  medico_responsable: string | null
  consulta_id: string | null
  created_at: string | null
}

export class VacunaController {
  static getInstance(): VacunaController {
    if (!instance) instance = new VacunaController()
    return instance
  }

  private async getVeterinariaId(): Promise<string | null> {
    const auth = AuthController.getInstance()
    const currentUser = await auth.resolveUser()
    return currentUser?.veterinariaId ?? null
  }

  private mapVacuna(row: VacunaRow, mascotaId: string): Vacuna {
    return {
      id: row.id,
      mascotaId: row.mascota_id,
      expedienteId: `exp-${mascotaId}`,
      nombre: row.nombre,
      fechaAplicacion: row.fecha_aplicacion,
      dosis: row.dosis ?? undefined,
      proximaDosis: row.fecha_proxima_dosis ?? undefined,
      lote: row.lote ?? undefined,
      aplicadaPor: row.aplicada_por ?? undefined,
    }
  }

  private mapDesparasitacion(row: DesparasitacionRow, mascotaId: string): Desparasitacion {
    return {
      id: row.id,
      mascotaId: row.mascota_id,
      expedienteId: `exp-${mascotaId}`,
      tipo: row.tipo,
      viaAdministracion: row.via_administracion,
      fechaAplicacion: row.fecha_aplicacion,
      fechaProximoTratamiento: row.fecha_proximo_tratamiento ?? undefined,
      medicoResponsable: row.medico_responsable ?? undefined,
    }
  }

  async crearVacuna(data: {
    mascotaId: string
    nombre: string
    fechaAplicacion: string
    dosis?: string
    proximaDosis?: string
    lote?: string
    aplicadaPor?: string
  }): Promise<void> {
    const veterinariaId = await this.getVeterinariaId()
    if (!veterinariaId) throw new Error('No se encontró veterinaria')

    const { error } = await supabase
      .from('vacunas')
      .insert({
        mascota_id: data.mascotaId,
        veterinaria_id: veterinariaId,
        nombre: data.nombre,
        fecha_aplicacion: data.fechaAplicacion,
        dosis: data.dosis ?? null,
        lote: data.lote ?? null,
        fecha_proxima_dosis: data.proximaDosis ?? null,
        aplicada_por: data.aplicadaPor?.trim() || null,
      })

    if (error) throw new Error(`No se pudo crear vacuna: ${error.message}`)
  }

  async crearDesparasitacion(data: {
    mascotaId: string
    tipo: string
    viaAdministracion: string
    fechaAplicacion: string
    fechaProximoTratamiento?: string
    medicoResponsable?: string
  }): Promise<void> {
    const veterinariaId = await this.getVeterinariaId()
    if (!veterinariaId) throw new Error('No se encontró veterinaria')

    const { error } = await supabase
      .from('desparasitaciones')
      .insert({
        mascota_id: data.mascotaId,
        veterinaria_id: veterinariaId,
        tipo: data.tipo,
        via_administracion: data.viaAdministracion,
        fecha_aplicacion: data.fechaAplicacion,
        fecha_proximo_tratamiento: data.fechaProximoTratamiento ?? null,
        medico_responsable: data.medicoResponsable?.trim() || null,
      })

    if (error) throw new Error(`No se pudo crear desparasitación: ${error.message}`)
  }

  async quitarProximaDosis(vacunaId: string): Promise<void> {
    const veterinariaId = await this.getVeterinariaId()
    if (!veterinariaId) throw new Error('No se encontró veterinaria')

    const { error } = await supabase
      .from('vacunas')
      .update({ fecha_proxima_dosis: null })
      .eq('id', vacunaId)
      .eq('veterinaria_id', veterinariaId)

    if (error) throw new Error(`No se pudo actualizar la vacuna: ${error.message}`)
  }

  async quitarProximoTratamiento(desparasitacionId: string): Promise<void> {
    const veterinariaId = await this.getVeterinariaId()
    if (!veterinariaId) throw new Error('No se encontró veterinaria')

    const { error } = await supabase
      .from('desparasitaciones')
      .update({ fecha_proximo_tratamiento: null })
      .eq('id', desparasitacionId)
      .eq('veterinaria_id', veterinariaId)

    if (error) throw new Error(`No se pudo actualizar la desparasitación: ${error.message}`)
  }

  async getVacunasByMascota(mascotaId: string): Promise<Vacuna[]> {
    const veterinariaId = await this.getVeterinariaId()
    if (!veterinariaId) return []

    const { data, error } = await supabase
      .from('vacunas')
      .select('id,mascota_id,veterinaria_id,nombre,fecha_aplicacion,dosis,lote,fecha_proxima_dosis,aplicada_por,consulta_id,created_at')
      .eq('mascota_id', mascotaId)
      .eq('veterinaria_id', veterinariaId)
      .order('fecha_aplicacion', { ascending: false })

    if (error) throw new Error(`No se pudieron cargar vacunas: ${error.message}`)
    return (data ?? []).map(row => this.mapVacuna(row as VacunaRow, mascotaId))
  }

  async getDesparasitacionesByMascota(mascotaId: string): Promise<Desparasitacion[]> {
    const veterinariaId = await this.getVeterinariaId()
    if (!veterinariaId) return []

    const { data, error } = await supabase
      .from('desparasitaciones')
      .select('id,mascota_id,veterinaria_id,tipo,via_administracion,fecha_aplicacion,fecha_proximo_tratamiento,medico_responsable,consulta_id,created_at')
      .eq('mascota_id', mascotaId)
      .eq('veterinaria_id', veterinariaId)
      .order('fecha_aplicacion', { ascending: false })

    if (error) throw new Error(`No se pudieron cargar desparasitaciones: ${error.message}`)
    return (data ?? []).map(row => this.mapDesparasitacion(row as DesparasitacionRow, mascotaId))
  }
}
