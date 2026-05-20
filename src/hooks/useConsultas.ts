import { useState, useCallback } from 'react'
import { ConsultaController } from '@/controllers/consulta.controller'
import { CatalogoController } from '@/controllers/catalogo.controller'
import type { Consulta, DetalleConsulta, Producto } from '@/types'

const consultaCtrl = ConsultaController.getInstance()
const catalogoCtrl = CatalogoController.getInstance()

export function useConsultas() {
  const [consultas, setConsultas] = useState<Consulta[]>(() => consultaCtrl.getAll())

  const getConsultasPendientes = useCallback((): Consulta[] => {
    return consultaCtrl.getPendientes()
  }, [])

  const getConsultasPorMascota = useCallback((mascotaId: string): Consulta[] => {
    return consultaCtrl.getByMascota(mascotaId)
  }, [])

  const finalizarConsulta = useCallback((consultaId: string): boolean => {
    consultaCtrl.finalizar(consultaId)
    setConsultas(consultaCtrl.getAll())
    return true
  }, [])

  const crearConsulta = useCallback((data: Partial<Consulta>): Consulta => {
    const nueva = consultaCtrl.crear(data)
    setConsultas(consultaCtrl.getAll())
    return nueva
  }, [])

  const calcularTotal = useCallback((detalles: DetalleConsulta[]): number => {
    return consultaCtrl.calcularTotal(detalles)
  }, [])

  return {
    consultas,
    getConsultasPendientes,
    getConsultasPorMascota,
    finalizarConsulta,
    crearConsulta,
    calcularTotal,
  }
}

export function useCatalogo() {
  const [productos, setProductos] = useState<Producto[]>(() => catalogoCtrl.getAll())

  const getProductosPorCategoria = useCallback((categoria: string) => {
    return catalogoCtrl.getByCategoria(categoria)
  }, [])

  const buscarProductos = useCallback((query: string) => {
    return catalogoCtrl.buscar(query)
  }, [])

  const actualizarProducto = useCallback((id: string, data: Partial<Producto>) => {
    catalogoCtrl.actualizar(id, data)
    setProductos(catalogoCtrl.getAll())
  }, [])

  const crearProducto = useCallback((data: Omit<Producto, 'id'>) => {
    const nuevo = catalogoCtrl.crear(data)
    setProductos(catalogoCtrl.getAll())
    return nuevo
  }, [])

  const eliminarProducto = useCallback((id: string) => {
    catalogoCtrl.eliminar(id)
    setProductos(catalogoCtrl.getAll())
  }, [])

  return {
    productos,
    getProductosPorCategoria,
    buscarProductos,
    actualizarProducto,
    crearProducto,
    eliminarProducto,
  }
}
