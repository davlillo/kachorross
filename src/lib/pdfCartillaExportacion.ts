import { jsPDF } from 'jspdf'
import type { Mascota, Vacuna } from '@/types'
import { formatDateLocal } from '@/lib/utils'

export function generarPdfCartillaExportacion(mascota: Mascota, vacunas: Vacuna[]): string {
  if (vacunas.length === 0) throw new Error('La mascota no tiene vacunas registradas')

  const pdf = new jsPDF()
  const width = pdf.internal.pageSize.getWidth()
  const margin = 18
  let y = 22

  const header = () => {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.text('Registro de vacunación', margin, 22)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text(`Mascota: ${mascota.nombre} · ${mascota.especie} · ${mascota.raza}`, margin, 32)
    pdf.text(`Propietario: ${mascota.propietario.nombre}`, margin, 38)
    pdf.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-SV')}`, margin, 44)
    pdf.line(margin, 48, width - margin, 48)
    y = 56
  }

  header()
  for (const vacuna of [...vacunas].sort((a, b) => a.fechaAplicacion.localeCompare(b.fechaAplicacion))) {
    if (y > 265) {
      pdf.addPage()
      header()
    }
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text(pdf.splitTextToSize(vacuna.nombre, width - 2 * margin)[0], margin, y)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text(`Aplicación: ${formatDateLocal(vacuna.fechaAplicacion)}  Lote: ${vacuna.lote || 'No registrado'}`, margin, y + 6)
    pdf.text(`Dosis: ${vacuna.dosis || 'No registrada'}  Veterinario: ${vacuna.aplicadaPor || 'No registrado'}`, margin, y + 12)
    y += 22
  }
  pdf.setFontSize(8)
  pdf.text('Registro clínico de vacunación. No sustituye una certificación sanitaria oficial.', margin, 284)
  return pdf.output('datauristring').split(',')[1]
}
