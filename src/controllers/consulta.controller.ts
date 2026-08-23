import { supabase } from '@/supabase/client'
import type { Consulta, DetalleConsulta, MonitorSalida, Producto } from '@/types'
import { normalizeCategoria } from '@/lib/catalogo-categorias'
import { MascotaController } from './mascota.controller'
import { AuthController } from './auth.controller'
import { fechaClaveToIsoDia, hoyEnElSalvador } from '@/lib/fechaAgenda'

let instance: ConsultaController | null = null

type ConsultaRow = {
  id: string
  mascota_id: string
  fecha: string | null
  motivo: string
  sintomas: string | null
  diagnostico: string
  tratamiento: string | null
  notas: string | null
  doctora_id: string | null
  estado: string | null
  total: number | string | null
  proxima_cita: string | null
  tipo_seguimiento: string | null
}

type DetalleRow = {
  id: string
  consulta_id: string
  producto_id: string | null
  nombre_personalizado: string | null
  cantidad: number
  precio_aplicado: number | string
  subtotal: number | string | null
  catalogo: {
    id: string
    codigo: string
    nombre: string
    descripcion: string | null
    categoria: string
    precio: number | string | null
    activo: boolean | null
  } | null
}

export class ConsultaController {
  static getInstance(): ConsultaController {
    if (!instance) instance = new ConsultaController()
    return instance
  }

  private mapProducto(row: DetalleRow['catalogo'], fallbackName?: string | null): Producto {
    return {
      id: row?.id ?? '',
      veterinariaId: '',
      codigo: row?.codigo ?? 'MANUAL',
      nombre: row?.nombre ?? fallbackName ?? 'Item sin catálogo',
      descripcion: row?.descripcion ?? '',
      categoria: normalizeCategoria(row?.categoria ?? 'consulta', row?.codigo),
      precio: Number(row?.precio ?? 0),
      activo: row?.activo ?? true,
    }
  }

  private mapDetalle(row: DetalleRow): DetalleConsulta {
    return {
      id: row.id,
      consultaId: row.consulta_id,
      productoId: row.producto_id ?? '',
      producto: this.mapProducto(row.catalogo, row.nombre_personalizado),
      cantidad: row.cantidad,
      precioAplicado: Number(row.precio_aplicado),
      subtotal: Number(row.subtotal ?? Number(row.precio_aplicado) * row.cantidad),
    }
  }

  private async fetchDetalles(consultaIds: string[]): Promise<Record<string, DetalleConsulta[]>> {
    if (consultaIds.length === 0) return {}

    const { data, error } = await supabase
      .from('detalles_consulta')
      .select(
        'id,consulta_id,producto_id,nombre_personalizado,cantidad,precio_aplicado,subtotal,catalogo(id,codigo,nombre,descripcion,categoria,precio,activo)'
      )
      .in('consulta_id', consultaIds)

    if (error) throw new Error(`No se pudieron cargar detalles: ${error.message}`)

    const grouped: Record<string, DetalleConsulta[]> = {}
    for (const row of (data ?? []) as unknown as DetalleRow[]) {
      const detail = this.mapDetalle(row)
      grouped[detail.consultaId] = grouped[detail.consultaId] ?? []
      grouped[detail.consultaId].push(detail)
    }
    return grouped
  }

  private mapConsulta(row: ConsultaRow, detalles: DetalleConsulta[]): Consulta {
    return {
      id: row.id,
      veterinariaId: (row as any).veterinaria_id ?? '',
      mascotaId: row.mascota_id,
      fecha: row.fecha ?? new Date().toISOString(),
      motivo: row.motivo,
      sintomas: row.sintomas ?? '',
      diagnostico: row.diagnostico,
      tratamiento: row.tratamiento ?? '',
      notas: row.notas ?? '',
      doctora: 'Doctora',
      estado: row.estado === 'finalizado' ? 'finalizado' : 'pendiente',
      total: Number(row.total ?? 0),
      detalles,
      proximaCita: row.proxima_cita ?? undefined,
      tipoSeguimiento: (row.tipo_seguimiento as Consulta['tipoSeguimiento']) ?? undefined,
    }
  }

  private async getVeterinariaId(): Promise<string | null> {
    const auth = AuthController.getInstance()
    const currentUser = await auth.resolveUser()
    return currentUser?.veterinariaId ?? null
  }

