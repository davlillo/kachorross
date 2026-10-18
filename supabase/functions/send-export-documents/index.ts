import { createClient } from 'npm:@supabase/supabase-js@2'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

type DocumentType = 'certificado' | 'cartilla' | 'laboratorio'
type Attachment = { tipo: DocumentType; content: string }
const allowed = new Set<DocumentType>(['certificado', 'cartilla', 'laboratorio'])
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function reply(status: number, error?: string) {
  return new Response(JSON.stringify(error ? { error } : { ok: true }), { status, headers })
}

function validPdf(base64: string): boolean {
  if (base64.length < 12 || base64.length > 7_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return false
  try {
    return atob(base64.slice(0, 12)).startsWith('%PDF-')
  } catch {
    return false
  }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return reply(405, 'Método no permitido')

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: { user }, error: authError } = await client.auth.getUser()
  if (authError || !user) return reply(401, 'No autenticado')

  const { data: perfil, error: perfilError } = await admin.from('perfiles')
    .select('veterinaria_id,rol,activo').eq('id', user.id).maybeSingle()
  if (perfilError || !perfil || !perfil.activo || !['doctora', 'admin'].includes(perfil.rol)) {
    return reply(403, 'Sin permisos para enviar documentación')
  }

  let body: { exportacionId?: string; destinatarioEmail?: string; adjuntos?: Attachment[] }
  try { body = await req.json() } catch { return reply(400, 'Solicitud no válida') }
  if (!body.exportacionId || !uuid.test(body.exportacionId) || !Array.isArray(body.adjuntos)
    || body.adjuntos.length < 1 || body.adjuntos.length > 3) return reply(400, 'Seleccione documentos válidos')

  const tipos = new Set<DocumentType>()
  for (const adjunto of body.adjuntos) {
    if (!adjunto || !allowed.has(adjunto.tipo) || typeof adjunto.content !== 'string'
      || !validPdf(adjunto.content) || tipos.has(adjunto.tipo)) return reply(400, 'Adjunto PDF inválido')
    tipos.add(adjunto.tipo)
  }
  if (body.adjuntos.reduce((size, adjunto) => size + adjunto.content.length, 0) > 14_000_000) {
    return reply(400, 'Los adjuntos exceden el tamaño permitido')
  }

  const { data: tramite, error: tramiteError } = await admin.from('exportaciones_mascota')
    .select('id,veterinaria_id,mascota_id,estado,requisitos')
    .eq('id', body.exportacionId).eq('veterinaria_id', perfil.veterinaria_id).maybeSingle()
  if (tramiteError || !tramite) return reply(404, 'Trámite no encontrado')
  const requisitos = tramite.requisitos as Array<{ estado?: string }> | null
  if (tramite.estado !== 'completado' || !Array.isArray(requisitos) || requisitos.length === 0
    || requisitos.some(item => item.estado !== 'completado')) return reply(409, 'El trámite debe estar completo')

  const { data: mascota, error: mascotaError } = await admin.from('mascotas')
    .select('id,nombre,propietario_id').eq('id', tramite.mascota_id)
    .eq('veterinaria_id', perfil.veterinaria_id).maybeSingle()
  if (mascotaError || !mascota) return reply(404, 'Mascota no encontrada')
  const { data: propietario, error: propietarioError } = await admin.from('propietarios')
    .select('nombre,email').eq('id', mascota.propietario_id)
    .eq('veterinaria_id', perfil.veterinaria_id).maybeSingle()
  if (propietarioError || !propietario?.email) return reply(400, 'El propietario no tiene correo registrado')
  if (propietario.email !== body.destinatarioEmail) {
    return reply(409, 'El correo del propietario cambió. Actualice el expediente antes de enviar')
  }

  if (tipos.has('cartilla')) {
    const { count, error } = await admin.from('vacunas').select('id', { count: 'exact', head: true })
      .eq('mascota_id', mascota.id).eq('veterinaria_id', perfil.veterinaria_id)
    if (error || !count) return reply(400, 'La mascota no tiene vacunas registradas')
  }

  const { data: config, error: configError } = await admin.from('config_email')
    .select('smtp_host,smtp_port,smtp_user,smtp_pass,from_name,from_email,activo')
    .eq('veterinaria_id', perfil.veterinaria_id).maybeSingle()
  if (configError || !config?.activo) return reply(400, 'Configure el correo de la clínica antes de enviar')

  const { data: intento, error: logError } = await admin.from('envios_exportacion').insert({
    veterinaria_id: perfil.veterinaria_id,
    exportacion_id: tramite.id,
    mascota_id: mascota.id,
    destinatario_email: propietario.email,
    documentos: [...tipos],
    estado: 'pendiente',
  }).select('id').single()
  if (logError || !intento) return reply(500, 'No se pudo registrar el intento de envío')

  try {
    const { createTransport } = await import('npm:nodemailer@6.9.16')
    const transport = createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_port === 465,
      auth: { user: config.smtp_user, pass: config.smtp_pass },
    })
    const filenames: Record<DocumentType, string> = {
      certificado: 'certificado-salud.pdf',
      cartilla: 'cartilla-vacunacion.pdf',
      laboratorio: 'resultados-laboratorio.pdf',
    }
    await transport.sendMail({
      from: { name: config.from_name || 'Clínica veterinaria', address: config.from_email || config.smtp_user },
      to: propietario.email,
      subject: `Documentación de viaje de ${mascota.nombre}`,
      text: `Estimado/a ${propietario.nombre},\n\nAdjuntamos la documentación disponible para el trámite de viaje de ${mascota.nombre}. Confirme los requisitos vigentes con la autoridad del destino.\n\nAtentamente,\n${config.from_name || 'Clínica veterinaria'}`,
      attachments: body.adjuntos.map(item => ({
        filename: filenames[item.tipo], content: item.content, encoding: 'base64', contentType: 'application/pdf',
      })),
    })
    const { error: updateError } = await admin.from('envios_exportacion')
      .update({ estado: 'enviado', fecha_envio: new Date().toISOString() }).eq('id', intento.id)
    if (updateError) return reply(500, 'El correo salió, pero no se pudo confirmar el registro. Revise el historial antes de reenviar')
    return reply(200)
  } catch {
    await admin.from('envios_exportacion').update({ estado: 'fallido' }).eq('id', intento.id)
    return reply(502, 'No se pudo enviar el correo. Revise la configuración e intente nuevamente')
  }
})
