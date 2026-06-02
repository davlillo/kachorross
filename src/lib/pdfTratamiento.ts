import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

function buildHtml(tratamiento: string, logoUrl?: string): string {
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="Logo" style="max-height:56px;width:auto;object-fit:contain;" />`
    : ''

  return `
<div style="width:720px;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#374151;">
  <div style="max-width:720px;margin:0 auto;border:1px solid #d1d5db;border-radius:6px;overflow:hidden;display:flex;flex-direction:column;">
    <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 24px;background:#fff;">
      <div style="display:flex;align-items:center;gap:8px;">
        ${logoHtml}
        <div style="display:flex;flex-direction:column;">
          <div style="font-size:18px;font-weight:600;color:#2B3B60;line-height:1.1;">Veterinaria</div>
          <div style="font-size:24px;font-weight:900;color:#842A64;line-height:1;">KACHORRO'S</div>
        </div>
      </div>
      <div style="text-align:right;">
        <h4 style="font-size:14px;font-weight:700;color:#1f2937;margin:0;">Inversiones Kachorro's S.A de C.V</h4>
        <div style="font-size:12px;color:#6b7280;display:flex;align-items:center;justify-content:flex-end;gap:12px;margin-top:4px;">
          <span style="display:inline-flex;align-items:center;gap:4px;">&#9742; +503 7315 8160</span>
          <span style="display:inline-flex;align-items:center;gap:4px;">&#9742; 2220 9679</span>
        </div>
      </div>
    </div>
    <div style="height:2px;background:#5A1846;"></div>
    <div style="flex:1;padding:24px;font-size:14px;line-height:1.6;white-space:pre-wrap;word-wrap:break-word;color:#374151;">
      ${tratamiento || 'Sin tratamiento registrado.'}
    </div>
    <div>
      <div style="height:1px;background:#5A1846;margin-bottom:4px;"></div>
      <p style="text-align:center;font-size:10px;color:#1f2937;font-weight:500;padding:4px 0 8px;margin:0;">
        AV. MONTECRISTO POLIG. C, COL. MONTEBELLO, # 1-A, MEJICANOS, SAN SALVADOR
      </p>
      <div style="background:#5A1846;color:#fff;padding:8px 16px;display:flex;justify-content:space-between;align-items:center;font-size:10px;">
        <span style="display:inline-flex;align-items:center;gap:4px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;background:#fff;color:#5A1846;font-weight:900;font-size:10px;">f</span>
          Veterinaria Kachorro's Montebello
        </span>
        <span style="display:inline-flex;align-items:center;gap:4px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:2px;background:#fff;">&#9829;</span>
          vetkachorrosv
        </span>
        <span style="display:inline-flex;align-items:center;gap:4px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:2px;background:#fff;color:#5A1846;font-weight:900;font-size:11px;">&#9830;</span>
          vet_kachorros
        </span>
        <span style="display:inline-flex;align-items:center;gap:4px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:2px;background:#fff;">&#9400;</span>
          www.kachorrosss.click
        </span>
      </div>
    </div>
  </div>
</div>`
}

function base64FromArrayBuffer(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export async function generarPdfTratamiento(
  tratamiento: string,
  logoUrl?: string,
): Promise<string> {
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;'
  container.innerHTML = buildHtml(tratamiento, logoUrl)
  document.body.appendChild(container)

  try {
    const el = container.firstElementChild as HTMLElement
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfW = pdf.internal.pageSize.getWidth()
    const pdfH = pdf.internal.pageSize.getHeight()

    const ratio = pdfW / canvas.width

    let offsetY = 0
    let pageNum = 0

    while (offsetY < canvas.height) {
      if (pageNum > 0) pdf.addPage()

      const pageCanvasH = Math.min(canvas.height - offsetY, pdfH / ratio)

      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = pageCanvasH
      const ctx = pageCanvas.getContext('2d')!
      ctx.drawImage(canvas, 0, offsetY, canvas.width, pageCanvasH, 0, 0, canvas.width, pageCanvasH)

      const imgData = pageCanvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pageCanvasH * ratio)

      offsetY += pageCanvasH
      pageNum++
    }

    const buf = pdf.output('arraybuffer')
    return base64FromArrayBuffer(buf)
  } finally {
    document.body.removeChild(container)
  }
}