  private async fetchConsultas(
    filters: { estado?: string; mascotaId?: string; limit?: number } = {}
  ): Promise<Consulta[]> {
    const veterinariaId = await this.getVeterinariaId()
    if (!veterinariaId) return []

    let query = supabase
      .from('consultas')
      .select('id,mascota_id,fecha,motivo,sintomas,diagnostico,tratamiento,notas,doctora_id,estado,total,proxima_cita,tipo_seguimiento,veterinaria_id')
      .eq('veterinaria_id', veterinariaId)
      .order('fecha', { ascending: false })

    if (filters.estado) query = query.eq('estado', filters.estado)
    if (filters.mascotaId) query = query.eq('mascota_id', filters.mascotaId)
    if (filters.limit) query = query.limit(filters.limit)

    const { data, error } = await query
    if (error) throw new Error(`No se pudieron cargar consultas: ${error.message}`)

    const rows = (data ?? []) as ConsultaRow[]
    const ids = rows.map(c => c.id)
    const detallesByConsulta = await this.fetchDetalles(ids)
    return rows.map(row => this.mapConsulta(row, detallesByConsulta[row.id] ?? []))
  }

  async getAll(): Promise<Consulta[]> {
    return this.fetchConsultas()
  }

  async getPendientes(limit?: number): Promise<Consulta[]> {
    return this.fetchConsultas({ estado: 'pendiente', limit })
  }

  async getByMascota(mascotaId: string): Promise<Consulta[]> {
    return this.fetchConsultas({ mascotaId })
  }

  async crear(data: Partial<Consulta>): Promise<Consulta> {
    const auth = AuthController.getInstance()
    const currentUser = await auth.resolveUser()
    if (!currentUser?.veterinariaId) throw new Error('No hay veterinaria activa')

    let proxima_cita: string | null = null
    let tipo_seguimiento: string | null = null
    if (data.proximaCita) {
      if (data.proximaCita < hoyEnElSalvador()) {
        throw new Error('La fecha del próximo control no puede estar en el pasado')
      }
      proxima_cita = fechaClaveToIsoDia(data.proximaCita)
      tipo_seguimiento = data.tipoSeguimiento ?? 'control'
    }

    const payload = {
      veterinaria_id: currentUser.veterinariaId,
      mascota_id: data.mascotaId || '',
      motivo: data.motivo || '',
      sintomas: data.sintomas || null,
      diagnostico: data.diagnostico || '',
      tratamiento: data.tratamiento || null,
      notas: data.notas || null,
      estado: 'pendiente',
      total: data.total || 0,
      proxima_cita,
      tipo_seguimiento,
    }

    const { data: inserted, error } = await supabase
      .from('consultas')
      .insert(payload)
      .select('id,mascota_id,fecha,motivo,sintomas,diagnostico,tratamiento,notas,doctora_id,estado,total,proxima_cita,tipo_seguimiento,veterinaria_id')
      .single()

    if (error) throw new Error(`No se pudo crear consulta: ${error.message}`)

    const consultaRow = inserted as ConsultaRow
    const detalles = data.detalles ?? []
    if (detalles.length > 0) {
      const insertDetalles = detalles.map(det => ({
        consulta_id: consultaRow.id,
        producto_id: det.productoId || null,
        nombre_personalizado: det.producto?.nombre ?? null,
        cantidad: det.cantidad,
        precio_aplicado: det.precioAplicado,
      }))

      const { error: detError } = await supabase.from('detalles_consulta').insert(insertDetalles)
      if (detError) throw new Error(`Consulta creada pero fallaron detalles: ${detError.message}`)
    }

    return this.mapConsulta(consultaRow, detalles)
  }

  async finalizar(id: string): Promise<void> {
    const { error } = await supabase
      .from('consultas')
      .update({ estado: 'finalizado', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw new Error(`No se pudo finalizar consulta: ${error.message}`)
  }

  calcularTotal(detalles: DetalleConsulta[]): number {
    return detalles.reduce((sum, d) => sum + d.subtotal, 0)
  }

  async getMonitorSalida(): Promise<MonitorSalida[]> {
    const pendientes = await this.getPendientes(3)
    if (pendientes.length === 0) return []

    const mascotaIds = [...new Set(pendientes.map(c => c.mascotaId))]
    const mascotaCtrl = MascotaController.getInstance()
    const mascotas = await mascotaCtrl.getByIds(mascotaIds)
    const mascotasById = new Map(mascotas.map(m => [m.id, m]))

    return pendientes
      .map((c, i) => {
        const mascota = mascotasById.get(c.mascotaId)
        if (!mascota) return null
        return {
          consultaId: c.id,
          mascota,
          horaTermino: c.fecha,
          total: c.total,
          estado: (i === 2 ? 'pagando' : 'listo') as MonitorSalida['estado'],
        }
      })
      .filter(Boolean) as MonitorSalida[]
  }
}
