import { supabase } from '@/supabase/client'
import { formatDateLocal } from '@/lib/utils'
import type { EstadoCobroHospedaje, EstadoHospedaje, GuardarHospedajeDTO, Hospedaje, Mascota, Propietario } from '@/types'
import { AuthController } from './auth.controller'

let instance: HospedajeController | null = null

type PropietarioRow = {
  id?: string
  veterinaria_id?: string
  nombre?: string
  telefono?: string
  email?: string | null
  direccion?: string | null
}

type MascotaRow = {
  id?: string
  veterinaria_id?: string
  nombre?: string
  especie?: string
  raza?: string
  fecha_nacimiento?: string | null
  sexo?: string
  color?: string | null
  peso?: number | null
  foto?: string | null
  alergias?: string[] | null
  notas_especiales?: string | null
  fecha_registro?: string | null
  propietarios?: PropietarioRow | PropietarioRow[] | null
}

type HospedajeRow = {
  id: string
  veterinaria_id: string
  mascota_id: string
  fecha_ingreso: string
  fecha_salida_estimada: string
  fecha_salida_real: string | null
  tarifa_diaria: number
  total_cargo: number | null
  observaciones: string | null
  estado: EstadoHospedaje
  estado_cobro: EstadoCobroHospedaje
  facturado_at: string | null
  consulta_id: string | null
  mascotas?: MascotaRow | MascotaRow[] | null
}

/**
 * Columnas que se escriben al registrar. Se derivan de `HospedajeRow` para que un
 * nombre de columna mal escrito sea un error de compilación y no un error de PostgREST.
 */
type HospedajeInsert = Pick<
  HospedajeRow,
  | 'mascota_id'
  | 'fecha_ingreso'
  | 'fecha_salida_estimada'
  | 'tarifa_diaria'
  | 'observaciones'
>

const SELECT_HOSPEDAJE =
  'id,veterinaria_id,mascota_id,fecha_ingreso,fecha_salida_estimada,fecha_salida_real,tarifa_diaria,total_cargo,observaciones,estado,estado_cobro,facturado_at,consulta_id,' +
  'mascotas(id,veterinaria_id,nombre,especie,raza,fecha_nacimiento,sexo,color,peso,foto,alergias,notas_especiales,fecha_registro,propietarios(id,veterinaria_id,nombre,telefono,email,direccion))'

const ESPECIES = new Set(['perro', 'gato', 'ave', 'conejo', 'otro'])
const SEXOS = new Set(['macho', 'hembra'])
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/

/** PostgREST puede devolver una relación to-one como objeto o como arreglo de un elemento. */
function primero<T>(relacion: T | T[] | null | undefined): T | null {
  if (!relacion) return null
  return Array.isArray(relacion) ? relacion[0] ?? null : relacion
}

function mapPropietario(row: PropietarioRow | null): Propietario | null {
  if (!row?.nombre) return null
  return {
    id: row.id ?? '',
    veterinariaId: row.veterinaria_id ?? '',
    nombre: row.nombre,
    telefono: row.telefono ?? '',
    email: row.email ?? undefined,
    direccion: row.direccion ?? undefined,
  }
}

function mapMascota(relacion: MascotaRow | MascotaRow[] | null | undefined): Mascota | null {
  const row = primero(relacion)
  if (!row?.nombre) return null

  const propietario = mapPropietario(primero(row.propietarios))

  return {
    id: row.id ?? '',
    veterinariaId: row.veterinaria_id ?? '',
    nombre: row.nombre,
    especie: (ESPECIES.has(row.especie ?? '') ? row.especie : 'otro') as Mascota['especie'],
    raza: row.raza ?? '',
    fechaNacimiento: row.fecha_nacimiento ?? null,
    sexo: (SEXOS.has(row.sexo ?? '') ? row.sexo : 'macho') as Mascota['sexo'],
    color: row.color ?? '',
    peso: Number(row.peso ?? 0),
    foto: row.foto ?? undefined,
    propietario: propietario ?? { id: '', veterinariaId: '', nombre: '', telefono: '' },
    alergias: row.alergias ?? [],
    notasEspeciales: row.notas_especiales ?? undefined,
    fechaRegistro: row.fecha_registro ?? '',
  }
}

export class HospedajeController {
  static getInstance(): HospedajeController {
    if (!instance) instance = new HospedajeController()
    return instance
  }

