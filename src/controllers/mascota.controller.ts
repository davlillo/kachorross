import { supabase } from '@/supabase/client'
import type {
  Consulta,
  DetalleConsulta,
  Expediente,
  FotoEvolucion,
  Mascota,
  Producto,
  Propietario,
  RegistrarExpedienteDTO,
  Vacuna,
} from '@/types'

let instance: MascotaController | null = null

export class MascotaController {
  static getInstance(): MascotaController {
    if (!instance) instance = new MascotaController()
    return instance
  }

  private mapMascota(row: any): Mascota {
    const propietario: Propietario = {
      id: row.propietarios?.id ?? '',
      nombre: row.propietarios?.nombre ?? '',
      telefono: row.propietarios?.telefono ?? '',
      email: row.propietarios?.email ?? undefined,
      direccion: row.propietarios?.direccion ?? undefined,
    }

    return {
      id: row.id,
      nombre: row.nombre,
      especie: row.especie as Mascota['especie'],
      raza: row.raza,
      fechaNacimiento: row.fecha_nacimiento,
      sexo: row.sexo as Mascota['sexo'],
      color: row.color ?? '',
      peso: Number(row.peso ?? 0),
      foto: row.foto ?? undefined,
      propietario,
      alergias: (row.alergias ?? []) as string[],
      notasEspeciales: row.notas_especiales ?? undefined,
      fechaRegistro: row.fecha_registro ?? new Date().toISOString().split('T')[0],
    }
  }

  private mapDetalle(row: any): DetalleConsulta {
    const producto: Producto = {
      id: row.catalogo?.id ?? '',
      codigo: row.catalogo?.codigo ?? 'MANUAL',
      nombre: row.catalogo?.nombre ?? row.nombre_personalizado ?? 'Item sin catálogo',
      descripcion: row.catalogo?.descripcion ?? '',
      categoria: (row.catalogo?.categoria ?? 'servicio') as Producto['categoria'],
      precio: Number(row.catalogo?.precio ?? row.precio_aplicado ?? 0),
      activo: row.catalogo?.activo ?? true,
    }

    return {
      id: row.id,
      consultaId: row.consulta_id,
      productoId: row.producto_id ?? '',
      producto,
      cantidad: row.cantidad,
      precioAplicado: Number(row.precio_aplicado ?? 0),
      subtotal: Number(row.subtotal ?? Number(row.precio_aplicado ?? 0) * row.cantidad),
    }
  }

  private mapConsulta(row: any, detalles: DetalleConsulta[]): Consulta {
    return {
      id: row.id,
      mascotaId: row.mascota_id,
      fecha: row.fecha,
      motivo: row.motivo,
      sintomas: row.sintomas ?? '',
      diagnostico: row.diagnostico ?? '',
      tratamiento: row.tratamiento ?? '',
      notas: row.notas ?? '',
      doctora: row.doctora?.nombre ?? 'Doctora',
      estado: row.estado === 'finalizado' ? 'finalizado' : 'pendiente',
      total: Number(row.total ?? 0),
      detalles,
      proximaCita: row.proxima_cita ?? undefined,
    }
  }

