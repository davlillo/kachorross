import { Bell, Syringe, Bug } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/atoms/ui/popover'
import { Badge } from '@/components/atoms/ui/badge'
import { Button } from '@/components/atoms/ui/button'
import { useAlertasProximas } from '@/hooks/useAlertasProximas'
import { todayLocal, formatDateLocal, parseDateLocal } from '@/lib/utils'

function etiquetaFecha(fecha: string): string {
  const hoy = todayLocal()
  if (fecha === hoy) return 'hoy'
  const manana = new Date(parseDateLocal(hoy))
  manana.setDate(manana.getDate() + 1)
  const mananaKey = manana.toISOString().slice(0, 10)
  if (fecha === mananaKey) return 'mañana'
  return formatDateLocal(fecha)
}

export function AlertaBell({ refreshKey }: { refreshKey?: number }) {
  const { alertas, count } = useAlertasProximas(7, refreshKey)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 shrink-0">
          <Bell className="w-4 h-4" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-none rounded-full"
            >
              {count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={4} className="w-72 p-0">
        <div className="px-3 py-2 border-b border-border/50">
          <p className="text-xs font-bold">Alertas proximas</p>
          <p className="text-[10px] text-muted-foreground">
            {count === 0
              ? 'Sin pendientes'
              : `${count} ${count === 1 ? 'tratamiento' : 'tratamientos'} en los proximos dias`}
          </p>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {alertas.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground text-center">
              No hay alertas pendientes
            </p>
          ) : (
            alertas.map(a => (
              <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  a.tipo === 'vacuna'
                    ? 'bg-amber-100 dark:bg-amber-900/40'
                    : 'bg-violet-100 dark:bg-violet-900/40'
                }`}>
                  {a.tipo === 'vacuna'
                    ? <Syringe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    : <Bug className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{a.mascota}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{a.titulo}</p>
                </div>
                <span className={`text-[10px] font-bold whitespace-nowrap ${
                  a.fecha === todayLocal()
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground'
                }`}>
                  {etiquetaFecha(a.fecha)}
                </span>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
