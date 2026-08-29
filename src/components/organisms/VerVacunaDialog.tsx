import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  Dialog, DialogPortal, DialogOverlay, DialogTitle,
} from '@/components/atoms/ui/dialog'
import { cn, parseDateLocal } from '@/lib/utils'
import { X, Syringe, CalendarDays, Pill, FileText } from 'lucide-react'
import type { Vacuna } from '@/types'

interface VerVacunaDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  vacuna: Vacuna | null
}

const formatearFecha = (dateStr: string) =>
  parseDateLocal(dateStr).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

export function VerVacunaDialog({ open, onOpenChange, vacuna }: VerVacunaDialogProps) {
  if (!vacuna) return null

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
          <DialogTitle className="sr-only">Detalle de vacuna</DialogTitle>

          {/* ── Header degradado ── */}
          <div className="relative bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Syringe className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-lg leading-tight truncate">{vacuna.nombre}</h2>
                  <p className="text-xs text-white/70 truncate">{formatearFecha(vacuna.fechaAplicacion)}</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Cuerpo ── */}
          <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                <Pill className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Dosis</p>
                  <p className="text-sm mt-1">{vacuna.dosis ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Lote</p>
                  <p className="text-sm mt-1">{vacuna.lote ?? '—'}</p>
                </div>
              </div>
            </div>

            {vacuna.aplicadaPor && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                <Syringe className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Médico encargado</p>
                  <p className="text-sm mt-1">{vacuna.aplicadaPor}</p>
                </div>
              </div>
            )}

            {vacuna.proximaDosis && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-emerald-700">Próxima dosis</p>
                  <p className="text-sm text-emerald-900 mt-1">{formatearFecha(vacuna.proximaDosis)}</p>
                </div>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
