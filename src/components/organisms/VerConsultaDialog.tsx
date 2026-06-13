import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  Dialog, DialogPortal, DialogOverlay, DialogTitle,
} from '@/components/atoms/ui/dialog'
import { Badge } from '@/components/atoms/ui/badge'
import { cn } from '@/lib/utils'
import {
  X, Stethoscope, CalendarDays, FileText, AlertCircle,
} from 'lucide-react'
import type { Consulta } from '@/types'
import { getCategoriaConfig, getCategoriaLabel } from '@/lib/catalogo-categorias'

interface VerConsultaDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  consulta: Consulta | null
}

export function VerConsultaDialog({ open, onOpenChange, consulta }: VerConsultaDialogProps) {
  if (!consulta) return null

  const fecha = new Date(consulta.fecha)
  const fechaStr = fecha.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const horaStr = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-sm" />

        <DialogPrimitive.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-xl rounded-2xl border-0 bg-background shadow-2xl overflow-hidden',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
        >
          <DialogTitle className="sr-only">Detalle de consulta</DialogTitle>

          {/* ── Header degradado ── */}
          <div className="relative bg-gradient-to-r from-brand-primary to-brand-primary px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-lg leading-tight truncate">{consulta.motivo}</h2>
                  <p className="text-xs text-white/70 truncate">
                    {fechaStr} &middot; {horaStr} &middot; {consulta.doctora}
                  </p>
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
            {/* Síntomas + Diagnóstico */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Síntomas</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{consulta.sintomas}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                <Stethoscope className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Diagnóstico</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{consulta.diagnostico}</p>
                </div>
              </div>
            </div>

            {/* Tratamiento */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Tratamiento</p>
                <p className="font-semibold text-sm mt-1 whitespace-pre-wrap">{consulta.tratamiento}</p>
              </div>
            </div>

            {/* Notas */}
            {consulta.notas && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-700">Notas</p>
                  <p className="text-sm text-amber-900 mt-1 whitespace-pre-wrap">{consulta.notas}</p>
                </div>
              </div>
            )}

            {/* Próximo control */}
            {consulta.proximaCita && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                <CalendarDays className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-indigo-700">Próximo control</p>
                  <p className="text-sm text-indigo-900 mt-1">
                    {new Date(consulta.proximaCita).toLocaleDateString('es-ES', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })}
                    {consulta.proximaCitaHora && ` a las ${consulta.proximaCitaHora}`}
                  </p>
                </div>
              </div>
            )}

            {/* ── Servicios y Productos ── */}
            {consulta.detalles.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  Servicios y Productos
                </p>

                <div className="rounded-xl overflow-hidden border border-border">
                  <div className="grid grid-cols-12 bg-muted px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <div className="col-span-3">Código</div>
                    <div className="col-span-4">Descripción</div>
                    <div className="col-span-2 text-center">Cant.</div>
                    <div className="col-span-2 text-right">P.Unit.</div>
                    <div className="col-span-1 text-right">Sub.</div>
                  </div>

                  {consulta.detalles.map((detalle, idx) => {
                    const cat = getCategoriaConfig(detalle.producto.categoria, detalle.producto.codigo)
                    const CatIcon = cat.icon
                    return (
                      <div
                        key={detalle.id}
                        className={`grid grid-cols-12 items-center px-3 py-2.5 border-t border-border transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-muted/20'} hover:bg-muted/40`}
                      >
                        <div className="col-span-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-black font-mono px-2 py-1 rounded-lg ${cat.bg} ${cat.color} ${cat.border} border`}>
                            <CatIcon className="w-3 h-3" />
                            {detalle.producto.codigo}
                          </span>
                        </div>
                        <div className="col-span-4 min-w-0 pr-1">
                          <p className="text-xs font-semibold truncate leading-tight">{detalle.producto.nombre}</p>
                          <Badge className={`text-[9px] px-1 py-0 ${cat.bg} ${cat.color} border-0 mt-0.5`}>
                            {getCategoriaLabel(detalle.producto.categoria, detalle.producto.codigo)}
                          </Badge>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="text-sm font-bold">{detalle.cantidad}</span>
                        </div>
                        <div className="col-span-2 text-right">
                          <span className="text-xs text-muted-foreground">${detalle.precioAplicado.toFixed(2)}</span>
                        </div>
                        <div className="col-span-1 text-right">
                          <span className="text-xs font-bold">${detalle.subtotal.toFixed(2)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-brand-primary/5 to-brand-primary/5 border border-brand-primary/20 mt-3">
                  <p className="text-xs text-muted-foreground font-medium">Total</p>
                  <p className="text-3xl font-black text-brand-primary">${consulta.total.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
