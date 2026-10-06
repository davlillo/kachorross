import type { Consulta, Hospedaje, MonitorSalida, ProcesadoSalida } from '@/types'
import { diasFacturables, fechaLocalClave } from '@/lib/utils'

/** Máximo de tarjetas que muestra el monitor, igual que antes de sumar hospedajes. */
export const LIMITE_MONITOR = 3

/**
 * El monitor mezcla dos fuentes: consultas guardadas que esperan cobro y
 * hospedajes cuya salida ya se registró pero que todavía no se facturaron.
 *
 * `fecha_salida_real` es un DATE sin hora, así que se ancla al final del día. Sin
 * esto `MonitorCard` calcularía "Hace 20 horas" para una salida de la tarde.
 */
function anclaSalidaHospedaje(hospedaje: Hospedaje): string {
  return `${hospedaje.fechaSalidaReal}T23:59:00`
}

function aMonitorHospedaje(hospedaje: Hospedaje): MonitorSalida | null {
  if (!hospedaje.mascota || hospedaje.fechaSalidaReal === null) return null

  return {
    origen: 'hospedaje',
    id: hospedaje.id,
    mascota: hospedaje.mascota,
    horaTermino: anclaSalidaHospedaje(hospedaje),
    total: hospedaje.totalCargo ?? 0,
    estado: 'listo',
    hospedaje,
  }
}

/**
 * Junta ambas fuentes, ordena por fecha descendente y corta en el límite.
 *
 * El corte va acá y no en cada fuente: si cada una limitara por su lado, el
 * hospedaje más reciente quedaría siempre fuera de la lista.
 */
export function combinarMonitor(
  consultas: MonitorSalida[],
  hospedajes: Hospedaje[],
  limite: number = LIMITE_MONITOR,
): MonitorSalida[] {
  const desdeHospedajes = hospedajes
    .map(aMonitorHospedaje)
    .filter(Boolean) as MonitorSalida[]

  return [...consultas, ...desdeHospedajes]
    .sort((a, b) => new Date(b.horaTermino).getTime() - new Date(a.horaTermino).getTime())
    .slice(0, limite)
}

/**
 * Lo que ya se procesó hoy: consultas finalizadas y hospedajes facturados.
 *
 * Los hospedajes se cuentan por `facturado_at` y no por la salida. Si recepción
 * factura hoy un hospedaje que salió ayer, lo de hoy es el cobro: es lo que suma al
 * total del día y lo que revisa quien cierra caja.
 */
export function combinarProcesadosHoy(
  consultas: Consulta[],
  hospedajes: Hospedaje[],
  diaClave: string,
): ProcesadoSalida[] {
  const desdeConsultas: ProcesadoSalida[] = consultas
    .filter(c => c.estado === 'finalizado' && c.fecha && fechaLocalClave(c.fecha) === diaClave)
    .map(consulta => ({
      origen: 'consulta',
      id: consulta.id,
      hora: consulta.fecha,
      motivo: consulta.motivo,
      responsable: consulta.doctora,
      total: consulta.total,
      consulta,
      hospedaje: null,
    }))

  const desdeHospedajes: ProcesadoSalida[] = hospedajes
    .flatMap(hospedaje => {
      // Sin `facturado_at` no hay día al que atribuirlos, así que no entran.
      if (!hospedaje.facturadoAt) return []

      return [{
        origen: 'hospedaje' as const,
        id: hospedaje.id,
        hora: hospedaje.facturadoAt,
        motivo: `Hospedaje · ${diasFacturables(hospedaje.fechaIngreso, hospedaje.fechaSalidaReal ?? hospedaje.fechaIngreso)} días`,
        responsable: hospedaje.mascota?.raza || '',
        total: hospedaje.totalCargo ?? 0,
        consulta: null,
        hospedaje,
      }]
    })

  return [...desdeConsultas, ...desdeHospedajes].sort(
    (a, b) => new Date(b.hora).getTime() - new Date(a.hora).getTime(),
  )
}