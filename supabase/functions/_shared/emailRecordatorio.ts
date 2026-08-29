export interface ItemRecordatorioEmail {
  mascotaNombre: string
  lineas: string[]
  /** true si alguna linea de esta mascota lleva hora concreta. */
  conHora?: boolean
}

export interface RecordatorioEmailParams {
  propietarioNombre: string
  veterinariaNombre: string
  fechaLegible: string
  fechaClave: string
  items: ItemRecordatorioEmail[]
  /** Datos de contacto de la clinica, para que el dueño pueda reprogramar. */
  veterinariaTelefono?: string | null
  veterinariaDireccion?: string | null
  veterinariaEmail?: string | null
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatFechaCorta(fechaClave: string): string {
  const [y, m, d] = fechaClave.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function bloquesMascotasHtml(items: ItemRecordatorioEmail[]): string {
  return items.map(item => {
    const lineas = item.lineas.map(l => `<li style="margin:4px 0;">${escapeHtml(l)}</li>`).join('')
    return `
      <div style="background:#fef2f2;border-left:4px solid #e11d48;padding:14px 16px;margin:14px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0 0 6px;font-weight:700;color:#be123c;">🐾 ${escapeHtml(item.mascotaNombre)}</p>
        <ul style="margin:0;padding-left:18px;color:#444;">${lineas}</ul>
      </div>`
  }).join('')
}

function bloquesMascotasTexto(items: ItemRecordatorioEmail[]): string {
  return items.map(item => {
    const lineas = item.lineas.map(l => `  • ${l}`).join('\n')
    return `\n🐾 ${item.mascotaNombre}:\n${lineas}`
  }).join('')
}

interface ContactoClinica {
  telefono?: string | null
  direccion?: string | null
  email?: string | null
}

function lineasContacto(c: ContactoClinica): string[] {
  const lineas: string[] = []
  if (c.telefono?.trim()) lineas.push(`Tel: ${c.telefono.trim()}`)
  if (c.email?.trim()) lineas.push(`Correo: ${c.email.trim()}`)
  if (c.direccion?.trim()) lineas.push(`Dirección: ${c.direccion.trim()}`)
  return lineas
}

function contactoTexto(c: ContactoClinica): string {
  const lineas = lineasContacto(c)
  if (lineas.length === 0) return ''
  const cuerpo = lineas.map(l => '  ' + l).join('\n')
  return '\n\nPuede contactarnos en:\n' + cuerpo
}

function contactoHtml(c: ContactoClinica): string {
  const lineas = lineasContacto(c)
  if (lineas.length === 0) return ''
  const items = lineas.map(l => `<p style="margin:2px 0;">${escapeHtml(l)}</p>`).join('')
  return `<div style="margin-top:14px;padding-top:12px;border-top:1px solid #f4f4f5;color:#52525b;font-size:13px;">
                <p style="margin:0 0 6px;font-weight:600;color:#3f3f46;">Contacto</p>
                ${items}
              </div>`
}

export function buildRecordatorioEmail(params: RecordatorioEmailParams): {
  subject: string
  text: string
  html: string
} {
  const {
    propietarioNombre,
    veterinariaNombre,
    fechaLegible,
    fechaClave,
    items,
    veterinariaTelefono,
    veterinariaDireccion,
    veterinariaEmail,
  } = params

  const hayHora = items.some(item => item.conHora === true)
  const notaHorario = hayHora
    ? 'Le esperamos a la hora indicada.'
    : 'Puede acudir en cualquier horario del día.'
  const contacto: ContactoClinica = {
    telefono: veterinariaTelefono,
    direccion: veterinariaDireccion,
    email: veterinariaEmail,
  }
  const fechaCorta = formatFechaCorta(fechaClave)
  const subject = `${veterinariaNombre} — Cita ${fechaCorta}`
  const mascotasTexto = bloquesMascotasTexto(items)
  const mascotasHtml = bloquesMascotasHtml(items)

  const text = `Estimado/a ${propietarioNombre},

Le recordamos que mañana ${fechaLegible} tiene programado en ${veterinariaNombre}. ${notaHorario}${mascotasTexto}

Si necesita reprogramar o tiene alguna consulta, no dude en contactarnos.${contactoTexto(contacto)}

Atentamente,
${veterinariaNombre}`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Segoe UI,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#e11d48,#be123c);padding:22px 24px;">
              <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">Recordatorio de cita</p>
              <p style="margin:6px 0 0;color:#fecdd3;font-size:13px;">${escapeHtml(veterinariaNombre)} · ${escapeHtml(fechaCorta)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;color:#27272a;font-size:15px;line-height:1.65;">
              <p style="margin:0 0 12px;">Estimado/a <strong>${escapeHtml(propietarioNombre)}</strong>,</p>
              <p style="margin:0 0 8px;">Le recordamos que <strong>mañana ${escapeHtml(fechaLegible)}</strong> tiene programado en <strong>${escapeHtml(veterinariaNombre)}</strong>.</p>
              <p style="margin:0 0 4px;color:#52525b;font-size:14px;">${escapeHtml(notaHorario)}</p>
              ${mascotasHtml}
              <p style="margin:20px 0 0;color:#71717a;font-size:14px;">Si necesita reprogramar o tiene alguna consulta, no dude en contactarnos.</p>
              ${contactoHtml(contacto)}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 22px;border-top:1px solid #f4f4f5;color:#a1a1aa;font-size:12px;text-align:center;">
              Atentamente, ${escapeHtml(veterinariaNombre)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, text, html }
}
