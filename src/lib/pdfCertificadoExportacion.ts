import { jsPDF } from 'jspdf'
import type { ExportacionMascota, Mascota, Veterinaria } from '@/types'
import { formatDateLocal } from '@/lib/utils'

interface GenerarCertificadoParams {
  exportacion: ExportacionMascota
  mascota: Mascota
  veterinaria: Veterinaria | null
}

const ESTADO_REQUISITO: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completado: 'Completado',
}

function base64FromArrayBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

async function convertirImagenADataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { mode: 'cors' })
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

export async function generarPdfCertificadoExportacion({
  exportacion,
  mascota,
  veterinaria,
}: GenerarCertificadoParams): Promise<string> {
  const pdf = new jsPDF('l', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - margin * 2
  const logo = veterinaria?.logoUrl
    ? await convertirImagenADataUrl(veterinaria.logoUrl)
    : null
  if (!veterinaria?.logoUrl || !logo) {
    throw new Error('Cargue un logo válido en Configuración antes de generar el certificado')
  }
  const primary = [132, 42, 100] as const
  const darkPrimary = [90, 24, 70] as const
  const navy = [43, 59, 96] as const
  const ink = [45, 55, 70] as const
  const muted = [105, 115, 130] as const
  const pale = [248, 246, 248] as const
  const reference = exportacion.id.slice(0, 8).toUpperCase()

  const drawHealthIcon = (x: number, y: number) => {
    pdf.setFillColor(...primary)
    pdf.circle(x, y, 4.3, 'F')
    pdf.setFillColor(255, 255, 255)
    pdf.roundedRect(x - 0.9, y - 2.7, 1.8, 5.4, 0.4, 0.4, 'F')
    pdf.roundedRect(x - 2.7, y - 0.9, 5.4, 1.8, 0.4, 0.4, 'F')
  }

  const drawContactIcon = (
    type: 'phone' | 'email' | 'location',
    x: number,
    y: number,
  ) => {
    pdf.setDrawColor(...primary)
    pdf.setLineWidth(0.45)
    if (type === 'email') {
      pdf.roundedRect(x, y - 2.4, 4.8, 3.5, 0.4, 0.4, 'S')
      pdf.line(x + 0.3, y - 2.1, x + 2.4, y - 0.5)
      pdf.line(x + 4.5, y - 2.1, x + 2.4, y - 0.5)
      return
    }
    if (type === 'location') {
      pdf.circle(x + 2.4, y - 1.1, 1.7, 'S')
      pdf.circle(x + 2.4, y - 1.1, 0.45, 'S')
      pdf.line(x + 1.2, y, x + 2.4, y + 1.6)
      pdf.line(x + 3.6, y, x + 2.4, y + 1.6)
      return
    }
    pdf.roundedRect(x + 0.9, y - 3, 3.1, 4.8, 0.5, 0.5, 'S')
    pdf.line(x + 1.6, y - 2.3, x + 3.3, y - 2.3)
    pdf.circle(x + 2.45, y + 1.1, 0.22, 'S')
  }

  const drawHeader = (continuacion = false) => {
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageWidth, 40, 'F')

    const properties = pdf.getImageProperties(logo)
    const ratio = properties.width / properties.height
    const maxWidth = 34
    const maxHeight = 24
    const imageWidth = Math.min(maxWidth, maxHeight * ratio)
    const imageHeight = imageWidth / ratio
    pdf.addImage(
      logo,
      properties.fileType,
      margin,
      4 + (24 - imageHeight) / 2,
      imageWidth,
      imageHeight,
      undefined,
      'FAST',
    )

    const brandX = margin + 39
    pdf.setTextColor(...navy)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.text(veterinaria?.nombre || "Veterinaria Kachorro's", brandX, 12)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...primary)
    pdf.setFontSize(8.5)
    pdf.text('Salud y bienestar animal', brandX, 18)

    const contactX = pageWidth - margin - 90
    pdf.setTextColor(...ink)
    pdf.setFontSize(7.2)
    drawContactIcon('phone', contactX, 8.5)
    pdf.text(veterinaria?.telefono || 'Teléfono no configurado', contactX + 7, 8.5)
    drawContactIcon('email', contactX, 15)
    pdf.text(veterinaria?.email || 'Correo no configurado', contactX + 7, 15)
    drawContactIcon('location', contactX, 21.5)
    pdf.setTextColor(...muted)
    pdf.text(
      pdf.splitTextToSize(veterinaria?.direccion || 'Dirección no configurada', 82)[0],
      contactX + 7,
      21.5,
    )

    pdf.setFillColor(249, 246, 248)
    pdf.rect(0, 29, pageWidth, 9, 'F')
    drawHealthIcon(margin + 4.5, 33.7)
    pdf.setTextColor(...darkPrimary)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text(
      continuacion ? 'ANEXO SANITARIO' : 'CERTIFICADO DE SALUD',
      margin + 14,
      35,
    )
    pdf.setTextColor(...primary)
    pdf.setFontSize(8.5)
    pdf.setFont('helvetica', 'bold')
    pdf.text(
      continuacion ? 'CONTINUACIÓN DEL CHECKLIST' : 'TRÁMITE DE EXPORTACIÓN DE MASCOTA',
      pageWidth / 2,
      34.8,
      { align: 'center' },
    )
    pdf.setFillColor(239, 229, 236)
    pdf.roundedRect(pageWidth - margin - 39, 30.3, 39, 6.5, 3, 3, 'F')
    pdf.setTextColor(...darkPrimary)
    pdf.setFontSize(7.2)
    pdf.text(`REFERENCIA ${reference}`, pageWidth - margin - 19.5, 34.5, { align: 'center' })
    pdf.setFillColor(...darkPrimary)
    pdf.rect(0, 38, pageWidth, 1.4, 'F')
  }

  const drawCard = (
    x: number,
    y: number,
    width: number,
    title: string,
    fields: Array<[string, string | undefined | null]>,
  ) => {
    const height = 47
    pdf.setFillColor(...pale)
    pdf.setDrawColor(226, 220, 225)
    pdf.roundedRect(x, y, width, height, 2, 2, 'FD')
    pdf.setFillColor(...primary)
    pdf.roundedRect(x, y, width, 8, 2, 2, 'F')
    pdf.rect(x, y + 5, width, 3, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8.5)
    pdf.text(title, x + 4, y + 5.5)

    let fieldY = y + 14
    fields.forEach(([label, value]) => {
      pdf.setTextColor(...muted)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(6.7)
      pdf.text(label.toUpperCase(), x + 4, fieldY)
      pdf.setTextColor(...ink)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8.4)
      const text = value?.trim() || 'No registrado'
      const lines = pdf.splitTextToSize(text, width - 30)
      pdf.text(lines[0], x + 28, fieldY)
      fieldY += 6
    })
  }

  const drawChecklistItem = (
    requisito: ExportacionMascota['requisitos'][number],
    x: number,
    y: number,
    width: number,
  ): number => {
    const estado = ESTADO_REQUISITO[requisito.estado] || requisito.estado
    const nameLines = pdf.splitTextToSize(requisito.nombre, width - 37)
    const descriptionLines = requisito.descripcion
      ? pdf.splitTextToSize(requisito.descripcion, width - 10).slice(0, 2)
      : []
    const height = Math.max(14, 7 + nameLines.length * 3.8 + descriptionLines.length * 3.3)

    pdf.setFillColor(255, 255, 255)
    pdf.setDrawColor(226, 220, 225)
    pdf.roundedRect(x, y, width, height, 1.5, 1.5, 'FD')
    pdf.setFillColor(
      requisito.estado === 'completado' ? 31 : requisito.estado === 'en_proceso' ? 217 : 156,
      requisito.estado === 'completado' ? 143 : requisito.estado === 'en_proceso' ? 119 : 163,
      requisito.estado === 'completado' ? 95 : requisito.estado === 'en_proceso' ? 6 : 175,
    )
    pdf.circle(x + 5, y + 6, 2.2, 'F')
    pdf.setTextColor(...ink)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.text(nameLines, x + 10, y + 5.3)
    pdf.setTextColor(...primary)
    pdf.setFontSize(6.6)
    pdf.text(
      `${requisito.obligatorio ? 'OBLIGATORIO' : 'OPCIONAL'} · ${estado.toUpperCase()}`,
      x + width - 4,
      y + 5.3,
      { align: 'right' },
    )
    if (descriptionLines.length > 0) {
      pdf.setTextColor(...muted)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(7)
      pdf.text(descriptionLines, x + 10, y + 10.2)
    }
    return height
  }

  const drawFooter = (page: number, pages: number) => {
    pdf.setFillColor(...darkPrimary)
    pdf.rect(0, pageHeight - 10, pageWidth, 10, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(7)
    pdf.text('Certificado clínico · Verifique los requisitos vigentes con la autoridad del destino.', margin, pageHeight - 4)
    pdf.text(`Página ${page} de ${pages}`, pageWidth - margin, pageHeight - 4, { align: 'right' })
  }

  drawHeader()
  pdf.setFillColor(255, 255, 255)
  pdf.setDrawColor(226, 220, 225)
  pdf.roundedRect(margin, 42, contentWidth, 15, 2, 2, 'FD')
  pdf.setTextColor(...navy)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9.5)
  pdf.text('CONSTANCIA CLÍNICA', margin + 5, 48)
  pdf.setTextColor(...ink)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.2)
  const statement = `Se deja constancia de que ${mascota.nombre} se encuentra en seguimiento clínico y documental para su traslado a ${exportacion.paisDestino}. La información detallada corresponde al expediente disponible a la fecha de emisión.`
  pdf.text(pdf.splitTextToSize(statement, contentWidth - 10), margin + 5, 53)

  const cardGap = 4
  const cardWidth = (contentWidth - cardGap * 2) / 3
  drawCard(margin, 62, cardWidth, 'PROPIETARIO', [
    ['Nombre', mascota.propietario.nombre],
    ['Teléfono', mascota.propietario.telefono],
    ['Correo', mascota.propietario.email],
    ['Dirección', mascota.propietario.direccion],
  ])
  drawCard(margin + cardWidth + cardGap, 62, cardWidth, 'IDENTIFICACIÓN DE LA MASCOTA', [
    ['Nombre', mascota.nombre],
    ['Especie / raza', `${mascota.especie} · ${mascota.raza}`],
    ['Sexo / color', `${mascota.sexo === 'macho' ? 'Macho' : 'Hembra'} · ${mascota.color}`],
    ['Nacimiento / peso', `${mascota.fechaNacimiento ? formatDateLocal(mascota.fechaNacimiento) : 'No registrado'} · ${mascota.peso} kg`],
  ])
  drawCard(margin + (cardWidth + cardGap) * 2, 62, cardWidth, 'DATOS DEL TRÁMITE', [
    ['Destino', [exportacion.paisDestino, exportacion.destinoDetalle].filter(Boolean).join(' · ')],
    ['Fecha trámite', formatDateLocal(exportacion.fechaTramiteProgramada)],
    ['Fecha viaje', exportacion.fechaViaje ? formatDateLocal(exportacion.fechaViaje) : undefined],
    ['Emisión', new Date().toLocaleDateString('es-SV')],
  ])

  pdf.setTextColor(...navy)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text('CONTROL DE REQUISITOS SANITARIOS', margin, 116)
  pdf.setTextColor(...muted)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.text('El estado refleja el seguimiento documental registrado; no constituye aprobación oficial.', margin, 121)

  const firstPageRequirements = exportacion.requisitos.slice(0, 6)
  const checklistColumnWidth = (contentWidth - 5) / 2
  const checklistYs = [126, 126]
  firstPageRequirements.forEach((requisito, index) => {
    const column = index % 2
    const x = margin + column * (checklistColumnWidth + 5)
    const height = drawChecklistItem(requisito, x, checklistYs[column], checklistColumnWidth)
    checklistYs[column] += height + 3
  })

  const bottomY = 178
  if (exportacion.observaciones) {
    pdf.setTextColor(...navy)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7.5)
    pdf.text('OBSERVACIONES', margin, bottomY)
    pdf.setTextColor(...ink)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7.2)
    pdf.text(
      pdf.splitTextToSize(exportacion.observaciones, contentWidth - 112).slice(0, 1),
      margin,
      bottomY + 4.5,
    )
  }

  const signatureWidth = 88
  const signatureX = pageWidth - margin - signatureWidth
  pdf.setDrawColor(...navy)
  pdf.setLineWidth(0.4)
  pdf.line(signatureX, bottomY + 9, signatureX + signatureWidth, bottomY + 9)
  pdf.setTextColor(...ink)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8.5)
  pdf.text(exportacion.veterinarioResponsable, signatureX + signatureWidth / 2, bottomY + 14, { align: 'center' })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.text('Firma y sello del veterinario responsable', signatureX + signatureWidth / 2, bottomY + 18, { align: 'center' })

  const remainingRequirements = exportacion.requisitos.slice(6)
  if (remainingRequirements.length > 0) {
    pdf.addPage()
    drawHeader(true)
    pdf.setTextColor(...navy)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text('CHECKLIST SANITARIO COMPLEMENTARIO', margin, 47)

    const columnWidth = (contentWidth - 6) / 2
    const columnYs = [54, 54]
    remainingRequirements.forEach((requisito) => {
      let column = columnYs[0] <= columnYs[1] ? 0 : 1
      const estimatedHeight = 22
      if (columnYs[column] + estimatedHeight > pageHeight - 18) {
        pdf.addPage()
        drawHeader(true)
        columnYs[0] = 48
        columnYs[1] = 48
        column = 0
      }
      const x = margin + column * (columnWidth + 6)
      const height = drawChecklistItem(requisito, x, columnYs[column], columnWidth)
      columnYs[column] += height + 3
    })
  }

  const pages = pdf.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page)
    drawFooter(page, pages)
  }

  return base64FromArrayBuffer(pdf.output('arraybuffer'))
}
