import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { sanitizeHTML } from '@/lib/sanitize'

function buildHtml(tratamiento: string, logoUrl?: string): string {
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="Logo" class="logo-img" />`
    : '';

  const hoy = new Date();
  const fechaStr = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;

  return `
  <style>
    .pdf-ka-container { width: 800px; background: #fff; font-family: Arial, Helvetica, sans-serif; color: #374151; box-sizing: border-box; }
    .pdf-ka-container * { box-sizing: border-box; margin: 0; padding: 0; }
    .pdf-ka-container .hoja { padding: 40px 50px; display: flex; flex-direction: column; min-height: 1131px; }
    
    .pdf-ka-container .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; background: #fff; }
    
    .pdf-ka-container .logo-wrap { display: flex; align-items: center; gap: 12px; }
    .pdf-ka-container .logo-img { height: 56px; width: auto; display: block; }
    .pdf-ka-container .logo-text { display: flex; flex-direction: column; justify-content: center; }
    .pdf-ka-container .logo-text .vet { font-size: 16px; font-weight: 600; color: #2B3B60; line-height: 1.2; }
    .pdf-ka-container .logo-text .kach { font-size: 25px; font-weight: 900; color: #842A64; line-height: 1; letter-spacing: -0.5px; }
    
    .pdf-ka-container .info { text-align: right; }
    .pdf-ka-container .info h4 { font-size: 13px; font-weight: 700; color: #1f2937; margin-bottom: 10px; }
    
    .pdf-ka-container .contacts { font-size: 11px; color: #6b7280; }
    .pdf-ka-container .contact-item { display: inline; }
    .pdf-ka-container .contact-item + .contact-item { margin-left: 16px; }
    .pdf-ka-container .contact-item span { line-height: 1.1; }
    
    .pdf-ka-container .fecha { font-size: 11px; color: #9ca3af; margin-top: 6px; font-weight: 500; }
    .pdf-ka-container .separator { height: 2px; background: #5A1846; width: 100%; }
    
    .pdf-ka-container .content { flex: 1; padding: 40px 10px; font-size: 20px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; color: #374151; }
    
    .pdf-ka-container .footer-sep { height: 1px; background: #5A1846; margin-bottom: 6px; width: 100%; }
    .pdf-ka-container .address { text-align: center; font-size: 9.5px; color: #1f2937; font-weight: 600; padding-bottom: 8px; margin: 0; }
    
    .pdf-ka-container .social { background: #5A1846; color: #fff; padding: 12px 18px; display: flex; justify-content: space-between; align-items: stretch; font-size: 10px; border-radius: 2px; }
    
    .pdf-ka-container .social-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
    .pdf-ka-container .social-item .badge-wrapper { display: flex; align-items: center; justify-content: center; width: 15px; height: 15px; }
    
    .pdf-ka-container .fb-badge, .pdf-ka-container .ig-badge, .pdf-ka-container .tik-badge, .pdf-ka-container .web-badge { display: flex; align-items: center; justify-content: center; width: 15px; height: 15px; border-radius: 3px; background: #fff; }
    .pdf-ka-container .fb-badge { border-radius: 50%; }
    
    .pdf-ka-container svg.social-svg { display: block; }
    .pdf-ka-container svg.fb-svg { width: 11px; height: 11px; fill: #5A1846; }
    .pdf-ka-container svg.ig-svg { width: 11px; height: 11px; fill: #5A1846; }
    .pdf-ka-container svg.tik-svg { width: 10px; height: 10px; fill: #5A1846; }
    .pdf-ka-container svg.web-svg { width: 11px; height: 11px; stroke: #5A1846; fill: none; stroke-width: 2.5; }
    
    .pdf-ka-container .social-item span { display: block; text-align: center; font-weight: 500; font-size: 9px; line-height: 1.1; }
  </style>

  <div class="pdf-ka-container">
    <div class="hoja">
      <div class="header">
        <div class="logo-wrap">
          ${logoHtml}
          <div class="logo-text">
            <div class="vet">Veterinaria</div>
            <div class="kach">KACHORRO'S</div>
          </div>
        </div>
        <div class="info">
          <h4>Inversiones Kachorro's S.A de C.V</h4>
          <div class="contacts">
            <span style="font-weight: 500; margin-right: 4px;">Contactos:</span>
            <div class="contact-item">
              <span>+503 7315 8160</span>
            </div><div class="contact-item">
              <span>2220 9679</span>
            </div>
          </div>
          <div class="fecha">${fechaStr}</div>
        </div>
      </div>
      <div class="separator"></div>
      <div class="content">${sanitizeHTML(tratamiento || 'Sin tratamiento registrado.')}</div>
      <div>
        <div class="footer-sep"></div>
        <p class="address">AV. MONTECRISTO POLIG. C, COL. MONTEBELLO, # 1-A, MEJICANOS, SAN SALVADOR</p>
        <div class="social">
          <div class="social-item">
            <div class="badge-wrapper"><div class="fb-badge"><svg viewBox="0 0 24 24" class="social-svg fb-svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></div></div><span>Veterinaria Kachorro's Montebello</span>
          </div>
          <div class="social-item">
            <div class="badge-wrapper"><div class="ig-badge"><svg viewBox="0 0 24 24" class="social-svg ig-svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></div></div><span>vetkachorrosv</span>
          </div>
          <div class="social-item">
            <div class="badge-wrapper"><div class="tik-badge"><svg viewBox="0 0 24 24" class="social-svg tik-svg"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.9 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.36 0 .69.08 1 .2v-3.5a6.37 6.37 0 0 0-1-.08A6.33 6.33 0 0 0 2 15.74a6.33 6.33 0 0 0 6.38 6.29 6.33 6.33 0 0 0 6.38-6.29V9.64c.9.66 2 1.06 3.23 1.06h.45v-3.5c-.68 0-1.35-.2-1.95-.51z"/></svg></div></div><span>vet_kachorros</span>
          </div>
          <div class="social-item">
            <div class="badge-wrapper"><div class="web-badge"><svg viewBox="0 0 24 24" class="social-svg web-svg"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div></div><span>www.kachorrosss.click</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  `
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
  container.style.cssText = 'position:fixed;top:0;left:0;width:800px;opacity:0;pointer-events:none;z-index:-1;'
  container.innerHTML = buildHtml(tratamiento, logoUrl)
  document.body.appendChild(container)

  try {
    const el = container.querySelector('.pdf-ka-container') as HTMLElement
    el.offsetHeight

    const canvas = await html2canvas(el, {
      scale: 2,
      width: 800,
      height: 1131,
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
