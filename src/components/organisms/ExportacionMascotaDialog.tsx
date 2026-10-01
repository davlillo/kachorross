import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCheck2,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import {
  ExportacionController,
  crearCostosExportacionIniciales,
  crearRequisitosDestino,
} from '@/controllers/exportacion.controller'
import type { PlantillaDestinoExportacion } from '@/controllers/exportacion.controller'
import { useAuth } from '@/context/AuthContext'
import { generarPdfCertificadoExportacion } from '@/lib/pdfCertificadoExportacion'
import type {
  CostoExportacion,
  EstadoExportacion,
  ExportacionMascota,
  GuardarExportacionMascotaDTO,
  Mascota,
  RequisitoExportacion,
} from '@/types'
import { todayLocal } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/atoms/ui/alert'
import { Badge } from '@/components/atoms/ui/badge'
import { Button } from '@/components/atoms/ui/button'
import { Checkbox } from '@/components/atoms/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/ui/dialog'
import { Input } from '@/components/atoms/ui/input'
import { Label } from '@/components/atoms/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/ui/select'
import { Textarea } from '@/components/atoms/ui/textarea'

interface ExportacionMascotaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mascota: Mascota
  veterinarioPredeterminado?: string
}

const controller = ExportacionController.getInstance()

const PLANTILLAS_DESTINO: Array<{
  value: PlantillaDestinoExportacion
  label: string
}> = [
  { value: 'estados_unidos', label: 'Estados Unidos' },
  { value: 'europa', label: 'Europa' },
  { value: 'suramerica', label: 'Suramérica' },
]

function idNuevo(): string {
  return crypto.randomUUID()
}

function requisitoGenerico(): RequisitoExportacion {
  return {
    id: idNuevo(),
    nombre: 'Requisitos sanitarios del país de destino',
    descripcion: 'Confirmar la documentación exigida por la autoridad competente.',
    estado: 'pendiente',
    obligatorio: true,
  }
}

function nuevoFormulario(mascotaId: string, veterinario: string): GuardarExportacionMascotaDTO {
  return {
    mascotaId,
    paisDestino: '',
    destinoDetalle: '',
    fechaTramiteProgramada: todayLocal(),
    fechaViaje: '',
    estado: 'borrador',
    requisitos: [requisitoGenerico()],
    costos: crearCostosExportacionIniciales(),
    moneda: 'USD',
    veterinarioResponsable: veterinario,
    observaciones: '',
  }
}

function formularioDesdeRegistro(registro: ExportacionMascota): GuardarExportacionMascotaDTO {
  return {
    mascotaId: registro.mascotaId,
    paisDestino: registro.paisDestino,
    destinoDetalle: registro.destinoDetalle ?? '',
    fechaTramiteProgramada: registro.fechaTramiteProgramada,
    fechaViaje: registro.fechaViaje ?? '',
    estado: registro.estado,
    requisitos: registro.requisitos.map(item => ({ ...item })),
    costos: registro.costos.map(item => ({ ...item })),
    moneda: registro.moneda,
    veterinarioResponsable: registro.veterinarioResponsable,
    observaciones: registro.observaciones ?? '',
  }
}

function calcularEstado(requisitos: RequisitoExportacion[]): EstadoExportacion {
  if (requisitos.length > 0 && requisitos.every(item => item.estado === 'completado')) {
    return 'completado'
  }
  if (requisitos.some(item => item.estado === 'completado')) return 'en_proceso'
  return 'borrador'
}

function plantillaDesdeDestino(destino: string): PlantillaDestinoExportacion | '' {
  return PLANTILLAS_DESTINO.find(item => item.label === destino)?.value ?? ''
}

