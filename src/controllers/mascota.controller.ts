import { supabase } from '@/supabase/client'
import { validarArchivoEvolucion } from '@/lib/archivoEvolucion'
import type {
  Consulta,
  Desparasitacion,
  DetalleConsulta,
  Expediente,
  ExpedienteResumen,
  FotoEvolucion,
  Mascota,
  Producto,
  Propietario,
  RegistrarExpedienteDTO,
  Vacuna,
} from '@/types'
import { AuthController } from './auth.controller'
import { normalizeCategoria } from '@/lib/catalogo-categorias'
import { escapeILike } from '@/lib/sanitize'
import { todayLocal } from '@/lib/utils'

let instance: MascotaController | null = null

export class MascotaController {
  static getInstance(): MascotaController {
    if (!instance) instance = new MascotaController()
    return instance
  }

  private mapMascota(row: any): Mascota {
    const propietario: Propietario = {
      id: row.propietarios?.id ?? '',
      veterinariaId: row.propietarios?.veterinaria_id ?? '',
      nombre: row.propietarios?.nombre ?? '',
      telefono: row.propietarios?.telefono ?? '',
      email: row.propietarios?.email ?? undefined,
      direccion: row.propietarios?.direccion ?? undefined,
    }

    return {
      id: row.id,
      veterinariaId: row.veterinaria_id ?? '',
      nombre: row.nombre,
      especie: row.especie as Mascota['especie'],
      raza: row.raza,
      fechaNacimiento: row.fecha_nacimiento ?? null,
      sexo: row.sexo as Mascota['sexo'],
      color: row.color ?? '',
      peso: Number(row.peso ?? 0),
      foto: row.foto ?? undefined,
      propietario,
      alergias: (row.alergias ?? []) as string[],
      notasEspeciales: row.notas_especiales ?? undefined,
      fechaRegistro: row.fecha_registro ?? todayLocal(),
    }
  }

