import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  Dialog, DialogPortal, DialogOverlay, DialogTitle,
} from '@/components/atoms/ui/dialog'
import { cn, diasFacturables, diffDias, parseDateLocal, todayLocal } from '@/lib/utils'
import { formatTelefono } from '@/lib/input-validators'
import {
  CalendarDays, CheckCircle2, PawPrint, Phone, Receipt, User, Wallet,
} from 'lucide-react'
import { TransportCageIcon } from '@/components/atoms/custom'
import type { Hospedaje } from '@/types'

interface VerHospedajeDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  hospedaje: Hospedaje | null
}

const formatearFecha = (dateStr: string) =>
  parseDateLocal(dateStr).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

const formatearFechaCorta = (dateStr: string) =>
  parseDateLocal(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

const formatearMoneda = (monto: number) => `$${monto.toFixed(2)}`

const ESPECIES: Record<string, string> = {
  perro: 'Perro', gato: 'Gato', ave: 'Ave', conejo: 'Conejo', otro: 'Otro',
}

/**
 * Detalle de una estancia. Los dias y el total salen de la base (los calcula el
 * trigger al registrar la salida), no se recalculan aca, para que lo que muestra
 * el historial coincida con lo facturado. El estado si es dinámico porque el
 * mismo dialog atiende estancias abiertas (tabla de hospedaje) y cerradas
 * (historial del expediente).
 */
export function VerHospedajeDialog({ open, onOpenChange, hospedaje }: VerHospedajeDialogProps) {
  if (!hospedaje) return null

  const activo = hospedaje.estado === 'activo'
  const mascota = hospedaje.mascota
  const propietario = mascota?.propietario

  const fin = hospedaje.fechaSalidaReal ?? todayLocal()
  const dias = activo
    ? Math.max(diffDias(hospedaje.fechaIngreso, fin), 0)
    : Math.max(diasFacturables(hospedaje.fechaIngreso, fin), 1)
  const total = hospedaje.totalCargo ?? dias * hospedaje.tarifaDiaria

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-sm" />

        <DialogPrimitive.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-md rounded-2xl border-0 bg-background shadow-2xl overflow-hidden',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
        >
          <DialogTitle className="sr-only">Detalle del hospedaje</DialogTitle>

          {/* Header degradado */}
          <div className="relative bg-gradient-to-r from-cyan-700 to-cyan-500 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {mascota?.foto ? (
                  <img
                    src={mascota.foto}
                    alt={mascota.nombre}
                    className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-white/40"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <PawPrint className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="font-bold text-lg leading-tight truncate">
                    {mascota?.nombre ?? 'Paciente'}
                  </h2>
                  <p className="text-xs text-white/70 truncate">
                    {[
                      mascota ? ESPECIES[mascota.especie] ?? null : null,
                      mascota?.raza || null,
                      formatearFechaCorta(hospedaje.fechaIngreso),
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                  activo ? 'bg-white/25 text-white' : 'bg-white/20 text-white',
                )}
              >
                {activo ? (
                  <TransportCageIcon className="w-3 h-3" />
                ) : (
                  <CheckCircle2 className="w-3 h-3" />
                )}
                {activo ? 'Hospedado' : 'Finalizado'}
              </span>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="rounded-xl bg-muted/50 border border-border p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                Propietario
              </p>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 shrink-0 text-cyan-600" />
                  <span className="truncate">{propietario?.nombre ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 shrink-0 text-cyan-600" />
                  <span className="tabular-nums">
                    {propietario?.telefono ? formatTelefono(propietario.telefono) : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/50 border border-border p-3">
                <CalendarDays className="w-4 h-4 text-cyan-600" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mt-2">Ingreso</p>
                <p className="text-sm mt-0.5">{formatearFechaCorta(hospedaje.fechaIngreso)}</p>
              </div>
              <div className="rounded-xl bg-muted/50 border border-border p-3">
                <CalendarDays className="w-4 h-4 text-cyan-600" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mt-2">Salida</p>
                <p className="text-sm mt-0.5">
                  {hospedaje.fechaSalidaReal
                    ? formatearFechaCorta(hospedaje.fechaSalidaReal)
                    : formatearFechaCorta(hospedaje.fechaSalidaEstimada)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {hospedaje.fechaSalidaReal ? 'Real' : 'Estimada'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border">
              <Receipt className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Tarifa diaria</p>
                  <p className="text-sm mt-1">{formatearMoneda(hospedaje.tarifaDiaria)}</p>
                </div>
                <p className="text-sm text-muted-foreground shrink-0">
                  {dias} {dias === 1 ? 'día' : 'días'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-cyan-50 border border-cyan-200">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-cyan-700" />
                <p className="text-sm font-semibold text-cyan-900">
                  {activo ? 'Total estimado' : 'Total'}
                </p>
              </div>
              <p className="text-lg font-bold text-cyan-900 tabular-nums">
                {formatearMoneda(total)}
              </p>
            </div>

            {hospedaje.observaciones && (
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Observaciones</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{hospedaje.observaciones}</p>
              </div>
            )}

            {hospedaje.fechaSalidaReal && (
              <p className="text-xs text-muted-foreground text-center">
                Salida registrada el {formatearFecha(hospedaje.fechaSalidaReal)}
              </p>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}