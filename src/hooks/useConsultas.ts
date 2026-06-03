import { useState, useCallback, useEffect } from 'react'
import { ConsultaController } from '@/controllers/consulta.controller'
import { CatalogoController } from '@/controllers/catalogo.controller'
import { MascotaController } from '@/controllers/mascota.controller'
import type { Consulta, DetalleConsulta, MonitorSalida, Producto } from '@/types'

const consultaCtrl = ConsultaController.getInstance()
const catalogoCtrl = CatalogoController.getInstance()
const mascotaCtrl = MascotaController.getInstance()

async function attachMascotasToMonitor(consultas: Consulta[]): Promise<MonitorSalida[]> {
  const pendientes = consultas.filter(c => c.estado === 'pendiente').slice(0, 3)
  if (pendientes.length === 0) return []

  const mascotaIds = [...new Set(pendientes.map(c => c.mascotaId))]
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

export function useConsultasMutations() {
  const crearConsulta = useCallback(async (data: Partial<Consulta>): Promise<Consulta> => {
    return consultaCtrl.crear(data)
  }, [])

  const calcularTotal = useCallback((detalles: DetalleConsulta[]): number => {
    return consultaCtrl.calcularTotal(detalles)
  }, [])

  return { crearConsulta, calcularTotal }
}

export function useConsultas() {
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [monitorSalida, setMonitorSalida] = useState<MonitorSalida[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const all = await consultaCtrl.getAll()
      const monitor = await attachMascotasToMonitor(all)
      setConsultas(all)
      setMonitorSalida(monitor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar consultas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const getConsultasPendientes = useCallback(async (): Promise<Consulta[]> => {
    return consultaCtrl.getPendientes()
  }, [])

  const getConsultasPorMascota = useCallback(async (mascotaId: string): Promise<Consulta[]> => {
    return consultaCtrl.getByMascota(mascotaId)
  }, [])

  const finalizarConsulta = useCallback(async (consultaId: string): Promise<boolean> => {
    await consultaCtrl.finalizar(consultaId)
    await refresh()
    return true
  }, [refresh])

  const crearConsulta = useCallback(async (data: Partial<Consulta>): Promise<Consulta> => {
    const nueva = await consultaCtrl.crear(data)
    await refresh()
    return nueva
  }, [refresh])

  const calcularTotal = useCallback((detalles: DetalleConsulta[]): number => {
    return consultaCtrl.calcularTotal(detalles)
  }, [])

  const getMonitorSalida = useCallback(async (): Promise<MonitorSalida[]> => {
    const monitor = await consultaCtrl.getMonitorSalida()
    setMonitorSalida(monitor)
    return monitor
  }, [])

  return {
    consultas,
    monitorSalida,
    isLoading,
    error,
    getConsultasPendientes,
    getConsultasPorMascota,
    getMonitorSalida,
    finalizarConsulta,
    crearConsulta,
    calcularTotal,
    refresh,
  }
}

export function useCatalogo() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      setProductos(await catalogoCtrl.getAll())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar catálogo')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const getProductosPorCategoria = useCallback(async (categoria: string) => {
    return catalogoCtrl.getByCategoria(categoria)
  }, [])

  const buscarProductos = useCallback(async (query: string) => {
    return catalogoCtrl.buscar(query)
  }, [])

  const actualizarProducto = useCallback(async (id: string, data: Partial<Producto>) => {
    await catalogoCtrl.actualizar(id, data)
    await refresh()
  }, [refresh])

  const crearProducto = useCallback(async (data: Omit<Producto, 'id'>) => {
    const nuevo = await catalogoCtrl.crear(data)
    await refresh()
    return nuevo
  }, [refresh])

  const eliminarProducto = useCallback(async (id: string) => {
    await catalogoCtrl.eliminar(id)
    await refresh()
  }, [refresh])

  return {
    productos,
    isLoading,
    error,
    getProductosPorCategoria,
    buscarProductos,
    actualizarProducto,
    crearProducto,
    eliminarProducto,
    refresh,
  }
}