  /**
   * Contexto de escritura: solo doctora y admin gestionan hospedajes.
   */
  private async getContexto() {
    const user = await AuthController.getInstance().resolveUser()
    if (!user?.veterinariaId) throw new Error('No se encontró la veterinaria del usuario')
    if (user.rol !== 'doctora' && user.rol !== 'admin') {
      throw new Error('No tiene permisos para gestionar hospedajes')
    }
    return { user, veterinariaId: user.veterinariaId }
  }

  /**
   * Contexto de lectura del monitor de prefacturación. Recepción entra acá: la
   * política RLS limita su visibilidad a las estancias cerradas y pendientes de
   * cobro, que es lo único que necesita ver para facturar.
   */
  private async getContextoMonitor() {
    const user = await AuthController.getInstance().resolveUser()
    if (!user?.veterinariaId) throw new Error('No se encontró la veterinaria del usuario')
    if (user.rol !== 'doctora' && user.rol !== 'admin' && user.rol !== 'recepcion') {
      throw new Error('No tiene permisos para ver el monitor de hospedajes')
    }
    return { user, veterinariaId: user.veterinariaId }
  }

  private map(row: HospedajeRow): Hospedaje {
    return {
      id: row.id,
      veterinariaId: row.veterinaria_id,
      mascotaId: row.mascota_id,
      mascota: mapMascota(row.mascotas),
      fechaIngreso: row.fecha_ingreso,
      fechaSalidaEstimada: row.fecha_salida_estimada,
      fechaSalidaReal: row.fecha_salida_real,
      tarifaDiaria: Number(row.tarifa_diaria),
      totalCargo: row.total_cargo === null ? null : Number(row.total_cargo),
      observaciones: row.observaciones ?? undefined,
      estado: row.estado,
      estadoCobro: row.estado_cobro,
      facturadoAt: row.facturado_at ?? null,
      consultaId: row.consulta_id ?? undefined,
    }
  }

  /**
   * Valida el registro. Solo se hospedan mascotas del expediente, así que la
   * referencia a `mascota_id` es obligatoria y la base la refuerza con NOT NULL.
   */
  private normalizar(data: GuardarHospedajeDTO): HospedajeInsert {
    const fechaIngreso = data.fechaIngreso.trim()
    const fechaSalidaEstimada = data.fechaSalidaEstimada.trim()
    const tarifaDiaria = Number(data.tarifaDiaria)
    const mascotaId = data.mascotaId?.trim()

    if (!mascotaId) throw new Error('Seleccione la mascota a hospedar')
    if (!FECHA_RE.test(fechaIngreso)) throw new Error('Ingrese una fecha de ingreso válida')
    if (!FECHA_RE.test(fechaSalidaEstimada)) throw new Error('Ingrese una fecha de salida estimada válida')
    if (fechaSalidaEstimada < fechaIngreso) {
      throw new Error('La salida estimada no puede ser anterior al ingreso')
    }
    if (!Number.isFinite(tarifaDiaria) || tarifaDiaria <= 0) {
      throw new Error('La tarifa diaria debe ser mayor que cero')
    }

    return {
      mascota_id: mascotaId,
      fecha_ingreso: fechaIngreso,
      fecha_salida_estimada: fechaSalidaEstimada,
      tarifa_diaria: tarifaDiaria,
      observaciones: data.observaciones?.trim() || null,
    }
  }

  /**
   * `estado` se filtra en SQL porque usa el índice (veterinaria_id, estado).
   * `query` se filtra en memoria sobre la relación ya resuelta, porque un `or()` de
   * PostgREST que alcance a `mascotas` y a `propietarios` anidados no es expresable.
   */
  async listar(filtros: { estado?: EstadoHospedaje; query?: string } = {}): Promise<Hospedaje[]> {
    const { veterinariaId } = await this.getContexto()

    let query = supabase
      .from('hospedajes')
      .select(SELECT_HOSPEDAJE)
      .eq('veterinaria_id', veterinariaId)
      .order('fecha_ingreso', { ascending: false })

    if (filtros.estado) query = query.eq('estado', filtros.estado)

    const { data, error } = await query
    if (error) throw new Error(`No se pudieron cargar los hospedajes: ${error.message}`)

    const hospedajes = ((data ?? []) as unknown as HospedajeRow[]).map(row => this.map(row))

    const q = filtros.query?.trim().toLowerCase()
    if (!q) return hospedajes

    return hospedajes.filter(h => {
      const campos = [
        h.mascota?.nombre ?? '',
        h.mascota?.raza ?? '',
        h.mascota?.propietario.nombre ?? '',
        h.mascota?.propietario.telefono ?? '',
      ]
      return campos.some(campo => campo.toLowerCase().includes(q))
    })
  }

