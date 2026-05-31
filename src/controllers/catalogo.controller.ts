import { supabase } from '@/supabase/client'
import type { Producto } from '@/types'
import { AuthController } from './auth.controller'

let instance: CatalogoController | null = null

type CatalogoRow = {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  categoria: string
  precio: number | string | null
  activo: boolean | null
}

export class CatalogoController {
  static getInstance(): CatalogoController {
    if (!instance) instance = new CatalogoController()
    return instance
  }

  private mapRow(row: CatalogoRow): Producto {
    return {
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? '',
      categoria: row.categoria as Producto['categoria'],
      precio: Number(row.precio ?? 0),
      activo: row.activo ?? true,
    }
  }

  async getAll(): Promise<Producto[]> {
    const auth = AuthController.getInstance()
    const currentUser = await auth.resolveUser()
    if (!currentUser?.veterinariaId) return []

    const { data, error } = await supabase
      .from('catalogo')
      .select('id,codigo,nombre,descripcion,categoria,precio,activo,veterinaria_id')
      .eq('veterinaria_id', currentUser.veterinariaId)
      .order('nombre', { ascending: true })

    if (error) throw new Error(`No se pudo cargar catálogo: ${error.message}`)
    return (data ?? []).map(row => this.mapRow(row as CatalogoRow))
  }

  async getByCategoria(categoria: string): Promise<Producto[]> {
    const auth = AuthController.getInstance()
    const currentUser = await auth.resolveUser()
    if (!currentUser?.veterinariaId) return []

    const { data, error } = await supabase
      .from('catalogo')
      .select('id,codigo,nombre,descripcion,categoria,precio,activo,veterinaria_id')
      .eq('veterinaria_id', currentUser.veterinariaId)
      .eq('categoria', categoria)
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) throw new Error(`No se pudo filtrar catálogo: ${error.message}`)
    return (data ?? []).map(row => this.mapRow(row as CatalogoRow))
  }

  async buscar(query: string): Promise<Producto[]> {
    const auth = AuthController.getInstance()
    const currentUser = await auth.resolveUser()
    if (!currentUser?.veterinariaId) return []

    const q = query.trim()
    if (!q) return this.getAll()

    const { data, error } = await supabase
      .from('catalogo')
      .select('id,codigo,nombre,descripcion,categoria,precio,activo,veterinaria_id')
      .eq('veterinaria_id', currentUser.veterinariaId)
      .eq('activo', true)
      .or(`nombre.ilike.%${q}%,codigo.ilike.%${q}%,descripcion.ilike.%${q}%`)
      .order('nombre', { ascending: true })

    if (error) throw new Error(`No se pudo buscar en catálogo: ${error.message}`)
    return (data ?? []).map(row => this.mapRow(row as CatalogoRow))
  }

  async actualizar(id: string, data: Partial<Producto>): Promise<void> {
    const payload: Record<string, unknown> = {}
    if (data.codigo !== undefined) payload.codigo = data.codigo
    if (data.nombre !== undefined) payload.nombre = data.nombre
    if (data.descripcion !== undefined) payload.descripcion = data.descripcion
    if (data.categoria !== undefined) payload.categoria = data.categoria
    if (data.precio !== undefined) payload.precio = data.precio
    if (data.activo !== undefined) payload.activo = data.activo
    payload.updated_at = new Date().toISOString()

    const { error } = await supabase.from('catalogo').update(payload).eq('id', id)
    if (error) throw new Error(`No se pudo actualizar producto: ${error.message}`)
  }

  async crear(data: Omit<Producto, 'id' | 'veterinariaId'>): Promise<Producto> {
    const auth = AuthController.getInstance()
    const currentUser = await auth.resolveUser()
    if (!currentUser?.veterinariaId) throw new Error('No hay veterinaria activa')

    const { data: inserted, error } = await supabase
      .from('catalogo')
      .insert({
        veterinaria_id: currentUser.veterinariaId,
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoria: data.categoria,
        precio: data.precio,
        activo: data.activo,
      })
      .select('id,codigo,nombre,descripcion,categoria,precio,activo,veterinaria_id')
      .single()

    if (error) throw new Error(`No se pudo crear producto: ${error.message}`)
    return this.mapRow(inserted as CatalogoRow)
  }

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase
      .from('catalogo')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw new Error(`No se pudo eliminar producto: ${error.message}`)
  }
}
