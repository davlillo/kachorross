export function imprimirTratamiento(tratamiento: string, logoUrl?: string) {
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="Logo" style="max-height:56px;width:auto;object-fit:contain;" />`
    : '';

  const container = document.createElement('div');
  container.className = 'print-ka-container';
  container.innerHTML = `
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
        <span>
          <svg viewBox="0 0 24 24" class="icon"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/></svg>
          +503 7315 8160
        </span>
        <span>
          <svg viewBox="0 0 24 24" class="icon"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/></svg>
          2220 9679
        </span>
      </div>
    </div>
  </div>
  <div class="separator"></div>
  <div class="content">${tratamiento || 'Sin tratamiento registrado.'}</div>
  <div>
    <div class="footer-sep"></div>
    <p class="address">AV. MONTECRISTO POLIG. C, COL. MONTEBELLO, # 1-A, MEJICANOS, SAN SALVADOR</p>
    <div class="social">
      <span class="social-item"><span class="fb-badge">f</span>Veterinaria Kachorro's Montebello</span>
      <span class="social-item">
        <span class="ig-badge">
          <svg viewBox="0 0 24 24" class="ig-svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        </span>
        vetkachorrosv
      </span>
      <span class="social-item">
        <span class="tik-badge">
          <svg viewBox="0 0 24 24" class="tik-svg"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.9 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.36 0 .69.08 1 .2v-3.5a6.37 6.37 0 0 0-1-.08A6.33 6.33 0 0 0 2 15.74a6.33 6.33 0 0 0 6.38 6.29 6.33 6.33 0 0 0 6.38-6.29V9.64c.9.66 2 1.06 3.23 1.06h.45v-3.5c-.68 0-1.35-.2-1.95-.51z"/></svg>
        </span>
        vet_kachorros</span>
      <span class="social-item">
        <span class="web-badge">
          <svg viewBox="0 0 24 24" class="web-svg"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        </span>
        www.kachorrosss.click
      </span>
    </div>
  </div>
</div>
  `;

  const style = document.createElement('style');
  style.className = 'print-ka-style';
  style.textContent = `
    @page { margin: 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .print-ka-container { display: none; }
    .print-ka-container .hoja { max-width: 720px; margin: 0 auto; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; min-height: 100%; font-family: Arial, Helvetica, sans-serif; color: #374151; }
    .print-ka-container .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: #fff; }
    .print-ka-container .logo-wrap { display: flex; align-items: center; gap: 8px; }
    .print-ka-container .logo-wrap img { max-height: 56px; width: auto; }
    .print-ka-container .logo-text { display: flex; flex-direction: column; }
    .print-ka-container .logo-text .vet { font-size: 18px; font-weight: 600; color: #2B3B60; line-height: 1.1; }
    .print-ka-container .logo-text .kach { font-size: 24px; font-weight: 900; color: #842A64; line-height: 1; }
    .print-ka-container .info { text-align: right; }
    .print-ka-container .info h4 { font-size: 14px; font-weight: 700; color: #1f2937; }
    .print-ka-container .info .contacts { font-size: 12px; color: #6b7280; display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 4px; }
    .print-ka-container .info .contacts span { display: inline-flex; align-items: center; gap: 4px; }
    .print-ka-container .separator { height: 2px; background: #5A1846; }
    .print-ka-container .content { flex: 1; padding: 24px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; color: #374151; }
    .print-ka-container .footer-sep { height: 1px; background: #5A1846; margin-bottom: 4px; }
    .print-ka-container .address { text-align: center; font-size: 10px; color: #1f2937; font-weight: 500; padding: 4px 0 8px; }
    .print-ka-container .social { background: #5A1846; color: #fff; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; }
    .print-ka-container .social-item { display: inline-flex; align-items: center; gap: 4px; }
    .print-ka-container .fb-badge { display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 50%; background: #fff; color: #5A1846; font-weight: 900; font-size: 10px; }
    .print-ka-container .ig-badge { display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 2px; background: #fff; }
    .print-ka-container .tik-badge { display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 2px; background: #fff; color: #5A1846; font-weight: 900; font-size: 11px; }
    .print-ka-container .web-badge { display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 2px; background: #fff; }
    .print-ka-container svg.icon { width: 12px; height: 12px; fill: #6b7280; }
    .print-ka-container svg.ig-svg { width: 10px; height: 10px; fill: #5A1846; }
    .print-ka-container svg.tik-svg { width: 10px; height: 10px; fill: #5A1846; }
    .print-ka-container svg.web-svg { width: 10px; height: 10px; stroke: #5A1846; fill: none; stroke-width: 3; }
    @media print {
      body > :not(.print-ka-container) { display: none !important; }
      .print-ka-container { display: flex !important; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 999999; background: #fff; }
      .print-ka-container .hoja { max-width: none; width: 100%; border: none; border-radius: 0; box-shadow: none; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  const originalTitle = document.title;
  document.title = 'Tratamiento';

  document.body.appendChild(style);
  document.body.appendChild(container);

  const cleanup = () => {
    const s = document.querySelector('.print-ka-style');
    const c = document.querySelector('.print-ka-container');
    if (c) c.remove();
    if (s) s.remove();
    document.title = originalTitle;
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);

  window.print();

  setTimeout(cleanup, 1000);
}
