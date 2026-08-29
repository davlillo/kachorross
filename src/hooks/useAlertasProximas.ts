import { useState, useCallback, useEffect } from 'react'
import { addDays, format } from 'date-fns'
import { AgendaController, type AlertaProxima } from '@/controllers/agenda.controller'
import { todayLocal, parseDateLocal } from '@/lib/utils'

const agendaCtrl = AgendaController.getInstance()

export function useAlertasProximas(dias = 7, refreshKey = 0) {
  const [alertas, setAlertas] = useState<AlertaProxima[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      const desde = todayLocal()
      const hasta = format(addDays(parseDateLocal(desde), dias), 'yyyy-MM-dd')

      const [vacunas, desparas] = await Promise.all([
        agendaCtrl.getVacunasProximas(desde, hasta),
        agendaCtrl.getDesparasitacionesProximas(desde, hasta),
      ])

      const combinadas: AlertaProxima[] = [
        ...vacunas.map(v => ({
          id: v.id,
          tipo: 'vacuna' as const,
          titulo: v.vacuna,
          mascota: v.mascota,
          fecha: v.fecha,
        })),
        ...desparas,
      ].sort((a, b) => a.fecha.localeCompare(b.fecha))

      setAlertas(combinadas)
    } catch {
      setAlertas([])
    } finally {
      setIsLoading(false)
    }
  }, [dias, refreshKey])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { alertas, count: alertas.length, isLoading, refresh }
}
