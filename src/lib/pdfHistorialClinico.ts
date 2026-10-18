import { jsPDF } from 'jspdf'
import logoLocalUrl from '@/media/logo.png'
import type { Consulta, Expediente, Veterinaria } from '@/types'
import { formatDateLocal, todayLocal } from '@/lib/utils'

interface GenerarHistorialClinicoParams {
  expediente: Expediente
  veterinaria: Veterinaria | null
}

const PAGE_MARGIN = 16
const HEADER_HEIGHT = 31
const FOOTER_HEIGHT = 12
const PRIMARY = [132, 42, 100] as const
const DARK = [54, 38, 62] as const
const MUTED = [100, 100, 110] as const
const LIGHT = [248, 245, 248] as const
const CLINIC_LEGAL_NAME = "Inversiones Kachorro's S.A de C.V"
const CLINIC_PHONE_PRIMARY = '+503 7315 8160'
const CLINIC_PHONE_SECONDARY = '2220 9679'

async function imageToDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function value(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'No registrado'
  return String(value)
}

function formatDateTime(date: string): string {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return value(date)
  return parsed.toLocaleString('es-SV', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function sanitizeFilePart(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*]+/g, '')
    .trim()
    .replace(/\s+/g, '_') || 'Mascota'
}

function consultaLines(consulta: Consulta): Array<[string, string]> {
  return [
    ['Motivo', consulta.motivo],
    ['Síntomas', consulta.sintomas],
    ['Diagnóstico', consulta.diagnostico],
    ['Tratamiento', consulta.tratamiento],
    ['Notas', consulta.notas],
    ['Médico responsable', consulta.medicoResponsable || consulta.doctora],
    ['Estado', consulta.estado === 'finalizado' ? 'Finalizado' : 'Pendiente'],
    ['Próxima cita', consulta.proximaCita ? formatDateLocal(consulta.proximaCita) : 'No programada'],
  ]
}

export interface HistorialClinicoPdf {
  base64: string
  filename: string
}

function base64FromArrayBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }
  return btoa(binary)
}

