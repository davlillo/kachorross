import { supabase } from '@/supabase/client'
import type {
  CostoExportacion,
  ExportacionMascota,
  GuardarExportacionMascotaDTO,
  RequisitoExportacion,
} from '@/types'
import { AuthController } from './auth.controller'

let instance: ExportacionController | null = null

type ExportacionRow = {
  id: string
  veterinaria_id: string
  mascota_id: string
  pais_destino: string
  destino_detalle: string | null
  fecha_tramite_programada: string
  fecha_viaje: string | null
  estado: ExportacionMascota['estado']
  requisitos: unknown
  costos: unknown
  moneda: string
  veterinario_responsable: string
  responsable_id: string | null
  observaciones: string | null
  created_at: string
  updated_at: string
}

const ESTADOS_REQUISITO = new Set(['pendiente', 'en_proceso', 'completado'])
const ESTADOS_EXPORTACION = new Set(['borrador', 'en_proceso', 'completado', 'cancelado'])
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/

function crearId(): string {
  return crypto.randomUUID()
}

export type PlantillaDestinoExportacion = 'estados_unidos' | 'europa' | 'suramerica'

const FORMULARIO_POR_DESTINO: Record<PlantillaDestinoExportacion, {
  nombre: string
  descripcion: string
}> = {
  estados_unidos: {
    nombre: 'CDC Dog Import Form Receipt',
    descripcion: 'El tutor debe completarlo entre 2 y 10 días antes del viaje.',
  },
  europa: {
    nombre: 'Formulario sanitario de ingreso a Europa',
    descripcion: 'Confirmar y completar el formulario exigido por el país europeo de destino.',
  },
  suramerica: {
    nombre: 'Formulario sanitario de ingreso a Suramérica',
    descripcion: 'Confirmar y completar el formulario exigido por el país sudamericano de destino.',
  },
}

export function crearRequisitosDestino(
  destino: PlantillaDestinoExportacion,
): RequisitoExportacion[] {
  const formulario = FORMULARIO_POR_DESTINO[destino]
  return [
    {
      id: crearId(),
      nombre: 'Vacuna antirrábica vigente',
      descripcion: 'Revisar cartilla, fechas, lote y respaldo emitido por el veterinario.',
      estado: 'pendiente',
      obligatorio: true,
    },
    {
      id: crearId(),
      nombre: 'Titulación de anticuerpos contra la rabia',
      descripcion: 'Extracción, preparación, envío y prueba por laboratorio autorizado.',
      estado: 'pendiente',
      obligatorio: true,
    },
    {
      id: crearId(),
      nombre: 'Microchip de identificación',
      descripcion: 'Registrar y comprobar el número de identificación de la mascota.',
      estado: 'pendiente',
      obligatorio: true,
    },
    {
      id: crearId(),
      nombre: 'Certificado de buena salud',
      descripcion: 'Preparar el certificado clínico requerido cerca de la fecha de viaje.',
      estado: 'pendiente',
      obligatorio: true,
    },
    {
      id: crearId(),
      nombre: 'Documentación y validaciones oficiales',
      descripcion: 'Preparar documentos y realizar las diligencias aplicables ante las autoridades.',
      estado: 'pendiente',
      obligatorio: true,
    },
    {
      id: crearId(),
      nombre: formulario.nombre,
      descripcion: formulario.descripcion,
      estado: 'pendiente',
      obligatorio: true,
    },
  ]
}

export function crearCostosExportacionIniciales(): CostoExportacion[] {
  return [
    { id: crearId(), concepto: 'Análisis de anticuerpos por laboratorio autorizado', cantidad: 1, precioUnitario: 375, total: 375 },
    { id: crearId(), concepto: 'Microchip', cantidad: 1, precioUnitario: 50, total: 50 },
    { id: crearId(), concepto: 'Trámites y documentación por el médico', cantidad: 1, precioUnitario: 175, total: 175 },
    { id: crearId(), concepto: 'Certificado de buena salud', cantidad: 1, precioUnitario: 50, total: 50 },
  ]
}

export class ExportacionController {
  static getInstance(): ExportacionController {
    if (!instance) instance = new ExportacionController()
    return instance
  }

  private async getContexto() {
    const user = await AuthController.getInstance().resolveUser()
    if (!user?.veterinariaId) throw new Error('No se encontró la veterinaria del usuario')
    if (user.rol !== 'doctora' && user.rol !== 'admin') {
      throw new Error('No tiene permisos para gestionar trámites de exportación')
    }
    return { user, veterinariaId: user.veterinariaId }
  }

  private normalizarRequisitos(requisitos: RequisitoExportacion[]): RequisitoExportacion[] {
    if (!Array.isArray(requisitos) || requisitos.length === 0) {
      throw new Error('Agregue al menos un requisito al checklist')
    }

    return requisitos.map((requisito) => {
      const nombre = requisito.nombre.trim()
      if (!nombre) throw new Error('Todos los requisitos deben tener un nombre')
      if (!ESTADOS_REQUISITO.has(requisito.estado)) {
        throw new Error(`Estado inválido para el requisito "${nombre}"`)
      }
      return {
        id: requisito.id || crearId(),
        nombre,
        descripcion: requisito.descripcion?.trim() || undefined,
        estado: requisito.estado,
        obligatorio: Boolean(requisito.obligatorio),
      }
    })
  }

