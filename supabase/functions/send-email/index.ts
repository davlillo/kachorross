import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Attachment {
  filename: string
  content: string
  contentType?: string
}

interface SendEmailPayload {
  veterinariaId?: string
  to: string
  subject: string
  text?: string
  html?: string
  useSystemConfig?: boolean
  attachment?: Attachment
  tipoNotificacion?: 'recordatorio' | 'confirmacion' | 'personalizado' | 'receta' | 'invitacion'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authHeader = req.headers.get('Authorization') ?? ''
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: { user: caller }, error: callerError } = await client.auth.getUser()
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: callerPerfil } = await admin
      .from('perfiles')
      .select('rol')
      .eq('id', caller.id)
      .maybeSingle()

    if (!callerPerfil || (callerPerfil.rol !== 'admin' && callerPerfil.rol !== 'super_admin' && callerPerfil.rol !== 'recepcion')) {
      return new Response(JSON.stringify({ error: 'Sin permisos de administrador' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { veterinariaId, to, subject, text, html, useSystemConfig, attachment, tipoNotificacion }: SendEmailPayload = await req.json()
    const tipoLog = tipoNotificacion ?? 'personalizado'
    if (!to || !subject || (!text && !html)) {
      return new Response(JSON.stringify({ error: 'Payload incompleto' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let smtpHost = 'smtp.gmail.com'
    let smtpPort = 587
    let smtpUser: string
    let smtpPass: string
    let fromName = 'Sistema'
    let fromEmail = ''
    let logVetId = veterinariaId || 'system'

    if (useSystemConfig || !veterinariaId) {
      smtpUser = Deno.env.get('SYSTEM_SMTP_USER') || ''
      smtpPass = Deno.env.get('SYSTEM_SMTP_PASS') || ''
      fromName = Deno.env.get('SYSTEM_SMTP_FROM') || 'Sistema Veterinario'
      fromEmail = smtpUser

      if (!smtpUser || !smtpPass) {
        return new Response(JSON.stringify({ error: 'SMTP del sistema no configurado. Agrega SYSTEM_SMTP_USER y SYSTEM_SMTP_PASS en Edge Functions secrets.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
      const { data: emailConfig, error: configError } = await admin
        .from('config_email')
        .select('*')
        .eq('veterinaria_id', veterinariaId)
        .maybeSingle()

      if (configError || !emailConfig || !emailConfig.activo) {
        return new Response(JSON.stringify({ error: 'Configuración de correo no encontrada o inactiva' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: vetData } = await admin
        .from('veterinarias')
        .select('nombre')
        .eq('id', veterinariaId)
        .maybeSingle()

      smtpHost = emailConfig.smtp_host
      smtpPort = emailConfig.smtp_port
      smtpUser = emailConfig.smtp_user
      smtpPass = emailConfig.smtp_pass
      fromName = emailConfig.from_name || vetData?.nombre || 'Mi Veterinaria'
      fromEmail = emailConfig.from_email || emailConfig.smtp_user
    }

    const { createTransport } = await import('npm:nodemailer@6.9.16')

    const transporter = createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })

    const mailOptions: any = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
    }

    if (text) mailOptions.text = text
    if (html) mailOptions.html = html

    if (attachment) {
      mailOptions.attachments = [{
        filename: attachment.filename,
        content: attachment.content,
        encoding: 'base64',
        contentType: attachment.contentType || 'application/pdf',
      }]
    }

    await transporter.sendMail(mailOptions)

    await admin.from('notificaciones').insert({
      veterinaria_id: logVetId,
      destinatario_email: to,
      tipo_notificacion: tipoLog,
      estado: 'enviado',
      fecha_envio: new Date().toISOString(),
    })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error inesperado'

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const fallbackClient = createClient(supabaseUrl, serviceRoleKey)
      await fallbackClient.from('notificaciones').insert({
        veterinaria_id: 'system',
        destinatario_email: 'unknown',
        tipo_notificacion: 'personalizado',
        estado: 'fallido',
        codigo_error: errorMessage,
        fecha_envio: new Date().toISOString(),
      })
    } catch {
      // No podemos hacer nada si falla el log
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