export async function generarPdfHistorialClinico({
  expediente,
  veterinaria,
}: GenerarHistorialClinicoParams): Promise<HistorialClinicoPdf> {
  const mascota = expediente.mascota
  const logo = await imageToDataUrl(veterinaria?.logoUrl || logoLocalUrl)
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidth = pageWidth - PAGE_MARGIN * 2
  let y = PAGE_MARGIN + HEADER_HEIGHT + 7

  const drawHeader = () => {
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageWidth, PAGE_MARGIN + HEADER_HEIGHT, 'F')

    if (logo) {
      try {
        const properties = pdf.getImageProperties(logo)
        const ratio = properties.width / properties.height
        const imageHeight = 22
        const imageWidth = Math.min(30, imageHeight * ratio)
        pdf.addImage(logo, properties.fileType, PAGE_MARGIN, 7, imageWidth, imageHeight, undefined, 'FAST')
      } catch {
        // El PDF sigue siendo válido aunque el logo configurado no pueda leerse.
      }
    }

    const textX = PAGE_MARGIN + 35
    pdf.setTextColor(...DARK)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text('Veterinaria', textX, 12)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(15)
    pdf.setTextColor(...PRIMARY)
    pdf.text("KACHORRO'S", textX, 20)

    const infoX = pageWidth - PAGE_MARGIN
    pdf.setTextColor(...DARK)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8.5)
    pdf.text(CLINIC_LEGAL_NAME, infoX, 10, { align: 'right' })
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7.5)
    pdf.setTextColor(...MUTED)
    pdf.text(`Contactos:    ${veterinaria?.telefono || CLINIC_PHONE_PRIMARY}    ${CLINIC_PHONE_SECONDARY}`, infoX, 17, { align: 'right' })
    pdf.text(formatDateLocal(todayLocal()), infoX, 25, { align: 'right' })

    pdf.setDrawColor(...PRIMARY)
    pdf.setLineWidth(0.8)
    pdf.line(PAGE_MARGIN, PAGE_MARGIN + HEADER_HEIGHT, pageWidth - PAGE_MARGIN, PAGE_MARGIN + HEADER_HEIGHT)
    y = PAGE_MARGIN + HEADER_HEIGHT + 7
  }

  const drawFooter = () => {
    const pages = pdf.getNumberOfPages()
    for (let page = 1; page <= pages; page += 1) {
      pdf.setPage(page)
      pdf.setDrawColor(...PRIMARY)
      pdf.setLineWidth(0.3)
      pdf.line(PAGE_MARGIN, pageHeight - FOOTER_HEIGHT, pageWidth - PAGE_MARGIN, pageHeight - FOOTER_HEIGHT)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(7.5)
      pdf.setTextColor(...MUTED)
      pdf.text('Historial clínico · Documento generado por Kachorros', PAGE_MARGIN, pageHeight - 6)
      pdf.text(`Página ${page} de ${pages}`, pageWidth - PAGE_MARGIN, pageHeight - 6, { align: 'right' })
    }
  }

  const newPage = () => {
    pdf.addPage()
    drawHeader()
  }

  const ensureSpace = (height: number) => {
    if (y + height > pageHeight - FOOTER_HEIGHT - 4) newPage()
  }

  const drawTitle = (title: string) => {
    ensureSpace(12)
    pdf.setFillColor(...LIGHT)
    pdf.roundedRect(PAGE_MARGIN, y - 5, contentWidth, 9, 2, 2, 'F')
    pdf.setTextColor(...PRIMARY)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text(title, PAGE_MARGIN + 4, y + 1)
    y += 11
  }

  const drawField = (label: string, text: string | number | null | undefined, width = contentWidth) => {
    const lines = pdf.splitTextToSize(value(text), width - 38) as string[]
    const height = Math.max(7, lines.length * 4.2 + 3)
    ensureSpace(height)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8.5)
    pdf.setTextColor(...DARK)
    pdf.text(`${label}:`, PAGE_MARGIN, y)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...MUTED)
    pdf.text(lines, PAGE_MARGIN + 38, y, { maxWidth: width - 38 })
    y += height
  }

  drawHeader()
  pdf.setTextColor(...DARK)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.text('Historial clínico', PAGE_MARGIN, y)
  y += 9
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...MUTED)
  pdf.text(`Expediente de ${mascota.nombre}`, PAGE_MARGIN, y)
  y += 9

  drawTitle('Datos de la mascota')
  drawField('Nombre', mascota.nombre)
  drawField('Especie', mascota.especie)
  drawField('Raza', mascota.raza)
  drawField('Sexo', mascota.sexo === 'macho' ? 'Macho' : 'Hembra')
  drawField('Fecha de nacimiento', mascota.fechaNacimiento ? formatDateLocal(mascota.fechaNacimiento) : 'No registrada')
  drawField('Color', mascota.color)
  drawField('Peso', mascota.peso ? `${mascota.peso} lb` : 'No registrado')
  drawField('Alergias', mascota.alergias?.length ? mascota.alergias.join(', ') : 'Ninguna registrada')
  drawField('Notas especiales', mascota.notasEspeciales || 'Ninguna registrada')

  drawTitle('Datos del propietario')
  drawField('Nombre', mascota.propietario.nombre)
  drawField('Teléfono', mascota.propietario.telefono)
  drawField('Correo', mascota.propietario.email)
  drawField('Dirección', mascota.propietario.direccion)

  drawTitle(`Consultas registradas (${expediente.consultas.length})`)
  const consultas = [...expediente.consultas].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  )

  if (consultas.length === 0) {
    drawField('Historial', 'No hay consultas registradas para este expediente.')
  }

  consultas.forEach((consulta, index) => {
    ensureSpace(18)
    pdf.setFillColor(...PRIMARY)
    pdf.roundedRect(PAGE_MARGIN, y - 5, contentWidth, 9, 2, 2, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text(`Consulta ${index + 1} · ${formatDateTime(consulta.fecha)}`, PAGE_MARGIN + 4, y + 1)
    y += 10

    consultaLines(consulta).forEach(([label, text]) => drawField(label, text))

    if (consulta.detalles.length > 0) {
      ensureSpace(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8.5)
      pdf.setTextColor(...DARK)
      pdf.text('Servicios y productos:', PAGE_MARGIN, y)
      y += 5
      consulta.detalles.forEach(detalle => {
        drawField(
          '•',
          `${detalle.producto.nombre} · Cantidad: ${detalle.cantidad} · Total: $${detalle.subtotal.toFixed(2)}`,
        )
      })
    }
    y += 3
  })

  if (expediente.vacunas.length > 0) {
    drawTitle(`Vacunas registradas (${expediente.vacunas.length})`)
    ;[...expediente.vacunas]
      .sort((a, b) => new Date(b.fechaAplicacion).getTime() - new Date(a.fechaAplicacion).getTime())
      .forEach(vacuna => {
        drawField('Vacuna', vacuna.nombre)
        drawField('Aplicación', formatDateLocal(vacuna.fechaAplicacion))
        drawField('Dosis / lote', `${value(vacuna.dosis)} / ${value(vacuna.lote)}`)
        drawField('Médico responsable', vacuna.aplicadaPor)
        if (vacuna.proximaDosis) drawField('Próxima dosis', formatDateLocal(vacuna.proximaDosis))
        y += 2
      })
  }

  if (expediente.desparasitaciones.length > 0) {
    drawTitle(`Desparasitaciones registradas (${expediente.desparasitaciones.length})`)
    ;[...expediente.desparasitaciones]
      .sort((a, b) => new Date(b.fechaAplicacion).getTime() - new Date(a.fechaAplicacion).getTime())
      .forEach(desparasitacion => {
        drawField('Tipo', desparasitacion.tipo)
        drawField('Vía de administración', desparasitacion.viaAdministracion)
        drawField('Aplicación', formatDateLocal(desparasitacion.fechaAplicacion))
        drawField('Médico responsable', desparasitacion.medicoResponsable)
        if (desparasitacion.fechaProximoTratamiento) {
          drawField('Próximo tratamiento', formatDateLocal(desparasitacion.fechaProximoTratamiento))
        }
        y += 2
      })
  }

  drawFooter()
  const filename = `Expediente_${sanitizeFilePart(mascota.nombre)}_${todayLocal()}.pdf`
  return {
    base64: base64FromArrayBuffer(pdf.output('arraybuffer')),
    filename,
  }
}
