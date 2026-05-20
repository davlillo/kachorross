import type { Consulta, DetalleConsulta, MonitorSalida } from '@/types'
import { consultasPendientes, consultasHistoricas, mascotas } from '@/data/mockData'

let instance: ConsultaController | null = null

export class ConsultaController {
  private data: Consulta[]

  private constructor() {
    this.data = [...consultasPendientes, ...consultasHistoricas]
  }

  static getInstance(): ConsultaController {
    if (!instance) instance = new ConsultaController()
    return instance
  }

  getAll(): Consulta[] {
    return this.data
  }

  getPendientes(): Consulta[] {
    return this.data.filter(c => c.estado === 'pendiente')
  }

  getByMascota(mascotaId: string): Consulta[] {
    return this.data
      .filter(c => c.mascotaId === mascotaId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }

  crear(data: Partial<Consulta>): Consulta {
    const nueva: Consulta = {
      id: `c${Date.now()}`,
      mascotaId: data.mascotaId || '',
      fecha: new Date().toISOString(),
      motivo: data.motivo || '',
      sintomas: data.sintomas || '',
      diagnostico: data.diagnostico || '',
      tratamiento: data.tratamiento || '',
      notas: data.notas || '',
      doctora: 'Dra. Maritza López',
      estado: 'pendiente',
      total: data.total || 0,
      detalles: data.detalles || [],
      proximaCita: data.proximaCita,
    }
    this.data.unshift(nueva)
    return nueva
  }

  finalizar(id: string): void {
    const idx = this.data.findIndex(c => c.id === id)
    if (idx >= 0) this.data[idx].estado = 'finalizado'
  }

  calcularTotal(detalles: DetalleConsulta[]): number {
    return detalles.reduce((sum, d) => sum + d.subtotal, 0)
  }

  getMonitorSalida(): MonitorSalida[] {
    const pendientes = this.getPendientes().slice(0, 3)
    return pendientes.map((c, i) => ({
      consultaId: c.id,
      mascota: mascotas.find(m => m.id === c.mascotaId)!,
      horaTermino: new Date(Date.now() - (i + 1) * 15 * 60000).toISOString(),
      total: c.total,
      estado: (i === 2 ? 'pagando' : 'listo') as MonitorSalida['estado'],
    }))
  }
}
