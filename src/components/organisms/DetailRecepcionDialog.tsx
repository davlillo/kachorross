import { useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  Dialog, DialogPortal, DialogOverlay, DialogTitle,
} from '@/components/atoms/ui/dialog'
import { Button } from '@/components/atoms/ui/button'
import { cn } from '@/lib/utils'
import {
  CheckCircle, X, PawPrint, User, Phone, Clock, FileText,
  Stethoscope, Printer,
} from 'lucide-react'
import type { Consulta, Mascota } from '@/types'
import { getCategoriaConfig } from '@/lib/catalogo-categorias'
import { useAuth } from '@/context/AuthContext'
import { imprimirTratamiento } from '@/lib/printTratamiento'
import { generarPdfTratamiento } from '@/lib/pdfTratamiento'
import { EmailController } from '@/controllers/email.controller'
import { proximaCitaEsManana } from '@/lib/fechaAgenda'
import { toast } from 'sonner'
import { DetalleProductoCell } from '@/components/molecules/DetalleProductoCell'

const emailCtrl = EmailController.getInstance()

interface DetailRecepcionDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  consulta: Consulta | undefined
  mascota?: Mascota
  onTerminado?: (consultaId: string) => void
}

export function DetailRecepcionDialog({
  open, onOpenChange, consulta, mascota, onTerminado,
}: DetailRecepcionDialogProps) {
  const [confirmando, setConfirmando] = useState(false)
  const { veterinaria } = useAuth()

  const handleClose = () => {
    setConfirmando(false)
    onOpenChange(false)
  }

  const handleTerminado = () => {
    if (!consulta) return
    if (!confirmando) { setConfirmando(true); return }

    const ownerEmail = mascota?.propietario.email
    const consultaId = consulta.id
    const tratamiento = consulta.tratamiento
    const fecha = consulta.fecha
    const propietarioNombre = mascota?.propietario.nombre ?? ''
    const mascotaNombre = mascota?.nombre ?? ''
    const vet = veterinaria

    setConfirmando(false)
    onTerminado?.(consultaId)
    onOpenChange(false)

    if (!ownerEmail) {
      toast.info('El propietario no tiene correo registrado', {
        description: 'Para enviarle el tratamiento electrónico, registre su correo en la ficha del paciente.',
      })
      return
    }

    if (!vet) {
      toast.warning('No se pudo enviar el tratamiento por correo', {
        description: 'Datos de la clínica no disponibles. Intente de nuevo en unos segundos.',
      })
      return
    }

    const proximaCita = consulta.proximaCita
    const enviarRecordatorio = proximaCita && proximaCitaEsManana(proximaCita)

    toast.promise(
      (async () => {
        const pdfBase64 = await generarPdfTratamiento(tratamiento, vet.logoUrl)
        const r = await emailCtrl.enviarTratamientoEmail({
          veterinariaId: vet.id,
          veterinariaNombre: vet.nombre,
          veterinariaTelefono: vet.telefono,
          veterinariaDireccion: vet.direccion,
          propietarioEmail: ownerEmail,
          propietarioNombre,
          mascotaNombre,
          mascotaId: mascota?.id,
          consultaId: consulta.id,
          fecha,
          pdfBase64,
        })
        if (!r.ok) {
          const msg = r.error?.includes('non-2xx')
            ? 'La función de correo no está disponible. Despliega la Edge Function send-email en Supabase.'
            : r.error ?? 'Puede configurar SMTP en Configuración.'
          throw new Error(msg)
        }

        if (enviarRecordatorio && proximaCita) {
          const rec = await emailCtrl.enviarRecordatorioCita({
            veterinariaId: vet.id,
            veterinariaNombre: vet.nombre,
            propietarioEmail: ownerEmail,
            propietarioNombre,
            mascotaNombre,
            proximaCitaIso: proximaCita,
            tipoSeguimiento: consulta.tipoSeguimiento,
            motivo: consulta.motivo,
            veterinariaTelefono: vet.telefono,
            veterinariaDireccion: vet.direccion,
            veterinariaEmail: vet.email,
          })
          if (!rec.ok) {
            return { recordatorioFallo: rec.error ?? 'No se pudo enviar el recordatorio' }
          }
        }
        return { recordatorioFallo: null as string | null }
      })(),
      {
        id: 'envio-tratamiento-email',
        loading: enviarRecordatorio
          ? 'Enviando tratamiento y recordatorio de cita...'
          : 'Enviando tratamiento por correo...',
        success: (res) => {
          if (res?.recordatorioFallo) {
            toast.warning('Tratamiento enviado. Recordatorio no enviado', {
              description: res.recordatorioFallo,
            })
            return 'Tratamiento enviado al correo del propietario'
          }
          return enviarRecordatorio
            ? 'Tratamiento y recordatorio de cita enviados'
            : 'Tratamiento enviado al correo del propietario'
        },
        error: (err) => err instanceof Error ? err.message : 'Error al enviar el tratamiento',
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogPortal>
        {/* Overlay con blur */}
        <DialogOverlay className="bg-black/40 backdrop-blur-sm" />

        <DialogPrimitive.Content
          onInteractOutside={e => e.preventDefault()}
          onEscapeKeyDown={e => e.preventDefault()}
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg leading-tight">Prefactura de Consulta</h2>
                  <p className="text-xs text-white/70">
                    {consulta
                      ? new Date(consulta.fecha).toLocaleDateString('es-ES', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                        })
                      : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Cuerpo ── */}
          <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
            {consulta && mascota && (
              <>
                {/* Info paciente + propietario */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                    <PawPrint className="w-4 h-4 text-brand-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Paciente</p>
                      <p className="font-bold text-sm truncate">{mascota.nombre}</p>
                      <p className="text-xs text-muted-foreground truncate">{mascota.raza}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                    <User className="w-4 h-4 text-brand-secondary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Propietario</p>
                      <p className="font-bold text-sm truncate">{mascota.propietario.nombre}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />{mascota.propietario.telefono}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Motivo */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <Stethoscope className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Motivo de consulta</p>
                    <p className="font-semibold text-sm">{consulta.motivo}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(consulta.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* ── Tabla de productos — CÓDIGO PROMINENTE ── */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    Servicios y Productos
                  </p>

                  <div className="rounded-xl overflow-hidden border border-border">
                    {/* Cabecera */}
                    <div className="grid grid-cols-12 bg-muted px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <div className="col-span-3">Código</div>
                      <div className="col-span-4">Descripción</div>
                      <div className="col-span-1 text-center">Cant.</div>
                      <div className="col-span-2 text-right">P.Unit.</div>
                      <div className="col-span-2 text-right">Sub.</div>
                    </div>

                    {/* Filas */}
                    {consulta.detalles.map((detalle, idx) => {
                      const cat = getCategoriaConfig(detalle.producto.categoria, detalle.producto.codigo)
                      const CatIcon = cat.icon
                      return (
                        <div
                          key={detalle.id}
                          className={`grid grid-cols-12 items-start px-3 py-2.5 border-t border-border transition-colors
                            ${idx % 2 === 0 ? 'bg-white' : 'bg-muted/20'} hover:bg-muted/40`}
                        >
                          {/* CÓDIGO — elemento más prominente */}
                          <div className="col-span-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-black font-mono px-2 py-1 rounded-lg ${cat.bg} ${cat.color} ${cat.border} border`}>
                              <CatIcon className="w-3 h-3" />
                              {detalle.producto.codigo}
                            </span>
                          </div>

                          {/* Nombre + descripción + categoría */}
                          <div className="col-span-4">
                            <DetalleProductoCell producto={detalle.producto} />
                          </div>

                          {/* Cantidad */}
                          <div className="col-span-1 text-center pt-0.5">
                            <span className="text-sm font-bold">{detalle.cantidad}</span>
                          </div>

                          {/* Precio unitario */}
                          <div className="col-span-2 text-right pt-0.5">
                            <span className="text-xs text-muted-foreground">${detalle.precioAplicado.toFixed(2)}</span>
                          </div>

                          {/* Subtotal */}
                          <div className="col-span-2 text-right pt-0.5">
                            <span className="text-xs font-bold">${detalle.subtotal.toFixed(2)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-brand-primary/5 to-brand-primary/5 border border-brand-primary/20">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Total a cobrar</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">⚠ Procesar en sistema externo</p>
                  </div>
                  <p className="text-3xl font-black text-brand-primary">${consulta.total.toFixed(2)}</p>
                </div>
              </>
            )}
          </div>

          {/* ── Footer — botones ── */}
          {consulta && (
            <div className="px-5 pb-5 space-y-2">
              <Button
                variant="outline"
                className="w-full h-11 text-sm font-semibold border-brand-primary/30 text-brand-primary hover:bg-brand-primary/5"
                onClick={() => imprimirTratamiento(consulta.tratamiento, veterinaria?.logoUrl)}
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir tratamiento
              </Button>
              {confirmando ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                  <p className="text-sm font-semibold text-amber-800 text-center">
                    ¿Confirmar salida del paciente?
                  </p>
                  <p className="text-xs text-amber-700 text-center">
                    Se marcará la consulta como finalizada y saldrá de la lista activa.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-9 text-sm" onClick={() => setConfirmando(false)}>
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1 h-9 text-sm bg-gradient-to-r from-brand-primary to-brand-primary hover:from-brand-primary hover:to-brand-primary"
                      onClick={handleTerminado}
                    >
                      <CheckCircle className="w-4 h-4 mr-1.5" />Confirmar salida
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-brand-primary to-brand-primary hover:from-brand-primary hover:to-brand-primary shadow-md"
                  onClick={handleTerminado}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />Marcar como Terminado
                </Button>
              )}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
