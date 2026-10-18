import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Mail } from 'lucide-react'
import { ExportacionController } from '@/controllers/exportacion.controller'
import { MascotaController } from '@/controllers/mascota.controller'
import { generarPdfCertificadoExportacion } from '@/lib/pdfCertificadoExportacion'
import { generarPdfCartillaExportacion } from '@/lib/pdfCartillaExportacion'
import type { DocumentoExportacion, EnvioExportacion, ExportacionMascota, Mascota, Vacuna, Veterinaria } from '@/types'
import { Button } from '@/components/atoms/ui/button'
import { Checkbox } from '@/components/atoms/ui/checkbox'
import { Input } from '@/components/atoms/ui/input'
import { Label } from '@/components/atoms/ui/label'

const controller = ExportacionController.getInstance()
const mascotaController = MascotaController.getInstance()

async function pdfBase64(file: File): Promise<string> {
  if (file.type !== 'application/pdf' || file.size > 5 * 1024 * 1024 || file.size === 0) {
    throw new Error('Seleccione un PDF de laboratorio de hasta 5 MB')
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') throw new Error('El archivo no es un PDF válido')
  let binary = ''
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
  }
  return btoa(binary)
}

export function EnvioDocumentosExportacion({ tramite, mascota, veterinaria }: {
  tramite: ExportacionMascota
  mascota: Mascota
  veterinaria: Veterinaria | null
}) {
  const [vacunas, setVacunas] = useState<Vacuna[]>([])
  const [envios, setEnvios] = useState<EnvioExportacion[]>([])
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [seleccion, setSeleccion] = useState<DocumentoExportacion[]>([])
  const [laboratorio, setLaboratorio] = useState<File | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let activo = true
    setSeleccion([])
    setLaboratorio(null)
    setErrorCarga(null)
    void Promise.all([controller.listarEnvios(tramite.id), mascotaController.getExpedienteById(mascota.id)])
      .then(([historial, expediente]) => {
        if (!activo) return
        setEnvios(historial)
        setVacunas(expediente?.vacunas ?? [])
      })
      .catch(error => { if (activo) setErrorCarga(error instanceof Error ? error.message : 'No se pudieron cargar los documentos') })
    return () => { activo = false }
  }, [tramite.id, mascota.id])

  const completo = tramite.estado === 'completado' && tramite.requisitos.length > 0
    && tramite.requisitos.every(item => item.estado === 'completado')
  const email = mascota.propietario.email

  const marcar = (tipo: DocumentoExportacion, checked: boolean) => {
    setConfirmando(false)
    setSeleccion(prev => checked ? [...prev, tipo] : prev.filter(item => item !== tipo))
  }

  const enviar = async () => {
    if (!completo || !email || !seleccion.length || enviando) return
    if (!confirmando) { setConfirmando(true); return }
    try {
      setEnviando(true)
      const adjuntos: Array<{ tipo: DocumentoExportacion; content: string }> = []
      if (seleccion.includes('certificado')) {
        adjuntos.push({ tipo: 'certificado', content: await generarPdfCertificadoExportacion({
          exportacion: tramite, mascota, veterinaria,
        }) })
      }
      if (seleccion.includes('cartilla')) {
        adjuntos.push({ tipo: 'cartilla', content: generarPdfCartillaExportacion(mascota, vacunas) })
      }
      if (seleccion.includes('laboratorio')) {
        if (!laboratorio) throw new Error('Seleccione los resultados de laboratorio')
        adjuntos.push({ tipo: 'laboratorio', content: await pdfBase64(laboratorio) })
      }
      await controller.enviarDocumentacion(tramite.id, email, adjuntos)
      setSeleccion([])
      setLaboratorio(null)
      toast.success(`Documentación enviada a ${email}`)
      try { setEnvios(await controller.listarEnvios(tramite.id)) } catch {
        toast.info('El correo se envió, pero no se pudo actualizar el historial en pantalla')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar la documentación')
      try { setEnvios(await controller.listarEnvios(tramite.id)) } catch { /* Keep the send error visible. */ }
    } finally {
      setEnviando(false)
      setConfirmando(false)
    }
  }

  return (
    <section className="space-y-3 border-t pt-5">
      <h3 className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4" />Enviar documentación</h3>
      <p className="text-sm text-muted-foreground">Destinatario: {email || 'El propietario no tiene correo registrado'}</p>
      {!completo && <p className="text-sm text-amber-700">Complete todos los pasos y guarde el trámite antes de enviar.</p>}
      {errorCarga && <p role="alert" className="text-sm text-destructive">{errorCarga}</p>}
      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Checkbox id="enviar-certificado" checked={seleccion.includes('certificado')}
            disabled={!completo || !veterinaria?.logoUrl || enviando}
            onCheckedChange={value => marcar('certificado', value === true)} />
          <Label htmlFor="enviar-certificado">Certificado de salud {veterinaria?.logoUrl ? '' : '(configure el logo)'}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="enviar-cartilla" checked={seleccion.includes('cartilla')}
            disabled={!completo || vacunas.length === 0 || enviando || !!errorCarga}
            onCheckedChange={value => marcar('cartilla', value === true)} />
          <Label htmlFor="enviar-cartilla">Cartilla de vacunación {vacunas.length ? '' : '(sin vacunas registradas)'}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="enviar-laboratorio" checked={seleccion.includes('laboratorio')}
            disabled={!completo || !laboratorio || enviando}
            onCheckedChange={value => marcar('laboratorio', value === true)} />
          <Label htmlFor="enviar-laboratorio">Resultados de laboratorio</Label>
        </div>
        <Input aria-label="Adjuntar resultados de laboratorio en PDF" type="file" accept="application/pdf"
          disabled={!completo || enviando} onChange={event => {
            const file = event.target.files?.[0] ?? null
            setLaboratorio(file)
            setConfirmando(false)
            setSeleccion(prev => file ? [...new Set([...prev, 'laboratorio' as const])] : prev.filter(item => item !== 'laboratorio'))
          }} />
        <p className="text-xs text-muted-foreground">Adjunte un PDF de hasta 5 MB. Verifique que corresponde a esta mascota.</p>
      </div>
      {confirmando && <p className="text-sm text-amber-700">Confirme el envío de {seleccion.length} documento(s) a {email}.</p>}
      <Button type="button" onClick={() => void enviar()}
        disabled={!completo || !email || !seleccion.length || enviando || !!errorCarga}>
        {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {confirmando ? 'Confirmar envío' : 'Enviar documentación'}
      </Button>
      {envios.length > 0 && <div className="space-y-2 pt-2">
        <h4 className="text-sm font-semibold">Historial de envíos</h4>
        {envios.map(envio => <p key={envio.id} className="text-xs text-muted-foreground">
          {new Date(envio.fechaEnvio || envio.createdAt).toLocaleString('es-SV')} · {envio.destinatarioEmail} · {envio.documentos.join(', ')} · {envio.estado}
        </p>)}
      </div>}
    </section>
  )
}
