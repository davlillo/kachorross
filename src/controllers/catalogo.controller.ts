import type { Producto } from '@/types'
import { catalogo as mockCatalogo } from '@/data/mockData'

let instance: CatalogoController | null = null

export class CatalogoController {
  private data: Producto[]

  private constructor() {
    this.data = [...mockCatalogo]
  }

  static getInstance(): CatalogoController {
    if (!instance) instance = new CatalogoController()
    return instance
  }

  getAll(): Producto[] {
    return this.data
  }

  getByCategoria(categoria: string): Producto[] {
    return this.data.filter(p => p.categoria === categoria && p.activo)
  }

  buscar(query: string): Producto[] {
    const lower = query.toLowerCase()
    return this.data.filter(
      p =>
        p.activo &&
        (p.nombre.toLowerCase().includes(lower) ||
          p.codigo.toLowerCase().includes(lower) ||
          p.descripcion.toLowerCase().includes(lower))
    )
  }

  actualizar(id: string, data: Partial<Producto>): void {
    const idx = this.data.findIndex(p => p.id === id)
    if (idx >= 0) this.data[idx] = { ...this.data[idx], ...data }
  }

  crear(data: Omit<Producto, 'id'>): Producto {
    const nuevo: Producto = { ...data, id: `prod${Date.now()}` }
    this.data.push(nuevo)
    return nuevo
  }

  eliminar(id: string): void {
    const idx = this.data.findIndex(p => p.id === id)
    if (idx >= 0) this.data[idx].activo = false
  }
}
