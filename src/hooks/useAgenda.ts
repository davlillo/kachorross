import { useState, useCallback, useEffect } from 'react'
import { startOfMonth, endOfMonth } from 'date-fns'
import { AgendaController, type EventoAgenda } from '@/controllers/agenda.controller'
import type { TipoEvento } from '@/data/eventosData'

const agendaCtrl = AgendaController.getInstance()

export function useAgenda(mesReferencia: Date) {
  const [eventos, setEventos] = useState<EventoAgenda[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const desde = startOfMonth(mesReferencia)
      const hasta = endOfMonth(mesReferencia)
      const data = await agendaCtrl.getPorRango(desde, hasta)
      setEventos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la agenda')
    } finally {
      setIsLoading(false)
    }
  }, [mesReferencia])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const verificarConflicto = useCallback(async (fecha: string, hora: string) => {
    return agendaCtrl.verificarConflicto(fecha, hora)
  }, [])

  const crearEvento = useCallback(async (data: {
    mascotaId: string
    titulo: string
    tipo: TipoEvento
    fecha: string
    notas?: string
  }) => {
    const nuevo = await agendaCtrl.crearManual(data)
    await refresh()
    return nuevo
  }, [refresh])

  const eliminarEvento = useCallback(async (id: string) => {
    await agendaCtrl.eliminarManual(id)
    await refresh()
  }, [refresh])

  return { eventos, isLoading, error, refresh, verificarConflicto, crearEvento, eliminarEvento }
}
