import { createClient } from 'npm:@supabase/supabase-js@2'
import { buildRecordatorioEmail } from '../_shared/emailRecordatorio.ts'

const TZ = 'America/El_Salvador'
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

interface VeterinariaInfo {
  nombre: string
  telefono: string | null
  direccion: string | null
  email: string | null
}

interface GrupoPropietario {
  veterinariaId: string
  veterinariaNombre: string
  /** Datos de contacto de la clinica que van en el pie del correo. */
  veterinaria: VeterinariaInfo
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

/**
 * Devuelve la hora solo si es significativa. La agenda normaliza las citas sin
 * hora a inicio del dia, asi que 00:00 local se trata como "sin hora concreta".
 */
function horaSiAplica(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined
  const hora = formatHora(iso)
  return hora === '00:00' ? undefined : hora
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
    desparasitacion: 'Desparasitación',
    desparasitante: 'Desparasitación',
    revision_general: 'Revisión general',
    urgencia: 'Urgencia',
  }
  return map[tipo] ?? tipo
}

function tituloSeguimiento(tipo: string | null | undefined, motivo?: string | null): string {
  const label = labelTipo(tipo ?? 'control')
  if (tipo === 'control' && motivo) return `${label}: ${motivo}`
  return label
}

function lineaRecordatorio(it: ItemRecordatorio): string {
  const label = labelTipo(it.tipo)
  const base = (it.titulo === label || it.titulo.startsWith(`${label}:`))
    ? it.titulo
    : `${label}: ${it.titulo}`
  return it.hora ? `${base} — ${it.hora} h` : base
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
  html: string
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
    html: params.html,
    headers: {
      'Content-Language': 'es',
    },
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

    // Dos formas validas de invocar:
    //  1. Un usuario logueado desde la app (JWT propio).
    //  2. El cron, con el secreto compartido en x-cron-secret.
    //
    // El gateway de Supabase ya exige un Authorization valido antes de llegar
    // aca, pero ese header lleva el anon key —  que es publico, va en el bundle
    // del frontend—  asi que por si solo no prueba nada. De ahi el secreto
    // aparte para el cron.
    const cronSecret = Deno.env.get('CRON_SECRET') ?? ''
    const cronHeader = req.headers.get('x-cron-secret') ?? ''
    const esCron = Boolean(cronSecret) && cronHeader === cronSecret

    if (!esCron) {
      const authHeader = req.headers.get('Authorization') ?? ''
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

    const vetInfos = new Map<string, VeterinariaInfo>()

    async function getVetInfo(vetId: string): Promise<VeterinariaInfo> {
      const cached = vetInfos.get(vetId)
      if (cached) return cached
      const { data } = await admin
        .from('veterinarias')
        .select('nombre, telefono, direccion, email')
        .eq('id', vetId)
        .maybeSingle()
      const info: VeterinariaInfo = {
        nombre: data?.nombre ?? 'Veterinaria',
        telefono: data?.telefono ?? null,
        direccion: data?.direccion ?? null,
        email: data?.email ?? null,
      }
      vetInfos.set(vetId, info)
      return info
    }

    let enviados = 0
    let omitidos = 0
    let sinEmail = 0
    const errores: string[] = []
    const detalle: string[] = []

    // Controles (proxima_cita) — filtro por fecha local SV
    const { data: controlesRaw, error: controlesError } = await admin
      .from('consultas')
      .select('id, mascota_id, veterinaria_id, motivo, proxima_cita, tipo_seguimiento, mascotas(id, nombre, propietarios(nombre, email))')
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
      const vet = await getVetInfo(row.veterinaria_id)
      addItem(
        `${row.veterinaria_id}:${email.toLowerCase()}`,
        { veterinariaId: row.veterinaria_id, veterinariaNombre: vet.nombre, veterinaria: vet, email, propietarioNombre: prop?.nombre ?? 'Estimado/a cliente' },
        {
          mascotaId: row.mascota_id,
          mascotaNombre: mascota?.nombre ?? 'su mascota',
          titulo: tituloSeguimiento(row.tipo_seguimiento, row.motivo),
          hora: horaSiAplica(row.proxima_cita),
          tipo: row.tipo_seguimiento ?? 'control',
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
      const vet = await getVetInfo(row.veterinaria_id)
      addItem(
        `${row.veterinaria_id}:${email.toLowerCase()}`,
        { veterinariaId: row.veterinaria_id, veterinariaNombre: vet.nombre, veterinaria: vet, email, propietarioNombre: prop?.nombre ?? 'Estimado/a cliente' },
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
      const vet = await getVetInfo(row.veterinaria_id)
      addItem(
        `${row.veterinaria_id}:${email.toLowerCase()}`,
        { veterinariaId: row.veterinaria_id, veterinariaNombre: vet.nombre, veterinaria: vet, email, propietarioNombre: prop?.nombre ?? 'Estimado/a cliente' },
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
      const vet = await getVetInfo(row.veterinaria_id)
      addItem(
        `${row.veterinaria_id}:${email.toLowerCase()}`,
        { veterinariaId: row.veterinaria_id, veterinariaNombre: vet.nombre, veterinaria: vet, email, propietarioNombre: prop?.nombre ?? 'Estimado/a cliente' },
        {
          mascotaId: row.mascota_id,
          mascotaNombre: mascota?.nombre ?? 'su mascota',
          titulo: row.titulo,
          hora: horaSiAplica(row.fecha_hora),
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

      const itemsEmail = [...porMascota.entries()].map(([mascotaNombre, items]) => ({
        mascotaNombre,
        lineas: items.map(it => lineaRecordatorio(it)),
        conHora: items.some(it => Boolean(it.hora)),
      }))

      const { subject, text, html } = buildRecordatorioEmail({
        propietarioNombre: grupo.propietarioNombre,
        veterinariaNombre: grupo.veterinariaNombre,
        fechaLegible,
        fechaClave: fechaManana,
        items: itemsEmail,
        veterinariaTelefono: grupo.veterinaria.telefono,
        veterinariaDireccion: grupo.veterinaria.direccion,
        veterinariaEmail: grupo.veterinaria.email,
      })

      try {
        await enviarSMTP({
          host: emailConfig.smtp_host ?? 'smtp.gmail.com',
          port: emailConfig.smtp_port ?? 587,
          user: emailConfig.smtp_user,
          pass: emailConfig.smtp_pass,
          fromName: emailConfig.from_name ?? grupo.veterinariaNombre,
          fromEmail: emailConfig.from_email ?? emailConfig.smtp_user,
          to: grupo.email,
          subject,
          text,
          html,
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
