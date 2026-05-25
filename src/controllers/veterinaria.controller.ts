import { supabase } from '@/supabase/client'
import type { Veterinaria } from '@/types'

let instance: VeterinariaController | null = null

export class VeterinariaController {
  static getInstance(): VeterinariaController {
    if (!instance) instance = new VeterinariaController()
    return instance
  }

  private mapVeterinaria(row: any): Veterinaria {
    return {
      id: row.id,
      nombre: row.nombre,
      direccion: row.direccion ?? undefined,
      telefono: row.telefono ?? undefined,
      email: row.email ?? undefined,
      logoUrl: row.logo_url ?? undefined,
      estado: row.estado as Veterinaria['estado'],
      createdAt: row.created_at,
    }
  }

  async getAll(): Promise<Veterinaria[]> {
    const { data, error } = await supabase
      .from('veterinarias')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`No se pudieron listar las veterinarias: ${error.message}`)
    return (data ?? []).map(row => this.mapVeterinaria(row))
  }

  async getById(id: string): Promise<Veterinaria | null> {
    const { data, error } = await supabase
      .from('veterinarias')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw new Error(`No se pudo obtener la veterinaria: ${error.message}`)
    if (!data) return null
    return this.mapVeterinaria(data)
  }

  async crear(data: Omit<Veterinaria, 'id' | 'createdAt' | 'estado'>): Promise<Veterinaria> {
    const { data: nueva, error } = await supabase
      .from('veterinarias')
      .insert([
        {
          nombre: data.nombre,
          direccion: data.direccion,
          telefono: data.telefono,
          email: data.email,
          estado: 'activo'
        }
      ])
      .select()
      .single()

    if (error) throw new Error(`No se pudo crear la veterinaria: ${error.message}`)
    return this.mapVeterinaria(nueva)
  }

  async actualizar(id: string, data: Partial<Omit<Veterinaria, 'id' | 'createdAt'>>): Promise<Veterinaria> {
    const payload: any = {}
    if (data.nombre !== undefined) payload.nombre = data.nombre
    if (data.direccion !== undefined) payload.direccion = data.direccion
    if (data.telefono !== undefined) payload.telefono = data.telefono
    if (data.email !== undefined) payload.email = data.email
    if (data.logoUrl !== undefined) payload.logo_url = data.logoUrl
    if (data.estado !== undefined) payload.estado = data.estado

    payload.updated_at = new Date().toISOString()

    const { data: actualizada, error } = await supabase
      .from('veterinarias')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) throw new Error(`No se pudo actualizar la veterinaria: ${error.message}`)
    if (!actualizada) {
      throw new Error('No tienes permiso para actualizar esta clínica. Verifica que tu usuario admin tenga veterinaria_id asignado.')
    }
    return this.mapVeterinaria(actualizada)
  }

  async subirLogo(id: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${id}-${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('logos_veterinarias')
      .upload(filePath, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      throw new Error(`Error al subir logo: ${uploadError.message}`)
    }

    const { data } = supabase.storage.from('logos_veterinarias').getPublicUrl(filePath)
    
    await this.actualizar(id, { logoUrl: data.publicUrl })
    
    return data.publicUrl
  }

  async suspender(id: string): Promise<Veterinaria> {
    return this.actualizar(id, { estado: 'suspendido' })
  }

  async activar(id: string): Promise<Veterinaria> {
    return this.actualizar(id, { estado: 'activo' })
  }
}