function descargarBase64(base64: string, nombre: string) {
  const binario = atob(base64)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i)
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.download = nombre
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function ExportacionMascotaDialog({
  open,
  onOpenChange,
  mascota,
  veterinarioPredeterminado = '',
}: ExportacionMascotaDialogProps) {
  const { veterinaria } = useAuth()
  const [registros, setRegistros] = useState<ExportacionMascota[]>([])
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null)
  const [form, setForm] = useState<GuardarExportacionMascotaDTO>(
    () => nuevoFormulario(mascota.id, veterinarioPredeterminado),
  )
  const [mostrarFormulario, setMostrarFormulario] = useState(true)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [generandoPdf, setGenerandoPdf] = useState(false)

  useEffect(() => {
    if (!open) return
    let activo = true
    void controller.listarPorMascota(mascota.id)
      .then((data) => {
        if (!activo) return
        setRegistros(data)
        if (data.length > 0) {
          setSeleccionadoId(null)
          setForm(nuevoFormulario(mascota.id, veterinarioPredeterminado))
          setMostrarFormulario(false)
        } else {
          setSeleccionadoId(null)
          setForm(nuevoFormulario(mascota.id, veterinarioPredeterminado))
          setMostrarFormulario(true)
        }
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los trámites')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [open, mascota.id, veterinarioPredeterminado])

  const pendientes = form.requisitos.filter(
    item => item.obligatorio && item.estado !== 'completado',
  ).length
  const plantillaSeleccionada = plantillaDesdeDestino(form.paisDestino)
  const certificadoConLogo = Boolean(veterinaria?.logoUrl)
  const total = useMemo(
    () => form.costos.reduce(
      (sum, item) => sum + (Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0),
      0,
    ),
    [form.costos],
  )

  const seleccionarRegistro = (registro: ExportacionMascota) => {
    setSeleccionadoId(registro.id)
    setForm(formularioDesdeRegistro(registro))
    setMostrarFormulario(true)
  }

  const iniciarNuevo = () => {
    setSeleccionadoId(null)
    setForm(nuevoFormulario(mascota.id, veterinarioPredeterminado))
    setMostrarFormulario(true)
  }

  const cargarPlantilla = (plantilla: PlantillaDestinoExportacion) => {
    const destino = PLANTILLAS_DESTINO.find(item => item.value === plantilla)
    if (!destino) return
    setForm(prev => ({
      ...prev,
      paisDestino: destino.label,
      estado: 'borrador',
      requisitos: crearRequisitosDestino(plantilla),
      costos: crearCostosExportacionIniciales(),
    }))
    toast.info(`Se cargó la plantilla para ${destino.label}`)
  }

  const actualizarRequisito = (id: string, cambios: Partial<RequisitoExportacion>) => {
    setForm(prev => {
      const requisitos = prev.requisitos.map(
        item => item.id === id ? { ...item, ...cambios } : item,
      )
      return { ...prev, requisitos, estado: calcularEstado(requisitos) }
    })
  }

  const eliminarRequisito = (id: string) => {
    setForm(prev => {
      const requisitos = prev.requisitos.filter(item => item.id !== id)
      return { ...prev, requisitos, estado: calcularEstado(requisitos) }
    })
  }

  const agregarRequisito = () => {
    setForm(prev => {
      const requisitos: RequisitoExportacion[] = [
        ...prev.requisitos,
        { id: idNuevo(), nombre: '', descripcion: '', estado: 'pendiente', obligatorio: true },
      ]
      return { ...prev, requisitos, estado: calcularEstado(requisitos) }
    })
  }

  const actualizarCosto = (id: string, cambios: Partial<CostoExportacion>) => {
    setForm(prev => ({
      ...prev,
      costos: prev.costos.map(item => item.id === id ? { ...item, ...cambios } : item),
    }))
  }

  const agregarCosto = () => {
    setForm(prev => ({
      ...prev,
      costos: [
        ...prev.costos,
        { id: idNuevo(), concepto: '', cantidad: 1, precioUnitario: 0, total: 0 },
      ],
    }))
  }

  const eliminarCosto = (id: string) => {
    setForm(prev => ({ ...prev, costos: prev.costos.filter(item => item.id !== id) }))
  }

  const guardar = async () => {
    try {
      setGuardando(true)
      const editando = Boolean(seleccionadoId)
      const payload = { ...form, estado: calcularEstado(form.requisitos) }
      const guardado = seleccionadoId
        ? await controller.actualizar(seleccionadoId, payload)
        : await controller.crear(payload)
      setRegistros(prev => {
        const existe = prev.some(item => item.id === guardado.id)
        return existe
          ? prev.map(item => item.id === guardado.id ? guardado : item)
          : [guardado, ...prev]
      })
      setSeleccionadoId(null)
      setForm(nuevoFormulario(mascota.id, veterinarioPredeterminado))
      setMostrarFormulario(false)
      toast.success(editando ? 'Trámite actualizado' : 'Trámite registrado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el trámite')
    } finally {
      setGuardando(false)
    }
  }

  const descargarCertificado = async () => {
    if (!certificadoConLogo) {
      toast.info('Cargue el logo de la clínica en Configuración')
      return
    }
    const registro = registros.find(item => item.id === seleccionadoId)
    if (!registro) {
      toast.info('Guarde el trámite antes de generar el certificado')
      return
    }
    try {
      setGenerandoPdf(true)
      const base64 = await generarPdfCertificadoExportacion({
        exportacion: registro,
        mascota,
        veterinaria,
      })
      const paciente = mascota.nombre.replace(/[^a-z0-9áéíóúñ_-]+/gi, '-').toLowerCase()
      descargarBase64(base64, `certificado-salud-${paciente}.pdf`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo generar el certificado')
    } finally {
      setGenerandoPdf(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-brand-primary" />
            Trámite de exportación
          </DialogTitle>
          <DialogDescription>
            {mascota.nombre} · Propietario: {mascota.propietario.nombre}. El checklist orienta el seguimiento; no certifica automáticamente la aptitud para viajar.
          </DialogDescription>
        </DialogHeader>

        {cargando ? (
          <div className="flex min-h-80 items-center justify-center">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Cargando trámites...
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 lg:grid-cols-[250px_1fr]">
            <aside className="border-b bg-muted/30 p-4 lg:border-b-0 lg:border-r">
              <div className="max-h-52 space-y-2 overflow-y-auto lg:max-h-[68vh]">
                {registros.length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                    No hay trámites registrados.
                  </p>
                ) : registros.map(registro => (
                  <button
                    key={registro.id}
                    type="button"
                    onClick={() => seleccionarRegistro(registro)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      seleccionadoId === registro.id
                        ? 'border-brand-primary bg-brand-primary/5'
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{registro.paisDestino}</span>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {registro.requisitos.filter(item => item.estado === 'completado').length}/{registro.requisitos.length} pasos
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {registro.fechaTramiteProgramada}
                    </p>
                  </button>
                ))}
              </div>
            </aside>

            {mostrarFormulario ? (
              <div className="max-h-[73vh] space-y-6 overflow-y-auto p-5 lg:p-6">
              <section className="space-y-4">
                <h3 className="font-semibold">Datos del trámite</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Plantilla de destino *</Label>
                    <Select
                      value={plantillaSeleccionada}
                      onValueChange={value => cargarPlantilla(value as PlantillaDestinoExportacion)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLANTILLAS_DESTINO.map(plantilla => (
                          <SelectItem key={plantilla.value} value={plantilla.value}>
                            {plantilla.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>País y ciudad de destino</Label>
                    <Input
                      value={form.destinoDetalle}
                      onChange={event => setForm(prev => ({ ...prev, destinoDetalle: event.target.value }))}
                      placeholder="Ej. España, Madrid"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fecha programada del trámite *</Label>
                    <Input
                      type="date"
                      value={form.fechaTramiteProgramada}
                      onChange={event => setForm(prev => ({ ...prev, fechaTramiteProgramada: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fecha estimada de viaje</Label>
                    <Input
                      type="date"
                      min={form.fechaTramiteProgramada}
                      value={form.fechaViaje}
                      onChange={event => setForm(prev => ({ ...prev, fechaViaje: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Veterinario responsable *</Label>
                    <Input
                      value={form.veterinarioResponsable}
                      onChange={event => setForm(prev => ({ ...prev, veterinarioResponsable: event.target.value }))}
                    />
                  </div>
                </div>
                {plantillaSeleccionada && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="text-amber-700" />
                    <AlertTitle className="text-amber-900">Planificación recomendada</AlertTitle>
                    <AlertDescription className="text-amber-800">
                      Inicie la preparación 3–4 meses antes y confirme que la mascota sea mayor de 6 meses.
                      {plantillaSeleccionada === 'estados_unidos' && ' El tutor debe completar el CDC Dog Import Form Receipt entre 2 y 10 días antes del viaje.'}
                      {' '}Verifique siempre los requisitos vigentes del país específico.
                    </AlertDescription>
                  </Alert>
                )}
              </section>

              <section className="space-y-3 border-t pt-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">Pasos del trámite</h3>
                    <p className="text-xs text-muted-foreground">Marque cada paso cuando haya sido cumplido.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={agregarRequisito}>
                    <Plus className="mr-1 h-4 w-4" />Agregar
                  </Button>
                </div>
                {pendientes > 0 ? (
                  <Alert className="border-amber-200">
                    <AlertTriangle className="text-amber-600" />
                    <AlertTitle>{pendientes} requisito(s) obligatorio(s) pendiente(s)</AlertTitle>
                    <AlertDescription>Revise el checklist antes de completar el trámite.</AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-emerald-200 bg-emerald-50">
                    <CheckCircle2 className="text-emerald-700" />
                    <AlertTitle className="text-emerald-900">Checklist obligatorio completado</AlertTitle>
                  </Alert>
                )}
                <div className="space-y-3">
                  {form.requisitos.map(requisito => (
                    <div key={requisito.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[auto_1fr_auto] md:items-start">
                      <Checkbox
                        className="mt-2 h-5 w-5"
                        checked={requisito.estado === 'completado'}
                        onCheckedChange={checked => actualizarRequisito(
                          requisito.id,
                          { estado: checked === true ? 'completado' : 'pendiente' },
                        )}
                        aria-label={`Marcar ${requisito.nombre || 'paso'} como cumplido`}
                      />
                      <div className="space-y-2">
                        <Input
                          value={requisito.nombre}
                          onChange={event => actualizarRequisito(requisito.id, { nombre: event.target.value })}
                          placeholder="Nombre del requisito"
                        />
                        <Input
                          value={requisito.descripcion ?? ''}
                          onChange={event => actualizarRequisito(requisito.id, { descripcion: event.target.value })}
                          placeholder="Descripción o indicaciones"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant="outline"
                          className={requisito.estado === 'completado'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'}
                        >
                          {requisito.estado === 'completado' ? 'Cumplido' : 'Pendiente'}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarRequisito(requisito.id)}
                          aria-label="Eliminar requisito"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3 border-t pt-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">Presupuesto</h3>
                    <p className="text-xs text-muted-foreground">Los importes se guardan como referencia propia de este trámite.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={agregarCosto}>
                    <Plus className="mr-1 h-4 w-4" />Agregar
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.costos.map(costo => (
                    <div key={costo.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_80px_120px_90px_auto] sm:items-center">
                      <Input
                        value={costo.concepto}
                        onChange={event => actualizarCosto(costo.id, { concepto: event.target.value })}
                        placeholder="Concepto"
                      />
                      <Input
                        type="number"
                        min="0.01"
                        step="1"
                        value={costo.cantidad}
                        onChange={event => actualizarCosto(costo.id, { cantidad: Number(event.target.value) })}
                        aria-label="Cantidad"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={costo.precioUnitario}
                        onChange={event => actualizarCosto(costo.id, { precioUnitario: Number(event.target.value) })}
                        aria-label="Precio unitario"
                      />
                      <span className="text-right text-sm font-semibold">
                        {form.moneda} {((Number(costo.cantidad) || 0) * (Number(costo.precioUnitario) || 0)).toFixed(2)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => eliminarCosto(costo.id)}
                        aria-label="Eliminar costo"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end text-lg font-bold">
                  Total: {form.moneda} {total.toFixed(2)}
                </div>
              </section>

              <section className="space-y-1.5 border-t pt-5">
                <Label>Observaciones</Label>
                <Textarea
                  value={form.observaciones}
                  onChange={event => setForm(prev => ({ ...prev, observaciones: event.target.value }))}
                  placeholder="Indicaciones, números de referencia o notas del seguimiento"
                  className="min-h-24"
                />
              </section>
              </div>
            ) : (
              <div className="flex min-h-[55vh] items-center justify-center p-6">
                <div className="max-w-md text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10">
                    <FileCheck2 className="h-8 w-8 text-brand-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Historial de trámites</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Seleccione un trámite del historial para consultarlo o editarlo. Si la mascota realizará un nuevo viaje, registre un trámite independiente.
                  </p>
                  <Button className="mt-5" onClick={iniciarNuevo}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar otro trámite
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          {mostrarFormulario && (
            <>
              <Button
                variant="outline"
                onClick={descargarCertificado}
                disabled={!seleccionadoId || !certificadoConLogo || generandoPdf || guardando}
              >
                {generandoPdf
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Download className="mr-2 h-4 w-4" />}
                Descargar certificado
              </Button>
              <Button onClick={guardar} disabled={guardando || cargando}>
                {guardando
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Save className="mr-2 h-4 w-4" />}
                Guardar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
