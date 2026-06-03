import { createClient } from 'npm:@supabase/supabase-js@2'

const TZ = 'America/El_Salvador'
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ItemRecordatorio {
  mascotaId: string
  mascotaNombre: string
  titulo: string
  /** Solo controles y eventos con cita; vacuna/desparas = sin hora */
  hora?: string
  tipo: string
}

interface GrupoPropietario {
  veterinariaId: string
  veterinariaNombre: string
  email: string
  propietarioNombre: string
  items: ItemRecordatorio[]
}

function hoyEnTZ(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
}

function mananaDesdeHoy(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number)
  const dt = new Date(y, m - 1, d + 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function rangoTimestamptz(fecha: string): { desde: string; hasta: string } {
  const [y, m, d] = fecha.split('-').map(Number)
  const desde = new Date(Date.UTC(y, m - 1, d, 6, 0, 0))
  const hasta = new Date(Date.UTC(y, m - 1, d + 1, 5, 59, 59, 999))
  return { desde: desde.toISOString(), hasta: hasta.toISOString() }
}

function fechaEnTZ(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso))
}

function formatHora(iso: string): string {
  return new Intl.DateTimeFormat('es-SV', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

function formatFechaLegible(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function labelTipo(tipo: string): string {
  const map: Record<string, string> = {
    control: 'Control',
    vacuna: 'Vacuna',
    desparasitante: 'Desparasitación',
    urgencia: 'Urgencia',
  }
  return map[tipo] ?? tipo
}

async function enviarSMTP(params: {
  host: string
  port: number
  user: string
  pass: string
  fromName: string
  fromEmail: string
  to: string
  subject: string
  text: string
}) {
  const { createTransport } = await import('npm:nodemailer@6.9.16')
  const transporter = createTransport({
    host: params.host,
    port: params.port,
    secure: params.port === 465,
    auth: { user: params.user, pass: params.pass },
  })
  await transporter.sendMail({
    from: `"${params.fromName}" <${params.fromEmail}>`,
    to: params.to,
    subject: params.subject,
    text: params.text,
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceRoleKey)

    const authHeader = req.headers.get('Authorization') ?? ''
    const esCron = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`
    if (!esCron) {
      const client = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      })
      const { data: { user }, error: userError } = await client.auth.getUser()
      if (userError || !user) {
        return new Response(JSON.stringify({ error: 'No autenticado' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const fechaManana = mananaDesdeHoy(hoyEnTZ())
    const { desde, hasta } = rangoTimestamptz(fechaManana)
    const fechaLegible = formatFechaLegible(fechaManana)
    const hoy = hoyEnTZ()

    const grupos = new Map<string, GrupoPropietario>()

    const addItem = (
      key: string,
      data: Omit<GrupoPropietario, 'items'>,
      item: ItemRecordatorio,
    ) => {
      const existing = grupos.get(key)
      if (existing) {
        existing.items.push(item)
      } else {
        grupos.set(key, { ...data, items: [item] })
      }
    }

    const vetNames = new Map<string, string>()

    async function getVetName(vetId: string): Promise<string> {
      if (vetNames.has(vetId)) return vetNames.get(vetId)!
      const { data } = await admin.from('veterinarias').select('nombre').eq('id', vetId).maybeSingle()
      const nombre = data?.nombre ?? 'Veterinaria'
      vetNames.set(vetId, nombre)
      return nombre
    }

    let enviados = 0
    let omitidos = 0
    let sinEmail = 0
    const errores: string[] = []
    const detalle: string[] = []

    // Controles (proxima_cita) — filtro por fecha local SV
    const { data: controlesRaw, error: controlesError } = await admin
      .from('consultas')
      .select('id, mascota_id, veterinaria_id, motivo, proxima_cita, mascotas(id, nombre, propietarios(nombre, email))')
      .not('proxima_cita', 'is', null)
      .gte('proxima_cita', desde)
      .lte('proxima_cita', hasta)

    if (controlesError) {
      errores.push(`Error consultas: ${controlesError.message}`)
    }

    const controles = (controlesRaw ?? []).filter(row =>
      row.proxima_cita && fechaEnTZ(row.proxima_cita) === fechaManana
    )

    for (const row of controles) {
      if (!row.veterinaria_id) continue
      const mascota = row.mascotas as { id: string; nombre: string; propietarios?: { nombre?: string; email?: string } | { nombre?: string; email?: string }[] | null } | null
      const prop = Array.isArray(mascota?.propietarios) ? mascota?.propietarios[0] : mascota?.propietarios
      const email = prop?.email?.trim()
      if (!email) {
        sinEmail++
        detalle.push(`Sin email: ${mascota?.nombre ?? row.mascota_id}`)
        continue
      }
      const vetNombre = await getVetName(row.veterinaria_id)
      addItem(
        `${row.veterinaria_id}:${email.toLowerCase()}`,
        { veterinariaId: row.veterinaria_id, veterinariaNombre: vetNombre, email, propietarioNombre: prop?.nombre ?? 'Estimado/a cliente' },
        {
          mascotaId: row.mascota_id,
          mascotaNombre: mascota?.nombre ?? 'su mascota',
          titulo: row.motivo ? `Control: ${row.motivo}` : 'Control de seguimiento',
          hora: formatHora(row.proxima_cita),
          tipo: 'control',
        },
      )
    }

    // Vacunas
    const { data: vacunas } = await admin
      .from('vacunas')
      .select('id, mascota_id, veterinaria_id, nombre, fecha_proxima_dosis, mascotas(id, nombre, propietarios(nombre, email))')
      .eq('fecha_proxima_dosis', fechaManana)

    for (const row of vacunas ?? []) {
      if (!row.veterinaria_id) continue
      const mascota = row.mascotas as { id: string; nombre: string; propietarios?: { nombre?: string; email?: string } | { nombre?: string; email?: string }[] | null } | null
      const prop = Array.isArray(mascota?.propietarios) ? mascota?.propietarios[0] : mascota?.propietarios
      const email = prop?.email?.trim()
      if (!email) {
        sinEmail++
        detalle.push(`Sin email: ${mascota?.nombre ?? row.mascota_id}`)
        continue
      }
      const vetNombre = await getVetName(row.veterinaria_id)
      addItem(
        `${row.veterinaria_id}:${email.toLowerCase()}`,
        { veterinariaId: row.veterinaria_id, veterinariaNombre: vetNombre, email, propietarioNombre: prop?.nombre ?? 'Estimado/a cliente' },
        {
          mascotaId: row.mascota_id,
          mascotaNombre: mascota?.nombre ?? 'su mascota',
          titulo: `Vacuna: ${row.nombre}`,
          tipo: 'vacuna',
        },
      )
    }

    // Desparasitaciones
    const { data: desparas } = await admin
      .from('desparasitaciones')
      .select('id, mascota_id, veterinaria_id, tipo, fecha_proximo_tratamiento, mascotas(id, nombre, propietarios(nombre, email))')
      .eq('fecha_proximo_tratamiento', fechaManana)

    for (const row of desparas ?? []) {
      if (!row.veterinaria_id) continue
      const mascota = row.mascotas as { id: string; nombre: string; propietarios?: { nombre?: string; email?: string } | { nombre?: string; email?: string }[] | null } | null
      const prop = Array.isArray(mascota?.propietarios) ? mascota?.propietarios[0] : mascota?.propietarios
      const email = prop?.email?.trim()
      if (!email) {
        sinEmail++
        detalle.push(`Sin email: ${mascota?.nombre ?? row.mascota_id}`)
        continue
      }
      const vetNombre = await getVetName(row.veterinaria_id)
      addItem(
        `${row.veterinaria_id}:${email.toLowerCase()}`,
        { veterinariaId: row.veterinaria_id, veterinariaNombre: vetNombre, email, propietarioNombre: prop?.nombre ?? 'Estimado/a cliente' },
        {
          mascotaId: row.mascota_id,
          mascotaNombre: mascota?.nombre ?? 'su mascota',
          titulo: `Desparasitación: ${row.tipo}`,
          tipo: 'desparasitante',
        },
      )
    }

    // Eventos manuales
    const { data: eventos } = await admin
      .from('eventos')
      .select('id, mascota_id, veterinaria_id, titulo, tipo, fecha_hora, mascotas(id, nombre, propietarios(nombre, email))')
      .gte('fecha_hora', desde)
      .lte('fecha_hora', hasta)

    for (const row of eventos ?? []) {
      if (!row.veterinaria_id) continue
      const mascota = row.mascotas as { id: string; nombre: string; propietarios?: { nombre?: string; email?: string } | { nombre?: string; email?: string }[] | null } | null
      const prop = Array.isArray(mascota?.propietarios) ? mascota?.propietarios[0] : mascota?.propietarios
      const email = prop?.email?.trim()
      if (!email) {
        sinEmail++
        detalle.push(`Sin email: ${mascota?.nombre ?? row.mascota_id}`)
        continue
      }
      const vetNombre = await getVetName(row.veterinaria_id)
      addItem(
        `${row.veterinaria_id}:${email.toLowerCase()}`,
        { veterinariaId: row.veterinaria_id, veterinariaNombre: vetNombre, email, propietarioNombre: prop?.nombre ?? 'Estimado/a cliente' },
        {
          mascotaId: row.mascota_id,
          mascotaNombre: mascota?.nombre ?? 'su mascota',
          titulo: row.titulo,
          hora: formatHora(row.fecha_hora),
          tipo: row.tipo,
        },
      )
    }

    for (const grupo of grupos.values()) {
      const { data: yaEnviado } = await admin
        .from('notificaciones')
        .select('id')
        .eq('veterinaria_id', grupo.veterinariaId)
        .eq('destinatario_email', grupo.email)
        .eq('tipo_notificacion', 'recordatorio')
        .eq('estado', 'enviado')
        .gte('fecha_envio', `${hoy}T00:00:00`)
        .lte('fecha_envio', `${hoy}T23:59:59`)
        .maybeSingle()

      if (yaEnviado) {
        omitidos++
        detalle.push(`Ya enviado hoy: ${grupo.email}`)
        continue
      }

      const { data: emailConfig } = await admin
        .from('config_email')
        .select('*')
        .eq('veterinaria_id', grupo.veterinariaId)
        .maybeSingle()

      if (!emailConfig || emailConfig.activo === false) {
        errores.push(`Sin SMTP configurado para ${grupo.veterinariaNombre}. Guarda el correo en Configuración.`)
        continue
      }

      const porMascota = new Map<string, ItemRecordatorio[]>()
      for (const item of grupo.items) {
        const list = porMascota.get(item.mascotaNombre) ?? []
        list.push(item)
        porMascota.set(item.mascotaNombre, list)
      }

      const lineas: string[] = []
      for (const [nombreMascota, items] of porMascota) {
        lineas.push(`\n🐾 ${nombreMascota}:`)
        for (const it of items) {
          const cuando = it.hora ? ` (${it.hora})` : ''
          lineas.push(`  • ${labelTipo(it.tipo)}: ${it.titulo}${cuando}`)
        }
      }

      const text = `Estimado/a ${grupo.propietarioNombre},

Le recordamos que mañana ${fechaLegible} tiene programado en ${grupo.veterinariaNombre}:${lineas.join('\n')}

Si necesita reprogramar o tiene alguna consulta, no dude en contactarnos.

Atentamente,
${grupo.veterinariaNombre}

---
© ${new Date().getFullYear()} ${grupo.veterinariaNombre} | Gracias por confiar en nosotros 🐾`

      try {
        await enviarSMTP({
          host: emailConfig.smtp_host ?? 'smtp.gmail.com',
          port: emailConfig.smtp_port ?? 587,
          user: emailConfig.smtp_user,
          pass: emailConfig.smtp_pass,
          fromName: emailConfig.from_name ?? grupo.veterinariaNombre,
          fromEmail: emailConfig.from_email ?? emailConfig.smtp_user,
          to: grupo.email,
          subject: `${grupo.veterinariaNombre} — Recordatorio para mañana`,
          text,
        })

        await admin.from('notificaciones').insert({
          veterinaria_id: grupo.veterinariaId,
          mascota_id: grupo.items[0]?.mascotaId ?? null,
          destinatario_email: grupo.email,
          tipo_notificacion: 'recordatorio',
          estado: 'enviado',
          fecha_envio: new Date().toISOString(),
        })

        enviados++
        detalle.push(`Enviado a ${grupo.email}`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido'
        errores.push(`${grupo.email}: ${msg}`)
        await admin.from('notificaciones').insert({
          veterinaria_id: grupo.veterinariaId,
          mascota_id: grupo.items[0]?.mascotaId ?? null,
          destinatario_email: grupo.email,
          tipo_notificacion: 'recordatorio',
          estado: 'fallido',
          codigo_error: msg,
          fecha_envio: new Date().toISOString(),
        })
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      hoy,
      fechaManana,
      controlesEncontrados: controles.length,
      sinEmailPropietario: sinEmail,
      grupos: grupos.size,
      enviados,
      omitidos,
      errores,
      detalle,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error inesperado'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