  private normalizarCostos(costos: CostoExportacion[]): CostoExportacion[] {
    if (!Array.isArray(costos)) throw new Error('El presupuesto no es válido')

    return costos.map((costo) => {
      const concepto = costo.concepto.trim()
      const cantidad = Number(costo.cantidad)
      const precioUnitario = Number(costo.precioUnitario)
      if (!concepto) throw new Error('Todos los costos deben tener un concepto')
      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        throw new Error(`La cantidad de "${concepto}" debe ser mayor que cero`)
      }
      if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
        throw new Error(`El precio de "${concepto}" no es válido`)
      }
      return {
        id: costo.id || crearId(),
        concepto,
        cantidad,
        precioUnitario,
        total: Math.round(cantidad * precioUnitario * 100) / 100,
      }
    })
  }

  private normalizar(data: GuardarExportacionMascotaDTO) {
    const paisDestino = data.paisDestino.trim()
    const veterinarioResponsable = data.veterinarioResponsable.trim()
    if (!paisDestino) throw new Error('Ingrese el país de destino')
    if (!veterinarioResponsable) throw new Error('Ingrese el veterinario responsable')
    if (!FECHA_RE.test(data.fechaTramiteProgramada)) {
      throw new Error('Ingrese una fecha programada válida')
    }
    if (data.fechaViaje && !FECHA_RE.test(data.fechaViaje)) {
      throw new Error('Ingrese una fecha de viaje válida')
    }
    if (data.fechaViaje && data.fechaViaje < data.fechaTramiteProgramada) {
      throw new Error('La fecha de viaje no puede ser anterior a la fecha del trámite')
    }
    if (!ESTADOS_EXPORTACION.has(data.estado)) {
      throw new Error('El estado general del trámite no es válido')
    }

    return {
      mascota_id: data.mascotaId,
      pais_destino: paisDestino,
      destino_detalle: data.destinoDetalle?.trim() || null,
      fecha_tramite_programada: data.fechaTramiteProgramada,
      fecha_viaje: data.fechaViaje || null,
      estado: data.estado,
      requisitos: this.normalizarRequisitos(data.requisitos),
      costos: this.normalizarCostos(data.costos),
      moneda: (data.moneda || 'USD').trim().toUpperCase().slice(0, 3),
      veterinario_responsable: veterinarioResponsable,
      observaciones: data.observaciones?.trim() || null,
    }
  }

  private map(row: ExportacionRow): ExportacionMascota {
    return {
      id: row.id,
      veterinariaId: row.veterinaria_id,
      mascotaId: row.mascota_id,
      paisDestino: row.pais_destino,
      destinoDetalle: row.destino_detalle ?? undefined,
      fechaTramiteProgramada: row.fecha_tramite_programada,
      fechaViaje: row.fecha_viaje ?? undefined,
      estado: row.estado,
      requisitos: Array.isArray(row.requisitos) ? row.requisitos as RequisitoExportacion[] : [],
      costos: Array.isArray(row.costos) ? row.costos as CostoExportacion[] : [],
      moneda: row.moneda,
      veterinarioResponsable: row.veterinario_responsable,
      responsableId: row.responsable_id ?? undefined,
      observaciones: row.observaciones ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  async listarPorMascota(mascotaId: string): Promise<ExportacionMascota[]> {
    const { veterinariaId } = await this.getContexto()
    const { data, error } = await supabase
      .from('exportaciones_mascota')
      .select('*')
      .eq('veterinaria_id', veterinariaId)
      .eq('mascota_id', mascotaId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`No se pudieron cargar los trámites: ${error.message}`)
    return (data ?? []).map(row => this.map(row as ExportacionRow))
  }

  async crear(data: GuardarExportacionMascotaDTO): Promise<ExportacionMascota> {
    const { user, veterinariaId } = await this.getContexto()
    const payload = this.normalizar(data)
    const { data: created, error } = await supabase
      .from('exportaciones_mascota')
      .insert({
        ...payload,
        veterinaria_id: veterinariaId,
        responsable_id: user.id,
      })
      .select('*')
      .single()

    if (error || !created) {
      throw new Error(`No se pudo registrar el trámite: ${error?.message ?? 'respuesta vacía'}`)
    }
    return this.map(created as ExportacionRow)
  }

  async actualizar(id: string, data: GuardarExportacionMascotaDTO): Promise<ExportacionMascota> {
    const { user, veterinariaId } = await this.getContexto()
    const payload = this.normalizar(data)
    const { data: updated, error } = await supabase
      .from('exportaciones_mascota')
      .update({ ...payload, responsable_id: user.id })
      .eq('id', id)
      .eq('veterinaria_id', veterinariaId)
      .select('*')
      .single()

    if (error || !updated) {
      throw new Error(`No se pudo actualizar el trámite: ${error?.message ?? 'respuesta vacía'}`)
    }
    return this.map(updated as ExportacionRow)
  }
}
