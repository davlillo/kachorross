import { useState, useCallback, useEffect } from 'react'
import { HospedajeController } from '@/controllers/hospedaje.controller'
import type { GuardarHospedajeDTO, Hospedaje } from '@/types'

const hospedajeCtrl = HospedajeController.getInstance()

/** Hook de datos para la lista de hospedajes. */
export function useHospedajes() {
  const [hospedajes, setHospedajes] = useState<Hospedaje[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      setHospedajes(await hospedajeCtrl.listar())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los hospedajes')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const registrarSalida = useCallback(
    async (id: string, fechaSalidaReal: string): Promise<Hospedaje> => {
      const actualizado = await hospedajeCtrl.registrarSalida(id, fechaSalidaReal)
      await refresh()
      return actualizado
    },
    [refresh],
  )

  return { hospedajes, isLoading, error, registrarSalida, refresh }
}

/**
 * Hook del monitor de prefacturación. Usa un controller aparte del de la lista
 * porque reception solo puede leer las estancias pendientes de cobro, mientras
 * que `useHospedajes` tira para ese rol.
 */
export function useHospedajesPrefacturacion() {
  const [hospedajes, setHospedajes] = useState<Hospedaje[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      setHospedajes(await hospedajeCtrl.listarParaPrefacturacion())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los hospedajes a facturar')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const marcarFacturado = useCallback(
    async (id: string): Promise<void> => {
      const ok = await hospedajeCtrl.marcarFacturado(id)
      if (!ok) {
        throw new Error('El hospedaje ya fue facturado o no está disponible')
      }
      await refresh()
    },
    [refresh],
  )

  return { hospedajes, isLoading, error, marcarFacturado, refresh }
}

/**
 * Hospedajes facturados dentro de un rango UTC, para sumarlos a los totales del día.
 *
 * El rango viene ya convertido por `rangoUtcDeDiaLocal` porque el filtro por día
 * depende de la zona horaria y no corresponde a la capa de datos.
 */
export function useHospedajesFacturados(desdeUtc: string, hastaUtc: string) {
  const [hospedajes, setHospedajes] = useState<Hospedaje[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      setHospedajes(await hospedajeCtrl.listarFacturados(desdeUtc, hastaUtc))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los hospedajes facturados')
    } finally {
      setIsLoading(false)
    }
  }, [desdeUtc, hastaUtc])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { hospedajes, isLoading, error, refresh }
}

export function useHospedajeMutations() {
  const registrarHospedaje = useCallback(
    async (data: GuardarHospedajeDTO): Promise<Hospedaje> => {
      return hospedajeCtrl.crear(data)
    },
    [],
  )

  return { registrarHospedaje }
}