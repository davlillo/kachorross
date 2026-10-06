import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/ui/dialog'
import { Button } from '@/components/atoms/ui/button'
import { Input } from '@/components/atoms/ui/input'
import { Label } from '@/components/atoms/ui/label'
import { CalendarClock, LogOut, PawPrint, User } from 'lucide-react'
import type { Hospedaje } from '@/types'
import { cn, diasFacturables, todayLocal } from '@/lib/utils'
import { toast } from 'sonner'

export interface RegistrarSalidaHospedajeDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  hospedaje: Hospedaje | null
  onConfirm: (fechaSalidaReal: string) => Promise<void>
}

export function RegistrarSalidaHospedajeDialog({
  open,
  onOpenChange,
  hospedaje,
  onConfirm,
}: RegistrarSalidaHospedajeDialogProps) {
  const [fechaSalida, setFechaSalida] = useState(todayLocal())
  const [isSaving, setIsSaving] = useState(false)

  /** Al cerrar se reinicia la fecha para que la próxima apertura parta de hoy. */
  const cerrar = (abierto: boolean) => {
    onOpenChange(abierto)
    if (!abierto) setFechaSalida(todayLocal())
  }

  const nombrePaciente = hospedaje?.mascota?.nombre ?? ''

  const dias = useMemo(() => {
    if (!hospedaje) return 0
    return diasFacturables(hospedaje.fechaIngreso, fechaSalida)
  }, [hospedaje, fechaSalida])

  const total = hospedaje ? dias * hospedaje.tarifaDiaria : 0

  const fechaInvalida =
    !!hospedaje && (fechaSalida < hospedaje.fechaIngreso || fechaSalida > todayLocal())

  const handleConfirm = async () => {
    if (!hospedaje || isSaving) return
    try {
      setIsSaving(true)
      await onConfirm(fechaSalida)
      cerrar(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo registrar la salida')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-primary/10">
              <LogOut className="w-4 h-4 text-brand-primary" />
            </div>
            Registrar Salida
          </DialogTitle>
        </DialogHeader>

        {hospedaje && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              {hospedaje.mascota?.foto ? (
                <img
                  src={hospedaje.mascota.foto}
                  alt={nombrePaciente}
                  className="w-11 h-11 rounded-full object-cover"
                />
              ) : (
                <span className="inline-flex w-11 h-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary/15 to-brand-secondary/15 text-brand-primary">
                  <PawPrint className="w-5 h-5" />
                </span>
              )}
              <div className="min-w-0">
                <p className="font-semibold truncate">{nombrePaciente}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 truncate">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  {hospedaje.mascota?.propietario.nombre ?? '—'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hospedajeFechaSalidaReal">Fecha de salida</Label>
              <Input
                id="hospedajeFechaSalidaReal"
                type="date"
                min={hospedaje.fechaIngreso}
                max={todayLocal()}
                value={fechaSalida}
                onChange={e => setFechaSalida(e.target.value)}
                className={cn(fechaInvalida && 'border-red-500 focus-visible:ring-red-500')}
                aria-invalid={fechaInvalida}
              />
              {fechaInvalida && (
                <p className="text-xs text-red-600">
                  La salida debe estar entre el ingreso y el día de hoy
                </p>
              )}
            </div>

            <div className="space-y-2 rounded-xl border border-border/70 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5" />
                  Días facturables
                </span>
                <span className="font-semibold tabular-nums">{dias}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tarifa diaria</span>
                <span className="tabular-nums text-muted-foreground">
                  ${hospedaje.tarifaDiaria.toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-2 flex items-center justify-between text-lg">
                <span className="font-medium">Total a cobrar:</span>
                <span className="font-bold text-2xl text-brand-primary tabular-nums">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => cerrar(false)} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!hospedaje || isSaving || fechaInvalida}
            className="flex-1 bg-gradient-to-r from-brand-primary to-brand-primary"
          >
            <LogOut className="w-4 h-4 mr-1" />
            {isSaving ? 'Registrando...' : 'Registrar salida'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}