  private mapDetalle(row: any): DetalleConsulta {
    const producto: Producto = {
      id: row.catalogo?.id ?? '',
      veterinariaId: '',
      codigo: row.catalogo?.codigo ?? 'MANUAL',
      nombre: row.catalogo?.nombre ?? row.nombre_personalizado ?? 'Item sin catálogo',
      descripcion: row.catalogo?.descripcion ?? '',
      categoria: normalizeCategoria(row.catalogo?.categoria ?? 'consulta', row.catalogo?.codigo),
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
      veterinariaId: row.veterinaria_id ?? '',
      mascotaId: row.mascota_id,
      fecha: row.fecha,
      motivo: row.motivo,
      sintomas: row.sintomas ?? '',
      diagnostico: row.diagnostico ?? '',
      tratamiento: row.tratamiento ?? '',
      notas: row.notas ?? '',
      doctora: row.doctora?.nombre ?? 'Doctora',
      medicoResponsable: row.medico_responsable ?? undefined,
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

  async getAll(): Promise<Mascota[]> {
    const veterinariaId = await this.getVeterinariaId()
    if (!veterinariaId) return []

    const { data, error } = await supabase
      .from('mascotas')
      .select('id,nombre,especie,raza,fecha_nacimiento,sexo,color,peso,foto,alergias,notas_especiales,fecha_registro,activo,veterinaria_id,propietarios(id,nombre,telefono,email,direccion,veterinaria_id)')
      .eq('veterinaria_id', veterinariaId)
      .eq('activo', true)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`No se pudieron cargar mascotas: ${error.message}`)
    return (data ?? []).map(row => this.mapMascota(row))
  }

  async getByIds(ids: string[]): Promise<Mascota[]> {
    if (ids.length === 0) return []

    const veterinariaId = await this.getVeterinariaId()
    if (!veterinariaId) return []

    const { data, error } = await supabase
      .from('mascotas')
      .select('id,nombre,especie,raza,fecha_nacimiento,sexo,color,peso,foto,alergias,notas_especiales,fecha_registro,veterinaria_id,propietarios(id,nombre,telefono,email,direccion,veterinaria_id)')
      .in('id', ids)
      .eq('veterinaria_id', veterinariaId)
      .eq('activo', true)

    if (error) throw new Error(`No se pudieron cargar mascotas: ${error.message}`)
    return (data ?? []).map(row => this.mapMascota(row))
  }

  async getById(id: string): Promise<Mascota | undefined> {
    const veterinariaId = await this.getVeterinariaId()
    if (!veterinariaId) return undefined

    const { data, error } = await supabase
      .from('mascotas')
      .select('id,nombre,especie,raza,fecha_nacimiento,sexo,color,peso,foto,alergias,notas_especiales,fecha_registro,veterinaria_id,propietarios(id,nombre,telefono,email,direccion,veterinaria_id)')
      .eq('id', id)
      .eq('veterinaria_id', veterinariaId)
      .maybeSingle()

    if (error) throw new Error(`No se pudo cargar mascota: ${error.message}`)
    return data ? this.mapMascota(data) : undefined
  }

  async buscar(query: string): Promise<Mascota[]> {
    const q = query.trim()
    const veterinariaId = await this.getVeterinariaId()
    if (!veterinariaId) return []

    const selectFields = 'id,nombre,especie,raza,fecha_nacimiento,sexo,color,peso,foto,alergias,notas_especiales,fecha_registro,activo,veterinaria_id,propietarios(id,nombre,telefono,email,direccion,veterinaria_id)'

    const base = () =>
      supabase
        .from('mascotas')
        .select(selectFields)
        .eq('veterinaria_id', veterinariaId)
        .eq('activo', true)
        .order('created_at', { ascending: false })

    if (!q) {
      const { data, error } = await base()
      if (error) throw new Error(`No se pudieron buscar mascotas: ${error.message}`)
      return (data ?? []).map(row => this.mapMascota(row))
    }

    // Query A: buscar por nombre o raza de la mascota
    const { data: petData } = await base()
      .or(`nombre.ilike.%${escapeILike(q)}%,raza.ilike.%${escapeILike(q)}%`)

    const map = new Map<string, any>()
    for (const row of petData ?? []) map.set(row.id, row)

    // Query B: buscar propietarios por nombre o teléfono
    const { data: ownerData } = await supabase
      .from('propietarios')
      .select('id')
      .eq('veterinaria_id', veterinariaId)
      .or(`nombre.ilike.%${escapeILike(q)}%,telefono.ilike.%${escapeILike(q)}%`)

    if (ownerData && ownerData.length > 0) {
      const ownerIds = ownerData.map(o => o.id)
      const { data: ownerPetData } = await base()
        .in('propietario_id', ownerIds)

      for (const row of ownerPetData ?? []) {
        if (!map.has(row.id)) map.set(row.id, row)
      }
    }

    return Array.from(map.values()).map(row => this.mapMascota(row))
  }

  async listarExpedientesResumen(query = ''): Promise<ExpedienteResumen[]> {
    const mascotas = await this.buscar(query)
    if (mascotas.length === 0) return []

    const mascotaIds = mascotas.map(m => m.id)
    const { data: consultasData, error: consultasError } = await supabase
      .from('consultas')
      .select('mascota_id')
      .in('mascota_id', mascotaIds)

    if (consultasError) {
      throw new Error(`No se pudieron contar consultas: ${consultasError.message}`)
    }

    const counts = new Map<string, number>()
    for (const row of consultasData ?? []) {
      counts.set(row.mascota_id, (counts.get(row.mascota_id) ?? 0) + 1)
    }

    return mascotas.map(mascota => ({
      id: `exp-${mascota.id}`,
      mascotaId: mascota.id,
      mascota,
      consultasCount: counts.get(mascota.id) ?? 0,
    }))
  }

  async getExpedienteById(id: string): Promise<Expediente | undefined> {
    const veterinariaId = await this.getVeterinariaId()
    if (!veterinariaId) return undefined

    const mascota =
      (await this.getById(id)) ??
      (await (async () => {
        const { data, error } = await supabase
          .from('mascotas')
          .select('id,nombre,especie,raza,fecha_nacimiento,sexo,color,peso,foto,alergias,notas_especiales,fecha_registro,veterinaria_id,propietarios(id,nombre,telefono,email,direccion,veterinaria_id)')
          .eq('id', id.replace('exp-', ''))
          .eq('veterinaria_id', veterinariaId)
          .maybeSingle()
        if (error) throw new Error(`No se pudo cargar expediente: ${error.message}`)
        return data ? this.mapMascota(data) : undefined
      })())

    if (!mascota) return undefined

    const [{ data: consultasData, error: consultasError }, { data: vacunasData, error: vacunasError }, { data: fotosData, error: fotosError }, { data: desparasitacionesData, error: desparasitacionesError }] =
      await Promise.all([
        supabase
          .from('consultas')
          .select('id,mascota_id,fecha,motivo,sintomas,diagnostico,tratamiento,notas,estado,total,proxima_cita,tipo_seguimiento,veterinaria_id,medico_responsable,doctora:perfiles(nombre)')
          .eq('mascota_id', mascota.id)
          .eq('veterinaria_id', veterinariaId)
          .order('fecha', { ascending: false }),
        supabase
          .from('vacunas')
          .select('id,mascota_id,nombre,fecha_aplicacion,dosis,lote,fecha_proxima_dosis,aplicada_por,veterinaria_id')
          .eq('mascota_id', mascota.id)
          .eq('veterinaria_id', veterinariaId)
          .order('fecha_aplicacion', { ascending: false }),
        supabase
          .from('fotos_evolucion')
          .select('id,mascota_id,url,fecha,descripcion,veterinaria_id,consulta_id,tipo_archivo')
          .eq('mascota_id', mascota.id)
          .eq('veterinaria_id', veterinariaId)
          .order('fecha', { ascending: false }),
        supabase
          .from('desparasitaciones')
          .select('id,mascota_id,tipo,via_administracion,fecha_aplicacion,fecha_proximo_tratamiento,medico_responsable,veterinaria_id')
          .eq('mascota_id', mascota.id)
          .eq('veterinaria_id', veterinariaId)
          .order('fecha_aplicacion', { ascending: false }),
      ])

    if (consultasError) throw new Error(`No se pudieron cargar consultas del expediente: ${consultasError.message}`)
    if (vacunasError) throw new Error(`No se pudieron cargar vacunas del expediente: ${vacunasError.message}`)
    if (fotosError) throw new Error(`No se pudieron cargar fotos de evolución: ${fotosError.message}`)
    if (desparasitacionesError) throw new Error(`No se pudieron cargar desparasitaciones: ${desparasitacionesError.message}`)

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
      mascotaId: row.mascota_id,
      expedienteId: `exp-${mascota.id}`,
      nombre: row.nombre,
      fechaAplicacion: row.fecha_aplicacion,
      dosis: row.dosis ?? undefined,
      proximaDosis: row.fecha_proxima_dosis ?? undefined,
      lote: row.lote ?? undefined,
      aplicadaPor: row.aplicada_por ?? undefined,
    }))

    const fotosEvolucion: FotoEvolucion[] = (fotosData ?? []).map(row => ({
      id: row.id,
      expedienteId: `exp-${mascota.id}`,
      url: row.url,
      fecha: row.fecha,
      descripcion: row.descripcion ?? 'Sin descripción',
      consultaId: row.consulta_id ?? undefined,
      tipoArchivo: row.tipo_archivo ?? undefined,
    }))

    const desparasitaciones: Desparasitacion[] = (desparasitacionesData ?? []).map(row => ({
      id: row.id,
      mascotaId: row.mascota_id,
      expedienteId: `exp-${mascota.id}`,
      tipo: row.tipo,
      viaAdministracion: row.via_administracion,
      fechaAplicacion: row.fecha_aplicacion,
      fechaProximoTratamiento: row.fecha_proximo_tratamiento ?? undefined,
      medicoResponsable: row.medico_responsable ?? undefined,
    }))

    return {
      id: `exp-${mascota.id}`,
      mascotaId: mascota.id,
      mascota,
      consultas,
      fotosEvolucion,
      vacunas,
      desparasitaciones,
    }
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
          fecha_nacimiento: data.mascota.fechaNacimiento || null,
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

  async subirFotoPerfil(mascotaId: string, file: File): Promise<string> {
    const veterinariaId = await this.getVeterinariaId()
    if (!veterinariaId) throw new Error('No hay veterinaria activa')

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const filePath = `${veterinariaId}/${mascotaId}/${crypto.randomUUID()}.${ext}`
    const contentType = file.type || `image/${ext}`

    const { error: uploadError } = await supabase.storage
      .from('mascotas')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      })

    if (uploadError) throw new Error(`No se pudo subir la foto: ${uploadError.message}`)

    const { data: urlData } = supabase.storage.from('mascotas').getPublicUrl(filePath)
    const fotoUrl = urlData.publicUrl

    const { error: updateError } = await supabase
      .from('mascotas')
      .update({ foto: fotoUrl, updated_at: new Date().toISOString() })
      .eq('id', mascotaId)

    if (updateError) throw new Error(`No se pudo actualizar la foto de perfil: ${updateError.message}`)

    return fotoUrl
  }

  async subirFotoEvolucion(
    mascotaId: string,
    file: File,
    descripcion?: string,
    consultaId?: string
  ): Promise<FotoEvolucion> {
    const veterinariaId = await this.getVeterinariaId()
    if (!veterinariaId) throw new Error('No hay veterinaria activa')

    validarArchivoEvolucion(file)

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const filePath = `${veterinariaId}/${mascotaId}/${crypto.randomUUID()}.${ext}`
    const contentType = file.type || `image/${ext}`

    const { error: uploadError } = await supabase.storage
      .from('fotos_evolucion')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      })

    if (uploadError) throw new Error(`No se pudo subir la foto: ${uploadError.message}`)

    const { data: urlData } = supabase.storage.from('fotos_evolucion').getPublicUrl(filePath)

    const { data: row, error: insertError } = await supabase
      .from('fotos_evolucion')
      .insert({
        veterinaria_id: veterinariaId,
        mascota_id: mascotaId,
        consulta_id: consultaId ?? null,
        url: urlData.publicUrl,
        descripcion: descripcion?.trim() || null,
        tipo_archivo: file.type || null,
      })
      .select('id,mascota_id,url,fecha,descripcion,veterinaria_id,consulta_id,tipo_archivo')
      .single()

    if (insertError) throw new Error(`No se pudo registrar la foto de evolución: ${insertError.message}`)

    return {
      id: row.id,
      expedienteId: `exp-${mascotaId}`,
      url: row.url,
      fecha: row.fecha,
      descripcion: row.descripcion ?? 'Sin descripción',
      consultaId: row.consulta_id ?? undefined,
      tipoArchivo: row.tipo_archivo ?? undefined,
    }
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
    const auth = AuthController.getInstance()
    const currentUser = await auth.resolveUser()
    if (!currentUser?.veterinariaId) throw new Error('No hay veterinaria activa')

    const { data: duplicado } = await supabase
      .from('mascotas')
      .select('id, propietarios!inner(nombre)')
      .eq('veterinaria_id', currentUser.veterinariaId)
      .eq('nombre', data.mascota.nombre)
      .eq('activo', true)
      .eq('propietarios.nombre', data.propietario.nombre)
      .maybeSingle()

    if (duplicado) {
      throw new Error('Ya existe un paciente con ese nombre y propietario.')
    }

    const { data: propietarioRow, error: propietarioError } = await supabase
      .from('propietarios')
      .insert({
        veterinaria_id: currentUser.veterinariaId,
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
        veterinaria_id: currentUser.veterinariaId,
        nombre: data.mascota.nombre,
        especie: data.mascota.especie,
        raza: data.mascota.raza,
        fecha_nacimiento: data.mascota.fechaNacimiento || null,
        sexo: data.mascota.sexo,
        color: data.mascota.color,
        peso: data.mascota.peso,
        foto: data.mascota.foto,
        propietario_id: propietarioRow.id,
        alergias: data.mascota.alergias ?? [],
        notas_especiales: data.mascota.notasEspeciales,
        fecha_registro: todayLocal(),
      })
      .select('id')
      .single()

    if (mascotaError) throw new Error(`No se pudo crear mascota: ${mascotaError.message}`)

    const expediente = await this.getExpedienteById(mascotaRow.id)
    if (!expediente) throw new Error('No se pudo recuperar el expediente recién creado')
    return expediente
  }
}