  /**
   * Cuántas mascotas están en hospedaje ahora.
   *
   * Usa `head: true` para que PostgREST solo devuelva el conteo. Traer las filas
   * completas con la mascota y el propietario embebidos para contar would cargar en
   * memoria lo que el dashboard solo necesita como número.
   */
  async contarActivos(): Promise<number> {
    const { veterinariaId } = await this.getContexto()

    const { count, error } = await supabase
      .from('hospedajes')
      .select('id', { count: 'exact', head: true })
      .eq('veterinaria_id', veterinariaId)
      .eq('estado', 'activo')

    if (error) throw new Error(`No se pudo contar las mascotas en hospedaje: ${error.message}`)

    return count ?? 0
  }

  /**
   * Estancias cerradas y todavía no cobradas, que es lo que el monitor de
   * prefacturación muestra a recepción. El filtro de `estado_cobro` es el que saca
   * la estancia del monitor cuando se factura, y coincide con el índice parcial.
   */
  async listarParaPrefacturacion(): Promise<Hospedaje[]> {
    const { veterinariaId } = await this.getContextoMonitor()

    const { data, error } = await supabase
      .from('hospedajes')
      .select(SELECT_HOSPEDAJE)
      .eq('veterinaria_id', veterinariaId)
      .eq('estado', 'finalizado')
      .eq('estado_cobro', 'pendiente')
      .order('fecha_salida_real', { ascending: false })

    if (error) throw new Error(`No se pudieron cargar los hospedajes a facturar: ${error.message}`)

    return ((data ?? []) as unknown as HospedajeRow[]).map(row => this.map(row))
  }

  /**
   * Hospedajes ya facturados dentro de un rango, ordenados por hora de cobro.
   *
   * Alimenta "Consultas del Día" y los totales del dashboard. El rango entra como UTC
   * porque `facturado_at` es `timestamptz`: si se filtrara por día en la zona del
   * servidor (UTC) el corte caería seis horas antes del cierre de caja local.
   *
   * Comparte el contexto del monitor porque recepción también necesita esto para la
   * pestaña del día, y la política RLS ya le abre las estancias facturadas de su
   * veterinaria.
   */
  async listarFacturados(desdeUtc: string, hastaUtc: string): Promise<Hospedaje[]> {
    const { veterinariaId } = await this.getContextoMonitor()

    const { data, error } = await supabase
      .from('hospedajes')
      .select(SELECT_HOSPEDAJE)
      .eq('veterinaria_id', veterinariaId)
      .eq('estado_cobro', 'facturado')
      .not('facturado_at', 'is', null)
      .gte('facturado_at', desdeUtc)
      .lt('facturado_at', hastaUtc)
      .order('facturado_at', { ascending: false })

    if (error) throw new Error(`No se pudieron cargar los hospedajes facturados: ${error.message}`)

    return ((data ?? []) as unknown as HospedajeRow[]).map(row => this.map(row))
  }

  /**
   * Recepción marca la estancia como facturada y con esto sale del monitor.
   *
   * Pasa por una RPC `security definer` en vez de un UPDATE directo porque RLS no
   * filtra por columna: si le diéramos UPDATE a recepción podría alterar
   * `tarifa_diaria` o `fecha_salida_real`. La función además es idempotente,
   * devuelve false si la estancia ya estaba facturada o no le pertenece.
   */
  async marcarFacturado(id: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('marcar_hospedaje_facturado', {
      p_hospedaje_id: id,
    })

    if (error) throw new Error(`No se pudo marcar el hospedaje como facturado: ${error.message}`)

    return data === true
  }