  async getAll(): Promise<Mascota[]> {
    const { data, error } = await supabase
      .from('mascotas')
      .select('id,nombre,especie,raza,fecha_nacimiento,sexo,color,peso,foto,alergias,notas_especiales,fecha_registro,activo,propietarios(id,nombre,telefono,email,direccion)')
      .eq('activo', true)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`No se pudieron cargar mascotas: ${error.message}`)
    return (data ?? []).map(row => this.mapMascota(row))
  }

  async getById(id: string): Promise<Mascota | undefined> {
    const { data, error } = await supabase
      .from('mascotas')
      .select('id,nombre,especie,raza,fecha_nacimiento,sexo,color,peso,foto,alergias,notas_especiales,fecha_registro,propietarios(id,nombre,telefono,email,direccion)')
      .eq('id', id)
      .maybeSingle()

    if (error) throw new Error(`No se pudo cargar mascota: ${error.message}`)
    return data ? this.mapMascota(data) : undefined
  }

  async buscar(query: string): Promise<Mascota[]> {
    const q = query.trim().toLowerCase()
    const mascotas = await this.getAll()
    if (!q) return mascotas

    return mascotas.filter(
      m =>
        m.nombre.toLowerCase().includes(q) ||
        m.propietario.nombre.toLowerCase().includes(q) ||
        m.propietario.telefono.includes(q) ||
        m.raza.toLowerCase().includes(q)
    )
  }

  async getExpedienteById(id: string): Promise<Expediente | undefined> {
    const mascota =
      (await this.getById(id)) ??
      (await (async () => {
        const { data, error } = await supabase
          .from('mascotas')
          .select('id,nombre,especie,raza,fecha_nacimiento,sexo,color,peso,foto,alergias,notas_especiales,fecha_registro,propietarios(id,nombre,telefono,email,direccion)')
          .eq('id', id.replace('exp-', ''))
          .maybeSingle()
        if (error) throw new Error(`No se pudo cargar expediente: ${error.message}`)
        return data ? this.mapMascota(data) : undefined
      })())

    if (!mascota) return undefined

    const [{ data: consultasData, error: consultasError }, { data: vacunasData, error: vacunasError }, { data: fotosData, error: fotosError }] =
      await Promise.all([
        supabase
          .from('consultas')
          .select('id,mascota_id,fecha,motivo,sintomas,diagnostico,tratamiento,notas,estado,total,proxima_cita,doctora:perfiles(nombre)')
          .eq('mascota_id', mascota.id)
          .order('fecha', { ascending: false }),
        supabase
          .from('vacunas')
          .select('id,mascota_id,nombre,fecha_aplicacion,dosis,lote,fecha_proxima_dosis')
          .eq('mascota_id', mascota.id)
          .order('fecha_aplicacion', { ascending: false }),
        supabase
          .from('fotos_evolucion')
          .select('id,mascota_id,url,fecha,descripcion')
          .eq('mascota_id', mascota.id)
          .order('fecha', { ascending: false }),
      ])

    if (consultasError) throw new Error(`No se pudieron cargar consultas del expediente: ${consultasError.message}`)
    if (vacunasError) throw new Error(`No se pudieron cargar vacunas del expediente: ${vacunasError.message}`)
    if (fotosError) throw new Error(`No se pudieron cargar fotos de evolución: ${fotosError.message}`)

    const consultaIds = (consultasData ?? []).map(c => c.id)
    const { data: detallesData, error: detallesError } = consultaIds.length
      ? await supabase
          .from('detalles_consulta')
          .select('id,consulta_id,producto_id,nombre_personalizado,cantidad,precio_aplicado,subtotal,catalogo(id,codigo,nombre,descripcion,categoria,precio,activo)')
          .in('consulta_id', consultaIds)
      : { data: [], error: null }

    if (detallesError) throw new Error(`No se pudieron cargar detalles de consulta: ${detallesError.message}`)

    const detallesByConsulta = new Map<string, DetalleConsulta[]>()
    for (const detalle of detallesData ?? []) {
      const mapped = this.mapDetalle(detalle)
      const list = detallesByConsulta.get(mapped.consultaId) ?? []
      list.push(mapped)
      detallesByConsulta.set(mapped.consultaId, list)
    }

    const consultas: Consulta[] = (consultasData ?? []).map(row =>
      this.mapConsulta(row, detallesByConsulta.get(row.id) ?? [])
    )

    const vacunas: Vacuna[] = (vacunasData ?? []).map(row => ({
      id: row.id,
      expedienteId: `exp-${mascota.id}`,
      nombre: row.nombre,
      fechaAplicacion: row.fecha_aplicacion,
      proximaDosis: row.fecha_proxima_dosis ?? undefined,
      lote: row.lote ?? row.dosis ?? undefined,
    }))

    const fotosEvolucion: FotoEvolucion[] = (fotosData ?? []).map(row => ({
      id: row.id,
      expedienteId: `exp-${mascota.id}`,
      url: row.url,
      fecha: row.fecha,
      descripcion: row.descripcion ?? 'Sin descripción',
    }))

    return {
      id: `exp-${mascota.id}`,
      mascotaId: mascota.id,
      mascota,
      consultas,
      fotosEvolucion,
      vacunas,
    }
  }

  async buscarExpedientes(query: string): Promise<Expediente[]> {
    const mascotas = await this.buscar(query)
    const expedientes = await Promise.all(mascotas.map(m => this.getExpedienteById(m.id)))
    return expedientes.filter(Boolean) as Expediente[]
  }

  async actualizar(id: string, data: {
    mascota?: Partial<Pick<Mascota, 'nombre' | 'especie' | 'raza' | 'fechaNacimiento' | 'sexo' | 'color' | 'peso' | 'foto' | 'alergias' | 'notasEspeciales'>>;
    propietario?: Partial<Pick<Propietario, 'nombre' | 'telefono' | 'email' | 'direccion'>>;
  }): Promise<Mascota | undefined> {
    const actual = await this.getById(id)
    if (!actual) return undefined

    if (data.propietario) {
      const { error: propietarioError } = await supabase
        .from('propietarios')
        .update({
          nombre: data.propietario.nombre,
          telefono: data.propietario.telefono,
          email: data.propietario.email,
          direccion: data.propietario.direccion,
          updated_at: new Date().toISOString(),
        })
        .eq('id', actual.propietario.id)

      if (propietarioError) {
        throw new Error(`No se pudo actualizar propietario: ${propietarioError.message}`)
      }
    }

    if (data.mascota) {
      const { error: mascotaError } = await supabase
        .from('mascotas')
        .update({
          nombre: data.mascota.nombre,
          especie: data.mascota.especie,
          raza: data.mascota.raza,
          fecha_nacimiento: data.mascota.fechaNacimiento,
          sexo: data.mascota.sexo,
          color: data.mascota.color,
          peso: data.mascota.peso,
          foto: data.mascota.foto,
          alergias: data.mascota.alergias,
          notas_especiales: data.mascota.notasEspeciales,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (mascotaError) throw new Error(`No se pudo actualizar mascota: ${mascotaError.message}`)
    }

    return this.getById(id)
  }

  async eliminar(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('mascotas')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw new Error(`No se pudo eliminar mascota: ${error.message}`)
    return true
  }

  async registrar(data: RegistrarExpedienteDTO): Promise<Expediente> {
    const { data: propietarioRow, error: propietarioError } = await supabase
      .from('propietarios')
      .insert({
        nombre: data.propietario.nombre,
        telefono: data.propietario.telefono,
        email: data.propietario.email,
        direccion: data.propietario.direccion,
      })
      .select('id')
      .single()

    if (propietarioError) throw new Error(`No se pudo crear propietario: ${propietarioError.message}`)

    const { data: mascotaRow, error: mascotaError } = await supabase
      .from('mascotas')
      .insert({
        nombre: data.mascota.nombre,
        especie: data.mascota.especie,
        raza: data.mascota.raza,
        fecha_nacimiento: data.mascota.fechaNacimiento,
        sexo: data.mascota.sexo,
        color: data.mascota.color,
        peso: data.mascota.peso,
        foto: data.mascota.foto,
        propietario_id: propietarioRow.id,
        alergias: data.mascota.alergias ?? [],
        notas_especiales: data.mascota.notasEspeciales,
      })
      .select('id')
      .single()

    if (mascotaError) throw new Error(`No se pudo crear mascota: ${mascotaError.message}`)

    const expediente = await this.getExpedienteById(mascotaRow.id)
    if (!expediente) throw new Error('No se pudo recuperar el expediente recién creado')
    return expediente
  }
}
