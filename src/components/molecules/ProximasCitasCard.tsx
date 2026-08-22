import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight } from 'lucide-react'
import type { Expediente } from '@/types'
import {
  colorCita,
  formatFechaCita,
  obtenerProximasCitas,
} from '@/lib/proximasCitasExpediente'

interface ProximasCitasCardProps {
  expediente: Expediente
}

export function ProximasCitasCard({ expediente }: ProximasCitasCardProps) {
  const citas = obtenerProximasCitas(expediente)
  if (citas.length === 0) return null

  return (
    <div className="mb-4 rounded-2xl border border-brand-primary/15 bg-gradient-to-r from-brand-primary/5 via-background to-background shadow-soft overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b border-brand-primary/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4 text-brand-primary" />
          </div>
          <div>
            <p className="text-sm font-bold">Próximas citas</p>
            <p className="text-[11px] text-muted-foreground">
              {citas.length} {citas.length === 1 ? 'control programado' : 'controles programados'}
            </p>
          </div>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-0.5 text-xs text-brand-primary hover:underline font-semibold shrink-0"
        >
          Ver en calendario
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 p-3">
        {citas.map(cita => {
          const col = colorCita(cita.tipo)
          return (
            <div
              key={cita.id}
              className="flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-xl bg-card border border-border/60 shadow-sm min-w-[140px]"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
              <div className="min-w-0">
                <p className="text-[11px] font-bold leading-tight">{formatFechaCita(cita.fecha)}</p>
                <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{col.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