  /**
   * Replica en el cliente la regla de solapamiento del trigger
   * `trigger_hospedajes_sin_solapamiento`, para poder avisar sin gastar un viaje a la
   * base y con un mensaje que se pueda mostrar tal cual.
   *
   * No es una frontera de seguridad: la validación que manda es la del trigger, que
   * cubre cualquier cliente. Si alguna vez se contradicen, el trigger gana. Por eso
   * el mensaje se arma acá y no se intenta interpretar el error de Postgres.
   */
  private async validarSinSolapamiento(
    mascotaId: string,
    fechaIngreso: string,
    fechaSalida: string,
    excluirId?: string,
  ): Promise<void> {
    const { veterinariaId } = await this.getContexto()

    // Se trae solo fecha y estado: el rango se evalúa acá y no en SQL, para poder
    // diferenciar los dos mensajes.
    let query = supabase
      .from('hospedajes')
      .select('id,estado,fecha_ingreso,fecha_salida_estimada,fecha_salida_real')
      .eq('veterinaria_id', veterinariaId)
      .eq('mascota_id', mascotaId)

    if (excluirId) query = query.neq('id', excluirId)

    const { data, error } = await query
    if (error) {
      // Si no se puede leer el estado actual no se bloquea el registro: el trigger
      // sigue siendo la autoridad y va a fallar si de verdad hay conflicto.
      return
    }

    const existentes = (data ?? []) as {
      id: string
      estado: EstadoHospedaje
      fecha_ingreso: string
      fecha_salida_estimada: string
      fecha_salida_real: string | null
    }[]

    for (const existente of existentes) {
      const finExistente = existente.fecha_salida_real ?? existente.fecha_salida_estimada

      // Extremos cerrados porque el cobro cuenta el día de salida como jornada: dos
      // estancias que comparten un día sí se pisan.
      if (fechaIngreso <= finExistente && existente.fecha_ingreso <= fechaSalida) {
        throw new Error(
          `La mascota ya tiene un hospedaje del ${formatDateLocal(existente.fecha_ingreso)} ` +
            `al ${formatDateLocal(finExistente)}. El período del ${formatDateLocal(fechaIngreso)} ` +
            `al ${formatDateLocal(fechaSalida)} se superpone.`,
        )
      }

      if (existente.estado === 'activo' && fechaSalida >= existente.fecha_ingreso) {
        throw new Error(
          `La mascota está en hospedaje desde el ${formatDateLocal(existente.fecha_ingreso)}. ` +
            'Solo se puede registrar un período anterior a esa fecha.',
        )
      }
    }
  }

  async crear(data: GuardarHospedajeDTO): Promise<Hospedaje> {
    const { veterinariaId } = await this.getContexto()
    const payload = this.normalizar(data)

    await this.validarSinSolapamiento(
      payload.mascota_id,
      payload.fecha_ingreso,
      payload.fecha_salida_estimada,
    )

    const { data: created, error } = await supabase
      .from('hospedajes')
      .insert({ ...payload, veterinaria_id: veterinariaId, estado: 'activo', estado_cobro: 'pendiente' })
      .select(SELECT_HOSPEDAJE)
      .single()

    if (error || !created) {
      throw new Error(`No se pudo registrar el hospedaje: ${error?.message ?? 'respuesta vacía'}`)
    }
    return this.map(created as unknown as HospedajeRow)
  }

  /**
   * Registra la salida real y finaliza la estancia. El total lo calcula el trigger
   * `update_hospedaje_cargo` y `updated_at` lo mantiene `update_hospedajes_updated_at`,
   * así que aquí solo se envían los datos de la salida.
   */
  async registrarSalida(id: string, fechaSalidaReal: string): Promise<Hospedaje> {
    const { veterinariaId } = await this.getContexto()
    const fecha = fechaSalidaReal.trim()

    if (!FECHA_RE.test(fecha)) throw new Error('Ingrese una fecha de salida válida')

    const { data: actual, error: actualError } = await supabase
      .from('hospedajes')
      .select('id,estado,fecha_ingreso,mascota_id')
      .eq('id', id)
      .eq('veterinaria_id', veterinariaId)
      .maybeSingle()

    if (actualError) {
      throw new Error(`No se pudo consultar el hospedaje: ${actualError.message}`)
    }
    if (!actual) throw new Error('El hospedaje no existe')
    if (actual.estado === 'finalizado') throw new Error('El hospedaje ya tiene una salida registrada')
    if (fecha < actual.fecha_ingreso) {
      throw new Error('La salida no puede ser anterior al ingreso')
    }

    // Registrar la salida cambia el final del período, así que puede metserse en el de
    // otra estancia de la misma mascota que se hubiera cargado después. El trigger
    // corta igual; esto es para que el error llegue antes.
    await this.validarSinSolapamiento(actual.mascota_id, actual.fecha_ingreso, fecha, id)

    // La estancia queda 'pendiente' de cobro: recién al registrar la salida entra
    // al monitor de prefacturación, y de ahí sale cuando recepción la factura.
    const { data: updated, error } = await supabase
      .from('hospedajes')
      .update({
        fecha_salida_real: fecha,
        estado: 'finalizado',
        estado_cobro: 'pendiente',
      })
      .eq('id', id)
      .eq('veterinaria_id', veterinariaId)
      .select(SELECT_HOSPEDAJE)
      .single()

    if (error || !updated) {
      throw new Error(`No se pudo registrar la salida: ${error?.message ?? 'respuesta vacía'}`)
    }
    return this.map(updated as unknown as HospedajeRow)
  }
}